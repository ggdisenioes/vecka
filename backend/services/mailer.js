const nodemailer = require('nodemailer');

function isConfigured() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const FROM = () => process.env.EMAIL_FROM || 'VeCKA <noreply@vecka.com.ar>';

async function sendMail(opts) {
  if (!isConfigured()) {
    console.log('[MAILER] SMTP no configurado — email simulado para:', opts.to);
    console.log('[MAILER] Asunto:', opts.subject);
    return;
  }
  try {
    await getTransporter().sendMail({ from: FROM(), ...opts });
  } catch (err) {
    console.error('[MAILER] Error enviando email:', err.message);
  }
}

// Email con links de descarga de PDFs
async function sendDownloadEmail(to, name, links, orderId) {
  const linksHtml = links.map(l => `
    <div style="margin:12px 0;padding:16px;background:#f0faf5;border-radius:8px;border-left:4px solid #5e9e8a">
      <strong style="color:#3d6b5e;display:block;margin-bottom:6px">${l.title}</strong>
      <a href="${l.url}"
         style="display:inline-block;background:#5e9e8a;color:#fff;text-decoration:none;padding:8px 18px;border-radius:6px;font-weight:600;font-size:14px">
        ↓ Descargar PDF
      </a>
      <span style="font-size:11px;color:#999;display:block;margin-top:6px">
        Válido 72 hs · máx. 5 descargas · ${l.url}
      </span>
    </div>
  `).join('');

  await sendMail({
    to,
    subject: `VeCKA — Tus moldes están listos (${orderId})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="font-family:Georgia,serif;color:#3d3030;margin-bottom:4px">¡Hola ${name}! 🎉</h1>
        <p style="color:#555;line-height:1.7">
          Tu pago fue confirmado. Podés descargar tus moldes desde los links de abajo.<br>
          También los encontrás en tu panel → <strong>Mis Compras</strong>.
        </p>
        ${linksHtml}
        <hr style="border:none;border-top:1px solid #eee;margin:28px 0">
        <p style="color:#888;font-size:13px">
          ¿Problemas con la descarga? Escribinos a
          <a href="mailto:consultas@vecka.com.ar" style="color:#5e9e8a">consultas@vecka.com.ar</a>
        </p>
        <p style="color:#bbb;font-size:11px">VeCKA · Buenos Aires, Argentina</p>
      </div>
    `,
  });
}

// Email de confirmación de pedido físico
async function sendPhysicalOrderEmail(to, name, items, order) {
  const itemsList = items.map(i => `<li style="margin:4px 0">${i.product_title}</li>`).join('');
  const addressParts = [
    order.shipping_address,
    order.shipping_city,
    order.shipping_province,
    `CP ${order.shipping_postal_code}`,
  ].filter(Boolean).join(', ');

  await sendMail({
    to,
    subject: `VeCKA — Tu pedido ${order.id} está en preparación 📦`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="font-family:Georgia,serif;color:#3d3030">¡Hola ${name}! 📦</h1>
        <p style="color:#555;line-height:1.7">Tu pago fue confirmado. Estamos preparando tu pedido:</p>
        <ul style="color:#555;padding-left:20px">${itemsList}</ul>
        <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
          <strong style="display:block;margin-bottom:6px">Dirección de envío:</strong>
          <span style="color:#555">${addressParts}</span>
        </div>
        <p style="color:#555">
          Te enviaremos el número de seguimiento de <strong>Correo Argentino</strong>
          cuando tu pedido sea despachado.
        </p>
        <p style="color:#555">
          Pedido: <strong style="color:#5e9e8a">${order.id}</strong> ·
          Total: <strong>$${order.total.toLocaleString('es-AR')}</strong>
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:28px 0">
        <p style="color:#888;font-size:13px">
          ¿Consultas? <a href="mailto:consultas@vecka.com.ar" style="color:#5e9e8a">consultas@vecka.com.ar</a>
        </p>
        <p style="color:#bbb;font-size:11px">VeCKA · Buenos Aires, Argentina</p>
      </div>
    `,
  });
}

// Email con número de seguimiento
async function sendTrackingEmail(to, name, orderId, trackingNumber) {
  await sendMail({
    to,
    subject: `VeCKA — Tu pedido fue despachado 🚚`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="font-family:Georgia,serif;color:#3d3030">¡Tu pedido fue enviado! 🚚</h1>
        <p style="color:#555;line-height:1.7">Hola ${name}, tu pedido <strong>${orderId}</strong> fue despachado por Correo Argentino.</p>
        <div style="background:#f0faf5;padding:20px;border-radius:8px;text-align:center;margin:20px 0">
          <p style="margin:0 0 8px;color:#555">Número de seguimiento:</p>
          <strong style="font-size:24px;color:#5e9e8a;letter-spacing:2px">${trackingNumber}</strong>
        </div>
        <p style="color:#555">
          Podés rastrear tu envío en
          <a href="https://www.correoargentino.com.ar/seguimiento" style="color:#5e9e8a">correoargentino.com.ar</a>
        </p>
        <p style="color:#bbb;font-size:11px">VeCKA · Buenos Aires, Argentina</p>
      </div>
    `,
  });
}

module.exports = { sendDownloadEmail, sendPhysicalOrderEmail, sendTrackingEmail };
