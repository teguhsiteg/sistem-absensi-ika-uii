import { sendWhatsAppMessage } from './whatsapp';

export const sendTicketViaWhatsApp = async (
  ticketElement: HTMLElement | null,
  participantId: string,
  participantPhone: string,
  participantName: string,
  eventTitle: string
) => {
  try {
    const websiteUrl = window.location.origin;
    
    // Construct the WhatsApp message without image
    const message = `Halo ${participantName},\n\nTerima kasih telah mendaftar untuk acara *${eventTitle}*.\n\nPendaftaran Anda telah berhasil dicatat dengan ID Registrasi: *${participantId}*.\n\nJika Anda belum menyimpan atau melakukan screenshot pada QR Code tiket Anda, silakan kunjungi:\n${websiteUrl}\nLalu gunakan fitur "Cari Tiket Saya" dengan memasukkan Nomor HP atau ID Registrasi Anda.\n\nSampai jumpa di lokasi acara!`;
    
    // Send via WhatsApp Gateway (Fonnte)
    await sendWhatsAppMessage({
      phone: participantPhone,
      message
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send ticket text via WhatsApp:', error);
    return false;
  }
};
