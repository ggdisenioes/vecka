import { signIn } from '@/app/auth/actions'

export const dynamic = 'force-dynamic'

export default async function LoginPage({ searchParams }) {
  const error = searchParams?.error

  return (
    <main className="shell section">
      <section className="panel" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="eyebrow">Acceso</div>
        <h1 className="section-title">Ingresar a Vecka Studio</h1>
        <p className="body-copy">
          Esta base ya está preparada para roles `admin`, `editorial` y `student` usando Supabase Auth + profiles.
        </p>
        {error ? (
          <div className="empty" style={{ borderStyle: 'solid', borderColor: '#d3a28c', color: '#7c3f2d' }}>
            {error}
          </div>
        ) : null}
        <form action={signIn} className="editor" style={{ marginTop: 18 }}>
          <div className="field">
            <label>Email</label>
            <input name="email" required type="email" />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input name="password" required type="password" />
          </div>
          <button className="btn btn-primary" type="submit">Ingresar</button>
        </form>
      </section>
    </main>
  )
}
