export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { phone, patientName, doctorName, tokenNumber, clinicName } = req.body;

  // Dono variable names ko fallback ke sath support karein
  const WHATSAPP_TOKEN = process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_CLOUD_API_TOKEN;
  const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    return res.status(500).json({
      error: 'WhatsApp API Credentials missing in environment variables',
    });
  }

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
          to: phone,
          type: 'template',
          template: {
            name: 'hello_world',
            language: { code: 'en_US' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: patientName },
                  { type: 'text', text: doctorName },
                  { type: 'text', text: String(tokenNumber) },
                  { type: 'text', text: clinicName },
                ],
              },
            ],
          },
        }),
      }
    );

    const waData = await waResponse.json();

    if (waData.error) {
      return res.status(400).json({
        success: false,
        isNotOnWhatsApp: waData.error.code === 131026,
        metaError: waData.error,
      });
    }

    return res.status(200).json({ success: true, waData });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
