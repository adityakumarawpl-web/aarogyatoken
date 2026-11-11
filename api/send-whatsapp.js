export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const { phone, patientName, doctorName, tokenNumber, clinicName } = body || {};

    // Phone Clean (Strictly 91 + 10 digits)
    const rawDigits = String(phone || '').replace(/\D/g, '');
    const cleanPhone = rawDigits.startsWith('91') && rawDigits.length === 12
      ? rawDigits
      : `91${rawDigits.slice(-10)}`;

    const WHATSAPP_TOKEN = process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_CLOUD_API_TOKEN;
    const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      return res.status(500).json({
        success: false,
        error: 'Vercel environment variables missing (META_ACCESS_TOKEN / META_PHONE_NUMBER_ID)',
      });
    }

    const metaUrl = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

    // 🔹 Approved Hindi Template: opd_token_confirmation
    const metaResponse = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'template',
        template: {
          name: 'opd_token_confirmation',
          language: { code: 'hi' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: patientName || 'Patient' },
                { type: 'text', text: doctorName || 'Doctor' },
                { type: 'text', text: String(tokenNumber || '#1') },
                { type: 'text', text: clinicName || 'Clinic' },
              ],
            },
          ],
        },
      }),
    });

    const metaData = await metaResponse.json();

    if (!metaResponse.ok || metaData.error) {
      return res.status(metaResponse.status || 400).json({
        success: false,
        metaError: metaData.error || metaData,
      });
    }

    return res.status(200).json({
      success: true,
      data: metaData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Server Internal Error',
    });
  }
}
