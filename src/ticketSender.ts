import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { sendWhatsAppMessage } from './whatsapp';
import html2canvas from 'html2canvas';

export const sendTicketViaWhatsApp = async (
  ticketElement: HTMLElement,
  participantId: string,
  participantPhone: string,
  participantName: string,
  eventTitle: string
) => {
  try {
    // 1. Capture the ticket element as an image
    const canvas = await html2canvas(ticketElement, {
      scale: 2, // Higher quality
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    
    // 2. Convert canvas to base64 data URL (JPEG to save space)
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
    
    // 3. Upload to Firebase Storage
    const storageRef = ref(storage, `tickets/${participantId}-${Date.now()}.jpg`);
    await uploadString(storageRef, base64Image, 'data_url');
    
    // 4. Get the public download URL
    const imageUrl = await getDownloadURL(storageRef);
    
    // 5. Construct the WhatsApp message
    const message = `Halo ${participantName},\n\nTerima kasih telah mendaftar untuk acara *${eventTitle}*.\n\nBerikut adalah tiket QR Anda (terlampir pada gambar). Silakan tunjukkan tiket ini kepada panitia saat registrasi ulang di lokasi acara.\n\nID Tiket: ${participantId}\n\nSampai jumpa di lokasi!`;
    
    // 6. Send via WhatsApp Gateway (Fonnte)
    await sendWhatsAppMessage({
      phone: participantPhone,
      message,
      imageUrl
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send ticket via WhatsApp:', error);
    return false;
  }
};
