'use server'

import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function signIn(formData) {
  const supabase = await getSupabaseServer()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/admin')
}

export async function signOut() {
  const supabase = await getSupabaseServer()
  await supabase.auth.signOut()
  redirect('/login')
}
