import { getPublishedProducts } from '@/lib/lms'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const products = await getPublishedProducts()

  return (
    <main className="shell section">
      <div className="section-head">
        <div>
          <div className="eyebrow">Productos</div>
          <h1 className="section-title">Catálogo comercial</h1>
        </div>
      </div>
      {products.length === 0 ? (
        <div className="empty">No hay productos publicados todavía.</div>
      ) : (
        <div className="grid product-grid">
          {products.map((product) => (
            <article className="card" key={product.id}>
              <span className="badge">{product.category || 'Producto'}</span>
              <h3>{product.title}</h3>
              <p className="body-copy">{product.subcategory || product.product_type}</p>
              <p className="muted">ARS {Number(product.price_ars || 0).toLocaleString('es-AR')} · USD {Number(product.price_usd || 0).toFixed(2)}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
