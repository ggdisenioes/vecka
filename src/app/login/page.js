import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LoginPage({ searchParams }) {
  const nextPath = typeof searchParams?.next === 'string' && searchParams.next.startsWith('/')
    ? searchParams.next
    : '/'
  const target = new URL(nextPath, 'http://localhost')

  target.searchParams.set('auth', 'login')

  if (searchParams?.error) {
    target.searchParams.set('error', searchParams.error)
  }

  if (searchParams?.success) {
    target.searchParams.set('success', searchParams.success)
  }

  target.searchParams.set('next', nextPath)

  redirect(`${target.pathname}${target.search}`)
}
