# CLAUDE.md — Migración VeCKA: WordPress → React + Supabase

> **Documento de contexto y plan de migración.**
> Generado a partir del análisis del dump SQL real de producción de vecka.com.ar (`u210132504_HPex9.sql`, ~687 MB sin comprimir, MariaDB 11.8).
> Última actualización: 2026-05-21.
>
> Si sos una nueva sesión de Claude Code: leé este documento entero antes de tocar nada. Hay decisiones tomadas, decisiones abiertas, y trampas conocidas. Saltearte secciones puede costar horas de trabajo.

---

## Tabla de contenidos

1. [Contexto del proyecto](#1-contexto-del-proyecto)
2. [Estado actual](#2-estado-actual)
3. [Stack origen: análisis de vecka.com.ar](#3-stack-origen-análisis-de-veckacomar)
4. [Inventario de datos reales](#4-inventario-de-datos-reales)
5. [Arquitectura del negocio: cómo se entrelazan las piezas](#5-arquitectura-del-negocio-cómo-se-entrelazan-las-piezas)
6. [Decisiones de alcance ya tomadas](#6-decisiones-de-alcance-ya-tomadas)
7. [Decisiones abiertas que bloquean el plan](#7-decisiones-abiertas-que-bloquean-el-plan)
8. [Plan de migración por fases](#8-plan-de-migración-por-fases)
9. [Esquema Supabase (borrador completo)](#9-esquema-supabase-borrador-completo)
10. [Estrategia de migración de contraseñas](#10-estrategia-de-migración-de-contraseñas)
11. [LearnDash: opciones evaluadas](#11-learndash-opciones-evaluadas)
12. [Subscriptions + MercadoPago: la parte más riesgosa](#12-subscriptions--mercadopago-la-parte-más-riesgosa)
13. [Productos WooCommerce: mapeo detallado](#13-productos-woocommerce-mapeo-detallado)
14. [Memberships: lógica de acceso](#14-memberships-lógica-de-acceso)
15. [Storage de archivos y media](#15-storage-de-archivos-y-media)
16. [MailPoet → estrategia de email](#16-mailpoet--estrategia-de-email)
17. [Stack técnico recomendado](#17-stack-técnico-recomendado)
18. [Convenciones del proyecto](#18-convenciones-del-proyecto)
19. [Cómo obtener el dump y los archivos localmente](#19-cómo-obtener-el-dump-y-los-archivos-localmente)
20. [Próximos pasos inmediatos](#20-próximos-pasos-inmediatos)
21. [Glosario del negocio](#21-glosario-del-negocio)

---

## 1. Contexto del proyecto

- **Cliente**: Vero, dueña de **VeCKA** (vecka.com.ar). Negocio: taller de costura online argentino. Vende moldes digitales, moldes impresos, talleres online (cursos), mercería física, y un **Club VeCKA** (membresía mensual con acceso a un Aula Online tipo Netflix-de-costura + clases en vivo + grupo de WhatsApp).
- **Estudio**: GG Diseño (Gustavo). Dev/diseñador a cargo.
- **Objetivo**: Replatformear vecka.com.ar entera desde WordPress a **React + Supabase**. Esto significa reemplazar: tienda + blog + Aula Online + sistema de membresías + facturación recurrente + emailing.
- **Estrategia de corte**: One-shot. Una fecha, corte limpio, sin convivencia prolongada (sí mantener el WP viejo en `legacy.vecka.com.ar` por 30-60 días por las dudas).
- **Idioma**: Toda la copy en español argentino, voseo. Mantener decisiones de copy del cliente al pie de la letra, incluso si parecen "errores" (Vero hace elecciones deliberadas, ej: ausencia de acentos en frases específicas como "Anotate y se la primera en saber").

## 2. Estado actual

- Se construyó una landing page para Club VeCKA (HTML estático con secciones hero/qué-es/cómo-funciona/qué-incluye/testimonios/waitlist form/FAQ/footer). Esa landing fue el punto de entrada al proyecto, pero el alcance real escaló a migración completa.
- Se obtuvo y analizó el dump SQL completo de producción (`u210132504_HPex9.sql`).
- Se descubrió que el stack real es mucho más complejo que lo briefeado al principio. La versión inicial del plan asumía WooCommerce + Memberships básico. La realidad: WooCommerce + Subscriptions + Memberships + **LearnDash LMS** + MailPoet + 4 gateways de pago.
- No hay nada construido todavía en React/Supabase. Arrancamos desde cero.

## 3. Stack origen: análisis de vecka.com.ar

### Servidor

- **Hosting**: Hostinger, cuenta `u210132504` (múltiples sitios bajo la misma cuenta — atención: hay sitios con nombres similares que NO son VeCKA, ya nos equivocamos tres veces antes de dar con el dump correcto).
- **Base de datos**: MariaDB 11.8, nombre `u210132504_HPex9`.
- **PHP**: 7.2.
- **Acceso disponible**: cPanel + phpMyAdmin + FTP. Tenés todo lo que necesitás para exportar dump nuevo, bajar `wp-content/uploads/`, y leer `wp-config.php`.

### Plugins activos (los 38)

Los críticos para la migración (en negrita los que importan más):

- **`woocommerce`** + extensiones: `woocommerce-subscriptions`, **`woocommerce-memberships`**, `woocommerce-checkout-manager`, `woocommerce-direct-checkout`, `woocommerce-multi-currency`, `woo-order-export-lite`
- **Pagos**: `woocommerce-mercadopago` (principal, AR), `woocommerce-paypal-payments`, `woocommerce-payments` (Stripe-like), `paga-con-modo` (Modo, gateway argentino), `yith-dynamic-pricing-per-payment-method-for-woocommerce-premium`
- **Envíos**: `sucursales-correo-argentino-para-woocommerce` (Correo Argentino)
- **LMS**: **`sfwd-lms`** (LearnDash core), `learndash-woocommerce` (integración WC↔LearnDash), `learndash-edd`, `learndash-hub`, `visibility-control-for-learndash`
- **Email**: `wp-mail-smtp`, `wp-mail-logging` (logs los emails enviados — tabla `wp_wpml_mails` con 20K filas)
- **Marketing/email**: tablas de **MailPoet** activas (no figura en `active_plugins` pero las tablas existen con datos — verificar si está activo o quedó residual)
- **E-commerce alternativo**: Easy Digital Downloads (instalado pero prácticamente sin uso: 0 órdenes EDD, solo 9 emails de configuración)
- **UI/Builder**: `elementor`, `elementor-pro`, `elementskit`, `header-footer-elementor`, `essential-addons-elementor`, `bdthemes-element-pack`, `dynamic-visibility-for-elementor`, `woolentor-addons` + `woolentor-addons-pro` (el carrito abandonado vive acá)
- **Otros relevantes**: `yith-wcwl` (wishlist), `emails-verification-for-woocommerce` (doble opt-in en checkout), `code-snippets` (un snippet activo que oculta los comentarios del admin)
- **Seguridad/backup/cache** (NO se migran, son utilidades): `malcare-security`, `duplicator-pro`, `litespeed-cache`, Wordfence (vive en `wp_wf*` y `wp_wfls_*` — 11 tablas con logs masivos que ignorás)

### Idioma y multi-currency

- Plugin de traducciones detectado (`weglot` o similar dejó rastro en `wp_wpml_mails`). Sitio principalmente en español. Confirmar si hay versión inglesa real.
- Multi-currency activo: el primary es ARS (pesos), pero hay clientes con compras en otras monedas. Verificar `wp_options` para ver qué monedas están habilitadas.

## 4. Inventario de datos reales

Conteo de filas por tabla (extraído del dump real, no estimación). Solo las tablas relevantes:

| Tabla | Filas | Qué significa para la migración |
|---|---:|---|
| `wp_users` | **1.970** | Cuentas de clientas (más algunos staff/test). Algunas con compras, otras solo registradas |
| `wp_usermeta` | 80.393 | Metadata por usuario: rol, capabilities, billing/shipping address, preferencias, course progress, membership flags |
| `wp_posts` | 12.320 | TODO el contenido: productos, cursos, lecciones, páginas, posts, attachments, revisions, membership records |
| `wp_postmeta` | **266.195** | Metadata clave-valor de todo lo anterior. Acá vive el 80% de la información real (precios, stock, configuración de cursos, asociaciones) |
| `wp_comments` | 10.630 | Mayormente **notas internas de WooCommerce** sobre órdenes (no comentarios de blog). Solo importás las que sean del blog |
| `wp_wc_orders` (HPOS) | **4.104** | Órdenes de WooCommerce (formato nuevo, High-Performance Order Storage) |
| `wp_wc_orders_meta` | 61.738 | Metadata de órdenes |
| `wp_wc_order_addresses` | 8.208 | Direcciones de envío y facturación por orden (1 billing + 1 shipping = ~4104 × 2) |
| `wp_wc_order_operational_data` | 4.104 | Datos operativos por orden (estado de pago, etc.) |
| `wp_wc_order_product_lookup` | 5.195 | Tabla de lookup orden ↔ producto (denormalizada para reportes) |
| `wp_wc_order_stats` | 4.102 | Stats por orden |
| `wp_wc_customer_lookup` | 1.894 | Customers únicos (subset de wp_users que compraron) |
| `wp_woocommerce_order_items` | 7.340 | Line items de las órdenes (productos comprados, shipping lines, fees, etc.) |
| `wp_woocommerce_order_itemmeta` | 59.416 | Metadata de cada line item |
| `wp_woocommerce_downloadable_product_permissions` | 2.701 | Quién tiene acceso a qué descarga (moldes digitales) |
| `wp_wc_download_log` | 4.663 | Log de descargas |
| `wp_learndash_user_activity` | **13.879** | **Progreso de las alumnas en los cursos** — qué lección vieron, cuándo, si la completaron |
| `wp_learndash_user_activity_meta` | 5.342 | Metadata adicional del progreso |
| `wp_mailpoet_subscribers` | **998** | Suscriptoras al newsletter |
| `wp_mailpoet_subscriber_segment` | 1.984 | Suscriptora ↔ segmento (~2 segmentos por suscriptora promedio) |
| `wp_terms` + `wp_term_taxonomy` + `wp_term_relationships` | 190 / 190 / 1.012 | Categorías de productos, etiquetas, etc. |
| `wp_options` | 3.244 | Settings globales del WP — ignorás casi todo, solo te interesan algunos específicos |

**De `wp_posts`, distribución por `post_type` (lo más importante):**

- `revision`: 1.975 (descartar, son versiones viejas)
- `attachment`: 1.396 (cada imagen/PDF subido al media library)
- `sfwd-lessons`: ~302 (lecciones de LearnDash — el contenido del Aula Online)
- `product_variation`: ~96 (variaciones de productos variables, ej: talle/color)
- `wc_user_membership`: 87 (registros de membresías — de las cuales **71 están activas**, status `wcm-active`)
- `shop_coupon`: 81 (cupones de descuento)
- `sfwd-courses`: ~57 (cursos completos — un curso agrupa lecciones)
- `sfwd-question`: 51 (preguntas de quizzes)
- `sfwd-quiz`: 31 (quizzes asociados a cursos)
- `sfwd-essays`: 28 (essays/tareas escritas que las alumnas suben)
- `nav_menu_item`: 17 (items de menú)
- `page`: 15 (páginas del sitio: home, contacto, términos, etc.)
- `product`: 15 visibles pero el real es mucho más alto — el parser falló por HTML embebido. La cantidad real de productos publicados está entre **80 y 200** según referencias cruzadas con `wp_wc_order_product_lookup`. Hay que verificar con un query directo.
- `elementor_library`: 14 (templates de Elementor)
- `wc_membership_plan`: 6 (planes de membresía — ej: "Club Mensual", "Club Trimestral")
- `post`: bajo (entre 1 y 10, el blog se usa poco)
- `sfwd-topic`: 1+ (topics dentro de lecciones, jerarquía de LearnDash)

**Notas sobre las cifras:**

- El parser CSV falló parseando rows con HTML denso (Elementor mete bloques enormes con comas y comillas embebidas en `post_content`). Los conteos de `product` y `post` son piso, no real. **Cuando empieces en Claude Code, una de las primeras cosas a hacer es cargar el dump en MySQL/MariaDB local y correr conteos reales con SQL.**
- Las 4.104 órdenes incluyen TODOS los estados: completadas, canceladas, pending, refunded, failed. Para migrar customer history conviene quedarse solo con `wc-completed`, `wc-processing`, `wc-on-hold`, `wc-refunded` (descarta `wc-pending`, `wc-cancelled`, `wc-failed`, y `auto-draft`).
- Hay 71 `wc_user_membership` activas. Cada una está asociada a un `wp_user` y a un `wc_membership_plan`. **Esas 71 personas son las que están pagando el Club ahora mismo — la migración no las puede dejar afuera.**

## 5. Arquitectura del negocio: cómo se entrelazan las piezas

Esto es crítico para entender qué tabla mapea a qué.

```
                    ┌─────────────────────────────┐
                    │   CLIENTA (wp_users)         │
                    └──────────────┬───────────────┘
                                   │
            ┌──────────────────────┼──────────────────────┐
            │                      │                      │
            ▼                      ▼                      ▼
    ┌───────────────┐    ┌─────────────────┐    ┌──────────────────┐
    │ ORDERS         │    │ SUBSCRIPTIONS   │    │ MEMBERSHIPS       │
    │ (wp_wc_orders) │    │ (wp_posts con   │    │ (wp_posts con     │
    │ Compras one-off│    │ post_type =     │    │ post_type =       │
    │ de talleres,   │    │ shop_subscription│    │ wc_user_membership)│
    │ moldes,        │    │ — recurrencia   │    │                   │
    │ mercería       │    │ del Club)       │    │ Activan acceso   │
    └───────┬────────┘    └────────┬────────┘    └─────────┬────────┘
            │                      │                       │
            │                      │                       │
            ▼                      ▼                       ▼
    ┌───────────────────────────────────────────────────────────┐
    │              ACCESO A CONTENIDO                            │
    │                                                            │
    │  • Producto "Taller X" comprado one-off                    │
    │       → desbloquea curso LearnDash X (vía learndash_wc)    │
    │                                                            │
    │  • Suscripción del Club activa                             │
    │       → mantiene Membership activa                         │
    │       → Membership desbloquea cursos del Aula del Club     │
    │                                                            │
    │  • Producto "Molde digital" comprado one-off               │
    │       → permite descargar archivo (wc_downloadable_perms)  │
    └────────────────┬──────────────────────────────────────────┘
                     │
                     ▼
              ┌──────────────────────┐
              │ LearnDash CPTs       │
              │ • sfwd-courses (57)  │
              │   • sfwd-lessons (302)│
              │     • sfwd-topic     │
              │     • sfwd-quiz (31) │
              │       • sfwd-question│
              │   • sfwd-essays (28) │
              └──────────────────────┘
                     │
                     ▼
              ┌──────────────────────┐
              │ wp_learndash_user_   │
              │ activity (13.879)    │ ← progreso de cada alumna
              └──────────────────────┘
```

**Flujos típicos de una clienta:**

1. **Compra puntual de un taller**:
   `Producto (post_type=product)` → al pagar → crea `order` con line item → trigger del plugin `learndash-woocommerce` → enrola al user en el curso LearnDash asociado → la alumna ahora ve ese curso en el Aula Online.

2. **Inscripción al Club VeCKA**:
   `Producto suscripción` → al pagar → crea `order` + `shop_subscription` (recurring) → crea `wc_user_membership` activa → la membership le da acceso a múltiples cursos LearnDash (los del Club).

3. **Compra de molde digital**:
   `Producto digital (downloadable)` → al pagar → crea entrada en `wp_woocommerce_downloadable_product_permissions` → la clienta ve el link de descarga en su área "Mi Cuenta → Talleres y Descargas".

4. **Mercería física**:
   `Producto físico` → al pagar → orden con shipping a través de Correo Argentino → tracking → estado pasa a `wc-completed` cuando se despacha.

## 6. Decisiones de alcance ya tomadas

- ✅ Reemplaza **vecka.com.ar entera** (tienda + blog + Club + Aula Online). No es parcial.
- ✅ **Corte limpio en una fecha** (no convivencia prolongada).
- ✅ Stack destino: **React + Supabase**.
- ✅ Mantener idioma: **español argentino voseo**.

## 7. Decisiones abiertas que bloquean el plan

Estas hay que cerrarlas ANTES de avanzar mucho. Cada una es un fork importante.

### 7.1 LearnDash: ¿cómo reemplazarlo?

Tres opciones (detalle completo en [Sección 11](#11-learndash-opciones-evaluadas)):
- (A) Rebuild en Supabase + React (control total, mucho trabajo)
- (B) LMS externa SaaS (Teachable, Thinkific, Podia, Kajabi) — menos trabajo pero pierde integración nativa con tu auth y tu checkout
- (C) Headless con LearnWorlds / LearnDash con un frontend custom (raro, no recomendado)

**Recomendación tentativa**: (A) si Vero quiere control e integración con su checkout/auth/precios en ARS. (B) si lo principal es velocidad de salida y aceptar perder UX integrada. **Decidir con Vero antes de avanzar.**

### 7.2 Subscriptions: ¿qué hacer con las 71 membresías activas?

(Detalle en [Sección 12](#12-subscriptions--mercadopago-la-parte-más-riesgosa))

- (A) Cancelar y pedir re-suscripción → UX pésima, perdés gente
- (B) Migrar las "preapprovals" de MercadoPago al nuevo sistema → técnicamente posible pero requiere usar la misma cuenta de MP y SDK nuevo
- (C) Híbrido: WP procesa los cobros hasta fin del mes en curso, sistema nuevo arranca con cobros desde el ciclo siguiente → el menos riesgoso pero requiere "freezear" altas en WP en una fecha y avisar a las clientas

**Recomendación**: (C). **Decidir fecha de corte y plan de comunicación con Vero.**

### 7.3 Auth: ¿cómo migrar contraseñas?

(Detalle en [Sección 10](#10-estrategia-de-migración-de-contraseñas))

- (A) Forzar reset por email a las 1.970 cuentas → simple, fricción alta
- (B) Edge Function que verifica phpass al primer login y migra el hash a bcrypt automáticamente → 0 fricción, requiere código backend custom

**Recomendación**: (B). Las clientas pagaron, no se las puede dejar bloqueadas.

### 7.4 Storage de media: ¿Supabase Storage o CDN externo?

- Supabase Storage: integrado, simple, RLS unificada con la BD, pero costo por GB puede subir
- CDN externo (Cloudflare R2, Bunny.net): más barato a escala, más config

**Recomendación**: empezar con Supabase Storage. Si crece mucho, migrar a R2 después.

### 7.5 Host del frontend

- Vercel (lo más simple para Next.js / Vite)
- Netlify
- Hostinger directamente (donde ya están)
- Cloudflare Pages

**Decidir antes del cutover** porque afecta el DNS y la config de SSL.

### 7.6 Email: ¿con qué reemplazás MailPoet?

MailPoet hoy maneja: lista de suscriptoras (998), newsletters, automatización básica. Reemplazos:
- **Resend** o **Postmark** para emails transaccionales (welcome, recibos, password reset) → necesarios sí o sí
- **Mailchimp** / **Klaviyo** / **Brevo (ex-Sendinblue)** para marketing (newsletters, automatizaciones)
- O todo-en-uno: **Loops.so**, **Customer.io**

**Recomendación**: Resend para transaccional (barato, dev-friendly) + Brevo o Mailchimp para marketing (Vero ya conoce la dinámica).

### 7.7 Otros forks menores a definir

- Multi-currency en el sitio nuevo: ¿solo ARS o también USD/USDT?
- SEO: ¿mantener URLs viejas con redirects 301? (recomendado SÍ para no perder tráfico orgánico)
- Analítica: ¿GA4, Plausible, PostHog?
- Búsqueda en el sitio: ¿Algolia, Meilisearch, o pgvector + Supabase?

## 8. Plan de migración por fases

Cada fase tiene entregables concretos. No saltar fases.

### Fase 0 — Preparación (1-2 días)

1. Bajar dump SQL nuevo y fresco desde phpMyAdmin de Hostinger (formato SQL, no compress en el server, comprimir al bajar).
2. Bajar `/wp-content/uploads/` completo por FTP (probablemente varios GB).
3. Levantar el dump en una MariaDB local para poder hacer queries reales:
   ```bash
   docker run -d --name vecka-db -e MYSQL_ROOT_PASSWORD=secret -p 3306:3306 mariadb:11
   docker exec -i vecka-db mysql -uroot -psecret -e "CREATE DATABASE vecka;"
   docker exec -i vecka-db mysql -uroot -psecret vecka < u210132504_HPex9.sql
   ```
4. Auditar `wp_options` para listar settings que importan: monedas habilitadas, gateways activos, regiones de envío, opciones de LearnDash.
5. Inventariar `meta_keys` distintos en `wp_postmeta` y `wp_usermeta` (para no perderse campos custom de plugins):
   ```sql
   SELECT meta_key, COUNT(*) FROM wp_postmeta GROUP BY meta_key ORDER BY 2 DESC;
   SELECT meta_key, COUNT(*) FROM wp_usermeta GROUP BY meta_key ORDER BY 2 DESC;
   ```
6. Confirmar conteos reales de productos:
   ```sql
   SELECT post_status, COUNT(*) FROM wp_posts WHERE post_type='product' GROUP BY post_status;
   SELECT post_status, COUNT(*) FROM wp_posts WHERE post_type='post' GROUP BY post_status;
   ```
7. Crear proyecto en Supabase + activar Auth + Storage + Edge Functions.

### Fase 1 — Diseño del esquema Supabase (2-3 días)

Ver [Sección 9](#9-esquema-supabase-borrador-completo) para el SQL completo. Principios:
- **UUIDs** como PK (`gen_random_uuid()`).
- Columna `legacy_wp_id` en cada tabla para mantener trazabilidad y mapear FKs durante el ETL.
- **RLS habilitada en todas las tablas** desde el día 1.
- Índices en `legacy_wp_id`, `user_id`, `status`, y campos de búsqueda.
- Triggers de `updated_at` automáticos.

### Fase 2 — Extracción de datos (1-2 días)

Dos vías combinadas:
- **WP REST API** (mejor para productos, posts, customers): el WP de VeCKA expone `/wp-json/wc/v3/...`. Generás API keys desde WooCommerce → Ajustes → Avanzado → REST API. Devuelve JSON limpio.
- **SQL directo** (para lo que la API no expone bien): contraseñas (`wp_users.user_pass`), LearnDash custom tables, MailPoet, memberships internos.

Output: archivos JSON estructurados por entidad en una carpeta `migration/exports/`:
- `users.json`
- `customers.json`
- `products.json` (+ variations.json)
- `orders.json`
- `subscriptions.json`
- `memberships.json`
- `membership_plans.json`
- `courses.json`
- `lessons.json`
- `quizzes.json`
- `user_progress.json`
- `posts.json` (blog)
- `mailpoet_subscribers.json`
- `legacy_passwords.json` (separado, sensible)

### Fase 3 — ETL: transformación e inserción (3-5 días)

Script Node.js en `migration/etl/`. Estructura:

```
migration/
├── etl/
│   ├── 00-prep.ts           # Crear tablas auxiliares de mapping
│   ├── 01-users.ts          # wp_users → auth.users + profiles
│   ├── 02-addresses.ts
│   ├── 03-categories.ts
│   ├── 04-products.ts
│   ├── 05-variants.ts
│   ├── 06-orders.ts
│   ├── 07-order-items.ts
│   ├── 08-subscriptions.ts
│   ├── 09-membership-plans.ts
│   ├── 10-memberships.ts
│   ├── 11-courses.ts
│   ├── 12-lessons.ts
│   ├── 13-quizzes.ts
│   ├── 14-quiz-questions.ts
│   ├── 15-user-progress.ts
│   ├── 16-downloadable-permissions.ts
│   ├── 17-posts.ts          # blog
│   ├── 18-coupons.ts
│   ├── 19-mailpoet-subscribers.ts
│   └── 99-verify.ts         # conteos vs origen
├── lib/
│   ├── supabase-admin.ts    # cliente con service_role key
│   ├── id-map.ts            # gestión del mapeo wp_id → uuid
│   └── wp-rest-client.ts
└── exports/                 # JSON dumps
```

Reglas de oro del ETL:
- Cada script es **idempotente**: si lo corrés dos veces, no duplica datos (usa `legacy_wp_id` como key de UPSERT).
- **Logging exhaustivo**: cada script escribe a `migration/logs/[script].log` con cada insert, error, skip.
- **Orden importa por FKs**: usuarios antes que órdenes, planes antes que membresías, cursos antes que lecciones, etc.
- **service_role key** solo en el script de migración, NUNCA en el frontend.

### Fase 4 — Migración de archivos (1-2 días)

(Detalle en [Sección 15](#15-storage-de-archivos-y-media))

1. Crear buckets en Supabase Storage: `products`, `lessons`, `posts`, `avatars`, `downloads` (privado), `member-files` (privado).
2. Script que recorre `/wp-content/uploads/` y sube todo manteniendo estructura de carpetas por año/mes.
3. **Mapeo de URLs**: archivo CSV `wp-url → supabase-url` para hacer find-and-replace después.
4. Reescribir URLs embebidas en contenido HTML de productos, posts, lecciones (parsear con cheerio o regex).

### Fase 5 — Frontend React (4-8 semanas, depende de scope)

No detallado en este documento — es trabajo de implementación. Pero los módulos principales:
- Auth + perfil
- Tienda + checkout + carrito
- Detalle de producto (con variantes)
- Mi Cuenta (órdenes, descargas, dirección)
- Aula Online (player de lecciones, navegación de curso, progreso)
- Club VeCKA (gestión de suscripción, ver clases en vivo embebidas de Vimeo)
- Blog
- Páginas estáticas (sobre, contacto, términos, política)
- Admin panel para Vero (opcional, podría usar Supabase Studio inicialmente)

### Fase 6 — Validación pre-cutover (3-5 días)

- Conteos lado a lado: productos, órdenes, customers, memberships activas
- Spot checks de 20 órdenes random comparando totales, items, dirección
- Test de login con 5-10 clientas reales (con permiso de Vero)
- Revisión de imágenes en productos y lecciones
- Test del flujo completo: registro → compra de un taller → acceso al curso → marcar lección como completada
- Test de checkout con MercadoPago en modo sandbox

### Fase 7 — Cutover (1 día, planificado)

(Detalle de subscriptions en [Sección 12](#12-subscriptions--mercadopago-la-parte-más-riesgosa))

Día D:
1. Plugin de "mantenimiento" activo en el WP viejo desde la mañana
2. Re-correr ETL delta: solo lo nuevo desde el último dump (órdenes, registros, suscripciones)
3. Cambiar DNS de vecka.com.ar al hosting nuevo (TTL bajo desde días antes)
4. WP viejo queda en `legacy.vecka.com.ar` solo-lectura por 30-60 días
5. Monitoreo intensivo de errores las primeras 48 horas
6. Comunicación a clientas: email + WhatsApp + post en redes anunciando el sitio nuevo + cómo loguearse + qué hacer si algo no anda

## 9. Esquema Supabase (borrador completo)

> Este es un borrador funcional, no final. Refinar según necesidad.
> Todo en SQL standard, listo para correr en el editor SQL de Supabase.

```sql
-- ============================================================
-- EXTENSIONES
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- búsqueda fuzzy

-- ============================================================
-- UTILIDADES
-- ============================================================

-- Trigger reutilizable para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PROFILES (extiende auth.users)
-- ============================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  legacy_wp_id BIGINT UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  phone TEXT,
  whatsapp TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer'  -- customer, admin, instructor
    CHECK (role IN ('customer', 'admin', 'instructor', 'staff')),
  newsletter_opt_in BOOLEAN DEFAULT false,
  preferred_locale TEXT DEFAULT 'es-AR',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_profiles_legacy_wp_id ON public.profiles(legacy_wp_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
-- Admin policies via service_role

-- ============================================================
-- ADDRESSES (billing y shipping)
-- ============================================================

CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('billing', 'shipping')),
  is_default BOOLEAN DEFAULT false,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postcode TEXT,
  country TEXT NOT NULL DEFAULT 'AR',
  phone TEXT,
  email TEXT,
  -- Específico Correo Argentino:
  shipping_sucursal_id TEXT,  -- ID de sucursal si elige retiro
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_addresses_user ON public.addresses(user_id);
CREATE TRIGGER trg_addresses_updated_at BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own addresses" ON public.addresses
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- PRODUCT CATALOG
-- ============================================================

CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wp_id BIGINT UNIQUE,
  parent_id UUID REFERENCES public.product_categories(id),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wp_id BIGINT UNIQUE,
  type TEXT NOT NULL CHECK (type IN (
    'simple', 'variable', 'course', 'subscription', 'downloadable', 'membership_pack'
  )),
  slug TEXT UNIQUE NOT NULL,
  sku TEXT,
  title TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived', 'private')),
  -- Pricing (ARS por defecto, multi-currency en tabla separada si hace falta)
  regular_price NUMERIC(12,2),
  sale_price NUMERIC(12,2),
  sale_from TIMESTAMPTZ,
  sale_until TIMESTAMPTZ,
  -- Stock
  manage_stock BOOLEAN DEFAULT false,
  stock_quantity INT,
  stock_status TEXT DEFAULT 'instock'
    CHECK (stock_status IN ('instock', 'outofstock', 'onbackorder')),
  -- Físico/digital
  is_virtual BOOLEAN DEFAULT false,
  is_downloadable BOOLEAN DEFAULT false,
  weight_grams INT,
  dimensions JSONB,  -- {length, width, height}
  -- Asociaciones LMS
  linked_course_id UUID,  -- FK a courses; se setea al final si el producto desbloquea curso
  -- Asociaciones Membership
  linked_membership_plan_id UUID,
  -- Metadata extensible (para no perder nada del wp_postmeta)
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_products_legacy_wp_id ON public.products(legacy_wp_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_type ON public.products(type);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_title_trgm ON public.products USING gin (title gin_trgm_ops);
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.product_category_links (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wp_id BIGINT UNIQUE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT,
  attributes JSONB NOT NULL,  -- ej: {"talle": "M", "color": "rojo"}
  regular_price NUMERIC(12,2),
  sale_price NUMERIC(12,2),
  stock_quantity INT,
  stock_status TEXT DEFAULT 'instock',
  weight_grams INT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_variants_product ON public.product_variants(product_id);

CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false
);

-- Archivos descargables (moldes digitales)
CREATE TABLE public.product_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,  -- en bucket privado
  sort_order INT DEFAULT 0
);

-- Permisos: quién puede descargar qué (resultado de compras)
CREATE TABLE public.user_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_download_id UUID NOT NULL REFERENCES public.product_downloads(id) ON DELETE CASCADE,
  order_id UUID,  -- FK a orders, sin cascade
  granted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  download_count INT DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  UNIQUE (user_id, product_download_id)
);

-- Productos a las categorías (legacy_wp_id ya guarda mapping)

-- RLS de products: lectura pública si status=published, escritura solo service_role
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads published products" ON public.products
  FOR SELECT USING (status = 'published');

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TYPE public.order_status AS ENUM (
  'pending', 'processing', 'on_hold', 'completed',
  'cancelled', 'refunded', 'failed', 'partially_refunded'
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wp_id BIGINT UNIQUE,
  order_number TEXT UNIQUE NOT NULL,  -- formato: VK-2026-00042
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_email TEXT,  -- si checkout sin cuenta
  status order_status NOT NULL DEFAULT 'pending',
  currency TEXT NOT NULL DEFAULT 'ARS',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- Billing
  billing_first_name TEXT,
  billing_last_name TEXT,
  billing_company TEXT,
  billing_address_1 TEXT,
  billing_address_2 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_postcode TEXT,
  billing_country TEXT,
  billing_phone TEXT,
  billing_email TEXT,
  -- Shipping
  shipping_first_name TEXT,
  shipping_last_name TEXT,
  shipping_address_1 TEXT,
  shipping_address_2 TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_postcode TEXT,
  shipping_country TEXT,
  shipping_method TEXT,  -- ej: 'correo_argentino_sucursal'
  shipping_tracking_number TEXT,
  -- Pago
  payment_method TEXT,  -- 'mercadopago', 'paypal', 'modo', 'wc_payments'
  payment_gateway_txn_id TEXT,
  paid_at TIMESTAMPTZ,
  -- Misceláneo
  customer_note TEXT,
  internal_notes JSONB DEFAULT '[]'::jsonb,  -- array de {author, date, content}
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_legacy_wp_id ON public.orders(legacy_wp_id);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wp_id BIGINT,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  -- Snapshot del producto al momento de la compra (no se pierde info si el producto se borra después)
  product_snapshot JSONB NOT NULL,  -- {title, sku, price, image_url, attributes}
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  tax NUMERIC(12,2) DEFAULT 0,
  meta JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

-- RLS órdenes: cada user ve sólo las suyas
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own order items" ON public.order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()
  ));

-- ============================================================
-- SUBSCRIPTIONS (recurrencia del Club)
-- ============================================================

CREATE TYPE public.subscription_status AS ENUM (
  'active', 'on_hold', 'cancelled', 'expired', 'pending_cancel', 'pending'
);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wp_id BIGINT UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_product_id UUID REFERENCES public.products(id),
  status subscription_status NOT NULL DEFAULT 'pending',
  billing_period TEXT NOT NULL,  -- 'month', 'year', 'quarter'
  billing_interval INT NOT NULL DEFAULT 1,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  -- Fechas clave
  started_at TIMESTAMPTZ NOT NULL,
  next_payment_at TIMESTAMPTZ,
  last_payment_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  -- Gateway (MercadoPago preapproval, Stripe sub, etc.)
  payment_gateway TEXT NOT NULL,
  gateway_subscription_id TEXT,  -- el ID en el gateway (preapproval_id en MP)
  gateway_customer_id TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_subs_user ON public.subscriptions(user_id);
CREATE INDEX idx_subs_status ON public.subscriptions(status);
CREATE INDEX idx_subs_next_payment ON public.subscriptions(next_payment_at)
  WHERE status = 'active';
CREATE TRIGGER trg_subs_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Histórico de cobros
CREATE TABLE public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'succeeded', 'failed', 'pending', 'refunded'
  gateway_txn_id TEXT,
  charged_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  failure_reason TEXT
);

-- ============================================================
-- MEMBERSHIP PLANS Y MEMBERSHIPS
-- ============================================================

CREATE TABLE public.membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wp_id BIGINT UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  -- Tipo de acceso
  access_type TEXT NOT NULL DEFAULT 'subscription'
    CHECK (access_type IN ('subscription', 'one_time', 'lifetime')),
  -- Si se compra con un producto específico
  granted_by_product_id UUID REFERENCES public.products(id),
  -- Si la membresía expira sola
  duration_days INT,  -- null = no expira
  -- Misc
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TYPE public.membership_status AS ENUM (
  'active', 'paused', 'cancelled', 'expired', 'pending'
);

CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wp_id BIGINT UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.membership_plans(id),
  subscription_id UUID REFERENCES public.subscriptions(id),  -- si proviene de una sub
  status membership_status NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, plan_id)
);
CREATE INDEX idx_memberships_user ON public.memberships(user_id);
CREATE INDEX idx_memberships_status ON public.memberships(status);
CREATE INDEX idx_memberships_plan ON public.memberships(plan_id);
CREATE TRIGGER trg_memberships_updated_at BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Qué cursos desbloquea cada plan de membership
CREATE TABLE public.membership_plan_courses (
  plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  PRIMARY KEY (plan_id, course_id)
);

-- RLS memberships
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own memberships" ON public.memberships
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- LMS: CURSOS, LECCIONES, QUIZZES, PROGRESO
-- ============================================================

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wp_id BIGINT UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  cover_image_url TEXT,
  trailer_video_url TEXT,
  level TEXT,  -- 'beginner', 'intermediate', 'advanced'
  duration_minutes INT,
  instructor_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INT DEFAULT 0,
  -- Acceso: o se compra como producto, o viene por membership
  is_free BOOLEAN DEFAULT false,
  granted_by_product_id UUID REFERENCES public.products(id),
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_courses_legacy_wp_id ON public.courses(legacy_wp_id);
CREATE INDEX idx_courses_status ON public.courses(status);
CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wp_id BIGINT UNIQUE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,  -- HTML; el video va embebido (Vimeo iframe) o en video_url
  video_url TEXT,  -- URL de Vimeo principalmente
  video_provider TEXT,  -- 'vimeo', 'youtube', 'mux', etc.
  duration_seconds INT,
  sort_order INT NOT NULL DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT false,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (course_id, slug)
);
CREATE INDEX idx_lessons_course ON public.lessons(course_id);
CREATE TRIGGER trg_lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Archivos adjuntos a lecciones (PDFs de moldes, guías, etc.)
CREATE TABLE public.lesson_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,  -- 'pdf', 'image', 'video', 'zip'
  sort_order INT DEFAULT 0
);

CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wp_id BIGINT UNIQUE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id),
  title TEXT NOT NULL,
  description TEXT,
  passing_score INT DEFAULT 70,  -- %
  max_attempts INT,
  randomize_questions BOOLEAN DEFAULT false,
  time_limit_minutes INT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wp_id BIGINT UNIQUE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,  -- 'single', 'multiple', 'text', 'essay'
  points INT DEFAULT 1,
  sort_order INT DEFAULT 0,
  options JSONB,  -- array de {id, text, is_correct}
  correct_answer TEXT,  -- para tipo text
  explanation TEXT
);

CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score NUMERIC(5,2),
  passed BOOLEAN,
  answers JSONB,
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_quiz_attempts_user ON public.quiz_attempts(user_id);

-- Essays (tareas escritas que las alumnas suben)
CREATE TABLE public.essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wp_id BIGINT UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  lesson_id UUID REFERENCES public.lessons(id),
  course_id UUID REFERENCES public.courses(id),
  title TEXT,
  content TEXT,
  file_url TEXT,  -- por si suben archivo en lugar de texto
  status TEXT DEFAULT 'submitted',  -- 'submitted', 'graded', 'rejected'
  grade NUMERIC(5,2),
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  graded_at TIMESTAMPTZ
);

-- Progreso de las alumnas: una fila por (user, lesson)
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_pct INT DEFAULT 0,  -- 0-100
  last_position_seconds INT DEFAULT 0,  -- para resume de video
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, lesson_id)
);
CREATE INDEX idx_progress_user_course ON public.lesson_progress(user_id, course_id);

-- Enrollments (qué cursos puede acceder cada user, y por qué)
CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  source TEXT NOT NULL,  -- 'purchase', 'membership', 'admin_grant', 'free'
  source_order_id UUID REFERENCES public.orders(id),
  source_membership_id UUID REFERENCES public.memberships(id),
  enrolled_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ,  -- null = sin expirar
  UNIQUE (user_id, course_id, source)
);
CREATE INDEX idx_enrollments_user ON public.course_enrollments(user_id);
CREATE INDEX idx_enrollments_course ON public.course_enrollments(course_id);

-- RLS LMS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Cursos: publicados son visibles a todos (para landing y catálogo)
CREATE POLICY "anyone reads published courses" ON public.courses
  FOR SELECT USING (status = 'published');

-- Lecciones: solo si está enrolado al curso, o es preview
CREATE POLICY "enrolled users read lessons" ON public.lessons
  FOR SELECT USING (
    is_free_preview = true
    OR EXISTS (
      SELECT 1 FROM public.course_enrollments
      WHERE course_id = lessons.course_id AND user_id = auth.uid()
        AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- Progreso: solo el propio
CREATE POLICY "users manage own progress" ON public.lesson_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users read own enrollments" ON public.course_enrollments
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- BLOG
-- ============================================================

CREATE TABLE public.post_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wp_id BIGINT UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wp_id BIGINT UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  author_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_posts_slug ON public.posts(slug);
CREATE INDEX idx_posts_published_at ON public.posts(published_at DESC);
CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.post_category_links (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.post_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- ============================================================
-- COUPONS
-- ============================================================

CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wp_id BIGINT UNIQUE,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed_cart', 'fixed_product')),
  amount NUMERIC(12,2) NOT NULL,
  min_purchase NUMERIC(12,2),
  max_uses INT,
  uses_count INT DEFAULT 0,
  max_uses_per_user INT,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  applies_to_product_ids UUID[],
  excluded_product_ids UUID[],
  applies_to_category_ids UUID[],
  free_shipping BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id),
  user_id UUID REFERENCES public.profiles(id),
  order_id UUID REFERENCES public.orders(id),
  used_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- WISHLIST (yith)
-- ============================================================

CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Mi lista de deseos',
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (wishlist_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own wishlist" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- MIGRATION HELPERS (temporales — borrar después del cutover)
-- ============================================================

-- Hashes phpass para login transparente (ver Sección 10)
CREATE TABLE public.legacy_passwords (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  phpass_hash TEXT NOT NULL,
  migrated BOOLEAN DEFAULT false,
  migrated_at TIMESTAMPTZ
);
ALTER TABLE public.legacy_passwords ENABLE ROW LEVEL SECURITY;
-- Sin policies: solo se accede vía service_role en la Edge Function

-- URL mapping para reescritura de contenido
CREATE TABLE public.media_url_map (
  wp_url TEXT PRIMARY KEY,
  supabase_url TEXT NOT NULL,
  migrated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- FIN ESQUEMA
-- ============================================================
```

**Notas sobre el esquema:**

- Falta agregar tablas para: shipping zones/methods, tax rates, abandoned carts (woolentor), wp_e_submissions de Elementor (form submissions). Agregalas según necesidad.
- Las `meta JSONB` permiten guardar lo que no encaja sin tener que migrar el esquema cada vez.
- Los `legacy_wp_id` son tu **lifeline** durante toda la migración. No los borres hasta que estés 100% seguro de que todo funciona.

## 10. Estrategia de migración de contraseñas

WordPress usa **phpass** (`$P$...`), Supabase Auth usa **bcrypt** (`$2a$.../$2b$...`). No son interoperables directamente.

### Opción A — Reset masivo (la simple)

1. Importás todos los users a `auth.users` con `email_confirm=true` pero sin password (o password random).
2. Antes del cutover, mandás un email a las 1.970 cuentas explicando el cambio y el link de "establecer contraseña".
3. Cuando intentan loguearse, usan "Olvidé mi contraseña" → magic link → setean nueva password.

**Pro**: cero código backend. Funciona out-of-the-box con Supabase.
**Contra**: muchas clientas no van a leer el email, otras no van a recibirlo (spam, email viejo), y vas a tener un problema de soporte enorme las primeras 2 semanas.

### Opción B — Verificación dual con Edge Function (la limpia)

Es la **recomendada para VeCKA** porque las clientas ya pagaron y no se las puede dejar afuera.

**Flujo:**

1. En el ETL, además de crear el user en `auth.users`, guardás el `user_pass` original (hash phpass) en la tabla `public.legacy_passwords`.
2. Reemplazás el endpoint normal de login por una **Edge Function** custom (`/auth/login-with-migration`).
3. Cuando una clienta intenta loguearse:
   - Primero, intentás auth normal contra Supabase Auth.
   - Si falla y el user existe en `legacy_passwords`:
     - Verificás la password contra el hash phpass usando la librería `phpass` de npm.
     - Si matchea: actualizás la password en Supabase Auth con la password en claro (que Supabase rehashea como bcrypt internamente), marcás `migrated=true`, y logueás al user.
     - Si no matchea: devolvés error genérico de credenciales.
4. Después de 60-90 días, descartás `legacy_passwords` y deshabilitás la Edge Function. Las cuentas no migradas pasan a "olvidé mi contraseña" estándar.

**Esqueleto de la Edge Function** (Deno, en `supabase/functions/login-with-migration/index.ts`):

```typescript
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { CheckPassword } from 'npm:phpass@0.1.1'  // verificar versión

Deno.serve(async (req) => {
  const { email, password } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 1. Intentar login normal
  const normal = await supabase.auth.signInWithPassword({ email, password })
  if (!normal.error) {
    return new Response(JSON.stringify(normal.data), { headers: { 'Content-Type': 'application/json' } })
  }

  // 2. Buscar user por email para ver si está en legacy
  const { data: userByEmail } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()
  if (!userByEmail) return new Response('Invalid credentials', { status: 401 })

  const { data: legacy } = await supabase
    .from('legacy_passwords')
    .select('phpass_hash, migrated')
    .eq('user_id', userByEmail.id)
    .single()
  if (!legacy || legacy.migrated) return new Response('Invalid credentials', { status: 401 })

  // 3. Verificar phpass
  const phpass = new CheckPassword({ iteration_count_log2: 8, portable_hashes: true })
  const ok = phpass.CheckPassword(password, legacy.phpass_hash)
  if (!ok) return new Response('Invalid credentials', { status: 401 })

  // 4. Re-set password en Supabase Auth con bcrypt
  await supabase.auth.admin.updateUserById(userByEmail.id, { password })
  await supabase.from('legacy_passwords').update({ migrated: true, migrated_at: new Date().toISOString() }).eq('user_id', userByEmail.id)

  // 5. Re-loguear ya con bcrypt
  const reauth = await supabase.auth.signInWithPassword({ email, password })
  return new Response(JSON.stringify(reauth.data), { headers: { 'Content-Type': 'application/json' } })
})
```

**Verificá la versión exacta del paquete `phpass` en npm/jsr** y testealo contra hashes reales del dump antes de confiar.

## 11. LearnDash: opciones evaluadas

LearnDash es lo más pesado de la migración. Hay 57 cursos con 302 lecciones, 31 quizzes con 51 preguntas, 28 essays, y **13.879 registros de progreso de alumnas**. Toda la operación del Aula Online y del Club VeCKA depende de esto.

### Opción A — Rebuild en Supabase + React (RECOMENDADO si Vero quiere control)

**Implementación:**
- Las tablas `courses`, `lessons`, `quizzes`, `lesson_progress` del esquema (Sección 9) cubren toda la funcionalidad.
- Frontend: un course player en React. Mira referencias en Frontity, Refine, o un dashboard custom.
- Video player: Vimeo embebido (Vero ya usa Vimeo Pro, los URLs están en el contenido de las lecciones).
- Progreso: track del video position + marcar como completada al llegar a X%.

**Esfuerzo**: ~3-4 semanas de dev solo para el LMS player.

**Ventajas:**
- Integración nativa con el resto del sitio (auth, perfil, checkout).
- Control de pricing en ARS sin tener que pelearse con limits de SaaS.
- Sin costo mensual extra (solo el Supabase usage).
- Datos propios.

**Desventajas:**
- Es el mayor bloque de trabajo del proyecto.
- Features avanzadas (gamification, certificados, drip content) las tenés que construir vos.

### Opción B — LMS SaaS externa (Teachable / Thinkific / Podia / Kajabi)

**Implementación:**
- Migrar los cursos manualmente o vía API a la plataforma elegida.
- En el sitio React, embebés links a la plataforma (los usuarios salen del dominio para ver clases).
- O usás SSO si la plataforma lo permite (Teachable y Thinkific tienen SSO en planes top).

**Esfuerzo**: 1-2 semanas de migración de contenido + setup.

**Ventajas:**
- Mucho menos código que escribir.
- Features de LMS profesionales out-of-the-box (drip, certificados, comunidad).

**Desventajas:**
- Costo mensual ($50-200 USD/mes en plan medio).
- Pricing en USD (problemático para una clienta argentina que cobra en pesos).
- Pierde el "control total" de la UX.
- Las 13.879 entradas de progreso no migran fácil (cada plataforma tiene su modelo).
- Cobros recurrentes complicados (la plataforma probablemente quiere cobrar ella, no integra con MercadoPago argentino bien).
- Dependencia externa.

### Opción C — Headless (no recomendada)

Mantener LearnDash en WordPress como API backend y consumirlo desde React. Es complejo, frágil, y derrota el propósito de la migración. **Descartar.**

### Recomendación final

**Opción A** salvo que Vero tenga restricción de tiempo y prefiera salir con menos features. Hay que confirmar con ella antes de avanzar.

## 12. Subscriptions + MercadoPago: la parte más riesgosa

**71 personas pagan el Club VeCKA mes a mes**. Si la migración les corta el cobro, perdés clientas y plata. Si les cobra dos veces, peor.

### Cómo funciona MercadoPago para suscripciones (preapprovals)

En Argentina, MercadoPago usa "Preapproval Plans" (planes de suscripción). El flujo es:

1. Cuando una clienta se suscribe, MP guarda un token vinculado a su tarjeta y un `preapproval_id`.
2. MP cobra periódicamente (mensual, trimestral, etc.) sin que la clienta haga nada.
3. El `preapproval_id` está atado a la cuenta de MP **del comercio** (Vero) y a los **access tokens** que usás en el plugin de WP.
4. Cuando un cobro entra, MP manda un webhook a tu sitio.

### Estrategia recomendada: corte por ciclo (Opción C en sección 7.2)

**Fase 1 — Setup nuevo (mientras WP sigue activo):**
- En el sistema nuevo (React + Supabase) integrás MercadoPago con la misma cuenta de Vero (los access tokens vienen del mismo lugar).
- Definís los nuevos planes de suscripción en MP (pueden ser planes nuevos, no es necesario reusar los del plugin WP).
- Implementás el flujo de alta nueva: clienta clickea "Suscribirse" → redirect a MP → vuelve con `preapproval_id` → guardás en `subscriptions.gateway_subscription_id`.

**Fase 2 — Freezar altas en WP (D-15 días aprox):**
- Desactivás el formulario de alta de membresía en el WP viejo (puede ser tan simple como deshabilitar el producto de suscripción).
- Las altas nuevas se dirigen al sitio nuevo (subdomain temporal `new.vecka.com.ar`).
- Las 71 suscripciones existentes siguen cobrándose normalmente vía WP/MP.

**Fase 3 — Comunicación a las 71 socias (D-7 días):**
- Email + WhatsApp + post en redes: "El sitio se renueva, tu Club sigue funcionando, no hace falta que hagas nada todavía, pero a partir del [fecha X] vas a entrar por la URL nueva con tus mismos datos."
- Tener canal de soporte abierto.

**Fase 4 — Migración suave de cobros (D-day a D+30):**
- Acá hay dos sub-opciones:

  **C.1 (la más limpia técnicamente)**: Las 71 preapprovals existentes en MP **siguen vivas** porque están en la cuenta de Vero. En la BD de Supabase, importás cada `subscription` con su `gateway_subscription_id` ya existente. El sistema nuevo escucha los mismos webhooks de MP y registra los cobros en `subscription_payments`. **No hay que mover nada en MP.** Solo cambiás qué endpoint escucha los webhooks (de WP a tu Edge Function nueva).

  **C.2**: Cancelás todas las preapprovals viejas en MP y mandás un mail pidiendo que se re-suscriban en el sitio nuevo. **Peor UX pero más simple técnicamente.**

**Mi recomendación**: **C.1**. Es factible porque la cuenta de MP no cambia. Hay que hacer un dry-run del manejo de webhooks antes del cutover.

### Webhook handler en Edge Function

Necesitás una Edge Function en `supabase/functions/mp-webhook/` que:

1. Reciba el webhook de MP (POST con `id`, `type`, etc.).
2. Valide la firma (importante por seguridad).
3. Según el `type`:
   - `payment.created` / `payment.updated`: buscá la suscripción por `gateway_subscription_id`, registrá el cobro en `subscription_payments`, actualizá `subscription.last_payment_at` y `next_payment_at`.
   - `preapproval.updated`: si pasa a `cancelled`, actualizá `subscriptions.status = 'cancelled'`.
4. Si la suscripción está vinculada a una `membership`, sincronizá el estado de la membresía (si la sub se pausa o cancela, la membresía también).

### Si el cobro falla

WC Subscriptions tiene lógica de reintentos. En el sistema nuevo, replicar:
- Marca `subscription.status = 'on_hold'`.
- Manda email a la clienta avisando.
- Reintenta a los 3, 5, 7 días.
- Si sigue fallando, marca `cancelled` y revoca acceso (membership → expired).

## 13. Productos WooCommerce: mapeo detallado

### Categorías de productos en VeCKA (deducidas del análisis)

- **Talleres Online**: cursos pagos. `product_type = 'course'` (creado por plugin learndash-woocommerce). Al comprarlos, dan acceso a un curso LearnDash.
- **Moldes digitales**: PDFs descargables. `is_downloadable = true, is_virtual = true`.
- **Moldes en papel / Mercería**: productos físicos con stock y shipping. `is_virtual = false`.
- **Membership / Club VeCKA**: producto tipo suscripción. `product_type = 'subscription'`.
- **Packs / Bundles**: combinaciones (verificar si existen como `product_type = 'bundle'`).

### Cómo se traducen los `wp_postmeta` clave

Para cada producto en `wp_posts` (post_type=product), los meta_keys importantes:

| `wp_postmeta.meta_key` | Mapea a `products.` |
|---|---|
| `_sku` | `sku` |
| `_price` | `regular_price` (precio actual; si está en sale, este es el sale) |
| `_regular_price` | `regular_price` |
| `_sale_price` | `sale_price` |
| `_sale_price_dates_from` | `sale_from` |
| `_sale_price_dates_to` | `sale_until` |
| `_stock` | `stock_quantity` |
| `_stock_status` | `stock_status` |
| `_manage_stock` | `manage_stock` |
| `_virtual` | `is_virtual` |
| `_downloadable` | `is_downloadable` |
| `_weight` | `weight_grams` (¡convertir! WC guarda en kg o gramos según setting) |
| `_dimensions` | `dimensions` |
| `_product_type` (en wp_term de taxonomy=product_type) | `type` |
| `_downloadable_files` (serialized PHP) | A `product_downloads` (deserializar) |
| `_thumbnail_id` | A `product_images.is_featured=true` (resolver el attachment) |
| `_product_image_gallery` (CSV de IDs) | A `product_images` |
| `_yoast_wpseo_focuskw` | A `meta` para SEO |

### Productos variables

Para productos `variable`:
- El producto padre está en `wp_posts`.
- Las variaciones son posts hijos con `post_type='product_variation'` y `post_parent` apuntando al padre.
- Los atributos del padre están en `wp_postmeta._product_attributes` (serialized PHP) — define qué atributos tiene (talle, color, etc.).
- Cada variación tiene meta `attribute_pa_talle`, `attribute_pa_color`, etc., con el valor específico.
- Mapeás cada variación a una fila en `product_variants` con `attributes JSONB = {"talle": "M", "color": "rojo"}`.

### Productos vinculados a cursos

El plugin `learndash-woocommerce` guarda en `wp_postmeta` del producto:
- `_related_course` (array de IDs de sfwd-courses).

Cuando un user compra ese producto:
- Crear `course_enrollment` con `source='purchase', source_order_id=...`.

### Productos de suscripción

`product_type='subscription'` (creado por WC Subscriptions). Tiene meta extra:
- `_subscription_price`
- `_subscription_period` (`day`, `week`, `month`, `year`)
- `_subscription_period_interval` (cada cuántos)
- `_subscription_length` (cuántos ciclos; 0 = indefinido)
- `_subscription_sign_up_fee`
- `_subscription_trial_length`, `_subscription_trial_period`

Mapeás a producto con `type='subscription'` y guardás esto en `meta` y `linked_membership_plan_id` si corresponde.

### Lo que no se trasciende

- Revisions de productos: ignorar.
- Productos en `auto-draft` o `trash`: ignorar.
- Productos sin precio publicado: revisar caso por caso.

## 14. Memberships: lógica de acceso

### Estructura WP origen

- `wc_membership_plan` (6 en VeCKA): define el plan ("Club Mensual", "Club Trimestral", etc.). Tiene meta `_product_ids` (qué productos otorgan esta membresía al comprarse) y `_access_length` (cuánto dura).
- `wc_user_membership` (87, de las cuales 71 activas): cada instancia de una clienta con un plan. Vive como post con:
  - `post_author` = user_id de la socia
  - `post_parent` = ID del plan
  - `post_status` = `wcm-active`, `wcm-paused`, `wcm-cancelled`, `wcm-expired`, `wcm-pending`
  - meta `_start_date`, `_end_date`, `_cancelled_date`, `_paused_date`

### Mapeo a Supabase

- 6 `wc_membership_plan` → 6 filas en `membership_plans`.
- 87 `wc_user_membership` → 87 filas en `memberships` (filtrar por status si querés solo activas).
- El status:
  - `wcm-active` → `active`
  - `wcm-paused` → `paused`
  - `wcm-cancelled` → `cancelled`
  - `wcm-expired` → `expired`
  - `wcm-pending` → `pending`
- Si la membership está vinculada a una suscripción (que es lo más común en el Club), enlazá vía `subscription_id`.

### Qué desbloquea cada plan

WC Memberships guarda en el plan qué contenido es exclusivo de los miembros:
- meta `_content_restriction_rules` (serialized PHP) → array de reglas: "el post X requiere plan Y", "la categoría Z requiere plan W".

Para LearnDash:
- El plugin `learndash-woocommerce-memberships` (si está) genera enrollments automáticos.
- Verificar en `wp_postmeta` qué cursos están vinculados a qué planes (busca meta_key como `_wc_memberships_force_public` o `_learndash_course_grants`).

En el esquema nuevo:
- Tabla `membership_plan_courses` (plan_id, course_id) — explicita qué cursos otorga cada plan.
- En el ETL, leer las reglas del WP, materializar en esta tabla.
- Cuando una `membership` se activa, crear `course_enrollment` para cada curso del plan, con `source='membership', source_membership_id=...`.
- Cuando se cancela/expira, marcar el enrollment con `expires_at`.

### Verificación de acceso runtime

En el frontend (o vía RLS), cuando una clienta intenta ver una lección:

```sql
-- Esta query la corre la RLS policy
SELECT 1 FROM course_enrollments
WHERE user_id = auth.uid()
  AND course_id = :lesson.course_id
  AND (expires_at IS NULL OR expires_at > now())
LIMIT 1;
```

Si no devuelve fila → 403.

## 15. Storage de archivos y media

### Inventario probable

`/wp-content/uploads/` tiene 1.396 attachments + tropecientos PDFs de moldes + thumbnails generados. Estimación: **5-20 GB**.

Estructura típica de WordPress:
```
wp-content/uploads/
├── 2022/06/imagen.jpg
├── 2022/06/imagen-300x300.jpg  ← thumbnail auto
├── 2022/06/imagen-150x150.jpg
├── 2024/03/molde-bombacha-bebe.pdf
├── ...
```

### Estrategia de migración a Supabase Storage

**Buckets sugeridos:**

- `products` (público) → imágenes de productos
- `lessons` (privado, RLS) → imágenes y archivos de lecciones del Aula Online
- `posts` (público) → imágenes del blog
- `avatars` (público) → fotos de perfil de las socias
- `downloads` (privado) → PDFs de moldes que se descargan tras compra
- `member-files` (privado) → archivos exclusivos del Club

**Pasos:**

1. Bajar `wp-content/uploads/` por FTP a tu compu (`rsync` o `wget -m`).
2. Script de upload (Node.js con `@supabase/supabase-js`):
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   import { readdir, readFile } from 'fs/promises'
   import { join } from 'path'

   const supabase = createClient(URL, SERVICE_ROLE_KEY)
   const BASE = './uploads'

   for await (const file of walkDir(BASE)) {
     const buf = await readFile(file)
     const key = file.replace(BASE + '/', '')  // ej: '2022/06/imagen.jpg'
     // Determinar bucket según convenciones (heurística por ruta o por tipo)
     const bucket = determineBucket(file)
     const { error } = await supabase.storage.from(bucket).upload(key, buf, {
       contentType: mimeFromExt(file),
       upsert: true,
     })
     if (error) console.error(file, error)
     // Guardar mapping wp_url → supabase_url
     await supabase.from('media_url_map').upsert({
       wp_url: `https://vecka.com.ar/wp-content/uploads/${key}`,
       supabase_url: supabase.storage.from(bucket).getPublicUrl(key).data.publicUrl,
     })
   }
   ```
3. **Saltearse los thumbnails generados** (los que tienen sufijo `-300x300`, `-150x150`, etc.) — son redundantes. Supabase Storage tiene image transformations on-the-fly, los podés generar al vuelo.

### Reescribir URLs en contenido

Después del upload, hay que parsear el HTML de:
- `posts.content`
- `lessons.content`
- `products.description` (y `short_description`)
- `pages` que migres

Y reemplazar todas las apariciones de `https://vecka.com.ar/wp-content/uploads/...` por las URLs de Supabase. Usá la `media_url_map` para el mapeo:

```typescript
function rewriteUrls(html: string, urlMap: Map<string, string>): string {
  for (const [oldUrl, newUrl] of urlMap) {
    html = html.replaceAll(oldUrl, newUrl)
  }
  return html
}
```

### URLs firmadas para downloads privados

Para PDFs de moldes (que solo pueden bajar quienes los compraron):
- Bucket `downloads` privado.
- En la pantalla "Mis descargas" de la clienta, antes de mostrar el link, validar que tiene un row en `user_downloads` y generar URL firmada con TTL de 1 hora:
  ```typescript
  const { data } = await supabase.storage
    .from('downloads')
    .createSignedUrl(file_path, 3600)
  ```

## 16. MailPoet → estrategia de email

Hay 998 subscribers, 1.984 relaciones a segmentos, varias automatizaciones, y muchos templates de newsletter.

### Lo que se migra

- Lista de 998 emails con `status` (subscribed, unsubscribed, bounced), `first_name`, `last_name`, `confirmed_at`, `subscribed_via`.
- Segmentos (probablemente: "Newsletter general", "Club VeCKA", "Compradoras"...).
- Mapeo subscriber → segments.

### Lo que NO se migra

- Templates (rearmar en la nueva plataforma o desde figma).
- Stats históricos (opens, clicks).
- Automatizaciones (las rearmás).

### Destino sugerido

**Brevo (ex-Sendinblue)** o **Mailchimp** son los más fáciles para Vero (panel visual). Si querés algo más dev-friendly y barato: **Resend**.

**Recomendación: separar transaccional de marketing.**
- **Resend** para emails transaccionales (welcome, password reset, recibos, notificaciones del Club) — se integra con Supabase Auth para los emails de auth.
- **Brevo** para marketing y automatizaciones (Vero opera).

### Migración de la lista

1. Exportá `wp_mailpoet_subscribers` a CSV: `email, first_name, last_name, status, created_at`.
2. Solo importás los `subscribed` (descartá los `unsubscribed` y `bounced` por compliance).
3. Importás a Brevo vía CSV o API.
4. Antes de mandar la primera campaña, doble opt-in para limpiar la lista.

## 17. Stack técnico recomendado

### Frontend

- **Framework**: **Next.js 15** (App Router) o **React Router 7** con Vite. Next.js gana si querés SSR y SEO fuerte para el blog y catálogo (recomendado).
- **Estilos**: **Tailwind CSS** + componentes de **shadcn/ui** para acelerar.
- **Forms**: **react-hook-form** + **zod**.
- **State server**: el SDK de Supabase + **TanStack Query** para cache.
- **Video player**: **Vimeo Player SDK** (`@vimeo/player`) ya que las clases están en Vimeo.
- **Payments**: integración directa con MercadoPago Checkout Pro (redirect) o Checkout API (custom UI).
- **Mapas / sucursales Correo Argentino**: API de Andreani o Correo Argentino para el selector de sucursal.

### Backend

- **Supabase**:
  - Postgres con el esquema de la Sección 9.
  - Auth (email/password con Edge Function de migración).
  - Storage para todo el contenido.
  - Edge Functions para webhooks (MP), login con migración, generación de URLs firmadas.
  - Realtime para algunas features (chat del Club, notificaciones).
- **Servicios externos**:
  - **Resend** para transaccional.
  - **MercadoPago + PayPal + Modo** para pagos.
  - **Cloudflare** para DNS y CDN (proxy delante de Vercel).

### Hosting

- **Vercel** para el Next.js (simple, deploy from git).
- Supabase ya está en la nube de Supabase.

### Repo structure

```
vecka/
├── apps/
│   └── web/                  # Next.js
│       ├── app/
│       ├── components/
│       ├── lib/
│       └── ...
├── packages/
│   ├── db/                   # Tipos generados del esquema Supabase
│   └── ui/                   # Componentes compartidos
├── supabase/
│   ├── migrations/           # SQL versionado
│   ├── functions/
│   │   ├── mp-webhook/
│   │   ├── login-with-migration/
│   │   └── ...
│   └── config.toml
├── migration/                # Scripts ETL (one-time)
│   ├── etl/
│   ├── lib/
│   ├── exports/              # JSON dumps (gitignored)
│   └── logs/
├── docs/
│   └── ...
├── CLAUDE.md                 # ESTE ARCHIVO
└── ...
```

## 18. Convenciones del proyecto

### Brand

- **Color primario**: teal `#98D0C8`
- **Acentos**: mauves `#CCA2BD` y `#D6B9CD`
- **Tipografía**: Montserrat (sans-serif) — la principal que usa el sitio actual
- **Tono**: cálido, cercano, hecho a mano. Voseo argentino. Pueden aparecer faltas de acento deliberadas en CTAs (ej: "Anotate") — no las "corrijas".

### Logo

El logo es chico (~20px alto) en el header. NO meter nav links en el header — el cliente lo corrigió múltiples veces. Header = logo + nombre a la izquierda, CTA a la derecha. Punto.

### Código

- TypeScript estricto. Sin `any`.
- Naming en inglés para código, español para copy de UI.
- Comentarios en español.
- `eslint` + `prettier` con la config default.
- Conventional commits (`feat:`, `fix:`, `chore:`, etc.).

## 19. Cómo obtener el dump y los archivos localmente

### Re-descargar el dump

Está en `u210132504_HPex9` en Hostinger. Login a hPanel → Bases de datos → phpMyAdmin → seleccionar la base → Exportar → Personalizado → SQL → marcar "comprimir gzip" → exportar.

El archivo se llama típicamente `u210132504_HPex9.sql.gz`. Descomprimir con:
```bash
gunzip u210132504_HPex9.sql.gz
```

### Bajar uploads/

Por FTP/SFTP (Hostinger te da credenciales en hPanel):
```bash
# Con rsync (lo más eficiente; ssh activo)
rsync -avz --progress username@servidor:public_html/wp-content/uploads/ ./uploads/

# Con lftp (FTP estándar)
lftp -e "mirror -P 4 public_html/wp-content/uploads ./uploads; quit" -u username,password ftp://servidor
```

### Levantar la BD en local

```bash
# Con Docker
docker run -d --name vecka-db \
  -e MARIADB_ROOT_PASSWORD=secret \
  -p 3306:3306 \
  mariadb:11

# Crear DB e importar
docker exec vecka-db mysql -uroot -psecret -e "CREATE DATABASE vecka CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
docker exec -i vecka-db mysql -uroot -psecret vecka < u210132504_HPex9.sql

# Conectar para hacer queries
docker exec -it vecka-db mysql -uroot -psecret vecka
```

### Conectarte desde Node para el ETL

```typescript
import mysql from 'mysql2/promise'
const conn = await mysql.createConnection({
  host: 'localhost', port: 3306, user: 'root', password: 'secret', database: 'vecka',
})
const [rows] = await conn.execute('SELECT COUNT(*) FROM wp_posts WHERE post_type = ?', ['product'])
```

## 20. Próximos pasos inmediatos

En orden, lo que hay que hacer cuando arranque la sesión en Claude Code:

1. **Cerrar las decisiones abiertas con Vero**. Específicamente:
   - LearnDash: opción A (rebuild) o B (SaaS)
   - Subscriptions: confirmar estrategia C.1 (mantener preapprovals)
   - Email: confirmar Resend + Brevo
   - Fecha tentativa del cutover
2. **Crear el proyecto Supabase y aplicar el esquema** (Sección 9).
3. **Levantar la BD MariaDB local con el dump** y correr conteos reales (productos, posts).
4. **Auditar `wp_postmeta` y `wp_usermeta`** para listar TODOS los meta_keys (no perderse nada custom).
5. **Setear el repo** con la estructura sugerida en Sección 17.
6. **Empezar el ETL por la base**: users + addresses primero. Probarlo con un subset (los 5 primeros users) antes de correr completo.
7. **Implementar la Edge Function de login con migración** (Sección 10) y probarla con un user de prueba.
8. **Migrar productos** (sin variantes primero, después variantes).
9. **Migrar órdenes** (filtrar status válidos).
10. **Migrar courses + lessons + enrollments + progress** (LearnDash).
11. **Migrar memberships + subscriptions**.
12. **Migrar media a Storage + reescribir URLs**.
13. **Frontend**: arrancar por catálogo y detalle de producto.
14. **Frontend**: checkout + integración MP.
15. **Frontend**: Aula Online (player de lecciones).
16. **Frontend**: Mi cuenta + descargas.
17. **Frontend**: blog + páginas estáticas.
18. **Validación end-to-end** con datos reales.
19. **Cutover** según plan de Sección 7.

## 21. Glosario del negocio

- **VeCKA** — Marca de Vero. Negocio de costura online.
- **Taller** — Curso de costura sobre un proyecto específico (ej: "Taller Online Ropa de Bebé Nivel 1"). En LearnDash es un `sfwd-courses`. Se compra como producto puntual.
- **Molde** — Patrón de costura en PDF. Se vende digital (PDF descargable) o impreso en papel (producto físico).
- **Aula Online** — La plataforma de cursos donde las alumnas ven las clases. Hoy es LearnDash, va a ser React + Supabase.
- **Club VeCKA** — La membresía mensual. Da acceso a contenido exclusivo (cursos, clases en vivo vía Vimeo, grupo de WhatsApp, archivos mensuales).
- **Membresía** — La instancia (de una clienta) de un plan del Club. Activa/pausada/cancelada/expirada.
- **Mercería VeCKA** — Sección de la tienda con productos físicos de costura (tijeras, alfileteros, etc.).
- **Plantilla** — Plantilla de Elementor (no relacionado a costura).

---

**Fin del documento.** Mantener actualizado a medida que se toman decisiones. Cuando algo cambie sustancialmente (ej: se elige opción B para LearnDash), editá la sección correspondiente y agregá una entrada en una sección "Changelog" al pie.
