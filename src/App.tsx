/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Download, 
  Phone, 
  Mail, 
  ChevronRight, 
  ArrowLeft, 
  Search, 
  Lock, 
  Shield, 
  Sparkles,
  Info,
  CalendarDays,
  FileSpreadsheet,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';

import { EventConfig, Participant, AuditLog, EventStats } from './types';
import AdminSidebar from './components/AdminSidebar';
import AdminDashboard from './components/AdminDashboard';
import AdminParticipants from './components/AdminParticipants';
import AdminScanner from './components/AdminScanner';
import AdminStats from './components/AdminStats';
import AdminLogs from './components/AdminLogs';
import AdminSettings from './components/AdminSettings';
import PlatformLanding from './components/PlatformLanding';
import PublicScanner from './components/PublicScanner';
import { ThemeToggle } from './components/ThemeToggle';
import { logAction } from './lib/audit';

import { auth, db } from './firebase';
import { sendTicketViaWhatsApp } from './ticketSender';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';

const adminFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('admin_token');
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
};


const generateGoogleCalendarUrl = (event: EventConfig) => {
  const title = encodeURIComponent(event.title || 'Event');
  const location = encodeURIComponent(event.location || '');
  const details = encodeURIComponent('Anda telah terdaftar untuk: ' + event.title + '\n\nCek detail: ' + window.location.href);
  
  // Try to parse basic dates or fallback to no explicit date (let user set it)
  // For standard Google Calendar format without dates, it still opens the composer.
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
};

