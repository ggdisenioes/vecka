import {
  createCourse,
  updateCourse,
  deleteCourse,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteAttachment,
} from '@/app/admin/actions'
import { getAdminDashboardData } from '@/lib/lms'

function CourseEditor({ course }) {
  return (
    <div className="list-row">
      <form action={updateCourse} className="editor">
        <input name="id" type="hidden" value={course.id} />
        <div className="editor-grid">
          <div className="field">
            <label>Título</label>
            <input defaultValue={course.title} name="title" required />
          </div>
          <div className="field">
            <label>Subtítulo</label>
            <input defaultValue={course.subtitle || ''} name="subtitle" />
          </div>
          <div className="field">
            <label>Categoría</label>
            <input defaultValue={course.category || ''} name="category" />
          </div>
          <div className="field">
            <label>Nivel</label>
            <input defaultValue={course.level || ''} name="level" />
          </div>
          <div className="field">
            <label>Duración</label>
            <input defaultValue={course.duration_label || ''} name="duration_label" />
          </div>
          <div className="field">
            <label>Cover URL</label>
            <input defaultValue={course.cover_image_url || ''} name="cover_image_url" />
          </div>
          <div className="field">
            <label>ARS</label>
            <input defaultValue={course.price_ars || 0} min="0" name="price_ars" type="number" />
          </div>
          <div className="field">
            <label>USD</label>
            <input defaultValue={course.price_usd || 0} min="0" name="price_usd" step="0.01" type="number" />
          </div>
          <div className="field">
            <label>Status</label>
            <select defaultValue={course.status} name="status">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="field">
            <label>Visibilidad</label>
            <select defaultValue={course.visibility} name="visibility">
              <option value="private">Private</option>
              <option value="public">Public</option>
              <option value="catalog">Catalog</option>
            </select>
          </div>
          <div className="field field-full">
            <label>Descripción</label>
            <textarea defaultValue={course.description || ''} name="description" />
          </div>
        </div>
        <div className="row-actions">
          <label className="attachment-item" style={{ justifyContent: 'flex-start' }}>
            <input defaultChecked={course.is_membership} name="is_membership" type="checkbox" />
            Curso membresía
          </label>
          <button className="btn btn-primary" type="submit">Guardar curso</button>
        </div>
      </form>
      <form action={deleteCourse} className="inline-form" style={{ marginTop: 10 }}>
        <input name="id" type="hidden" value={course.id} />
        <button className="btn btn-secondary" type="submit">Eliminar curso</button>
      </form>
    </div>
  )
}

