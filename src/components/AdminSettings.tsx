/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Settings, 
  Save, 
  Plus, 
  Calendar, 
  MapPin, 
  Image, 
  FileText, 
  Check, 
  Power,
  RefreshCw,
  Clock,
  Sparkles,
  Trash2,
  Archive
} from 'lucide-react';
import { EventConfig } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface SettingsProps {
  events: EventConfig[];
  activeEvent: EventConfig | null;
  onUpdateEvent: (id: string, data: Partial<EventConfig>) => Promise<void>;
  onCreateEvent: (data: Omit<EventConfig, 'id' | 'isActive'>) => Promise<void>;
  onActivateEvent: (id: string) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

export default function AdminSettings({ 
  events, 
  activeEvent, 
  onUpdateEvent, 
  onCreateEvent, 
  onActivateEvent,
  onDeleteEvent
}: SettingsProps) {
  const [selectedEventId, setSelectedEventId] = React.useState('');
  const [editForm, setEditForm] = React.useState<Partial<EventConfig>>({});
  const [archiveModalOpen, setArchiveModalOpen] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [eventToManage, setEventToManage] = React.useState<string | null>(null);
  
  // New Event creation form
  const [showAddEvent, setShowAddEvent] = React.useState(false);
  const [newEventForm, setNewEventForm] = React.useState({
    title: '',
    description: '',
    organizer: '',
    date: '',
    time: '',
    location: '',
    mapsUrl: '',
    bannerUrl: '',
    logoUrl: '',
    registrationDeadline: '',
    successMessage: '',
    scannerPin: '',
    socialMedia: { instagram: '', twitter: '', website: '', facebook: '' },
    gallery: [] as string[],
    fullDescription: '',
    isRegistrationActive: true,
    isScannerActive: true
  });

  // Sync state with selected event
  React.useEffect(() => {
    // When the component mounts or events list changes, if there's no selectedEventId
    if (!selectedEventId && events.length > 0) {
      setSelectedEventId(activeEvent ? activeEvent.id : events[0].id);
    }
  }, [activeEvent, events, selectedEventId]);

  React.useEffect(() => {
    // When selectedEventId changes, populate editForm with the selected event data
    if (selectedEventId) {
      const event = events.find(e => e.id === selectedEventId);
      if (event) setEditForm({ ...event });
    }
  }, [selectedEventId, events]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    try {
      await onUpdateEvent(selectedEventId, editForm);
      (window as any).showToast?.('Pengaturan event berhasil disimpan!', 'success');
    } catch (err: any) {
      (window as any).showToast?.(err.message || 'Gagal menyimpan pengaturan', 'error');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventForm.title || !newEventForm.date || !newEventForm.location) {
      (window as any).showToast?.('Nama, Tanggal, dan Lokasi Event wajib diisi!', 'error');
      return;
    }

    try {
      // Set some defaults
      const payload = {
        ...newEventForm,
        bannerUrl: newEventForm.bannerUrl || '',
        logoUrl: newEventForm.logoUrl || '',
        successMessage: newEventForm.successMessage || '',
        registrationDeadline: newEventForm.registrationDeadline || ''
      };

      await onCreateEvent(payload);
      (window as any).showToast?.('Event baru berhasil dibuat!', 'success');
      setShowAddEvent(false);
      setNewEventForm({
        title: '',
        description: '',
        organizer: '',
        date: '',
        time: '',
        location: '',
        mapsUrl: '',
        bannerUrl: '',
        logoUrl: '',
        registrationDeadline: '',
        successMessage: '',
        scannerPin: '',
        socialMedia: { instagram: '', twitter: '', website: '', facebook: '' },
        gallery: [] as string[],
        fullDescription: '',
        isRegistrationActive: true,
        isScannerActive: true
      });
    } catch (err: any) {
      (window as any).showToast?.(err.message || 'Gagal membuat event baru', 'error');
    }
  };

  const handleActivateEvent = async (id: string) => {
    try {
      await onActivateEvent(id);
      (window as any).showToast?.('Event berhasil diaktifkan!', 'success');
    } catch (err: any) {
      (window as any).showToast?.(err.message || 'Gagal mengaktifkan event', 'error');
    }
  };

  // No early return for !activeEvent so the user can create new events or activate inactive ones.

  return (
    <div className="space-y-6">
      {/* Event Switcher Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-slate-800 dark:text-slate-100 text-base">Manajemen Multi-Event</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Beralih event, mengaktifkan event, atau menambahkan acara baru.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 font-semibold cursor-pointer max-w-[280px]"
          >
            {events.map(e => (
              <option key={e.id} value={e.id}>
                {e.title} {e.isActive ? '(Aktif)' : ''}
              </option>
            ))}
          </select>

          {selectedEventId && (!activeEvent || selectedEventId !== activeEvent.id) && (
            <button
              onClick={() => handleActivateEvent(selectedEventId)}
              className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Aktifkan Event Ini
            </button>
          )}

          <button
            onClick={() => setShowAddEvent(true)}
            className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 font-semibold text-sm px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} /> Buat Event Baru
          </button>
        </div>
      </div>

      {/* Settings Form Grid */}
      {selectedEventId ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Settings Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <Settings className="text-teal-600" size={18} />
            <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">
              Konfigurasi Detail Event {editForm.isActive ? '(Aktif)' : ''}
            </h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Nama Event / Judul Kegiatan *</label>
              <input 
                type="text"
                required
                value={editForm.title || ''}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-all font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Penyelenggara / Organizer</label>
                <input 
                  type="text"
                  placeholder="Contoh: DPW IKA UII DIY"
                  value={editForm.organizer || ''}
                  onChange={(e) => setEditForm({ ...editForm, organizer: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Deskripsi Singkat</label>
                <input 
                  type="text"
                  placeholder="Contoh: Pelantikan Pengurus..."
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Tanggal Acara *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input 
                    type="date"
                    required
                    value={editForm.date || ''}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Waktu Mulai (WIB) *</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input 
                    type="time"
                    required
                    value={editForm.time || ''}
                    onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Lokasi Fisik (Gedung/Ruangan) *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input 
                    type="text"
                    required
                    value={editForm.location || ''}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Tautan Google Maps</label>
                <input 
                  type="url"
                  placeholder="https://maps.app.goo.gl/..."
                  value={editForm.mapsUrl || ''}
                  onChange={(e) => setEditForm({ ...editForm, mapsUrl: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Batas Waktu Registrasi Online</label>
                <input 
                  type="datetime-local"
                  value={editForm.registrationDeadline ? editForm.registrationDeadline.substring(0, 16) : ''}
                  onChange={(e) => setEditForm({ ...editForm, registrationDeadline: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Banner Image URL</label>
                <div className="relative">
                  <Image className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input 
                    type="url"
                    value={editForm.bannerUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, bannerUrl: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Logo Image URL</label>
              <div className="relative">
                <Image className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="url"
                  value={editForm.logoUrl || ''}
                  onChange={(e) => setEditForm({ ...editForm, logoUrl: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Deskripsi Lengkap Event (HTML/Teks)</label>
              <textarea 
                rows={5}
                value={editForm.fullDescription || ''}
                onChange={(e) => setEditForm({ ...editForm, fullDescription: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all"
                placeholder="Deskripsi detail tentang event..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Pesan Sukses Formulir Publik</label>
              <textarea 
                rows={3}
                value={editForm.successMessage || ''}
                onChange={(e) => setEditForm({ ...editForm, successMessage: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60">
              <h4 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm mb-4">Pengaturan Ekstra</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Scanner PIN (Untuk Panitia Eksternal)</label>
                  <input 
                    type="text"
                    value={editForm.scannerPin || ''}
                    onChange={(e) => setEditForm({ ...editForm, scannerPin: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all font-mono"
                    placeholder="Contoh: 123456"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Instagram URL</label>
                  <input 
                    type="url"
                    value={editForm.socialMedia?.instagram || ''}
                    onChange={(e) => setEditForm({ ...editForm, socialMedia: { ...editForm.socialMedia, instagram: e.target.value } })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all"
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Website URL</label>
                  <input 
                    type="url"
                    value={editForm.socialMedia?.website || ''}
                    onChange={(e) => setEditForm({ ...editForm, socialMedia: { ...editForm.socialMedia, website: e.target.value } })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Galeri Foto (Pisahkan URL dengan baris baru)</label>
                <textarea 
                  rows={3}
                  value={editForm.gallery?.join('\n') || ''}
                  onChange={(e) => setEditForm({ ...editForm, gallery: e.target.value.split('\n').filter(url => url.trim() !== '') })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all font-mono"
                  placeholder="https://gambar1.jpg&#10;https://gambar2.jpg"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEventToManage(selectedEventId);
                    setArchiveModalOpen(true);
                  }}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Archive size={16} /> Arsipkan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEventToManage(selectedEventId);
                    setDeleteModalOpen(true);
                  }}
                  className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Trash2 size={16} /> Hapus
                </button>
              </div>
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-teal-900/15"
              >
                <Save size={16} /> Simpan Pengaturan
              </button>
            </div>
          </form>
        </div>

        {/* Status Switches Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none space-y-4">
            <h4 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
              <Power className="text-teal-600" size={16} /> Status Kontrol Aliran
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Aktifkan atau matikan fitur utama event ini secara langsung (real-time).</p>

            <div className="divide-y divide-slate-100">
              {/* Registration Toggle */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Registrasi Online Publik</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Memperbolehkan tamu mengisi form</p>
                </div>
                <button
                  onClick={() => onUpdateEvent(selectedEventId, { isRegistrationActive: !editForm.isRegistrationActive })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    editForm.isRegistrationActive ? 'bg-teal-600' : 'bg-slate-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-900 shadow-xs dark:shadow-none ring-0 transition duration-200 ease-in-out ${
                    editForm.isRegistrationActive ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Scanner Toggle */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Scanner Pintu Masuk</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Memperbolehkan check-in scan QR</p>
                </div>
                <button
                  onClick={() => onUpdateEvent(selectedEventId, { isScannerActive: !editForm.isScannerActive })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    editForm.isScannerActive ? 'bg-teal-600' : 'bg-slate-200'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-900 shadow-xs dark:shadow-none ring-0 transition duration-200 ease-in-out ${
                    editForm.isScannerActive ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Preview Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-xl border border-slate-800 text-white flex flex-col justify-between h-48 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-400 to-transparent"></div>
            <div className="relative z-10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400">Preview Banner</span>
              <h4 className="font-display font-bold text-sm text-slate-200 truncate mt-1">{editForm.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{editForm.location}</p>
            </div>
            {editForm.bannerUrl ? (
              <div className="relative h-16 w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900 mt-4">
                <img src={editForm.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover opacity-60" />
              </div>
            ) : (
              <div className="h-16 w-full bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800 mt-4 text-xs text-slate-600 dark:text-slate-300">
                Gambar tidak diset
              </div>
            )}
          </div>
        </div>
      </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <div className="bg-teal-50 dark:bg-teal-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="text-teal-600 dark:text-teal-400" size={28} />
          </div>
          <h3 className="font-display font-bold text-xl text-slate-800 dark:text-slate-100 mb-2">Belum Ada Event Aktif</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Silakan pilih event dari menu dropdown di atas, atau klik tombol <strong>Buat Event Baru</strong> untuk menambahkan acara pertama Anda.
          </p>
          <button
            onClick={() => setShowAddEvent(true)}
            className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
          >
            <Plus size={18} /> Buat Event Sekarang
          </button>
        </div>
      )}

      {/* CREATE EVENT MULTI-STEP WIZARD */}
      {showAddEvent && (
        <CreateEventWizard
          newEventForm={newEventForm}
          setNewEventForm={setNewEventForm}
          onSubmit={handleCreateEvent}
          onClose={() => setShowAddEvent(false)}
        />
      )}

      <ConfirmModal
        isOpen={archiveModalOpen}
        title="Arsipkan Event"
        message="Yakin ingin mengarsipkan event ini? Event tidak akan muncul di halaman publik dan scanner."
        confirmText="Ya, Arsipkan"
        cancelText="Batal"
        variant="warning"
        onConfirm={() => {
          if (eventToManage) {
            onUpdateEvent(eventToManage, { isArchived: true });
          }
        }}
        onCancel={() => {
          setArchiveModalOpen(false);
          setEventToManage(null);
        }}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Hapus Event"
        message="PERINGATAN: Yakin ingin menghapus event ini secara permanen? Semua data peserta dan pengaturan terkait event ini akan ikut terhapus. Tindakan ini tidak dapat dibatalkan!"
        confirmText="Ya, Hapus Permanen"
        cancelText="Batal"
        variant="danger"
        onConfirm={() => {
          if (eventToManage) {
            onDeleteEvent(eventToManage);
          }
        }}
        onCancel={() => {
          setDeleteModalOpen(false);
          setEventToManage(null);
        }}
      />
    </div>
  );
}

// ========== MULTI-STEP CREATE EVENT WIZARD ==========
interface WizardProps {
  newEventForm: any;
  setNewEventForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
}

function CreateEventWizard({ newEventForm, setNewEventForm, onSubmit, onClose }: WizardProps) {
  const [step, setStep] = React.useState(0);

  const steps = [
    { title: 'Info Dasar', icon: FileText, desc: 'Nama, penyelenggara, deskripsi' },
    { title: 'Waktu & Lokasi', icon: Calendar, desc: 'Tanggal, waktu, tempat acara' },
    { title: 'Media & Deskripsi', icon: Image, desc: 'Banner, logo, deskripsi lengkap' },
    { title: 'Pengaturan', icon: Settings, desc: 'PIN, sosmed, opsi lanjutan' },
  ];

  const canNext = () => {
    if (step === 0) return !!newEventForm.title;
    if (step === 1) return !!newEventForm.date && !!newEventForm.time && !!newEventForm.location;
    return true;
  };

  const handleNext = () => { if (step < steps.length - 1) setStep(step + 1); };
  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  const inputCls = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-all";
  const labelCls = "block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-base">Buat Event Baru</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{steps[step].desc}</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-4 md:px-6 pt-4 pb-2">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => {
              const StepIcon = s.icon;
              const isDone = i < step;
              const isCurrent = i === step;
              return (
                <React.Fragment key={i}>
                  <button
                    type="button"
                    onClick={() => i <= step && setStep(i)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      isCurrent 
                        ? 'bg-teal-600 text-white shadow-sm' 
                        : isDone 
                          ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' 
                          : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {isDone ? <Check size={12} /> : <StepIcon size={12} />}
                    <span className="hidden sm:inline">{s.title}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </button>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded-full ${i < step ? 'bg-teal-400' : 'bg-slate-200 dark:bg-slate-800'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <form onSubmit={handleFinalSubmit}>
          <div className="px-4 md:px-6 py-4 space-y-4 max-h-[50vh] overflow-y-auto">

            {/* STEP 0: Info Dasar */}
            {step === 0 && (
              <>
                <div>
                  <label className={labelCls}>Nama Event / Acara *</label>
                  <input type="text" required placeholder="Contoh: Halal Bihalal DPW IKA UII DIY" value={newEventForm.title}
                    onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
                    className={`${inputCls} font-semibold`} />
                </div>
                <div>
                  <label className={labelCls}>Penyelenggara / Organizer</label>
                  <input type="text" placeholder="Contoh: DPW IKA UII DIY" value={newEventForm.organizer || ''}
                    onChange={(e) => setNewEventForm({ ...newEventForm, organizer: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Deskripsi Singkat</label>
                  <input type="text" placeholder="Contoh: Acara silaturahmi tahunan..." value={newEventForm.description || ''}
                    onChange={(e) => setNewEventForm({ ...newEventForm, description: e.target.value })}
                    className={inputCls} />
                </div>
              </>
            )}

            {/* STEP 1: Waktu & Lokasi */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tanggal Acara *</label>
                    <input type="date" required value={newEventForm.date}
                      onChange={(e) => setNewEventForm({ ...newEventForm, date: e.target.value })}
                      className={`${inputCls} font-semibold`} />
                  </div>
                  <div>
                    <label className={labelCls}>Waktu Mulai *</label>
                    <input type="time" required value={newEventForm.time}
                      onChange={(e) => setNewEventForm({ ...newEventForm, time: e.target.value })}
                      className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Tempat / Lokasi *</label>
                  <input type="text" required placeholder="Contoh: Auditorium Kahar Muzakkir UII"
                    value={newEventForm.location}
                    onChange={(e) => setNewEventForm({ ...newEventForm, location: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Google Maps URL</label>
                  <input type="url" placeholder="https://maps.app.goo.gl/..." value={newEventForm.mapsUrl}
                    onChange={(e) => setNewEventForm({ ...newEventForm, mapsUrl: e.target.value })}
                    className={`${inputCls} font-mono`} />
                </div>
                <div>
                  <label className={labelCls}>Batas Akhir Registrasi</label>
                  <input type="datetime-local"
                    value={newEventForm.registrationDeadline ? newEventForm.registrationDeadline.substring(0, 16) : ''}
                    onChange={(e) => setNewEventForm({ ...newEventForm, registrationDeadline: e.target.value })}
                    className={`${inputCls} font-mono`} />
                </div>
              </>
            )}

            {/* STEP 2: Media & Deskripsi */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Banner Image URL</label>
                    <input type="url" placeholder="https://..." value={newEventForm.bannerUrl}
                      onChange={(e) => setNewEventForm({ ...newEventForm, bannerUrl: e.target.value })}
                      className={`${inputCls} font-mono text-xs`} />
                  </div>
                  <div>
                    <label className={labelCls}>Logo Image URL</label>
                    <input type="url" placeholder="https://..." value={newEventForm.logoUrl}
                      onChange={(e) => setNewEventForm({ ...newEventForm, logoUrl: e.target.value })}
                      className={`${inputCls} font-mono text-xs`} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Deskripsi Lengkap Event</label>
                  <textarea rows={4} placeholder="Deskripsi detail tentang event..." value={newEventForm.fullDescription}
                    onChange={(e) => setNewEventForm({ ...newEventForm, fullDescription: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Pesan Sukses Registrasi</label>
                  <textarea rows={2} placeholder="Pesan yang tampil setelah peserta berhasil mendaftar..."
                    value={newEventForm.successMessage}
                    onChange={(e) => setNewEventForm({ ...newEventForm, successMessage: e.target.value })}
                    className={inputCls} />
                </div>
              </>
            )}

            {/* STEP 3: Pengaturan Lanjutan */}
            {step === 3 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Scanner PIN (Untuk Panitia)</label>
                    <input type="text" placeholder="Contoh: 123456" value={newEventForm.scannerPin}
                      onChange={(e) => setNewEventForm({ ...newEventForm, scannerPin: e.target.value })}
                      className={`${inputCls} font-mono`} />
                  </div>
                  <div>
                    <label className={labelCls}>Instagram URL</label>
                    <input type="url" placeholder="https://instagram.com/..." value={newEventForm.socialMedia.instagram}
                      onChange={(e) => setNewEventForm({ ...newEventForm, socialMedia: { ...newEventForm.socialMedia, instagram: e.target.value } })}
                      className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Website URL</label>
                  <input type="url" placeholder="https://..." value={newEventForm.socialMedia?.website || ''}
                    onChange={(e) => setNewEventForm({ ...newEventForm, socialMedia: { ...newEventForm.socialMedia, website: e.target.value } })}
                    className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <input type="checkbox" id="wizRegActive" checked={newEventForm.isRegistrationActive}
                      onChange={(e) => setNewEventForm({ ...newEventForm, isRegistrationActive: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded-sm cursor-pointer" />
                    <label htmlFor="wizRegActive" className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">Registrasi Aktif</label>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <input type="checkbox" id="wizScanActive" checked={newEventForm.isScannerActive}
                      onChange={(e) => setNewEventForm({ ...newEventForm, isScannerActive: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded-sm cursor-pointer" />
                    <label htmlFor="wizScanActive" className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">Scanner Aktif</label>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
            <button
              type="button"
              onClick={step === 0 ? onClose : handleBack}
              className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              {step === 0 ? 'Batal' : '← Kembali'}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-medium">{step + 1} / {steps.length}</span>
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canNext()}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-sm"
                >
                  Lanjut →
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-md shadow-teal-900/10 flex items-center gap-1.5"
                >
                  <Check size={15} /> Buat Event
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

interface XProps {
  size: number;
  className?: string;
}

function X({ size, className }: XProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