export default function App() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  React.useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Navigation / Route: 'public-landing' | 'public-register' | 'public-ticket' | 'public-lookup' | 'admin-login' | 'admin-panel' | 'public-scanner'
  const [route, setRoute] = React.useState<'public-landing' | 'public-register' | 'public-ticket' | 'public-lookup' | 'admin-login' | 'admin-panel' | 'public-scanner'>('public-landing');

  // WhatsApp integration refs & state
  const ticketRef = React.useRef<HTMLDivElement>(null);
  const [isNewRegistration, setIsNewRegistration] = React.useState(false);

  // Toast notifications state
  interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const showToast = React.useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  React.useEffect(() => {
    (window as any).showToast = showToast;
    return () => {
      delete (window as any).showToast;
    };
  }, [showToast]);

  // Listeners for secret Admin Portal access
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + A to open admin portal
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setRoute('admin-login');
        showToast('Mengakses portal administrator...', 'info');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast]);

  const [isScannerMode, setIsScannerMode] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get('admin') === 'true' || 
      params.get('login') === 'admin' ||
      window.location.pathname.toLowerCase().includes('/postingadmin')
    ) {
      setRoute('admin-login');
      // Clear URL params and path back to root for clean appearance
      window.history.replaceState({}, document.title, '/');
      showToast('Mengakses halaman login admin', 'info');
    } else if (
      params.get('scanner') === 'true' || 
      params.get('scan') === 'true' || 
      params.get('scanner') === '1'
    ) {
      setIsScannerMode(true);
      window.history.replaceState({}, document.title, '/');
    }
  }, [showToast]);



  // Secret click counter for Admin Portal access
  const [logoClicks, setLogoClicks] = React.useState(0);
  
  // Admin Panel states
  const [adminTab, setAdminTab] = React.useState('dashboard');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = React.useState(false);
  const [adminEmail, setAdminEmail] = React.useState('');

  // Domain states (Synchronized with backend)
  const [events, setEvents] = React.useState<EventConfig[]>([]);
  const [activeEvent, setActiveEvent] = React.useState<EventConfig | null>(null);
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);
  const [stats, setStats] = React.useState<EventStats | null>(null);

  React.useEffect(() => {
    if (isScannerMode && activeEvent) {
      setRoute('public-scanner');
      setIsScannerMode(false);
    }
  }, [isScannerMode, activeEvent]);

  // Loaded/Sync flags
  const [loading, setLoading] = React.useState(true);

  // Active registration ticket state (for public ticket view)
  const [activeTicket, setActiveTicket] = React.useState<Participant | null>(null);
  const [ticketQrUrl, setTicketQrUrl] = React.useState('');

  // Lookup state
  const [lookupQuery, setLookupQuery] = React.useState('');
  const [lookupResult, setLookupResult] = React.useState<Participant | null>(null);
  const [lookupError, setLookupError] = React.useState('');

  // Public register form state
  const [regForm, setRegForm] = React.useState({
    name: '',
    phone: '',
    email: '',
    status: 'Hadir' as 'Hadir' | 'Berhalangan',
    reason: '',
    instansi: '',
    jabatan: 'Alumni',
    kota: '',
    catatan: '',
    consent: false
  });
  const [regError, setRegError] = React.useState('');
  const [isSubmittingReg, setIsSubmittingReg] = React.useState(false);

  // Admin login credentials
  const [loginForm, setLoginForm] = React.useState({ email: '', password: '' });
  const [loginError, setLoginError] = React.useState('');
  const [isAdminRegisterMode, setIsAdminRegisterMode] = React.useState(false);

  // WhatsApp auto-send after registration
  React.useEffect(() => {
    if (route === 'public-ticket' && activeTicket && activeEvent && isNewRegistration && ticketRef.current) {
      setIsNewRegistration(false); // Only trigger once
      showToast('Sedang memproses tiket & mengirim WhatsApp...', 'info');
      sendTicketViaWhatsApp(
        ticketRef.current,
        activeTicket.id,
        activeTicket.phone,
        activeTicket.name,
        activeEvent.title
      ).then(success => {
        if (success) showToast('Tiket berhasil dikirim ke WhatsApp Anda!', 'success');
        else showToast('Gagal mengirim WhatsApp, tapi tiket berhasil dibuat.', 'error');
      });
    }
  }, [route, activeTicket, activeEvent, isNewRegistration, showToast]);

  // --- API BACKEND COMMUNICATORS ---

  const fetchActiveEvent = async () => {
    try {
      const q = query(collection(db, 'events'), where('isActive', '==', true), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as EventConfig;
        setActiveEvent(data);
        return data;
      }
    } catch (err) {
      console.error('Fetch active event error:', err);
    }
    return null;
  };

  const fetchAllEvents = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'events'));
      const data = snapshot.docs.map(d => d.data() as EventConfig).filter(e => !e.isArchived);
      setEvents(data);
    } catch (err) {
      console.error('Fetch events error:', err);
    }
  };

  const fetchParticipants = async (eventId: string) => {
    try {
      const q = query(collection(db, 'participants'), where('eventId', '==', eventId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => d.data() as Participant);
      setParticipants(data);
    } catch (err) {
      console.error('Fetch participants error:', err);
    }
  };

  const fetchStats = async (eventId: string) => {
    try {
      const q = query(collection(db, 'participants'), where('eventId', '==', eventId));
      const snapshot = await getDocs(q);
      const parts = snapshot.docs.map(d => d.data() as Participant);
      
      const totalHadir = parts.filter(p => p.status === 'Hadir').length;
      const checkedInCount = parts.filter(p => p.checkedIn).length;
      
      
      // Helper function to aggregate counts
      const countBy = (arr: any[], key: string) => {
        const counts = arr.reduce((acc, obj) => {
          const val = obj[key] || 'Lainnya';
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts)
          .map(([name, value]) => ({ name, value: value as number }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10); // Top 10
      };

      const computedStats: EventStats = {
        totalRegistered: parts.length,
        totalHadir,
        totalBelumHadir: totalHadir - checkedInCount,
        totalBerhalangan: parts.filter(p => p.status === 'Berhalangan').length,
        checkedInTodayCount: checkedInCount,
        attendanceRate: totalHadir > 0 ? Math.round((checkedInCount / totalHadir) * 100) : 0,
        hourlyCheckIn: [], // Could be implemented by parsing checkedInAt
        instansiBreakdown: countBy(parts, 'instansi'),
        angkatanBreakdown: countBy(parts, 'angkatan'),
        kotaBreakdown: countBy(parts, 'kota'),
        statusBreakdown: countBy(parts, 'status')
      };
            setStats(computedStats);
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => d.data() as AuditLog);
      setAuditLogs(data);
    } catch (err) {
      console.error('Fetch audit logs error:', err);
    }
  };

  // Sync everything
  const syncAllData = async () => {
    setLoading(true);
    const active = await fetchActiveEvent();
    await fetchAllEvents();
    if (auth.currentUser) {
      if (active) {
        await fetchParticipants(active.id);
        await fetchStats(active.id);
      }
      await fetchAuditLogs();
    }
    setLoading(false);
  };

  React.useEffect(() => {
    // Listen to Firebase Auth state change to sync admin status and data
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsAdminLoggedIn(true);
        setAdminEmail(user.email || '');
        try {
          const token = await user.getIdToken();
          localStorage.setItem('admin_token', token);
          localStorage.setItem('admin_email', user.email || '');
        } catch (err) {
          console.error('Error updating token:', err);
        }
        
        // Sync full data once authenticated
        const active = await fetchActiveEvent();
        await fetchAllEvents();
        if (active) {
          await fetchParticipants(active.id);
          await fetchStats(active.id);
        }
        await fetchAuditLogs();
        setLoading(false);
      } else {
        setIsAdminLoggedIn(false);
        setAdminEmail('');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_email');
        
        // Non-admin: only load public data
        setLoading(true);
        await fetchActiveEvent();
        await fetchAllEvents();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Update dynamic QR Code when ticket changes
  React.useEffect(() => {
    if (activeTicket) {
      QRCode.toDataURL(activeTicket.id, { width: 300, margin: 2 })
        .then(url => setTicketQrUrl(url))
        .catch(err => console.error(err));
    } else {
      setTicketQrUrl('');
    }
  }, [activeTicket]);

  // --- ACTIONS ---

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    
    if (!activeEvent) {
      setRegError('Event tidak aktif.');
      return;
    }

    if (!regForm.name || !regForm.phone) {
      setRegError('Nama Lengkap dan Nomor HP wajib diisi.');
      return;
    }

    if (!regForm.consent) {
      setRegError('Anda wajib menyetujui kebijakan penggunaan data untuk melanjutkan.');
      return;
    }

    setIsSubmittingReg(true);
    try {
      const id = doc(collection(db, 'participants')).id;
      const newParticipant = {
        ...regForm,
        id,
        eventId: activeEvent.id,
        checkedIn: false,
        checkedInAt: null,
        createdAt: new Date().toISOString(),
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent
      };
      
      await setDoc(doc(db, 'participants', id), newParticipant);
      
      setActiveTicket(newParticipant);
      setIsNewRegistration(true);
      setRoute('public-ticket');
      setRegForm({
        name: '',
        phone: '',
        email: '',
        status: 'Hadir',
        reason: '',
        instansi: '',
        jabatan: 'Alumni',
        kota: '',
        catatan: '',
        consent: false
      });
      syncAllData();
    } catch (err) {
      setRegError('Kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setLookupResult(null);

    if (!lookupQuery.trim()) {
      setLookupError('Harap masukkan Nomor HP atau ID Registrasi Anda.');
      return;
    }

    try {
      const q = query(collection(db, 'participants'), where('id', '==', lookupQuery.trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        // Fallback to phone number
        const q2 = query(collection(db, 'participants'), where('phone', '==', lookupQuery.trim()));
        const snap2 = await getDocs(q2);
        if (snap2.empty) {
          setLookupError('Data registrasi tidak ditemukan.');
        } else {
          setLookupResult(snap2.docs[0].data() as Participant);
        }
      } else {
        setLookupResult(snap.docs[0].data() as Participant);
      }
    } catch (err) {
      setLookupError('Kesalahan jaringan. Harap ulangi beberapa saat lagi.');
    }
  };

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      let userCredential;
      if (isAdminRegisterMode) {
        userCredential = await createUserWithEmailAndPassword(auth, loginForm.email, loginForm.password);
        showToast('Akun admin berhasil dibuat dan login!', 'success');
      } else {
        userCredential = await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      }
      
      const token = await userCredential.user.getIdToken();
      const email = userCredential.user.email || '';

      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_email', email);
      setIsAdminLoggedIn(true);
      setAdminEmail(email);
      setRoute('admin-panel');
      setAdminTab('dashboard');
      setLoginForm({ email: '', password: '' });
      setIsAdminRegisterMode(false);
      syncAllData();
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setLoginError('Email atau password salah.');
      } else if (err.code === 'auth/email-already-in-use') {
        setLoginError('Email sudah terdaftar. Silakan login.');
      } else if (err.code === 'auth/weak-password') {
        setLoginError('Password terlalu lemah (minimal 6 karakter).');
      } else {
        setLoginError(err.message || 'Kesalahan sistem atau jaringan.');
      }
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    setIsAdminLoggedIn(false);
    setAdminEmail('');
    setRoute('public-landing');
  };

  // --- ADMIN SYSTEM MUTATORS ---

  const handleUpdateEvent = async (id: string, data: Partial<EventConfig>) => {
    try {
      await updateDoc(doc(db, 'events', id), data);
      await syncAllData();
    } catch (err: any) {
      throw new Error(err.message || 'Gagal mengubah data event.');
    }
  };

  const handleCreateEvent = async (data: Omit<EventConfig, 'id' | 'isActive'>) => {
    try {
      const newEventId = 'event-' + Date.now();
      const newEvent: EventConfig = {
        ...data,
        id: newEventId,
        isActive: false
      };
      await setDoc(doc(db, 'events', newEventId), newEvent);
      await syncAllData();
    } catch (err: any) {
      throw new Error(err.message || 'Gagal membuat event baru.');
    }
  };

  const handleActivateEvent = async (id: string) => {
    try {
      // Deactivate others
      const eventsSnap = await getDocs(collection(db, 'events'));
      const batch = eventsSnap.docs.map(d => updateDoc(doc(db, 'events', d.id), { isActive: d.id === id }));
      await Promise.all(batch);
      await syncAllData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', id));
      await syncAllData();
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Gagal menghapus event.');
    }
  };

  const handleUpdateParticipant = async (id: string, data: Partial<Participant> & { updatedByAdmin?: boolean }) => {
    try {
      const { updatedByAdmin, ...cleanedData } = data;
      await updateDoc(doc(db, 'participants', id), cleanedData);
      await syncAllData();
    } catch (err: any) {
      throw new Error(err.message || 'Gagal mengubah data peserta.');
    }
  };

  const handleDeleteParticipant = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'participants', id));
      await syncAllData();
    } catch (err: any) {
      throw new Error(err.message || 'Gagal menghapus data peserta.');
    }
  };

  const handleAddParticipant = async (data: any) => {
    if (!activeEvent) return;
    try {
      const id = doc(collection(db, 'participants')).id;
      const newParticipant: Participant = {
        ...data,
        id,
        eventId: activeEvent.id,
        consent: true,
        checkedIn: false,
        checkedInAt: null,
        createdAt: new Date().toISOString(),
        ipAddress: '127.0.0.1',
        userAgent: 'Admin Manual'
      };
      await setDoc(doc(db, 'participants', id), newParticipant);
      await logAction(activeEvent.id, adminEmail, 'Create Participant', `Admin menambahkan ${data.name}`);
      await syncAllData();
    } catch (err: any) {
      throw new Error(err.message || 'Gagal menambahkan peserta.');
    }
  };

  const handleManualCheckIn = async (id: string) => {
    try {
      await updateDoc(doc(db, 'participants', id), {
        checkedIn: true,
        checkedInAt: new Date().toISOString()
      });
      await logAction(activeEvent.id, adminEmail, 'Manual Check-in', `Admin mengabsen ${id}`);
      await syncAllData();
    } catch (err: any) {
      showToast(err.message || 'Gagal check-in', 'error');
    }
  };

  const handleCancelCheckIn = async (id: string) => {
    try {
      await updateDoc(doc(db, 'participants', id), {
        checkedIn: false,
        checkedInAt: null
      });
      await logAction(activeEvent.id, adminEmail, 'Cancel Check-in', `Admin membatalkan absen ${id}`);
      await syncAllData();
    } catch (err: any) {
      showToast(err.message || 'Gagal membatalkan check-in', 'error');
    }
  };

  const handleScanCheckIn = async (qrCode: string) => {
    try {
      const q = query(collection(db, 'participants'), where('id', '==', qrCode));
      const snap = await getDocs(q);
      if (snap.empty) {
        return { success: false, status: 'invalid' as const, message: 'QR Code tidak ditemukan dalam database.' };
      }
      const participant = snap.docs[0].data() as Participant;
      if (participant.checkedIn) {
        return { success: false, status: 'duplicate' as const, message: `Peserta ${participant.name} sudah check-in pada ${new Date(participant.checkedInAt!).toLocaleTimeString()}`, participant };
      }
      
      await updateDoc(doc(db, 'participants', participant.id), {
        checkedIn: true,
        checkedInAt: new Date().toISOString(),
        status: 'Hadir'
      });
      
      await logAction(activeEvent.id, adminEmail, 'Scanner Check-in', `Scan QR ${participant.name}`);
      
      if (activeEvent) {
        fetchParticipants(activeEvent.id);
        fetchStats(activeEvent.id);
        fetchAuditLogs();
      }
      
      return { success: true, status: 'success' as const, message: `Check-in berhasil: ${participant.name}`, participant: { ...participant, checkedIn: true } };
    } catch (err: any) {
      return { success: false, status: 'invalid' as const, message: err.message || 'Server error saat check-in' };
    }
  };

  // NATIVE SHEET EXPORTER (Uses sheetJS xlsx package!)
  const handleExportExcel = () => {
    if (participants.length === 0) {
      showToast('Tidak ada data peserta untuk diexport.', 'error');
      return;
    }

    const exportData = participants.map((p, index) => ({
      'No': index + 1,
      'No Registrasi': p.id,
      'Nama Lengkap': p.name,
      'Nomor HP': p.phone,
      'Email': p.email || '',
      'Status': p.status,
      'Alasan Berhalangan': p.reason || '',
      'Instansi / Universitas': p.instansi || '',
      'Jabatan': p.jabatan || '',
      'Kota Asal': p.kota || '',
      'Catatan': p.catatan || '',
      'Check-In': p.checkedIn ? 'Sudah Hadir' : 'Belum Hadir',
      'Waktu Check-In': p.checkedInAt ? new Date(p.checkedInAt).toLocaleString('id-ID') : '',
      'Tanggal Mendaftar': new Date(p.createdAt).toLocaleString('id-ID')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Hadir');
    
    // Auto-fit columns helper
    const max_len = exportData.reduce((acc, row) => {
      Object.keys(row).forEach((key, col_idx) => {
        const val = String(row[key as keyof typeof row] || '');
        acc[col_idx] = Math.max(acc[col_idx] || 0, val.length, key.length);
      });
      return acc;
    }, [] as number[]);
    worksheet['!cols'] = max_len.map(len => ({ wch: len + 3 }));

    const eventPrefix = activeEvent ? activeEvent.title.replace(/\s+/g, '_') : 'Event_UII';
    XLSX.writeFile(workbook, `Rekap_Kehadiran_${eventPrefix}_${Date.now()}.xlsx`);
  };

  // Download QR Ticket Image
  const handleDownloadTicketQr = () => {
    if (!ticketQrUrl || !activeTicket) return;
    const a = document.createElement('a');
    a.href = ticketQrUrl;
    a.download = `Tiket_${activeTicket.id}_${activeTicket.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Pre-fill WA Message Link
  const getWhatsAppShareLink = () => {
    if (!activeTicket || !activeEvent) return '#';
    const message = `Halo, saya telah mendaftar pada acara *${activeEvent.title}*.\n\n` +
      `*Berikut data tiket digital saya:*\n` +
      `• No Registrasi: ${activeTicket.id}\n` +
      `• Nama: ${activeTicket.name}\n` +
      `• Status: ${activeTicket.status}\n\n` +
      `Simpan QR Code atau cari status pendaftaran saya di: ${window.location.origin}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  if (loading && !activeEvent) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-display">Memuat Sistem Kehadiran...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between relative transition-colors duration-300">
      
      {/* Global Theme Toggle (Top Right) */}
      {route !== 'admin-panel' && (
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle theme={theme} setTheme={setTheme} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-sm" />
        </div>
      )}

      {/* Back to All Events Portal Button (Top Left) */}
      {route === 'public-landing' && activeEvent && events.length > 0 && (
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={() => {
              setActiveEvent(null);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-sm rounded-lg text-xs font-bold text-slate-600 dark:text-slate-200 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
          >
            <ArrowLeft size={13} />
            <span>Semua Agenda</span>
          </button>
        </div>
      )}

      {/* 1a. PLATFORM LANDING PORTAL (If no active event is loaded) */}
      {route === 'public-landing' && !activeEvent && (
        <PlatformLanding 
          events={events}
          onSelectEvent={(event) => {
            setActiveEvent(event);
            fetchParticipants(event.id);
            fetchStats(event.id);
          }}
          onNavigateToAdmin={() => {
            if (isAdminLoggedIn) {
              setRoute('admin-panel');
            } else {
              setRoute('admin-login');
            }
          }}
        />
      )}

      {/* 1b. PUBLIC LANDING PAGE FOR SPECIFIC EVENT */}
      {route === 'public-landing' && activeEvent && (
        <div className="flex-1 flex flex-col justify-between">
          {/* Hero Banner Section */}
          <div className="relative bg-slate-900 text-white min-h-[55vh] flex flex-col justify-center items-center overflow-hidden">
            {activeEvent.bannerUrl ? (
              <img 
                src={activeEvent.bannerUrl} 
                alt="Event Banner" 
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-900 via-blue-950 to-amber-600 opacity-90 mix-blend-multiply"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-white/5 to-transparent"></div>

            <div className="relative max-w-4xl mx-auto px-4 text-center space-y-6 py-12 z-10 flex flex-col items-center">
              {/* Logos */}
              <div 
                onClick={() => {
                  setLogoClicks(prev => {
                    const next = prev + 1;
                    if (next >= 5) {
                      setRoute('admin-login');
                      showToast('Mengakses portal administrator secara rahasia...', 'info');
                      return 0;
                    }
                    return next;
                  });
                }}
                className="flex items-center gap-4 justify-center cursor-pointer select-none"
                title="Portal Kehadiran Resmi"
              >
                {activeEvent.logoUrl ? (
                  <div className="w-20 h-20 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden">
                    <img src={activeEvent.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl flex items-center justify-center font-display font-black text-xl text-blue-900">
                      IKA
                    </div>
                    <div className="w-16 h-16 bg-amber-500 border border-amber-400/30 p-2 rounded-2xl shadow-xl flex items-center justify-center font-display font-black text-xl text-blue-950">
                      UII
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-3">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Portal Kehadiran Resmi
                </span>
                <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight leading-tight text-white max-w-3xl">
                  {activeEvent.title}
                </h1>
                {activeEvent.organizer && (
                  <p className="text-sm md:text-base text-slate-300 font-medium max-w-2xl mx-auto">
                    {activeEvent.organizer}
                  </p>
                )}
              </div>

              {/* Quick Info Grid */}
              <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-100 font-semibold bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-2xl">
                <span className="flex items-center gap-2">
                  <CalendarDays size={18} className="text-amber-400" />
                  {new Date(activeEvent.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={18} className="text-amber-400" />
                  Pukul {activeEvent.time} WIB
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={18} className="text-amber-400" />
                  {activeEvent.location.split(',')[0]}
                </span>
              </div>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-direction sm:flex-row gap-3 pt-4 justify-center w-full max-w-xs sm:max-w-md">
                {activeEvent.isRegistrationActive ? (
                  <button
                    onClick={() => setRoute('public-register')}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-900/30 cursor-pointer text-center"
                  >
                    Daftar Kehadiran
                  </button>
                ) : (
                  <div className="flex-1 bg-slate-800 text-slate-400 border border-slate-700 font-bold px-6 py-3.5 rounded-xl text-sm text-center">
                    Registrasi Ditutup
                  </div>
                )}
                <button
                  onClick={() => setRoute('public-lookup')}
                  className="flex-1 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold px-6 py-3.5 rounded-xl text-sm transition-all cursor-pointer text-center backdrop-blur-xs"
                >
                  Cek Status Tiket / QR
                </button>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="max-w-4xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none space-y-4">
                <h3 className="font-display font-black text-slate-800 dark:text-slate-100 text-lg">Informasi Agenda Kegiatan</h3>
                {activeEvent.fullDescription ? (
                  <div 
                    className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-4"
                    dangerouslySetInnerHTML={{ __html: activeEvent.fullDescription.replace(/\n/g, '<br/>') }}
                  />
                ) : activeEvent.description ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {activeEvent.description}
                  </p>
                ) : null}
                <div className="p-4 bg-amber-50/60 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
                  <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Pemberitahuan Check-in:</p>
                    <p className="mt-1 opacity-90">Setiap alumni/tamu yang mendaftar online akan memperoleh kode QR unik. Mohon tunjukkan kode QR tersebut kepada petugas di lokasi acara untuk proses kehadiran yang lebih cepat.</p>
                  </div>
                </div>
              </div>
              
              {/* Gallery Section */}
              {activeEvent.gallery && activeEvent.gallery.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none space-y-4">
                  <h3 className="font-display font-black text-slate-800 dark:text-slate-100 text-lg">Galeri Event</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {activeEvent.gallery.map((url, idx) => (
                      <div key={idx} className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none space-y-4">
                <h4 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">Lokasi & Maps</h4>
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{activeEvent.location}</p>
                  {activeEvent.mapsUrl && (
                    <a 
                      href={activeEvent.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                    >
                      Buka di Google Maps <ChevronRight size={14} />
                    </a>
                  )}
                </div>
              </div>

              {/* Social Media Links */}
              {activeEvent.socialMedia && (activeEvent.socialMedia.instagram || activeEvent.socialMedia.twitter || activeEvent.socialMedia.website || activeEvent.socialMedia.facebook) && (
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none space-y-4">
                  <h4 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">Tautan & Media Sosial</h4>
                  <div className="flex flex-col gap-3 text-sm">
                    {activeEvent.socialMedia.instagram && (
                      <a href={activeEvent.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors">
                        Instagram
                      </a>
                    )}
                    {activeEvent.socialMedia.facebook && (
                      <a href={activeEvent.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors">
                        Facebook
                      </a>
                    )}
                    {activeEvent.socialMedia.twitter && (
                      <a href={activeEvent.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors">
                        Twitter (X)
                      </a>
                    )}
                    {activeEvent.socialMedia.website && (
                      <a href={activeEvent.socialMedia.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors">
                        Website Resmi
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. PUBLIC REGISTRATION FORM */}
      {route === 'public-register' && activeEvent && (
        <div className="max-w-2xl mx-auto px-4 py-12 w-full">
          <button 
            onClick={() => setRoute('public-landing')}
            className="mb-6 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 w-max shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Kembali ke Beranda
          </button>

          <form onSubmit={handleRegisterSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white border-b-4 border-blue-600 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400 to-transparent"></div>
              <div className="relative z-10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Formulir Registrasi Mandiri</span>
                <h2 className="font-display font-black text-lg text-slate-100">{activeEvent.title}</h2>
                <p className="text-xs text-slate-400 leading-relaxed">Isilah formulir dengan data yang valid untuk check-in lokasi acara.</p>
              </div>
            </div>

            {/* Error banner */}
            {regError && (
              <div className="p-4 bg-rose-50 border-b border-rose-100 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <span className="p-1 bg-rose-100 text-rose-800 rounded-full">!</span>
                <span>{regError}</span>
              </div>
            )}

            {/* Fields */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Nama Lengkap *</label>
                <input 
                  type="text"
                  required
                  placeholder="Nama Lengkap dengan Gelar"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all font-semibold placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Nomor HP / WhatsApp *</label>
                  <input 
                    type="tel"
                    required
                    placeholder="Contoh: 08123456789"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all font-mono placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Email (Opsional)</label>
                  <input 
                    type="email"
                    placeholder="nama.email@example.com"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all font-mono placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Instansi / Angkatan</label>
                  <input 
                    type="text"
                    placeholder="Contoh: Kantor Cabang / Instansi / Angkatan 2005"
                    value={regForm.instansi}
                    onChange={(e) => setRegForm({ ...regForm, instansi: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Jabatan / Kategori</label>
                  <select
                    value={regForm.jabatan}
                    onChange={(e) => setRegForm({ ...regForm, jabatan: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="Pengurus">Pengurus DPW / DPD</option>
                    <option value="Undangan">Undangan Khusus</option>
                    <option value="Alumni">Alumni Umum</option>
                    <option value="Tamu">Tamu Kehormatan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Kota Asal (Opsional)</label>
                  <input 
                    type="text"
                    placeholder="Yogyakarta / Sleman / Bantul"
                    value={regForm.kota}
                    onChange={(e) => setRegForm({ ...regForm, kota: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Rencana Kehadiran *</label>
                  <select
                    value={regForm.status}
                    onChange={(e) => setRegForm({ ...regForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Berhalangan">Berhalangan</option>
                  </select>
                </div>
              </div>

              {regForm.status === 'Berhalangan' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Alasan Berhalangan *</label>
                  <textarea 
                    required
                    rows={2}
                    placeholder="Tuliskan alasan singkat berhalangan..."
                    value={regForm.reason}
                    onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Catatan Tambahan (Opsional)</label>
                <textarea 
                  rows={2}
                  placeholder="Kebutuhan khusus atau pesan untuk panitia..."
                  value={regForm.catatan}
                  onChange={(e) => setRegForm({ ...regForm, catatan: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Consent checkbox */}
              <div className="flex items-start gap-3 pt-2">
                <input 
                  type="checkbox"
                  required
                  id="consentCheck"
                  checked={regForm.consent}
                  onChange={(e) => setRegForm({ ...regForm, consent: e.target.checked })}
                  className="w-4.5 h-4.5 mt-0.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="consentCheck" className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed cursor-pointer select-none">
                  Saya bersedia data saya digunakan untuk kebutuhan registrasi dan check-in acara <span className="font-semibold text-slate-700 dark:text-slate-300">{activeEvent.title}</span> secara transparan.
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/60 flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setRoute('public-landing')}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="submit"
                disabled={isSubmittingReg}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-900/10 disabled:opacity-50"
              >
                {isSubmittingReg ? 'Memproses...' : 'Daftar Sekarang'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. PUBLIC TICKET GENERATED SCREEN */}
      {route === 'public-ticket' && activeTicket && activeEvent && (
        <div className="max-w-md mx-auto px-4 py-12 w-full text-center space-y-6">
          <div ref={ticketRef} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-amber-800 text-white border-b-4 border-amber-400 text-center relative">
              <div className="absolute inset-0 bg-gradient-to-t from-amber-950/80 to-transparent"></div>
              <div className="relative z-10 flex flex-col items-center space-y-2">
                <div className="p-2 bg-white dark:bg-slate-900/20 rounded-full">
                  <CheckCircle2 size={36} className="text-amber-300" />
                </div>
                <h2 className="font-display font-black text-lg tracking-tight">REGISTRASI BERHASIL</h2>
                <p className="text-[10px] uppercase font-bold tracking-wider text-amber-200">{activeEvent.title}</p>
              </div>
            </div>

            {/* Ticket body */}
            <div className="p-6 space-y-6">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {activeEvent.successMessage}
              </p>

              {/* HUGE QR CODE */}
              <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/50 p-4 rounded-2xl relative">
                {ticketQrUrl ? (
                  <img src={ticketQrUrl} alt="Ticket QR" className="w-52 h-52 bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs dark:shadow-none" />
                ) : (
                  <div className="w-52 h-52 bg-slate-200 animate-pulse rounded-xl"></div>
                )}
                <span className="text-xs font-mono font-black tracking-widest mt-3.5 bg-slate-100 text-slate-700 dark:text-slate-200 px-3 py-1 rounded border border-slate-200 dark:border-slate-800/50 shadow-2xs">
                  {activeTicket.id}
                </span>
              </div>

              {/* Participant Details Table */}
              <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-5 text-left text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Nama Lengkap</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{activeTicket.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Nomor HP</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">{activeTicket.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Status Kehadiran</span>
                  <span className={`font-semibold ${activeTicket.status === 'Hadir' ? 'text-amber-600' : 'text-slate-500 dark:text-slate-400'}`}>
                    {activeTicket.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Instansi / Jabatan</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{activeTicket.instansi || '-'} / {activeTicket.jabatan || 'Alumni'}</span>
                </div>
              </div>
            </div>

            {/* Ticket Footer print cut layout */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-2">
              <button 
                onClick={handleDownloadTicketQr}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-blue-900/10"
              >
                <Download size={14} /> Download QR Code
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <a 
                  href={getWhatsAppShareLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold text-[11px] py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  Kirim WhatsApp
                </a>
                <button 
                  onClick={() => window.open(generateGoogleCalendarUrl(activeEvent), '_blank')}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  Simpan Kalender
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              setActiveTicket(null);
              setRoute('public-landing');
            }}
            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1 mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl shadow-2xs cursor-pointer"
          >
            Selesai & Beranda
          </button>
        </div>
      )}

      {/* 4. PUBLIC LOOKUP TICKET PORTAL */}
      {route === 'public-lookup' && activeEvent && (
        <div className="max-w-md mx-auto px-4 py-12 w-full space-y-6">
          <button 
            onClick={() => {
              setLookupResult(null);
              setLookupError('');
              setRoute('public-landing');
            }}
            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 w-max shadow-2xs cursor-pointer"
          >
            <ArrowLeft size={14} /> Kembali
          </button>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-900 text-white">
              <h2 className="font-display font-black text-base text-slate-100">Cari Tiket Digital Anda</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Masukkan Nomor HP yang Anda daftarkan atau ID Registrasi untuk mengambil tiket kembali.</p>
            </div>

            <form onSubmit={handleLookupSubmit} className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                <input 
                  type="text"
                  required
                  placeholder="Nomor HP atau ID Registrasi..."
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all font-semibold placeholder:text-slate-400"
                />
              </div>

              {lookupError && (
                <p className="text-xs text-rose-600 font-semibold">{lookupError}</p>
              )}

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm"
              >
                Cari Data Pendaftaran
              </button>
            </form>

            {/* Lookup Result Displays */}
            {lookupResult && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/50 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-amber-600" /> Data registrasi ditemukan!
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Nama Lengkap</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{lookupResult.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">No Registrasi</span>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{lookupResult.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Status Kehadiran</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{lookupResult.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Check-In</span>
                    <span className={`font-bold ${lookupResult.checkedIn ? 'text-amber-600' : 'text-amber-600'}`}>
                      {lookupResult.checkedIn ? 'Sudah Check-In' : 'Belum Check-In'}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setActiveTicket(lookupResult);
                    setRoute('public-ticket');
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-slate-100 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Tampilkan Kode QR Tiket
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4.5 PUBLIC SCANNER PORTAL */}
      {route === 'public-scanner' && activeEvent && (
        <PublicScanner 
          event={activeEvent}
          onBack={() => setRoute('public-landing')}
          onScanCheckIn={handleScanCheckIn}
        />
      )}

      {/* 5. ADMIN LOGIN */}
      {route === 'admin-login' && (
        <div className="max-w-md mx-auto px-4 py-16 w-full">
          <button 
            onClick={() => setRoute('public-landing')}
            className="mb-6 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 w-max shadow-2xs cursor-pointer"
          >
            <ArrowLeft size={14} /> Kembali ke Publik Portal
          </button>

          <form onSubmit={handleAdminAuth} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden animate-in fade-in duration-300">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white text-center space-y-2 border-b-4 border-blue-600">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-display font-black text-xl text-white mx-auto shadow-md">
                A
              </div>
              <div>
                <h2 className="font-display font-bold text-slate-100 text-base">Dashboard Administrator</h2>
                <p className="text-xs text-slate-400 leading-relaxed">Silakan login dengan kredensial panitia Anda.</p>
              </div>
            </div>

            {/* Error */}
            {loginError && (
              <div className="p-4 bg-rose-50 border-b border-rose-100 text-xs text-rose-700 font-semibold">
                {loginError}
              </div>
            )}

            {/* Fields */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Email Panitia</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input 
                    type="email"
                    required
                    placeholder="Masukkan email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all font-semibold font-mono placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input 
                    type="password"
                    required
                    placeholder="Sandi keamanan Anda"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all font-semibold placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-xl text-[10px] text-slate-400 leading-relaxed font-sans flex flex-col gap-2">
                <div>
                  <p className="font-bold text-slate-500 dark:text-slate-400">Keamanan Sistem:</p>
                  <p className="mt-0.5">Portal ini dilindungi dengan enkripsi Firebase Authentication. Akses hanya untuk staf dan panitia yang terdaftar.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row justify-end gap-2">
              <button 
                type="button"
                onClick={() => {
                  setRoute('public-landing');
                  setIsAdminRegisterMode(false);
                  setLoginError('');
                }}
                className="w-full sm:w-auto bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 active:bg-slate-400 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 px-6 rounded-xl transition-all cursor-pointer text-center"
              >
                Kembali
              </button>
              <button 
                type="submit"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Masuk ke Dashboard
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. ADMIN PRIVATE PORTAL PANEL */}
      {route === 'admin-panel' && isAdminLoggedIn && (
        <div className="flex-1 flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 relative">
          {/* Sidebar */}
          <AdminSidebar 
            currentTab={adminTab}
            setCurrentTab={setAdminTab}
            adminEmail={adminEmail}
            onLogout={handleAdminLogout}
            eventName={activeEvent?.title || 'Belum Ada Event Aktif'}
            theme={theme}
            setTheme={setTheme}
          />

          {/* Main Area container */}
          <main className="flex-1 flex flex-col h-screen overflow-hidden">
            {/* Header / Utility bar - hidden on mobile, shown on desktop */}
            <header className="hidden md:flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 items-center justify-between shadow-2xs shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 text-slate-600 dark:text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800/50 hidden md:block">
                  Event: {activeEvent?.title || 'Belum Ada Event Aktif'}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Export excel button available only on relevant tabs */}
                {(adminTab === 'dashboard' || adminTab === 'participants') && (
                  <button 
                    onClick={handleExportExcel}
                    className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Export all data to Excel"
                  >
                    <FileSpreadsheet size={15} /> Export Excel
                  </button>
                )}

                <button 
                  onClick={syncAllData}
                  className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 rounded-xl cursor-pointer"
                  title="Refresh Data"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            </header>
            {/* Mobile top header */}
            <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-display font-bold text-white text-xs shadow-md">UII</div>
                <div>
                  <h1 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">E-Attendance</h1>
                  <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{activeEvent?.title || 'Belum Ada Event'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(adminTab === 'dashboard' || adminTab === 'participants') && (
                  <button 
                    onClick={handleExportExcel}
                    className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-semibold text-[10px] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <FileSpreadsheet size={13} /> Excel
                  </button>
                )}
                <button 
                  onClick={syncAllData}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-lg cursor-pointer"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </header>

            {/* View Port for Tabs */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={adminTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {adminTab === 'dashboard' && (
                    <AdminDashboard 
                      stats={stats} 
                      activeEvent={activeEvent} 
                      participants={participants}
                      onTabChange={setAdminTab}
                    />
                  )}
                  {adminTab === 'participants' && (
                    <AdminParticipants 
                      participants={participants}
                      activeEvent={activeEvent}
                      onUpdateParticipant={handleUpdateParticipant}
                      onDeleteParticipant={handleDeleteParticipant}
                      onManualCheckIn={handleManualCheckIn}
                      onCancelCheckIn={handleCancelCheckIn}
                      onAddParticipant={handleAddParticipant}
                    />
                  )}
                  {adminTab === 'scanner' && (
                    <AdminScanner 
                      onScanCheckIn={handleScanCheckIn} 
                      activeEvent={activeEvent}
                    />
                  )}
                  {adminTab === 'statistics' && (
                    <AdminStats stats={stats} />
                  )}
                  {adminTab === 'logs' && (
                    <AdminLogs logs={auditLogs} />
                  )}
                  {adminTab === 'settings' && (
                    <AdminSettings 
                      events={events}
                      activeEvent={activeEvent}
                      onUpdateEvent={handleUpdateEvent}
                      onCreateEvent={handleCreateEvent}
                      onActivateEvent={handleActivateEvent}
                      onDeleteEvent={handleDeleteEvent}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      )}

      {/* Footer (For non-admin pages) */}
      {route !== 'admin-panel' && (
        <footer className="py-6 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-4">
          <div>
            <p>© {new Date().getFullYear()} {activeEvent?.organizer || 'Ikatan Keluarga Alumni'}. Hak Cipta Dilindungi.</p>
            <p className="mt-1 opacity-80">Sistem Kehadiran Digital Terpadu {activeEvent?.organizer ? `• ${activeEvent.organizer}` : ''}</p>
            <p className="mt-2 font-semibold text-slate-500 dark:text-slate-400">Powered by Guwigo</p>
          </div>
        </footer>
      )}

      {/* Floating Toast Notification Stack */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto p-4 rounded-xl shadow-lg border flex items-start gap-3 backdrop-blur-md ${
                toast.type === 'success'
                  ? 'bg-amber-500/15 dark:bg-amber-950/45 border-amber-500/30 text-amber-800 dark:text-amber-200'
                  : toast.type === 'error'
                  ? 'bg-rose-500/15 dark:bg-rose-950/45 border-rose-500/30 text-rose-800 dark:text-rose-200'
                  : 'bg-blue-500/15 dark:bg-blue-950/45 border-blue-500/30 text-blue-800 dark:text-blue-200'
              }`}
            >
              {toast.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              {toast.type === 'error' && (
                <Info className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              {toast.type === 'info' && (
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer text-sm font-bold"
              >
                &times;
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
