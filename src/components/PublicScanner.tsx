import React, { useState } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import AdminScanner from './AdminScanner';
import { EventConfig, Participant } from '../types';

interface PublicScannerProps {
  event: EventConfig;
  onBack: () => void;
  onScanCheckIn: (qrCode: string) => Promise<{
    success: boolean;
    status: 'success' | 'duplicate' | 'invalid' | 'inactive';
    message: string;
    participant?: Participant;
  }>;
}

export default function PublicScanner({ event, onBack, onScanCheckIn }: PublicScannerProps) {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event.scannerPin) {
      setError('Event ini belum mengonfigurasi PIN Scanner. Hubungi Administrator.');
      return;
    }
    
    if (pin === event.scannerPin) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('PIN tidak valid.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft size={20} /> Kembali
        </button>

        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-none border border-slate-200 dark:border-slate-800/80 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="text-teal-600 dark:text-teal-400" size={32} />
            </div>
            <h2 className="text-2xl font-black font-display text-slate-800 dark:text-white">Akses Scanner Panitia</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              Masukkan PIN Scanner untuk event: <strong className="text-slate-700 dark:text-slate-300">{event.title}</strong>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">PIN Scanner</label>
              <input
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:border-teal-500 transition-all font-mono"
                placeholder="••••••"
              />
              {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-teal-900/20"
            >
              Masuk Scanner
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Once authenticated, show the normal AdminScanner
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-4">
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white p-2"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-bold text-slate-800 dark:text-white leading-tight">Scanner Panitia</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{event.title}</p>
        </div>
      </div>
      <div className="p-4 max-w-4xl mx-auto">
        <AdminScanner activeEvent={event} onScanCheckIn={onScanCheckIn} />
      </div>
    </div>
  );
}