function ModuleEditor({ module }) {
  return (
    <div className="list-row">
      <form action={updateModule} className="editor">
        <input name="id" type="hidden" value={module.id} />
        <div className="editor-grid">
          <div className="field">
            <label>Título del módulo</label>
            <input defaultValue={module.title} name="title" required />
          </div>
          <div className="field">
            <label>Posición</label>
            <input defaultValue={module.position} min="1" name="position" type="number" />
          </div>
          <div className="field field-full">
            <label>Descripción</label>
            <textarea defaultValue={module.description || ''} name="description" />
          </div>
        </div>
        <div className="row-actions">
          <button className="btn btn-primary" type="submit">Guardar módulo</button>
        </div>
      </form>
      <form action={deleteModule} className="inline-form" style={{ marginTop: 10 }}>
        <input name="id" type="hidden" value={module.id} />
        <button className="btn btn-secondary" type="submit">Eliminar módulo</button>
      </form>

      <div className="stack" style={{ marginTop: 16 }}>
        {(module.lessons || []).map((lesson) => (
          <div className="editor" key={lesson.id}>
            <form action={updateLesson} className="stack">
              <input name="id" type="hidden" value={lesson.id} />
              <div className="editor-grid">
                <div className="field">
                  <label>Título de clase</label>
                  <input defaultValue={lesson.title} name="title" required />
                </div>
                <div className="field">
                  <label>Posición</label>
                  <input defaultValue={lesson.position} min="1" name="position" type="number" />
                </div>
                <div className="field">
                  <label>Proveedor de video</label>
                  <select defaultValue={lesson.video_provider || 'vimeo'} name="video_provider">
                    <option value="vimeo">Vimeo</option>
                    <option value="external">External</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div className="field">
                  <label>Status</label>
                  <select defaultValue={lesson.status} name="status">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="field field-full">
                  <label>Resumen</label>
                  <textarea defaultValue={lesson.summary || ''} name="summary" />
                </div>
                <div className="field field-full">
                  <label>Texto de la clase</label>
                  <textarea defaultValue={lesson.body || ''} name="body" />
                </div>
                <div className="field">
                  <label>Vimeo URL</label>
                  <input defaultValue={lesson.vimeo_url || ''} name="vimeo_url" placeholder="https://player.vimeo.com/video/..." />
                </div>
                <div className="field">
                  <label>Video externo</label>
                  <input defaultValue={lesson.external_video_url || ''} name="external_video_url" placeholder="https://..." />
                </div>
              </div>
              <div className="row-actions">
                <label className="attachment-item" style={{ justifyContent: 'flex-start' }}>
                  <input defaultChecked={lesson.is_preview} name="is_preview" type="checkbox" />
                  Clase preview
                </label>
                <button className="btn btn-primary" type="submit">Guardar clase</button>
              </div>
            </form>

            <form action="/api/admin/attachments" encType="multipart/form-data" method="post" className="editor">
              <input name="lesson_id" type="hidden" value={lesson.id} />
              <div className="field">
                <label>Adjuntar archivo</label>
                <input name="file" required type="file" />
              </div>
              <button className="btn btn-secondary" type="submit">Subir adjunto</button>
            </form>

            <div className="attachment-list">
              {(lesson.attachments || []).map((attachment) => (
                <div className="attachment-item" key={attachment.id}>
                  <span>{attachment.file_name}</span>
                  <form action={deleteAttachment} className="inline-form">
                    <input name="id" type="hidden" value={attachment.id} />
                    <input name="bucket_name" type="hidden" value={attachment.bucket_name} />
                    <input name="storage_path" type="hidden" value={attachment.storage_path} />
                    <button className="btn btn-secondary" type="submit">Eliminar</button>
                  </form>
                </div>
              ))}
            </div>

            <form action={deleteLesson} className="inline-form">
              <input name="id" type="hidden" value={lesson.id} />
              <button className="btn btn-secondary" type="submit">Eliminar clase</button>
            </form>
          </div>
        ))}

        <form action={createLesson} className="editor">
          <input name="module_id" type="hidden" value={module.id} />
          <h4>Nueva clase</h4>
          <div className="editor-grid">
            <div className="field">
              <label>Título</label>
              <input name="title" required />
            </div>
            <div className="field">
              <label>Status</label>
              <select defaultValue="draft" name="status">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="field field-full">
              <label>Resumen</label>
              <textarea name="summary" />
            </div>
            <div className="field field-full">
              <label>Texto</label>
              <textarea name="body" />
            </div>
            <div className="field">
              <label>Proveedor de video</label>
              <select defaultValue="vimeo" name="video_provider">
                <option value="vimeo">Vimeo</option>
                <option value="external">External</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="field">
              <label>Vimeo URL</label>
              <input name="vimeo_url" />
            </div>
            <div className="field field-full">
              <label>Video externo</label>
              <input name="external_video_url" />
            </div>
          </div>
          <div className="row-actions">
            <label className="attachment-item" style={{ justifyContent: 'flex-start' }}>
              <input name="is_preview" type="checkbox" />
              Clase preview
            </label>
            <button className="btn btn-primary" type="submit">Crear clase</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProductEditor({ product }) {
  return (
    <div className="list-row">
      <form action={updateProduct} className="editor">
        <input name="id" type="hidden" value={product.id} />
        <div className="editor-grid">
          <div className="field">
            <label>Título</label>
            <input defaultValue={product.title} name="title" required />
          </div>
          <div className="field">
            <label>Categoría</label>
            <input defaultValue={product.category || ''} name="category" />
          </div>
          <div className="field">
            <label>Subcategoría</label>
            <input defaultValue={product.subcategory || ''} name="subcategory" />
          </div>
          <div className="field">
            <label>Formato</label>
            <input defaultValue={product.format || ''} name="format" />
          </div>
          <div className="field">
            <label>ARS</label>
            <input defaultValue={product.price_ars || 0} min="0" name="price_ars" type="number" />
          </div>
          <div className="field">
            <label>USD</label>
            <input defaultValue={product.price_usd || 0} min="0" name="price_usd" step="0.01" type="number" />
          </div>
          <div className="field">
            <label>Tipo</label>
            <select defaultValue={product.product_type || 'downloadable'} name="product_type">
              <option value="downloadable">Downloadable</option>
              <option value="physical">Physical</option>
            </select>
          </div>
          <div className="field">
            <label>Entrega</label>
            <select defaultValue={product.delivery_method || 'download'} name="delivery_method">
              <option value="download">Download</option>
              <option value="shipping">Shipping</option>
            </select>
          </div>
          <div className="field">
            <label>Talles</label>
            <input defaultValue={product.sizes || ''} name="sizes" />
          </div>
          <div className="field">
            <label>Badge</label>
            <input defaultValue={product.badge || ''} name="badge" />
          </div>
          <div className="field">
            <label>Costo envío</label>
            <input defaultValue={product.shipping_cost_ars || 0} min="0" name="shipping_cost_ars" type="number" />
          </div>
          <div className="field">
            <label>Días de envío</label>
            <input defaultValue={product.shipping_days || ''} name="shipping_days" />
          </div>
          <div className="field">
            <label>Download URL</label>
            <input defaultValue={product.download_url || ''} name="download_url" />
          </div>
          <div className="field">
            <label>Color</label>
            <input defaultValue={product.color_hex || '#f4e4d4'} name="color_hex" type="color" />
          </div>
          <div className="field">
            <label>Status</label>
            <select defaultValue={product.status} name="status">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="field field-full">
            <label>Descripción</label>
            <textarea defaultValue={product.description || ''} name="description" />
          </div>
        </div>
        <div className="row-actions">
          <button className="btn btn-primary" type="submit">Guardar producto</button>
        </div>
      </form>
      <form action={deleteProduct} className="inline-form" style={{ marginTop: 10 }}>
        <input name="id" type="hidden" value={product.id} />
        <button className="btn btn-secondary" type="submit">Eliminar producto</button>
      </form>
    </div>
  )
}

export default async function EditorialDashboard() {
  const { courses, products, metrics } = await getAdminDashboardData()

  return (
    <main className="shell admin-layout">
      <aside className="panel sidebar">
        <div className="eyebrow">Backoffice</div>
        <nav>
          <a data-active="true" href="#overview">Resumen</a>
          <a href="#courses">Cursos</a>
          <a href="#products">Productos</a>
          <a href="/admin">Panel clásico</a>
        </nav>
      </aside>

      <section className="panel-grid">
        <section className="panel" id="overview">
          <div className="section-head">
            <div>
              <div className="eyebrow">Estado</div>
              <h1 className="section-title">Panel editorial Vecka</h1>
            </div>
          </div>
          <div className="metric-grid">
            <div className="metric">
              <strong>{metrics.courses}</strong>
              <span className="muted">cursos</span>
            </div>
            <div className="metric">
              <strong>{metrics.lessons}</strong>
              <span className="muted">clases</span>
            </div>
            <div className="metric">
              <strong>{metrics.attachments}</strong>
              <span className="muted">adjuntos</span>
            </div>
            <div className="metric">
              <strong>{metrics.products}</strong>
              <span className="muted">productos</span>
            </div>
          </div>
        </section>

        <section className="panel" id="courses">
          <div className="section-head">
            <div>
              <div className="eyebrow">Cursos</div>
              <h2 className="section-title">Cursos, módulos y clases</h2>
            </div>
          </div>

          <form action={createCourse} className="editor">
            <h3>Nuevo curso</h3>
            <div className="editor-grid">
              <div className="field">
                <label>Título</label>
                <input name="title" required />
              </div>
              <div className="field">
                <label>Subtítulo</label>
                <input name="subtitle" />
              </div>
              <div className="field">
                <label>Categoría</label>
                <input name="category" />
              </div>
              <div className="field">
                <label>Nivel</label>
                <input name="level" />
              </div>
              <div className="field">
                <label>Duración</label>
                <input name="duration_label" />
              </div>
              <div className="field">
                <label>Cover URL</label>
                <input name="cover_image_url" />
              </div>
              <div className="field">
                <label>ARS</label>
                <input min="0" name="price_ars" type="number" />
              </div>
              <div className="field">
                <label>USD</label>
                <input min="0" name="price_usd" step="0.01" type="number" />
              </div>
              <div className="field">
                <label>Status</label>
                <select defaultValue="draft" name="status">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="field">
                <label>Visibilidad</label>
                <select defaultValue="private" name="visibility">
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                  <option value="catalog">Catalog</option>
                </select>
              </div>
              <div className="field field-full">
                <label>Descripción</label>
                <textarea name="description" />
              </div>
            </div>
            <div className="row-actions">
              <label className="attachment-item" style={{ justifyContent: 'flex-start' }}>
                <input name="is_membership" type="checkbox" />
                Curso membresía
              </label>
              <button className="btn btn-primary" type="submit">Crear curso</button>
            </div>
          </form>

          <div className="stack" style={{ marginTop: 20 }}>
            {courses.length === 0 ? <div className="empty">Todavía no hay cursos.</div> : null}
            {courses.map((course) => (
              <div className="panel" key={course.id}>
                <CourseEditor course={course} />
                <div className="stack" style={{ marginTop: 20 }}>
                  {(course.modules || []).map((module) => (
                    <ModuleEditor key={module.id} module={module} />
                  ))}
                  <form action={createModule} className="editor">
                    <input name="course_id" type="hidden" value={course.id} />
                    <h4>Nuevo módulo para {course.title}</h4>
                    <div className="editor-grid">
                      <div className="field">
                        <label>Título</label>
                        <input name="title" required />
                      </div>
                      <div className="field field-full">
                        <label>Descripción</label>
                        <textarea name="description" />
                      </div>
                    </div>
                    <button className="btn btn-primary" type="submit">Crear módulo</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel" id="products">
          <div className="section-head">
            <div>
              <div className="eyebrow">Productos</div>
              <h2 className="section-title">Catálogo comercial</h2>
            </div>
          </div>

          <form action={createProduct} className="editor">
            <h3>Nuevo producto</h3>
            <div className="editor-grid">
              <div className="field">
                <label>Título</label>
                <input name="title" required />
              </div>
              <div className="field">
                <label>Categoría</label>
                <input name="category" />
              </div>
              <div className="field">
                <label>Subcategoría</label>
                <input name="subcategory" />
              </div>
              <div className="field">
                <label>Formato</label>
                <input name="format" />
              </div>
              <div className="field">
                <label>ARS</label>
                <input min="0" name="price_ars" type="number" />
              </div>
              <div className="field">
                <label>USD</label>
                <input min="0" name="price_usd" step="0.01" type="number" />
              </div>
              <div className="field">
                <label>Tipo</label>
                <select defaultValue="downloadable" name="product_type">
                  <option value="downloadable">Downloadable</option>
                  <option value="physical">Physical</option>
                </select>
              </div>
              <div className="field">
                <label>Entrega</label>
                <select defaultValue="download" name="delivery_method">
                  <option value="download">Download</option>
                  <option value="shipping">Shipping</option>
                </select>
              </div>
              <div className="field">
                <label>Talles</label>
                <input name="sizes" />
              </div>
              <div className="field">
                <label>Badge</label>
                <input name="badge" />
              </div>
              <div className="field">
                <label>Costo envío</label>
                <input min="0" name="shipping_cost_ars" type="number" />
              </div>
              <div className="field">
                <label>Días de envío</label>
                <input name="shipping_days" />
              </div>
              <div className="field">
                <label>Download URL</label>
                <input name="download_url" />
              </div>
              <div className="field">
                <label>Color</label>
                <input defaultValue="#f4e4d4" name="color_hex" type="color" />
              </div>
              <div className="field">
                <label>Status</label>
                <select defaultValue="draft" name="status">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="field field-full">
                <label>Descripción</label>
                <textarea name="description" />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">Crear producto</button>
          </form>

          <div className="stack" style={{ marginTop: 20 }}>
            {products.length === 0 ? <div className="empty">Todavía no hay productos.</div> : null}
            {products.map((product) => <ProductEditor key={product.id} product={product} />)}
          </div>
        </section>
      </section>
    </main>
  )
}
