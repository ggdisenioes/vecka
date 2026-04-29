import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServer } from '@/lib/supabase/server'

const ALLOWED_BUCKETS = new Set(['course-videos'])

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const scope = String(searchParams.get('scope') || '')
    const id = String(searchParams.get('id') || '')
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const supabase = await getSupabaseServer()
    let record = null
    let error = null

    if (scope === 'lesson') {
      ;({ data: record, error } = await supabase
        .from('course_lessons')
        .select('id, video_provider, video_storage_path, video_bucket')
        .eq('id', id)
        .maybeSingle())
    } else if (scope === 'module') {
      ;({ data: record, error } = await supabase
        .from('course_modules')
        .select('id, video_provider, video_storage_path, video_bucket')
        .eq('id', id)
        .maybeSingle())
    } else {
      return NextResponse.json({ error: 'Invalid scope' }, { status: 400 })
    }

    if (error) throw error
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (record.video_provider !== 'upload' || !record.video_storage_path) {
      return NextResponse.json({ error: 'No uploaded video for this resource' }, { status: 400 })
    }

    const bucket = record.video_bucket || 'course-videos'
    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: 'Bucket not allowed' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { data: signed, error: signError } = await admin.storage
      .from(bucket)
      .createSignedUrl(record.video_storage_path, 60 * 30)

    if (signError || !signed?.signedUrl) {
      return NextResponse.json({ error: 'Could not sign video URL' }, { status: 500 })
    }
    return NextResponse.json({ url: signed.signedUrl })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Playback failed' }, { status: 500 })
  }
}
