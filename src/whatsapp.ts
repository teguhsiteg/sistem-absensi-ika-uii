export interface SendWhatsAppParams {
  phone: string;
  message: string;
  imageUrl?: string;
}

export const sendWhatsAppMessage = async ({ phone, message, imageUrl }: SendWhatsAppParams) => {
  const token = import.meta.env.VITE_FONNTE_TOKEN;
  
  if (!token) {
    console.warn("VITE_FONNTE_TOKEN is not set. WhatsApp message simulated.");
    console.log("To:", phone);
    console.log("Message:", message);
    if (imageUrl) console.log("Image URL:", imageUrl);
    return { status: true, detail: "Simulated sending because no API token is configured." };
  }

  try {
    const formData = new FormData();
    formData.append('target', phone);
    formData.append('message', message);
    if (imageUrl) {
      formData.append('url', imageUrl); // Fonnte uses 'url' field for sending media (image/pdf)
    }

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token
      },
      body: formData
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};
