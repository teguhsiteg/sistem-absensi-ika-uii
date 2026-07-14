/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  HelpCircle, 
  XCircle, 
  Clock, 
  Percent, 
  Calendar, 
  ArrowUpRight,
  TrendingUp,
  MapPin,
  QrCode
} from 'lucide-react';
import { EventStats, Participant, EventConfig } from '../types';

interface DashboardProps {
  stats: EventStats | null;
  activeEvent: EventConfig | null;
  participants: Participant[];
  onTabChange: (tab: string) => void;
}

export default function AdminDashboard({ stats, activeEvent, participants, onTabChange }: DashboardProps) {
  if (!activeEvent) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-display font-black text-xl text-slate-800 dark:text-slate-100 mb-2">Belum Ada Event Aktif</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
          Saat ini tidak ada event yang sedang aktif. Silakan buka menu <strong>Pengaturan Event</strong> untuk menambahkan agenda baru atau mengaktifkan event yang sudah ada.
        </p>
        <button 
          onClick={() => onTabChange('settings')}
          className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md cursor-pointer"
        >
          Buka Pengaturan Event
        </button>
      </div>
    );
  }

  // Calculate some simple display metrics
  const totalReg = stats?.totalRegistered ?? 0;
  const totalHadir = stats?.totalHadir ?? 0;
  const totalBelum = stats?.totalBelumHadir ?? 0;
  const totalBerhalangan = stats?.totalBerhalangan ?? 0;
  const rate = stats?.attendanceRate ?? 0;
  const todayScan = stats?.checkedInTodayCount ?? 0;

  // Get recent 5 registrations
  const recentRegistrations = [...participants]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Get recent 5 scans
  const recentScans = [...participants]
    .filter(p => p.checkedIn && p.checkedInAt)
    .sort((a, b) => {
      const aTime = a.checkedInAt ? new Date(a.checkedInAt).getTime() : 0;
      const bTime = b.checkedInAt ? new Date(b.checkedInAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 5);

  // Hourly check-in calculation
  const hourlyData = stats?.hourlyCheckIn || [];
  const maxHourlyCount = Math.max(...hourlyData.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Event Header Card */}
      <div className="relative bg-gradient-to-r from-[#0b1329] to-[#020617] rounded-2xl text-white overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500 via-slate-900 to-slate-900"></div>
        <div className="p-6 md:p-8 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span> Live Event Dashboard
            </span>
            <h2 className="text-xl md:text-2xl font-display font-bold text-slate-100">{activeEvent.title}</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar size={16} className="text-yellow-400" />
                {new Date(activeEvent.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={16} className="text-blue-400" />
                Mulai {activeEvent.time} WIB
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={16} className="text-red-400" />
                {activeEvent.location.split(',')[0]}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => onTabChange('scanner')}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-950/50 flex items-center gap-2 cursor-pointer"
            >
              <QrCode size={16} /> Mulai Scan QR
            </button>
            <button 
              onClick={() => onTabChange('participants')}
              className="bg-[#020617] hover:bg-slate-900 text-slate-100 border border-slate-800 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              Kelola Peserta
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Registered */}
        <div className="bg-[#0b1329] p-4 rounded-xl border border-slate-800 shadow-xs dark:shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Registrasi</span>
            <div className="p-2 rounded-lg bg-blue-950/40 text-blue-400 border border-blue-500/15">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-display font-bold text-slate-100">{totalReg}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">peserta terdaftar</p>
          </div>
        </div>

        {/* Total Present */}
        <div className="bg-[#0b1329] p-4 rounded-xl border border-slate-800 shadow-xs dark:shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Hadir (Checked-In)</span>
            <div className="p-2 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-500/15">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-display font-bold text-emerald-400">{totalHadir}</p>
            <p className="text-[10px] text-emerald-400/80 mt-0.5">check-in berhasil</p>
          </div>
        </div>

        {/* Belum Check-In */}
        <div className="bg-[#0b1329] p-4 rounded-xl border border-slate-800 shadow-xs dark:shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Belum Check-In</span>
            <div className="p-2 rounded-lg bg-amber-950/40 text-amber-400 border border-amber-500/15">
              <HelpCircle size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-display font-bold text-amber-400">{totalBelum}</p>
            <p className="text-[10px] text-amber-400/80 mt-0.5">ditunggu kehadirannya</p>
          </div>
        </div>

        {/* Berhalangan */}
        <div className="bg-[#0b1329] p-4 rounded-xl border border-slate-800 shadow-xs dark:shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Berhalangan</span>
            <div className="p-2 rounded-lg bg-rose-950/40 text-rose-400 border border-rose-500/15">
              <XCircle size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-display font-bold text-rose-400">{totalBerhalangan}</p>
            <p className="text-[10px] text-rose-400/80 mt-0.5">mengisi konfirmasi</p>
          </div>
        </div>

        {/* Check-In Hari Ini */}
        <div className="bg-[#0b1329] p-4 rounded-xl border border-slate-800 shadow-xs dark:shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Scan Hari Ini</span>
            <div className="p-2 rounded-lg bg-indigo-950/40 text-indigo-400 border border-indigo-500/15">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-display font-bold text-indigo-400">{todayScan}</p>
            <p className="text-[10px] text-indigo-400/80 mt-0.5">tamu hari ini</p>
          </div>
        </div>

        {/* Persentase Kehadiran */}
        <div className="bg-[#0b1329] p-4 rounded-xl border border-slate-800 shadow-xs dark:shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Kehadiran %</span>
            <div className="p-2 rounded-lg bg-yellow-950/40 text-yellow-400 border border-yellow-500/15">
              <Percent size={18} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-display font-bold text-yellow-400">{rate}%</p>
            <p className="text-[10px] text-yellow-400/80 mt-0.5">dari target {totalReg - totalBerhalangan}</p>
          </div>
        </div>
      </div>

      {/* Progress & Hourly Scan Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Scan Bar Chart */}
        <div className="bg-[#0b1329] p-5 rounded-xl border border-slate-800 shadow-xs dark:shadow-none lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-slate-100 text-sm">Grafik Check-in per Jam</h3>
              <p className="text-xs text-slate-400">Jumlah kedatangan tamu terekam sistem</p>
            </div>
            <TrendingUp size={16} className="text-slate-500 dark:text-slate-400" />
          </div>

          <div className="h-56 flex items-end gap-3 pt-6 px-2 border-b border-slate-800">
            {hourlyData.map((d, index) => {
              const pct = (d.count / maxHourlyCount) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="relative w-full flex justify-center">
                    {/* Tooltip on hover */}
                    <span className="absolute -top-7 scale-0 group-hover:scale-100 transition-all duration-200 bg-slate-950 border border-slate-800 text-white text-[10px] py-1 px-1.5 rounded shadow font-semibold">
                      {d.count} orang
                    </span>
                    <div 
                      className="w-8 sm:w-10 bg-blue-600 group-hover:bg-blue-500 rounded-t-md transition-all duration-300 ease-out"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-2 rotate-0 truncate max-w-full">
                    {d.hour}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Progress Gauge */}
        <div className="bg-[#0b1329] p-5 rounded-xl border border-slate-800 shadow-xs dark:shadow-none flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-slate-100 text-sm mb-1">Rasio Check-in Kehadiran</h3>
            <p className="text-xs text-slate-400">Dari seluruh target peserta terkonfirmasi hadir</p>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            {/* SVG Radial Gauge */}
            <div className="relative w-36 h-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  className="stroke-slate-800" 
                  strokeWidth="10" 
                  fill="transparent" 
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  className="stroke-blue-500 transition-all duration-1000 ease-out" 
                  strokeWidth="10" 
                  fill="transparent" 
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * rate) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-display font-bold text-slate-100">{rate}%</span>
                <span className="text-[10px] text-slate-400 font-medium font-mono">{totalHadir} / {totalReg - totalBerhalangan}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-800 pt-3">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-400">Hadir</span>
              <span className="text-emerald-400 font-semibold">{totalHadir} orang</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-400">Belum Datang</span>
              <span className="text-amber-400 font-semibold">{totalBelum} orang</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-400">Izin Berhalangan</span>
              <span className="text-rose-400 font-semibold">{totalBerhalangan} orang</span>
            </div>
          </div>
        </div>
      </div>

      {/* Double Column: Recent Registration & Recent Check-In */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
            <div>
              <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">Registrasi Terbaru</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Peserta yang baru mengisi formulir online</p>
            </div>
            <button 
              onClick={() => onTabChange('participants')} 
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-0.5"
            >
              Lihat Semua <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
            {recentRegistrations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Belum ada peserta terdaftar</div>
            ) : (
              recentRegistrations.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between text-sm hover:bg-slate-50 dark:bg-slate-950/40 transition-colors">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px]">{p.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{p.id} • {p.instansi || 'Umum'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(p.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                      p.status === 'Hadir' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-slate-100 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Scans */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
            <div>
              <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">Check-In Terkini</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Aktivitas scanning QR di pintu masuk</p>
            </div>
            <button 
              onClick={() => onTabChange('scanner')} 
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-0.5"
            >
              Buka Scanner <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
            {recentScans.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Belum ada check-in yang tercatat hari ini</div>
            ) : (
              recentScans.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between text-sm hover:bg-slate-50 dark:bg-slate-950/40 transition-colors">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px]">{p.name}</p>
                    <p className="text-xs text-emerald-600 font-mono flex items-center gap-1 font-medium">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Checked In
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">{p.id}</p>
                    <p className="text-[10px] font-mono text-slate-400">
                      {p.checkedInAt ? new Date(p.checkedInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
