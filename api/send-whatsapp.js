export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { phone, patientName, doctorName, tokenNumber, clinicName, templateName } = req.body;

  // 1. Phone number ko strictly clean karein (Only digits, ensure 91 prefix)
  const rawDigits = String(phone || '').replace(/\D/g, '');
  const cleanPhone = rawDigits.startsWith('91') && rawDigits.length === 12
    ? rawDigits
    : `91${rawDigits.slice(-10)}`;

  // 2. Environment Variables
  const WHATSAPP_TOKEN = process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_CLOUD_API_TOKEN;
  const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    return res.status(500).json({
      error: 'WhatsApp API Credentials missing in environment variables',
    });
  }

  // 3. Template Payload Decision
  // Agar hello_world hai toh NO components, agar custom template hai tab components jayenge
  const isHelloWorld = !templateName || templateName === 'hello_world';

  const templatePayload = isHelloWorld
    ? {
        name: 'hello_world',
        language: { code: 'en_US' },
      }
    : {
        name: templateName, // e.g. 'opd_token_alert' ya 'opd_token_confirmation'
        language: { code: templateName.includes('alert') ? 'en_US' : 'hi' },
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
      };

  try {
    const waResponse = await fetch(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'template',
          template: templatePayload,
        }),
      }
    );

    const waData = await waResponse.json();

    if (waData.error) {
      console.error('Meta API Error Details:', waData.error);
      return res.status(400).json({
        success: false,
        error: waData.error.message,
        details: waData.error,
      });
    }

    return res.status(200).json({ success: true, waData });
  } catch (error: any) {
    console.error('Fetch execution error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
