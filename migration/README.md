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
- No importa cursos ni productos. Solo usa productos relacionados para inferir precio y período del tier.

## Orden recomendado

1. Aplicar migraciones de Supabase.
2. Correr `npm run migration:preflight`.
3. Correr `npm run migration:users -- --limit=5`.
4. Probar login con una cuenta migrada.
5. Correr `npm run migration:users` completo.
