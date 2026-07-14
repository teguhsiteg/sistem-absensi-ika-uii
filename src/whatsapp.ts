export interface SendWhatsAppParams {
  phone: string;
  message: string;
  imageUrl?: string;
}

export const sendWhatsAppMessage = async ({ phone, message, imageUrl }: SendWhatsAppParams) => {
  try {
    const payload = {
      phone,
      message,
      imageUrl
    };

    // Calling the Netlify Serverless Function proxy instead of Fonnte API directly to prevent CORS/token exposure.
    const response = await fetch('/.netlify/functions/send-wa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send WhatsApp message via proxy');
    }

    return data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};
