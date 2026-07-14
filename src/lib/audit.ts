import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const logAction = async (eventId: string, adminUser: string, action: string, details: string) => {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      eventId,
      adminUser,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to log action', err);
  }
};
