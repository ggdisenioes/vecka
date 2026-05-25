import { NextResponse } from 'next/server'
import { upgradeLegacyPassword } from '@/lib/legacy-passwords'

export async function POST(request) {
  const payload = await request.json().catch(() => ({}))
  const email = String(payload.email || '').trim()
  const password = String(payload.password || '')

  try {
    const upgraded = await upgradeLegacyPassword({ email, password })

    if (!upgraded) {
      return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 })
    }

    return NextResponse.json({ ok: true, email: upgraded.email })
  } catch (error) {
    console.error('Legacy password migration failed:', error)
    return NextResponse.json({ error: 'No pudimos iniciar sesión. Probá nuevamente.' }, { status: 500 })
  }
}
