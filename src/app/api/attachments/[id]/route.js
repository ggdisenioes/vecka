import { NextResponse } from 'next/server'
import { getVisibleAttachmentById } from '@/lib/lms'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET(_request, { params }) {
  const data = await getVisibleAttachmentById(params.id)
  if (!data) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  const supabase = getSupabaseAdmin()
  const { data: signed, error: signedError } = await supabase.storage
    .from(data.bucket_name)
    .createSignedUrl(data.storage_path, 60)

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Could not sign attachment URL' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
