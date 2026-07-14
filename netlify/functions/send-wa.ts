import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { phone, message, imageUrl } = JSON.parse(event.body || '{}');

    if (!phone || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing phone or message in request body' }),
      };
    }

    const token = process.env.VITE_FONNTE_TOKEN;
    
    if (!token) {
      console.warn("VITE_FONNTE_TOKEN is not set in environment.");
      // For local development without token, we can just simulate success
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          status: true, 
          detail: "Simulated sending because no API token is configured.",
          data: { phone, message, imageUrl }
        }),
      };
    }

    // Fonnte uses multipart/form-data or application/x-www-form-urlencoded
    // We'll use application/x-www-form-urlencoded via URLSearchParams for simplicity in serverless environment
    // or FormData if we polyfill it, but URLSearchParams is built-in to Node 14+
    const payload = new URLSearchParams();
    payload.append('target', phone);
    payload.append('message', message);
    if (imageUrl) {
      payload.append('url', imageUrl); // Fonnte uses 'url' field for media
    }

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload.toString()
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      body: JSON.stringify(data),
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};
