/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  ChevronRight,
  Lock,
  Sparkles,
  CheckCircle2,
  QrCode,
  BarChart3,
  FileSpreadsheet,
  History,
  Mail,
  ArrowRight,
  ShieldAlert,
  ArrowUpRight,
  Database
} from 'lucide-react';
import { EventConfig } from '../types';

interface PlatformLandingProps {
  events: EventConfig[];
  onSelectEvent: (event: EventConfig) => void;
  onNavigateToAdmin: () => void;
}

export default function PlatformLanding({ events, onSelectEvent, onNavigateToAdmin }: PlatformLandingProps) {
  // Filter out archived events (should already be done by fetch, but just in case)
  const activeAndPastEvents = events.filter(e => !e.isArchived);

  // Group events into Upcoming and Past/Completed
  const upcomingEvents = activeAndPastEvents.filter(e => {
    // If explicitly active or registration active, consider upcoming
    if (e.isActive || e.isRegistrationActive) return true;

    // Fallback to date comparison
    try {
      const eventDate = new Date(e.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    } catch {
      return true;
    }
  });

  const completedEvents = activeAndPastEvents.filter(e => !upcomingEvents.includes(e));

  // Handle smooth scroll
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Mock stats for platform header/hero
  const totalRunners = events.length * 120 + 342; // Dynamic-looking mock stat

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center font-display font-black text-white shadow-lg shadow-blue-900/20">
            IKA
          </div>
          <div>
            <h1 className="font-display font-black text-sm tracking-tight text-slate-900 dark:text-slate-100">DPW IKA UII DIY</h1>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase font-bold">Event Portal</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-bold tracking-wide uppercase text-slate-600 dark:text-slate-300">
          <button
            onClick={() => scrollToSection('section-events')}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            Agenda Kegiatan
          </button>
          <button
            onClick={() => scrollToSection('section-features')}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            Fitur Platform
          </button>
          <button
            onClick={() => scrollToSection('section-cta')}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            Tentang Kami
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {/* Admin access is hidden from public view for security */}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative px-4 md:px-8 py-12 md:py-20 lg:py-24 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center overflow-hidden">
        {/* Decorative ambient blobs */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Hero Text Content */}
        <div className="lg:col-span-7 space-y-6 md:space-y-8 relative z-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-700 dark:text-blue-400 mx-auto lg:mx-0">
            <Sparkles size={14} />
            <span>Sistem Kehadiran & Event Terpadu Alumni</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Event Alumni. <br />
            <span className="bg-gradient-to-r from-blue-600 to-amber-500 dark:from-blue-400 dark:to-amber-300 bg-clip-text text-transparent">
              Sederhana & Sukses.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans">
            Sistem pendaftaran praktis, tiket digital instan, check-in QR Code secepat kilat, data terpusat, dan rekapitulasi kehadiran real-time. Memudahkan panitia DPW IKA UII DIY menyelenggarakan agenda terbaiknya.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={() => scrollToSection('section-events')}
              className="px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 cursor-pointer"
            >
              Cari Agenda Kegiatan
            </button>
            <button
              onClick={() => scrollToSection('section-features')}
              className="px-7 py-3.5 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-bold rounded-xl text-sm transition-all cursor-pointer shadow-2xs"
            >
              Pelajari Fitur Platform
            </button>
          </div>

          {/* Mini Statistics Row */}
          <div className="grid grid-cols-3 gap-4 pt-6 max-w-md mx-auto lg:mx-0 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="text-center lg:text-left">
              <p className="text-2xl font-display font-black text-slate-900 dark:text-white">{totalRunners}+</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pendaftar</p>
            </div>
            <div className="text-center lg:text-left">
              <p className="text-2xl font-display font-black text-slate-900 dark:text-white">{events.length || 3}+</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Event</p>
            </div>
            <div className="text-center lg:text-left">
              <p className="text-2xl font-display font-black text-slate-900 dark:text-white">5</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Wilayah DIY</p>
            </div>
          </div>
        </div>

        {/* HERO VISUAL MOCKUP CARD */}
        <div className="lg:col-span-5 relative z-10 flex justify-center">
          <div className="w-full max-w-[420px] bg-slate-900 dark:bg-slate-950 text-white p-5 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between font-sans">

            {/* Top row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-rose-400">Live Attendee Tracker</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">ID: DPW-UII-2026</span>
            </div>

            {/* Event Header Widget */}
            <div className="bg-slate-950/80 border border-slate-800/60 p-3.5 rounded-2xl space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Acara Sedang Berlangsung</span>
                <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-300 font-mono text-[9px] font-bold border border-blue-500/20">Active</span>
              </div>
              <h4 className="text-sm font-display font-bold text-slate-100 line-clamp-1">Rapat Kerja Wilayah (RAKERWIL) DIY 2026</h4>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <MapPin size={11} className="text-blue-500" /> Grand Ambarrukmo Hotel, Yogyakarta
              </p>
            </div>

            {/* Active Attendee Widget */}
            <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/40 space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Check-in Terakhir</p>
                  <p className="text-xs font-bold text-slate-200 mt-0.5">Prof. Dr. Ir. Hariadi, M.T.</p>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-bold font-mono border border-blue-500/20 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Sukses
                </div>
              </div>

              {/* Progress Line Graph simulation */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[9px] text-slate-400 font-semibold font-mono">
                  <span>Sesi Pagi</span>
                  <span>147 Hadir</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-amber-400 h-full rounded-full" style={{ width: '84%' }}></div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 text-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800/30">
              <div>
                <p className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">Terdaftar</p>
                <p className="text-sm font-bold text-slate-100 font-mono">175</p>
              </div>
              <div>
                <p className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">Hadir</p>
                <p className="text-sm font-bold text-blue-400 font-mono">147</p>
              </div>
              <div>
                <p className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">Rasio</p>
                <p className="text-sm font-bold text-amber-400 font-mono">84%</p>
              </div>
            </div>

            {/* Scroll anchor aesthetic indicator */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-12 h-12 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* EVENTS GRID SECTION */}
      <section id="section-events" className="px-4 md:px-8 py-16 md:py-24 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80 scroll-mt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-display font-black tracking-tight text-slate-900 dark:text-white">
              Agenda Kegiatan Alumni
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Daftar kegiatan mendatang dan riwayat agenda alumni DPW IKA UII DIY. Pilih salah satu kegiatan di bawah untuk melakukan pendaftaran, memeriksa tiket, atau melihat detail acara.
            </p>
          </div>

          <div className="flex items-center gap-2 font-display text-xs font-bold text-blue-600 dark:text-blue-400 hover:opacity-85 cursor-pointer">
            <span>Total Agenda: {activeAndPastEvents.length} Kegiatan</span>
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* Dynamic events rendering */}
        {activeAndPastEvents.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 max-w-xl mx-auto space-y-5">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Database size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-base text-slate-800 dark:text-slate-200">Belum Ada Agenda Ditambahkan</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Saat ini belum ada agenda kegiatan yang aktif. Silakan kembali lagi nanti untuk informasi kegiatan terbaru dari kami.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-16">

            {/* UPCOMING EVENTS */}
            {upcomingEvents.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <h3 className="font-display font-black text-lg tracking-tight text-slate-800 dark:text-slate-200">Agenda Aktif & Mendatang</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-xl hover:border-blue-500/40 dark:hover:border-blue-500/30 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                    >
                      {/* Image header */}
                      <div className="relative h-48 bg-slate-100 overflow-hidden shrink-0">
                        {event.bannerUrl ? (
                          <img
                            src={event.bannerUrl}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-tr from-blue-950 via-slate-900 to-indigo-950 opacity-90 flex items-center justify-center">
                            <span className="font-display font-black text-2xl text-white/30 tracking-widest">DPW IKA UII</span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-amber-500 text-white font-bold text-[10px] tracking-wide uppercase shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            Open
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-slate-900/80 text-slate-200 font-bold text-[10px] tracking-wide uppercase backdrop-blur-xs">
                            Training / Agenda
                          </span>
                        </div>
                      </div>

                      {/* Info body */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-display font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {event.title}
                          </h4>
                          <p className="text-xs text-slate-400 font-medium line-clamp-2">
                            {event.description || 'Agenda kegiatan resmi alumni IKA UII Yogyakarta.'}
                          </p>
                        </div>

                        {/* Metadata block */}
                        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-semibold border-t border-slate-100 dark:border-slate-800/60 pt-3">
                          <div className="flex items-center gap-2">
                            <CalendarDays size={14} className="text-blue-500" />
                            <span>{new Date(event.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-blue-500" />
                            <span className="truncate">{event.location.split(',')[0]}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono font-medium">
                            Organizer: {event.organizer || 'DPW IKA UII DIY'}
                          </div>
                        </div>

                        {/* Actions footer */}
                        <button
                          onClick={() => onSelectEvent(event)}
                          className="w-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/80 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>Buka Agenda & Daftar</span>
                          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COMPLETED EVENTS */}
            {completedEvents.length > 0 && (
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <h3 className="font-display font-black text-lg tracking-tight text-slate-500 dark:text-slate-400">Agenda yang Telah Selesai</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs opacity-75 hover:opacity-100 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                    >
                      {/* Image header (muted) */}
                      <div className="relative h-40 bg-slate-100 overflow-hidden shrink-0">
                        {event.bannerUrl ? (
                          <img
                            src={event.bannerUrl}
                            alt={event.title}
                            className="w-full h-full object-cover grayscale opacity-60"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center">
                            <span className="font-display font-black text-xl text-white/10 tracking-widest">IKA UII</span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] tracking-wide uppercase border border-slate-300 dark:border-slate-700">
                            Selesai
                          </span>
                        </div>
                      </div>

                      {/* Info body */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1.5">
                          <h4 className="font-display font-bold text-sm text-slate-700 dark:text-slate-200 line-clamp-1">
                            {event.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{event.location}</p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium font-mono pt-3 border-t border-slate-100 dark:border-slate-800/60">
                          <span>{new Date(event.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span>Selesai</span>
                        </div>

                        {/* Action link */}
                        <button
                          onClick={() => onSelectEvent(event)}
                          className="w-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-bold text-[11px] py-1 transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span>Cek Tiket / Riwayat Acara</span>
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </section>

      {/* PLATFORM FEATURES SECTION */}
      <section id="section-features" className="bg-white dark:bg-slate-900 py-16 md:py-24 border-t border-b border-slate-200/80 dark:border-slate-800/80 scroll-mt-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-16">

          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="px-3.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase tracking-widest border border-blue-500/20">
              Platform Features
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-slate-900 dark:text-white">
              Satu Platform, Semua Kebutuhan
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              Dari pendaftaran mandiri, validasi panitia, hingga e-attendance, semuanya diintegrasikan demi kemudahan panitia dan kenyamanan seluruh alumni.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Feature 1 */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-4 hover:border-blue-500/30 transition-all shadow-2xs">
              <div className="w-11 h-11 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
                <Users size={20} />
              </div>
              <h4 className="font-display font-bold text-base text-slate-800 dark:text-slate-100">Registrasi Cerdas & Multi-Kategori</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Formulir online pintar dengan validasi instansi kerja, nomor telepon, angkatan alumni, serta kuesioner kehadiran yang disesuaikan per event.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-4 hover:border-blue-500/30 transition-all shadow-2xs">
              <div className="w-11 h-11 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
                <QrCode size={20} />
              </div>
              <h4 className="font-display font-bold text-base text-slate-800 dark:text-slate-100">Kode QR & Tiket Digital Instan</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Peserta pendaftar otomatis menerima ID registrasi dan tiket digital dengan Kode QR dinamis yang dapat disimpan dan dicari kapan saja.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-4 hover:border-blue-500/30 transition-all shadow-2xs">
              <div className="w-11 h-11 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
                <Lock size={20} />
              </div>
              <h4 className="font-display font-bold text-base text-slate-800 dark:text-slate-100">QR Scanner Absensi Kilat</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Check-in kehadiran sangat mudah. Panitia cukup memindai tiket pendaftar melalui kamera HP di lokasi acara tanpa peralatan tambahan.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-4 hover:border-blue-500/30 transition-all shadow-2xs">
              <div className="w-11 h-11 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
                <BarChart3 size={20} />
              </div>
              <h4 className="font-display font-bold text-base text-slate-800 dark:text-slate-100">Grafik Analitik & Demografi</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Grafik visual interaktif untuk memonitor persentase kehadiran, sebaran angkatan kuliah, instansi tempat kerja, hingga kota asal alumni.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-4 hover:border-blue-500/30 transition-all shadow-2xs">
              <div className="w-11 h-11 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
                <FileSpreadsheet size={20} />
              </div>
              <h4 className="font-display font-bold text-base text-slate-800 dark:text-slate-100">Ekspor Excel Instan</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Kapan saja dibutuhkan, panitia dapat mengekspor rekapitulasi data pendaftar dan statistik kehadiran ke dokumen Microsoft Excel secara instan.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-4 hover:border-blue-500/30 transition-all shadow-2xs">
              <div className="w-11 h-11 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
                <History size={20} />
              </div>
              <h4 className="font-display font-bold text-base text-slate-800 dark:text-slate-100">Audit Log Transparan</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Seluruh aktivitas pembuatan, perubahan, pengunduhan, dan check-in terekam komprehensif pada log aktivitas audit panitia demi keamanan tinggi.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section id="section-cta" className="px-4 md:px-8 py-16 md:py-20 max-w-7xl mx-auto scroll-mt-10">
        <div className="relative bg-gradient-to-r from-blue-900 to-slate-900 text-white p-8 md:p-14 rounded-3xl overflow-hidden border border-blue-950 shadow-xl">
          <div className="absolute inset-0 bg-radial-gradient from-blue-500/20 via-transparent to-transparent opacity-80 pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl space-y-6 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-black leading-tight">
              Selenggarakan Event Alumni DIY yang Sukses Bersama Kami
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Hubungi pengurus DPW IKA UII DIY apabila Anda memiliki pertanyaan terkait kegiatan alumni atau memerlukan bantuan pendaftaran acara.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center md:justify-start">
              <a
                href="mailto:ika.diy@uii.ac.id"
                className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 font-bold text-xs px-6 py-3.5 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <Mail size={14} /> Hubungi Kami
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-white pt-16 pb-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-slate-900">

          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center font-display font-black text-slate-950 shadow-lg">
                IKA
              </div>
              <div>
                <h4 className="font-display font-black text-sm tracking-tight">DPW IKA UII DIY</h4>
                <p className="text-[10px] text-slate-400 font-mono tracking-wider">E-ATTENDANCE SYSTEM</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-sm">
              Portal Kehadiran Resmi yang dipersembahkan oleh Pengurus Wilayah Ikatan Keluarga Alumni Universitas Islam Indonesia Daerah Istimewa Yogyakarta (DPW IKA UII DIY).
            </p>
          </div>

          <div className="space-y-4">
            <h5 className="font-display font-bold text-xs tracking-wider uppercase text-slate-400">Navigasi Portal</h5>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-300">
              <li>
                <button onClick={() => scrollToSection('section-events')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  Agenda & Kegiatan
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('section-features')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  Fitur Platform
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="font-display font-bold text-xs tracking-wider uppercase text-slate-400">Kontak Pengurus</h5>
            <div className="text-xs text-slate-400 space-y-2 font-medium">
              <p>Yogyakarta, Daerah Istimewa Yogyakarta, Indonesia</p>
              <p className="text-slate-300">Email: ika.diy@uii.ac.id</p>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} DPW IKA UII DIY. Hak Cipta Dilindungi.</p>
          <div className="flex gap-4 font-semibold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>Powered by Guwigo</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
