const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

let _client = null;

function getClient() {
  if (!_client) {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token || token.startsWith('TEST-your')) {
      console.warn('[MP] ⚠️  MP_ACCESS_TOKEN no configurado. Las órdenes se crearán sin link de pago.');
    }
    _client = new MercadoPagoConfig({ accessToken: token || 'TEST-placeholder' });
  }
  return _client;
}

/**
 * Crea una preferencia de pago en MercadoPago.
 * Docs: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/checkout-customization/preferences
 */
async function createPreference({ orderId, items, payer, frontendUrl }) {
  const preference = new Preference(getClient());

  const webhookUrl = process.env.MP_WEBHOOK_URL;
  const notificationUrl = webhookUrl && !webhookUrl.includes('TU-DOMINIO')
    ? webhookUrl
    : null; // null → MP no llama webhook (solo para dev sin ngrok)

  const body = {
    items,
    payer: { email: payer.email, name: payer.name },
    external_reference: orderId,
    back_urls: {
      success: `${frontendUrl}?payment=success&order=${orderId}`,
      failure: `${frontendUrl}?payment=failure&order=${orderId}`,
      pending: `${frontendUrl}?payment=pending&order=${orderId}`,
    },
    auto_return: 'approved',
    statement_descriptor: 'VeCKA',
    ...(notificationUrl ? { notification_url: notificationUrl } : {}),
  };

  return preference.create({ body });
}

/**
 * Obtiene los detalles de un pago por su ID.
 */
async function getPayment(paymentId) {
  const payment = new Payment(getClient());
  return payment.get({ id: paymentId });
}

module.exports = { createPreference, getPayment };
