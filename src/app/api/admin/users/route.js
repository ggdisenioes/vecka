import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff } from '@/lib/admin-api'

export async function GET(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  const url = new URL(request.url)
  const search = url.searchParams.get('search') || ''
  const role = url.searchParams.get('role') || ''
  const page = Math.max(0, Number(url.searchParams.get('page') || 0))
  const pageSize = 50

  const supabase = getSupabaseAdmin()

  let query = supabase
    .from('profiles')
    .select('id, email, full_name, display_name, role, created_at, avatar_url', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,display_name.ilike.%${search}%`)
  }
  if (role) {
    query = query.eq('role', role)
  }

  const { data: profiles, error, count } = await query
  if (error) return jsonError(error.message)

  return NextResponse.json({ profiles: profiles || [], total: count || 0, page, pageSize })
}
