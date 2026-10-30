export default async function handler(req, res) {
  // Sirf POST request allow karein
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { phone, patientName, tokenNumber, doctorName, clinicName } = req.body;

  // Environment variables se credentials uthana
  const token = process.env.META_ACCESS_TOKEN;
  const phoneId = process.env.META_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    return res.status(500).json({ error: 'Meta API credentials missing on server' });
  }

  // Meta Cloud API Endpoint
  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;

  // WhatsApp Message Payload (Template message format)
  const payload = {
    messaging_product: 'whatsapp',
    to: phone, // Format: 919876543210 (Country code ke sath bina '+' ke)
    type: 'template',
    template: {
      name: 'hello_world', // Abhi ke liye Meta ka default template use kar rahe hain, baad me apna custom template laga lenge
      language: {
        code: 'en_US'
      }
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
