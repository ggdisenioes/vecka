import { Resend } from 'resend'

const FROM = 'Vecka <hola@vecka.com.ar>'

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY no configurada')
  return new Resend(process.env.RESEND_API_KEY)
}

function periodLabel(period) {
  return period === 'monthly' ? 'mensual' : period === 'annual' ? 'anual' : period === 'lifetime' ? 'vitalicia' : ''
}

function baseTemplate({ title, preheader, body }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#faf5f8;font-family:'DM Sans',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf5f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f0e8e0;">
        <!-- Header -->
        <tr><td style="background:#5e9e8a;padding:32px 40px;text-align:center;">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:700;color:#fff;letter-spacing:0.02em;">Vecka</div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px;color:#3a2e28;font-size:15px;line-height:1.7;">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9f5f0;padding:20px 40px;text-align:center;font-size:12px;color:#8a7a6e;">
          Vecka — Escuela de Costura Online &nbsp;·&nbsp;
          <a href="https://vecka.com.ar" style="color:#5e9e8a;text-decoration:none;">vecka.com.ar</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendWelcomeEmail({ to, name, tierName, billingPeriod, expiresAt, tierSlug }) {
  const period = periodLabel(billingPeriod)
  const expiry = expiresAt
    ? `hasta el <strong>${new Date(expiresAt).toLocaleDateString('es-AR')}</strong>`
    : 'sin vencimiento'

  const body = `
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:700;margin:0 0 16px;">¡Bienvenida, ${name || 'alumna'}! 🌿</p>
    <p>Tu acceso a <strong>${tierName}</strong>${period ? ` (${period})` : ''} fue activado ${expiry}.</p>
    <p>Podés empezar a explorar todo el contenido de tu membresía ahora mismo:</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="https://vecka.com.ar/membresia/${tierSlug || ''}" style="display:inline-block;padding:14px 32px;background:#5e9e8a;color:#fff;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;">Ver mi membresía →</a>
    </p>
    <p style="color:#8a7a6e;font-size:13px;">Si tenés alguna pregunta, respondé este email y te ayudamos.</p>
  `

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `¡Tu membresía ${tierName} está activa!`,
    html: baseTemplate({ title: `Membresía ${tierName} activada`, preheader: `Tu acceso a ${tierName} ya está disponible.`, body }),
  })
}

export async function sendPaymentConfirmationEmail({ to, name, tierName, billingPeriod, amountArs, paymentReference, expiresAt, tierSlug }) {
  const period = periodLabel(billingPeriod)
  const expiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString('es-AR')
    : 'sin vencimiento'

  const body = `
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:700;margin:0 0 16px;">Pago confirmado ✓</p>
    <p>Hola <strong>${name || 'alumna'}</strong>, recibimos tu pago correctamente.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;border-radius:10px;padding:18px 22px;margin:20px 0;font-size:14px;">
      <tr><td style="padding:5px 0;color:#8a7a6e;">Membresía</td><td style="padding:5px 0;font-weight:600;text-align:right;">${tierName}${period ? ` · ${period}` : ''}</td></tr>
      ${amountArs ? `<tr><td style="padding:5px 0;color:#8a7a6e;">Importe</td><td style="padding:5px 0;font-weight:600;text-align:right;">$${Number(amountArs).toLocaleString('es-AR')} ARS</td></tr>` : ''}
      <tr><td style="padding:5px 0;color:#8a7a6e;">Vencimiento</td><td style="padding:5px 0;font-weight:600;text-align:right;">${expiry}</td></tr>
      ${paymentReference ? `<tr><td style="padding:5px 0;color:#8a7a6e;">Referencia</td><td style="padding:5px 0;font-size:12px;text-align:right;">${paymentReference}</td></tr>` : ''}
    </table>
    <p style="text-align:center;margin:28px 0;">
      <a href="https://vecka.com.ar/membresia/${tierSlug || ''}" style="display:inline-block;padding:14px 32px;background:#5e9e8a;color:#fff;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;">Ir a mi membresía →</a>
    </p>
  `

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Pago confirmado · ${tierName}`,
    html: baseTemplate({ title: 'Pago confirmado', preheader: `Tu pago de ${tierName} fue procesado exitosamente.`, body }),
  })
}

export async function sendPaymentFailedEmail({ to, name, tierName, tierSlug }) {
  const body = `
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:700;margin:0 0 16px;">Hubo un problema con tu pago</p>
    <p>Hola <strong>${name || 'alumna'}</strong>, lamentablemente no pudimos procesar tu pago para <strong>${tierName}</strong>.</p>
    <p>Podés intentarlo nuevamente desde la página de la membresía:</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="https://vecka.com.ar/membresia/${tierSlug || ''}" style="display:inline-block;padding:14px 32px;background:#5e9e8a;color:#fff;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;">Reintentar pago →</a>
    </p>
    <p style="color:#8a7a6e;font-size:13px;">Si el problema persiste, contactanos y lo resolvemos juntas.</p>
  `

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `No pudimos procesar tu pago · ${tierName}`,
    html: baseTemplate({ title: 'Error en el pago', preheader: `Hubo un problema procesando tu pago para ${tierName}.`, body }),
  })
}

export async function sendExpiryWarningEmail({ to, name, tierName, expiresAt, tierSlug, daysLeft }) {
  const body = `
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:700;margin:0 0 16px;">Tu membresía vence pronto</p>
    <p>Hola <strong>${name || 'alumna'}</strong>, tu acceso a <strong>${tierName}</strong> vence en <strong>${daysLeft} día${daysLeft !== 1 ? 's' : ''}</strong> (${new Date(expiresAt).toLocaleDateString('es-AR')}).</p>
    <p>Para no perder el acceso a tu contenido, renová tu membresía:</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="https://vecka.com.ar/membresia/${tierSlug || ''}" style="display:inline-block;padding:14px 32px;background:#5e9e8a;color:#fff;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;">Renovar membresía →</a>
    </p>
  `

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Tu membresía ${tierName} vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`,
    html: baseTemplate({ title: 'Tu membresía vence pronto', preheader: `Tu acceso a ${tierName} vence en ${daysLeft} días.`, body }),
  })
}

export async function sendExpiryExpiredEmail({ to, name, tierName, tierSlug }) {
  const body = `
    <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:700;margin:0 0 16px;">Tu membresía expiró</p>
    <p>Hola <strong>${name || 'alumna'}</strong>, tu acceso a <strong>${tierName}</strong> ya no está activo.</p>
    <p>Podés renovarla en cualquier momento para retomar donde dejaste:</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="https://vecka.com.ar/membresia/${tierSlug || ''}" style="display:inline-block;padding:14px 32px;background:#5e9e8a;color:#fff;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;">Renovar ahora →</a>
    </p>
  `

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Tu membresía ${tierName} expiró`,
    html: baseTemplate({ title: 'Membresía expirada', preheader: `Tu acceso a ${tierName} ha expirado.`, body }),
  })
}
