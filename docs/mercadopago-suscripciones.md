# MercadoPago: suscripciones recurrentes

## Flujo implementado

1. La clienta entra a `/checkout/[slug]`.
2. El backend crea una fila local en `membership_subscriptions`.
3. El backend crea una suscripción en MercadoPago con `POST /preapproval`.
4. La clienta completa el alta en MercadoPago.
5. MercadoPago avisa por webhook:
   - `subscription_preapproval`: actualiza el estado local de la suscripción.
   - `subscription_authorized_payment`: registra el cobro y activa `membership_grants`.
6. Al activarse `membership_grants`, los triggers existentes habilitan el contenido de la membresía.

## Variables requeridas

En Vercel, para `Production` y `Preview`:

```bash
NEXT_PUBLIC_SITE_URL=https://nuevo.vecka.com.ar
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_PUBLIC_KEY=...
MERCADOPAGO_WEBHOOK_SECRET=...
```

`MERCADOPAGO_WEBHOOK_SECRET` sale de la configuración del webhook en MercadoPago.

## Webhook en MercadoPago

Crear/configurar una integración en MercadoPago con esta URL:

```text
https://nuevo.vecka.com.ar/api/webhooks/mercadopago
```

Activar estos eventos:

```text
subscription_preapproval
subscription_authorized_payment
payment
```

`payment` queda por compatibilidad con pagos únicos viejos. La activación automática de membresías recurrentes usa `subscription_authorized_payment`.

## Base de datos

Aplicar la migración:

```bash
supabase db push
```

Esta migración crea:

- `membership_subscriptions`
- `membership_payment_events`

## Validación

1. Confirmar que una membresía publicada tenga:
   - `price_ars > 0`
   - `billing_period = monthly` o `annual`
2. Entrar con una cuenta cliente.
3. Ir a `/checkout/[slug-de-la-membresia]`.
4. Completar el alta en MercadoPago.
5. Verificar en Supabase:
   - `membership_subscriptions.status = authorized`
   - `membership_payment_events.status = approved` o `processed`
   - `membership_grants.access_status = active`
6. Entrar a la membresía y confirmar que el contenido se desbloquea.
