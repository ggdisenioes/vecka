# Migration

Base operativa para migrar datos desde WordPress/MariaDB hacia Supabase.

## Variables requeridas

Estas variables pueden vivir en `.env.local` o en el entorno de shell:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MIGRATION_WP_DB_HOST=127.0.0.1
MIGRATION_WP_DB_PORT=3306
MIGRATION_WP_DB_SOCKET=/tmp/mysql.sock
MIGRATION_WP_DB_USER=root
MIGRATION_WP_DB_PASSWORD=secret
MIGRATION_WP_DB_NAME=vecka
```

## Scripts disponibles

```bash
npm run migration:preflight
npm run migration:users -- --limit=5
npm run migration:users -- --email=clienta@ejemplo.com
npm run migration:users -- --dry-run
npm run migration:membership-tiers
npm run migration:membership-grants
npm run migration:membership-content -- --inventory
npm run migration:membership-content -- --tier-slug=club-vecka-costura --source-ids=10537,14017 --dry-run
npm run migration:membership-content -- --tier-slug=club-vecka-costura --source-ids=10537,14017
```

## Qué hace `01-users`

1. Lee `wp_users` + `wp_usermeta` desde MariaDB.
2. Crea o reutiliza usuarios en `auth.users`.
3. Upsertea `public.profiles` con `legacy_wp_id`, nombre, rol y datos básicos.
4. Guarda el hash original de WordPress en `public.legacy_passwords`.
5. Escribe log en `migration/logs/01-users.log`.

## Qué hacen los scripts de memberships

- `02-membership-tiers` migra `wc_membership_plan` hacia `membership_tiers`.
- `03-membership-grants` migra `wc_user_membership` hacia `membership_grants`.
- `04-membership-content` inventaria e importa contenido de WordPress hacia `membership_content_items`.
- No importa cursos ni productos. Solo usa productos relacionados para inferir precio y período del tier.

## Contenido de membresías

El flujo correcto para traer contenido de WordPress es:

1. Ejecutar `npm run migration:membership-content -- --inventory`.
2. Revisar `migration/exports/membership-content.inventory.json`.
3. Elegir los IDs que pertenecen a la membresía destino.
4. Ejecutar un dry-run con `--tier-slug=<slug> --source-ids=... --dry-run`.
5. Ejecutar la importación real con los mismos parámetros sin `--dry-run`.
6. Publicar cada item desde `/admin/membresias/[id]` cuando esté revisado.

Notas:
- El importador guarda el HTML de WordPress en `body`.
- Si el contenido trae `img`, `iframe` o links embebidos, se conservan.
- Si más adelante querés mover media a Supabase Storage, hacelo en una segunda pasada.

## Archivos de WordPress

La única carpeta de WordPress que tenés que copiar para traer imágenes, PDFs y adjuntos es:

```text
wp-content/uploads/
```

Copiala localmente en:

```text
migration/imports/uploads/
```

Si ya la copiaste en la raíz del proyecto como `uploads/`, también sirve para trabajar localmente. No la subas a GitHub: puede pesar varios GB y contener PDFs/archivos privados de clientas o productos pagos.

No copies plugins, themes ni todo `public_html`. El contenido textual de membresías, cursos y productos sale del dump SQL (`wp_posts`, `wp_postmeta` y tablas de WooCommerce/LearnDash); `uploads/` sólo aporta archivos enlazados desde ese contenido.

`migration/imports/` y `uploads/` están ignorados por Git porque pueden pesar varios GB. La ubicación final no es el repo: después se sube a Supabase Storage y se reescriben las URLs.

## Orden recomendado

1. Aplicar migraciones de Supabase.
2. Correr `npm run migration:preflight`.
3. Correr `npm run migration:users -- --limit=5`.
4. Probar login con una cuenta migrada.
5. Correr `npm run migration:users` completo.
