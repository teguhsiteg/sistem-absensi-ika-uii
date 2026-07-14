/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Search, 
  Filter, 
  Check, 
  X, 
  Eye, 
  Edit, 
  Trash2, 
  QrCode, 
  Printer, 
  UserPlus, 
  Download,
  AlertTriangle,
  Info,
  Calendar,
  XCircle,
  FileSpreadsheet,
  Users
} from 'lucide-react';
import QRCode from 'qrcode';
import { Participant, EventConfig } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface ParticipantsProps {
  participants: Participant[];
  activeEvent?: EventConfig | null;
  onUpdateParticipant: (id: string, data: Partial<Participant> & { updatedByAdmin?: boolean }) => Promise<void>;
  onDeleteParticipant: (id: string) => Promise<void>;
  onManualCheckIn: (id: string) => Promise<void>;
  onCancelCheckIn: (id: string) => Promise<void>;
  onAddParticipant: (data: Omit<Participant, 'id' | 'createdAt' | 'checkedIn' | 'checkedInAt' | 'ipAddress' | 'userAgent' | 'eventId'>) => Promise<void>;
}

export default function AdminParticipants({ 
  participants, 
  activeEvent,
  onUpdateParticipant, 
  onDeleteParticipant, 
  onManualCheckIn, 
  onCancelCheckIn,
  onAddParticipant
}: ParticipantsProps) {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all'); // all, hadir, belum, berhalangan
  const [instansiFilter, setInstansiFilter] = React.useState('all');
  const [kotaFilter, setKotaFilter] = React.useState('all');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = React.useState(false);

  const handleSelectAll = () => {
    if (selectedIds.length === participants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(participants.map(p => p.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Selected participant for Detail / Edit / Print Badge
  const [selectedParticipant, setSelectedParticipant] = React.useState<Participant | null>(null);
  const [activeModal, setActiveModal] = React.useState<'detail' | 'edit' | 'add' | 'print' | 'delete' | null>(null);

  // Form states for Edit / Add
  const [editForm, setEditForm] = React.useState<Partial<Participant>>({});
  const [addForm, setAddForm] = React.useState({
    name: '',
    phone: '',
    email: '',
    status: 'Hadir' as 'Hadir' | 'Berhalangan',
    reason: '',
    instansi: '',
    jabatan: '',
    kota: '',
    catatan: '',
    consent: true,
    subscribeNewsletter: false
  });

  // Dynamic QR Url for detail or printing
  const [qrCodeUrl, setQrCodeUrl] = React.useState('');

  // Handle QR generation when selected participant changes
  React.useEffect(() => {
    if (selectedParticipant) {
      QRCode.toDataURL(selectedParticipant.id, {
        width: 250,
        margin: 1.5,
        color: {
          dark: '#0f172a', // Slate 900
          light: '#ffffff'
        }
      })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('QR Gen error:', err));
    } else {
      setQrCodeUrl('');
    }
  }, [selectedParticipant]);

  // Unique list of instansi and kota for filters
  const uniqueInstansi = React.useMemo(() => {
    const set = new Set<string>();
    participants.forEach(p => { if (p.instansi) set.add(p.instansi.trim()); });
    return Array.from(set);
  }, [participants]);

  const uniqueKota = React.useMemo(() => {
    const set = new Set<string>();
    participants.forEach(p => { if (p.kota) set.add(p.kota.trim()); });
    return Array.from(set);
  }, [participants]);

  // Filtered List
  const filteredParticipants = React.useMemo(() => {
    return participants.filter(p => {
      // Search term
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery) ||
        (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status
      let matchesStatus = true;
      if (statusFilter === 'hadir') {
        matchesStatus = p.status === 'Hadir' && p.checkedIn;
      } else if (statusFilter === 'belum') {
        matchesStatus = p.status === 'Hadir' && !p.checkedIn;
      } else if (statusFilter === 'berhalangan') {
        matchesStatus = p.status === 'Berhalangan';
      }

      // Instansi
      const matchesInstansi = instansiFilter === 'all' || p.instansi === instansiFilter;

      // Kota
      const matchesKota = kotaFilter === 'all' || p.kota === kotaFilter;

      return matchesSearch && matchesStatus && matchesInstansi && matchesKota;
    });
  }, [participants, searchQuery, statusFilter, instansiFilter, kotaFilter]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setInstansiFilter('all');
    setKotaFilter('all');
  };

  // Open modals helper
  const openModal = (type: 'detail' | 'edit' | 'print' | 'delete', p: Participant) => {
    setSelectedParticipant(p);
    setEditForm({ ...p });
    setActiveModal(type);
  };

  const openAddModal = () => {
    setAddForm({
      name: '',
      phone: '',
      email: '',
      status: 'Hadir',
      reason: '',
      instansi: '',
      jabatan: 'Alumni',
      kota: 'Yogyakarta',
      catatan: '',
      consent: true,
      subscribeNewsletter: false
    });
    setActiveModal('add');
  };

  // Submit edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant) return;
    try {
      await onUpdateParticipant(selectedParticipant.id, { 
        ...editForm, 
        updatedByAdmin: true 
      });
      setActiveModal(null);
      setSelectedParticipant(null);
      (window as any).showToast?.('Data peserta berhasil diperbarui!', 'success');
    } catch (err: any) {
      (window as any).showToast?.(err.message || 'Gagal memperbarui data', 'error');
    }
  };

  // Submit Add
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.phone) {
      (window as any).showToast?.('Nama Lengkap dan No HP wajib diisi', 'error');
      return;
    }
    try {
      await onAddParticipant(addForm);
      setActiveModal(null);
      (window as any).showToast?.('Peserta berhasil ditambahkan!', 'success');
    } catch (err: any) {
      (window as any).showToast?.(err.message || 'Gagal menambahkan peserta', 'error');
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!selectedParticipant) return;
    try {
      await onDeleteParticipant(selectedParticipant.id);
      setActiveModal(null);
      setSelectedParticipant(null);
      (window as any).showToast?.('Peserta berhasil dihapus!', 'success');
    } catch (err: any) {
      (window as any).showToast?.(err.message || 'Gagal menghapus data', 'error');
    }
  };

  // Trigger browser print
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !selectedParticipant) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Badge - ${selectedParticipant.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Space+Grotesk:wght@600;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f1f5f9;
            }
            .badge-card {
              width: 320px;
              height: 480px;
              background-color: white;
              border: 2px solid #0f172a;
              border-radius: 20px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
              display: flex;
              flex-col: column;
              flex-direction: column;
              overflow: hidden;
              position: relative;
            }
            .badge-header {
              background-color: #005F40; /* Brand Green */
              color: white;
              padding: 24px 16px;
              text-align: center;
              border-bottom: 4px solid #D4AF37; /* Brand Gold */
            }
            .badge-header h1 {
              margin: 0;
              font-family: 'Space Grotesk', sans-serif;
              font-size: 14px;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .badge-header p {
              margin: 4px 0 0;
              font-size: 10px;
              color: #f0fdf4;
              opacity: 0.9;
            }
            .badge-body {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 24px;
              text-align: center;
            }
            .qr-container {
              margin-bottom: 20px;
            }
            .qr-image {
              width: 160px;
              height: 160px;
              border: 1px solid #e2e8f0;
              padding: 8px;
              border-radius: 12px;
            }
            .participant-id {
              font-family: monospace;
              font-size: 14px;
              font-weight: bold;
              color: #475569;
              margin-bottom: 12px;
              letter-spacing: 1px;
            }
            .participant-name {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 6px 0;
              font-family: 'Space Grotesk', sans-serif;
              line-height: 1.2;
            }
            .participant-role {
              font-size: 12px;
              color: #005F40;
              font-weight: 600;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .participant-inst {
              font-size: 11px;
              color: #64748b;
              margin: 4px 0 0 0;
            }
            .badge-footer {
              background-color: #0f172a;
              color: #94a3b8;
              text-align: center;
              font-size: 9px;
              padding: 10px;
              font-weight: 500;
              letter-spacing: 0.5px;
            }
            @media print {
              body {
                background: none;
              }
              .badge-card {
                box-shadow: none;
                border: 2px solid black;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="badge-card">
            <div class="badge-header">
              <h1>DPW IKA UII D.I.Y.</h1>
              <p>Pelantikan Pengurus & Rakerwil</p>
            </div>
            <div class="badge-body">
              <div class="qr-container">
                <img src="${qrCodeUrl}" class="qr-image" />
              </div>
              <div class="participant-id">${selectedParticipant.id}</div>
              <h2 class="participant-name">${selectedParticipant.name}</h2>
              <p class="participant-role">${selectedParticipant.jabatan || 'Alumni'}</p>
              <p class="participant-inst">${selectedParticipant.instansi || 'Ikatan Keluarga Alumni UII'}</p>
            </div>
            <div class="badge-footer">
              15 JULI 2026 • GRAND ROHAN JOGJA
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!activeEvent) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
        <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <Users className="text-slate-400 dark:text-slate-500" size={32} />
        </div>
        <h3 className="font-display font-bold text-xl text-slate-800 dark:text-slate-100 mb-2">Belum Ada Daftar Peserta</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Silakan aktifkan event terlebih dahulu di menu Pengaturan untuk dapat mengelola dan melihat data peserta.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-slate-800 dark:text-slate-100 text-base">Kelola Data Peserta</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total {filteredParticipants.length} dari {participants.length} peserta ditemukan</p>
          </div>
          <button 
            onClick={openAddModal}
            className="bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <UserPlus size={16} /> Tambah Manual
          </button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Cari nama, HP, email, atau QR ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500 appearance-none cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="hadir">Hadir (Checked-In)</option>
              <option value="belum">Belum Check-In</option>
              <option value="berhalangan">Berhalangan</option>
            </select>
            <Filter className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={14} />
          </div>

          {/* Instansi Filter */}
          <div className="relative">
            <select
              value={instansiFilter}
              onChange={(e) => setInstansiFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500 appearance-none cursor-pointer truncate pr-8"
            >
              <option value="all">Semua Instansi</option>
              {uniqueInstansi.map((inst, i) => (
                <option key={i} value={inst}>{inst}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={14} />
          </div>

          {/* Kota Filter & Reset */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={kotaFilter}
                onChange={(e) => setKotaFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500 appearance-none cursor-pointer pr-8"
              >
                <option value="all">Semua Kota</option>
                {uniqueKota.map((k, i) => (
                  <option key={i} value={k}>{k}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={14} />
            </div>

            <button 
              onClick={handleResetFilters}
              className="px-3 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center justify-center"
              title="Reset Filter"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none overflow-hidden">
        {selectedIds.length > 0 && (
          <div className="px-5 py-3 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-teal-800">{selectedIds.length} peserta terpilih</span>
            <button 
              onClick={() => setIsBatchDeleteModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Trash2 size={14} /> Hapus Terpilih
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-4 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filteredParticipants.length && filteredParticipants.length > 0} 
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-4 font-display">No. Registrasi</th>
                <th className="px-5 py-4 font-display">Nama Lengkap</th>
                <th className="px-5 py-4 font-display">No. HP / Email</th>
                <th className="px-5 py-4 font-display">Status Kehadiran</th>
                <th className="px-5 py-4 font-display">Instansi / Jabatan</th>
                <th className="px-5 py-4 font-display text-center">Status Check-in</th>
                <th className="px-5 py-4 font-display text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    Tidak ada data peserta yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:bg-slate-950/50 transition-colors">
                    <td className="px-5 py-4 w-10">
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => handleSelectOne(p.id)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                    </td>
                    {/* ID */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-100 px-2 py-1 rounded-md text-xs border border-slate-200 dark:border-slate-800/40">
                        {p.id}
                      </span>
                    </td>
                    {/* Nama */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</div>
                      {p.kota && <span className="text-[10px] text-slate-400 font-medium">Kota: {p.kota}</span>}
                    </td>
                    {/* Kontak */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                      <div>{p.phone}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.email || '-'}</div>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {p.status === 'Hadir' ? (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Hadir
                        </span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 w-max">
                            Berhalangan
                          </span>
                          {p.reason && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={p.reason}>
                              Ket: {p.reason}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    {/* Instansi */}
                    <td className="px-5 py-4">
                      <div className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-[150px]">{p.instansi || '-'}</div>
                      <div className="text-[10px] text-slate-400">{p.jabatan || 'Alumni'}</div>
                    </td>
                    {/* Checkin Status */}
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      {p.status === 'Berhalangan' ? (
                        <span className="text-xs text-slate-400 italic">N/A</span>
                      ) : p.checkedIn ? (
                        <div className="flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Sudah Hadir
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono mt-1">
                            {p.checkedInAt ? new Date(p.checkedInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span> Belum Check-in
                        </span>
                      )}
                    </td>
                    {/* Action */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.status === 'Hadir' && (
                          p.checkedIn ? (
                            <button
                              onClick={() => onCancelCheckIn(p.id)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Batalkan Kehadiran"
                            >
                              <XCircle size={15} />
                            </button>
                          ) : (
                            <button
                              onClick={() => onManualCheckIn(p.id)}
                              className="px-2 py-1 text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                              title="Manual Check-In"
                            >
                              Check-In
                            </button>
                          )
                        )}

                        <button
                          onClick={() => openModal('detail', p)}
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Detail & Logs"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => openModal('print', p)}
                          className="px-2 py-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                          title="Cetak Name Tag Peserta"
                        >
                          <Printer size={12} />
                          <span>Print Badge</span>
                        </button>
                        <button
                          onClick={() => openModal('edit', p)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedParticipant(p);
                            setActiveModal('delete');
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: DETAIL PARTICIPANT */}
      {activeModal === 'detail' && selectedParticipant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-base">Detail Data Registrasi</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">ID Peserta: {selectedParticipant.id}</p>
              </div>
              <button 
                onClick={() => { setActiveModal(null); setSelectedParticipant(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* QR Display */}
                <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-xl w-[220px]">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Participant QR" className="w-40 h-40 bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-lg" />
                  ) : (
                    <div className="w-40 h-40 bg-slate-200 animate-pulse rounded-lg"></div>
                  )}
                  <span className="text-xs font-mono font-bold mt-3 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                    {selectedParticipant.id}
                  </span>
                </div>

                {/* Primary Data */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-400 font-medium">Nama Lengkap</span>
                    <span className="col-span-2 text-slate-800 dark:text-slate-100 font-bold text-base">{selectedParticipant.name}</span>
                  </div>
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-400 font-medium">Nomor HP</span>
                    <span className="col-span-2 text-slate-800 dark:text-slate-100 font-semibold">{selectedParticipant.phone}</span>
                  </div>
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-400 font-medium">Email</span>
                    <span className="col-span-2 text-slate-800 dark:text-slate-100 font-mono">{selectedParticipant.email || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-400 font-medium">Kota Asal</span>
                    <span className="col-span-2 text-slate-800 dark:text-slate-100 font-semibold">{selectedParticipant.kota || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-400 font-medium">Instansi</span>
                    <span className="col-span-2 text-slate-800 dark:text-slate-100 font-semibold">{selectedParticipant.instansi || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-400 font-medium">Jabatan</span>
                    <span className="col-span-2 text-slate-800 dark:text-slate-100 font-semibold">{selectedParticipant.jabatan || 'Alumni'}</span>
                  </div>
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-400 font-medium">Status</span>
                    <span className="col-span-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        selectedParticipant.status === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                      }`}>
                        {selectedParticipant.status}
                      </span>
                    </span>
                  </div>
                  {selectedParticipant.status === 'Berhalangan' && (
                    <div className="grid grid-cols-3 text-sm">
                      <span className="text-slate-400 font-medium">Alasan Izin</span>
                      <span className="col-span-2 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 p-2 rounded-lg italic">
                        "{selectedParticipant.reason || '-'}"
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-400 font-medium">Newsletter</span>
                    <span className="col-span-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        selectedParticipant.subscribeNewsletter ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-slate-100 text-slate-500 dark:text-slate-400'
                      }`}>
                        {selectedParticipant.subscribeNewsletter ? 'Berlangganan' : 'Tidak Berlangganan'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Client Network Logs */}
              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-5 space-y-4">
                <h4 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                  <Info size={16} className="text-teal-600" /> Riwayat Aktivitas & Log Sistem
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800/60 rounded-xl">
                  <div className="space-y-2">
                    <div>
                      <p className="text-slate-400 font-semibold font-sans">Waktu Registrasi</p>
                      <p className="text-slate-700 dark:text-slate-200 font-medium mt-0.5">
                        {new Date(selectedParticipant.createdAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'medium' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold font-sans">Status Kehadiran</p>
                      <p className="text-slate-700 dark:text-slate-200 font-medium mt-0.5">
                        {selectedParticipant.checkedIn 
                          ? `Hadir (Scan pada ${new Date(selectedParticipant.checkedInAt!).toLocaleTimeString('id-ID')})` 
                          : 'Belum Hadir'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-slate-400 font-semibold font-sans">Alamat IP Pendaftar</p>
                      <p className="text-slate-700 dark:text-slate-200 font-medium mt-0.5">{selectedParticipant.ipAddress}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold font-sans">Device / Browser</p>
                      <p className="text-slate-700 dark:text-slate-200 font-medium mt-0.5 truncate" title={selectedParticipant.userAgent}>
                        {selectedParticipant.userAgent}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 flex justify-end gap-2.5">
              <button 
                onClick={() => { setActiveModal(null); setSelectedParticipant(null); }}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                Tutup
              </button>
              <button 
                onClick={() => { setActiveModal('print'); }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-900/10"
              >
                <Printer size={15} /> Cetak Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PARTICIPANT */}
      {activeModal === 'edit' && selectedParticipant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleEditSubmit} className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-base">Edit Data Peserta</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Formulir pembetulan data peserta {selectedParticipant.id}</p>
              </div>
              <button 
                type="button"
                onClick={() => { setActiveModal(null); setSelectedParticipant(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Nama Lengkap *</label>
                <input 
                  type="text"
                  required
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Nomor HP / WhatsApp *</label>
                  <input 
                    type="text"
                    required
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Email (Opsional)</label>
                  <input 
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Instansi</label>
                  <input 
                    type="text"
                    value={editForm.instansi || ''}
                    onChange={(e) => setEditForm({ ...editForm, instansi: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Jabatan / Delegasi</label>
                  <input 
                    type="text"
                    value={editForm.jabatan || ''}
                    onChange={(e) => setEditForm({ ...editForm, jabatan: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Kota Asal</label>
                  <input 
                    type="text"
                    value={editForm.kota || ''}
                    onChange={(e) => setEditForm({ ...editForm, kota: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Status Kehadiran</label>
                  <select
                    value={editForm.status || 'Hadir'}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500 appearance-none cursor-pointer"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Berhalangan">Berhalangan</option>
                  </select>
                </div>
              </div>

              {editForm.status === 'Berhalangan' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Alasan Berhalangan *</label>
                  <textarea 
                    required
                    rows={2}
                    value={editForm.reason || ''}
                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all"
                    placeholder="Contoh: Ada rapat penting di luar kota"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Catatan Tambahan</label>
                <textarea 
                  rows={2}
                  value={editForm.catatan || ''}
                  onChange={(e) => setEditForm({ ...editForm, catatan: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input 
                  type="checkbox"
                  id="adminEditSubscribe"
                  checked={!!editForm.subscribeNewsletter}
                  onChange={(e) => setEditForm({ ...editForm, subscribeNewsletter: e.target.checked })}
                  className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="adminEditSubscribe" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                  Langganan Newsletter
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 flex justify-end gap-2 z-10 relative">
              <button 
                type="button"
                onClick={() => { setActiveModal(null); setSelectedParticipant(null); }}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-md shadow-teal-900/10"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD PARTICIPANT */}
      {activeModal === 'add' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={handleAddSubmit} className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-base">Registrasi Manual (Admin)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mendaftarkan peserta baru langsung ke database</p>
              </div>
              <button 
                type="button"
                onClick={() => { setActiveModal(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Nama Lengkap *</label>
                <input 
                  type="text"
                  required
                  placeholder="Nama Lengkap dengan Gelar"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Nomor HP *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: 08123456789"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Email (Opsional)</label>
                  <input 
                    type="email"
                    placeholder="email@example.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Instansi</label>
                  <input 
                    type="text"
                    placeholder="Contoh: DPW IKA UII DIY"
                    value={addForm.instansi}
                    onChange={(e) => setAddForm({ ...addForm, instansi: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Jabatan / Delegasi</label>
                  <input 
                    type="text"
                    placeholder="Contoh: Pengurus / Alumni"
                    value={addForm.jabatan}
                    onChange={(e) => setAddForm({ ...addForm, jabatan: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Kota Asal</label>
                  <input 
                    type="text"
                    placeholder="Sleman / Yogyakarta"
                    value={addForm.kota}
                    onChange={(e) => setAddForm({ ...addForm, kota: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Status Kehadiran</label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500 appearance-none cursor-pointer"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Berhalangan">Berhalangan</option>
                  </select>
                </div>
              </div>

              {addForm.status === 'Berhalangan' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Alasan Berhalangan *</label>
                  <textarea 
                    required
                    rows={2}
                    value={addForm.reason}
                    onChange={(e) => setAddForm({ ...addForm, reason: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all"
                    placeholder="Contoh: Dinas ke luar daerah"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Catatan Khusus</label>
                <textarea 
                  rows={2}
                  value={addForm.catatan}
                  onChange={(e) => setAddForm({ ...addForm, catatan: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all"
                  placeholder="Kebutuhan khusus atau catatan akomodasi..."
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input 
                  type="checkbox"
                  id="adminAddSubscribe"
                  checked={!!addForm.subscribeNewsletter}
                  onChange={(e) => setAddForm({ ...addForm, subscribeNewsletter: e.target.checked })}
                  className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="adminAddSubscribe" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                  Langganan Newsletter
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => { setActiveModal(null); }}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-md shadow-teal-900/10"
              >
                Daftarkan Peserta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: BATCH DELETE CONFIRMATION */}
      <ConfirmModal
        isOpen={isBatchDeleteModalOpen}
        title="Hapus Data Peserta"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} peserta yang terpilih? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        onConfirm={async () => {
          for (const id of selectedIds) await onDeleteParticipant(id);
          setSelectedIds([]);
          (window as any).showToast?.('Peserta berhasil dihapus!', 'success');
        }}
        onCancel={() => setIsBatchDeleteModalOpen(false)}
      />

      {/* MODAL: DELETE CONFIRMATION */}
      {activeModal === 'delete' && selectedParticipant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-rose-50 text-rose-800 flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-xl text-rose-700">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm">Hapus Data Peserta</h3>
                <p className="text-xs text-rose-600">ID Peserta: {selectedParticipant.id}</p>
              </div>
            </div>

            <div className="p-5 space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-300">Apakah Anda yakin ingin menghapus data peserta berikut?</p>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 text-sm">
                <p className="font-bold text-slate-800 dark:text-slate-100">{selectedParticipant.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{selectedParticipant.phone} • {selectedParticipant.instansi || 'Ikatan Alumni'}</p>
              </div>
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1.5">
                <Info size={14} /> Tindakan ini tidak dapat dibatalkan dan semua riwayat log peserta akan dihapus.
              </p>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 flex justify-end gap-2">
              <button 
                onClick={() => { setActiveModal(null); setSelectedParticipant(null); }}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-md shadow-rose-900/10"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRINT BADGE PREVIEW */}
      {activeModal === 'print' && selectedParticipant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">Pratinjau Badge Name Tag</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Desain kartu tanda pengenal peserta</p>
              </div>
              <button 
                onClick={() => { setActiveModal(null); setSelectedParticipant(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Print Preview Design */}
            <div className="p-6 bg-slate-100 flex justify-center">
              <div className="w-[240px] h-[360px] bg-white dark:bg-slate-900 border-2 border-slate-900 rounded-2xl shadow-md overflow-hidden flex flex-col justify-between">
                <div className="bg-emerald-800 text-white p-3 text-center border-b-2 border-amber-400">
                  <h4 className="font-display font-bold text-[10px] tracking-wider uppercase m-0">DPW IKA UII D.I.Y.</h4>
                  <p className="text-[7px] text-emerald-100 opacity-95 m-0.5 font-medium">PELANTIKAN PENGURUS & RAKERWIL</p>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Badge QR" className="w-28 h-28 p-1 border border-slate-200 dark:border-slate-800 rounded-lg mb-2" />
                  ) : (
                    <div className="w-28 h-28 bg-slate-100 animate-pulse rounded-lg mb-2"></div>
                  )}
                  <span className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 mb-2">{selectedParticipant.id}</span>
                  <h2 className="text-sm font-bold font-display text-slate-800 dark:text-slate-100 leading-tight truncate w-full px-1">{selectedParticipant.name}</h2>
                  <p className="text-[9px] text-teal-700 font-semibold uppercase mt-0.5">{selectedParticipant.jabatan || 'Alumni'}</p>
                  <p className="text-[8px] text-slate-500 dark:text-slate-400 font-medium truncate w-full px-1">{selectedParticipant.instansi || 'Ikatan Alumni UII'}</p>
                </div>

                <div className="bg-slate-900 text-slate-400 text-center text-[7px] p-2 tracking-wider font-semibold">
                  GRAND ROHAN JOGJA • 15 JULI 2026
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 flex justify-end gap-2">
              <button 
                onClick={() => { setActiveModal(null); setSelectedParticipant(null); }}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handlePrint}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-900/10"
              >
                <Printer size={15} /> Cetak Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
