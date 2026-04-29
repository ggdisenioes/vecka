import Link from 'next/link'
import { redirect } from 'next/navigation'
import LegacyApp from '@/components/legacy/LegacyApp'
import { getCurrentAuth } from '@/lib/auth'
import { getLegacyFrontData } from '@/lib/legacy-front'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const { user, profile } = await getCurrentAuth()

  if (!user) {
    redirect('/login?next=/admin')
  }

  if (!profile || !['admin', 'editorial'].includes(profile.role)) {
    redirect('/cuenta')
  }

  const data = await getLegacyFrontData()

  return (
    <>
      <div
        style={{
          background: '#1d5f55',
          color: '#fff',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 14,
        }}
      >
        <span>Panel administrativo</span>
        <Link
          href="/admin/courses"
          style={{
            background: '#fff',
            color: '#1d5f55',
            padding: '6px 14px',
            borderRadius: 999,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Editor de cursos →
        </Link>
      </div>
      <LegacyApp
        initialCourses={data.courses}
        initialPage="admin"
        initialProducts={data.products}
        initialUser={data.user}
      />
    </>
  )
}
