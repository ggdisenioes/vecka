import LegacyApp from '@/components/legacy/LegacyApp'
import { getLegacyFrontData } from '@/lib/legacy-front'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Tienda — VeCKA',
  description: 'Moldes digitales, moldes impresos y mercería seleccionada por VeCKA.',
}

export default async function TiendaPage() {
  const data = await getLegacyFrontData()

  return (
    <LegacyApp
      initialCourses={data.courses}
      initialPage="tienda"
      initialProducts={data.products}
      initialUser={data.user}
    />
  )
}
