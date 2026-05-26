import { NextResponse } from 'next/server'
import { sendSignupWelcomeEmail } from '@/lib/email'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

async function findRecentAuthUserByEmail(supabase, email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return null

  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error

    const user = data?.users?.find((candidate) => normalizeEmail(candidate.email) === normalized)
    if (user) {
      const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0
      const recent = createdAt && Date.now() - createdAt < 10 * 60 * 1000
      return recent ? user : null
    }

    if (!data?.users || data.users.length < 200) return null
  }

  return null
}

export async function POST(request) {
  const payload = await request.json().catch(() => ({}))
  const email = normalizeEmail(payload.email)
  const fullName = String(payload.fullName || '').trim().slice(0, 160)

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: true })
  }

  try {
    const supabase = getSupabaseAdmin()
    const user = await findRecentAuthUserByEmail(supabase, email)
    if (user) {
      await sendSignupWelcomeEmail({
        to: email,
        name: fullName || user.user_metadata?.full_name || '',
      })
    }
  } catch (error) {
    console.error('Signup welcome email error:', error)
  }

  return NextResponse.json({ ok: true })
}
