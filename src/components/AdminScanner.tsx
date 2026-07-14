/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Camera, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Volume2, 
  Play, 
  Square,
  Sparkles,
  Info
} from 'lucide-react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { Participant, EventConfig } from '../types';

interface ScannerProps {
  activeEvent?: EventConfig | null;
  onScanCheckIn: (qrCode: string) => Promise<{
    success: boolean;
    status: 'success' | 'duplicate' | 'invalid' | 'inactive';
    message: string;
    participant?: Participant;
  }>;
}

export default function AdminScanner({ onScanCheckIn, activeEvent }: ScannerProps) {
  const [scanStatus, setScanStatus] = React.useState<'idle' | 'success' | 'duplicate' | 'invalid' | 'error'>('idle');
  const [scannedMessage, setScannedMessage] = React.useState('');
  const [scannedParticipant, setScannedParticipant] = React.useState<Participant | null>(null);
  const [scannerHistory, setScannerHistory] = React.useState<Array<{
    time: string;
    id: string;
    name: string;
    status: 'success' | 'duplicate' | 'invalid';
    message: string;
  }>>([]);

  const [cameras, setCameras] = React.useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = React.useState<string>('');
  const [isScanning, setIsScanning] = React.useState(false);
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  // Html5Qrcode instance ref
  const html5QrcodeRef = React.useRef<Html5Qrcode | null>(null);
  const scannerId = 'qr-reader-viewport';

  // Keep a stable AudioContext ref to bypass autoplay restrictions on user gesture
  const audioCtxRef = React.useRef<AudioContext | null>(null);

  const initAudioCtx = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch (e) {
      console.error('Failed to initialize AudioContext:', e);
    }
  };

  // Synth sound beeps using Web Audio API
  const playBeep = (type: 'success' | 'error' | 'duplicate') => {
    if (!soundEnabled) return;
    try {
      initAudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        // Crisp high success beep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'duplicate') {
        // Warning dual warning tone
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        // Red error buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.error('Audio Context beep failed:', e);
    }
  };

  // Get available cameras
  React.useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Auto-select back camera if possible, otherwise first camera
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch(err => console.error('Gagal mendapatkan list kamera:', err));

    return () => {
      // Cleanup scanner on unmount
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current.stop().catch(err => console.error('Stop scanner on unmount error:', err));
      }
    };
  }, []);

  const startScanning = async () => {
    // Pre-warm the AudioContext
    initAudioCtx();

    if (!selectedCameraId) {
      (window as any).showToast?.('Kamera tidak ditemukan. Pastikan izin kamera diaktifkan.', 'error');
      return;
    }

    try {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        await html5QrcodeRef.current.stop();
      }

      const html5Qrcode = new Html5Qrcode(scannerId);
      html5QrcodeRef.current = html5Qrcode;

      setScanStatus('idle');
      setScannedParticipant(null);

      await html5Qrcode.start(
        selectedCameraId,
        {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          }
        },
        async (decodedText) => {
          // Temporarily pause scanner to process
          await html5Qrcode.pause();
          await handleQrCodeDecoded(decodedText);
          
          // Resume after 2.5 seconds to allow operator to read display feedback
          setTimeout(() => {
            if (html5Qrcode.isScanning) {
              html5Qrcode.resume();
            }
          }, 2500);
        },
        () => {
          // Silent scan errors (occurring on every non-code frame)
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Kamera gagal dimulai:', err);
      (window as any).showToast?.('Kamera gagal diakses. Pastikan izin browser diberikan.', 'error');
    }
  };

  const stopScanning = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        setIsScanning(false);
        setScanStatus('idle');
      } catch (err) {
        console.error('Stop scanning error:', err);
      }
    }
  };

  const handleQrCodeDecoded = async (qrCode: string) => {
    try {
      const res = await onScanCheckIn(qrCode);
      
      if (res.success && res.status === 'success') {
        playBeep('success');
        setScanStatus('success');
        setScannedMessage(res.message);
        if (res.participant) {
          setScannedParticipant(res.participant);
          // Add to history
          addToHistory(qrCode, res.participant.name, 'success', res.message);
        }
      } else if (res.status === 'duplicate') {
        playBeep('duplicate');
        setScanStatus('duplicate');
        setScannedMessage(res.message);
        if (res.participant) {
          setScannedParticipant(res.participant);
          addToHistory(qrCode, res.participant.name, 'duplicate', res.message);
        }
      } else {
        playBeep('error');
        setScanStatus('invalid');
        setScannedMessage(res.message);
        addToHistory(qrCode, 'Format Tidak Dikenal', 'invalid', res.message);
      }
    } catch (err: any) {
      playBeep('error');
      setScanStatus('error');
      setScannedMessage(err.message || 'Gagal terhubung ke database');
      addToHistory(qrCode, 'Database Error', 'invalid', err.message || 'Error');
    }
  };

  const addToHistory = (id: string, name: string, status: 'success' | 'duplicate' | 'invalid', message: string) => {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setScannerHistory(prev => [
      { time: timeStr, id, name, status, message },
      ...prev.slice(0, 19) // Keep last 20 scans
    ]);
  };

  if (!activeEvent) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
        <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <Camera className="text-slate-400 dark:text-slate-500" size={32} />
        </div>
        <h3 className="font-display font-bold text-xl text-slate-800 dark:text-slate-100 mb-2">Scanner Tidak Aktif</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Silakan aktifkan event terlebih dahulu di menu Pengaturan untuk dapat memindai tiket peserta.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Scanner Control Box */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none space-y-6 flex flex-col justify-between">
        <div className="space-y-2">
          <h2 className="font-display font-bold text-slate-800 dark:text-slate-100 text-base">QR Code Reader (Live Camera)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Pilih kamera, mulailah pemindaian, lalu arahkan QR Code pada tiket peserta ke layar kamera.</p>
        </div>

        {/* Camera Selector & Audio Switch */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/50">
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <Camera size={16} className="text-slate-500 dark:text-slate-400" />
            <select
              value={selectedCameraId}
              onChange={(e) => {
                setSelectedCameraId(e.target.value);
                if (isScanning) {
                  // Restart with new camera
                  setTimeout(() => startScanning(), 100);
                }
              }}
              className="bg-transparent border-0 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer flex-1 py-1"
            >
              {cameras.length === 0 ? (
                <option value="">Kamera tidak terdeteksi...</option>
              ) : (
                cameras.map((c, i) => (
                  <option key={c.id} value={c.id}>{c.label || `Kamera ${i + 1}`}</option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button 
              onClick={() => {
                const nextState = !soundEnabled;
                setSoundEnabled(nextState);
                if (nextState) {
                  initAudioCtx();
                  setTimeout(() => playBeep('success'), 50);
                }
              }}
              className="flex items-center gap-1.5 hover:text-teal-600 cursor-pointer"
            >
              <Volume2 size={15} className={soundEnabled ? 'text-teal-600' : 'text-slate-400 line-through'} />
              <span>Suara Beep: {soundEnabled ? 'Aktif' : 'Senyap'}</span>
            </button>

            {isScanning ? (
              <button 
                onClick={stopScanning}
                className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Square size={12} fill="currentColor" /> Hentikan Kamera
              </button>
            ) : (
              <button 
                onClick={startScanning}
                className="bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Play size={12} fill="currentColor" /> Jalankan Kamera
              </button>
            )}
          </div>
        </div>

        {/* Camera Stage viewport */}
        <div className="relative aspect-video w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
          
          {/* Viewport element for html5-qrcode library */}
          <div id={scannerId} className="w-full h-full object-cover"></div>

          {/* Scanner Targeting Frame Reticle */}
          {isScanning && scanStatus === 'idle' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/30">
              <div className="w-48 h-48 md:w-56 md:h-56 border-[3px] border-white/80 rounded-2xl relative shadow-xl">
                {/* Laser animation line */}
                <div className="absolute left-0 right-0 h-[2px] bg-teal-500 shadow-lg shadow-teal-500/80 animate-bounce top-1/2"></div>
                
                {/* Corner Accents */}
                <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-teal-500"></span>
                <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-teal-500"></span>
                <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-teal-500"></span>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-teal-500"></span>
              </div>
            </div>
          )}

          {/* Idle Placeholder */}
          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10 bg-slate-950/90 text-slate-400">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-full text-slate-500 dark:text-slate-400 animate-pulse-slow">
                <Camera size={36} />
              </div>
              <div>
                <p className="font-semibold text-slate-200">Kamera Scanner Sedang Non-aktif</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">Klik tombol 'Jalankan Kamera' di atas untuk membuka feed video lensa.</p>
              </div>
            </div>
          )}

          {/* DYNAMIC SCREEN FEEDBACK STATES */}
          {scanStatus !== 'idle' && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in duration-200 ${
              scanStatus === 'success' ? 'bg-emerald-900/95 text-white' :
              scanStatus === 'duplicate' ? 'bg-amber-900/95 text-white' : 'bg-rose-950/95 text-white'
            }`}>
              {/* Icon */}
              <div className="mb-4">
                {scanStatus === 'success' && <CheckCircle size={64} className="text-emerald-400 animate-bounce" />}
                {scanStatus === 'duplicate' && <AlertTriangle size={64} className="text-amber-400 animate-bounce" />}
                {(scanStatus === 'invalid' || scanStatus === 'error') && <XCircle size={64} className="text-rose-400 animate-bounce" />}
              </div>

              {/* Title & Message */}
              <div className="space-y-1.5 max-w-sm">
                <h3 className="font-display font-black text-xl tracking-tight">
                  {scanStatus === 'success' && 'CHECK-IN BERHASIL'}
                  {scanStatus === 'duplicate' && 'DUPLIKAT / SUDAH DIGUNAKAN'}
                  {scanStatus === 'invalid' && 'KODE TIDAK VALID'}
                  {scanStatus === 'error' && 'ERROR SISTEM'}
                </h3>
                <p className="text-sm opacity-90 leading-relaxed font-semibold">
                  {scannedMessage}
                </p>
              </div>

              {/* Participant details display card */}
              {scannedParticipant && (
                <div className="mt-6 bg-black/20 border border-white/10 p-4 rounded-xl max-w-xs w-full text-left space-y-1 text-xs">
                  <div className="text-white/60">Nama Lengkap</div>
                  <div className="font-bold text-sm truncate">{scannedParticipant.name}</div>
                  
                  <div className="text-white/60 mt-2">Instansi / Jabatan</div>
                  <div className="font-semibold">{scannedParticipant.instansi || 'Ikatan Alumni'} ({scannedParticipant.jabatan || 'Alumni'})</div>

                  {scannedParticipant.checkedInAt && (
                    <>
                      <div className="text-white/60 mt-2">Waktu Pertama Scan</div>
                      <div className="font-mono font-semibold">
                        {new Date(scannedParticipant.checkedInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Quick resume info */}
              <p className="text-[10px] text-white/40 mt-6 animate-pulse font-mono">Kembali memindai secara otomatis dalam beberapa detik...</p>
            </div>
          )}
        </div>
      </div>

      {/* Scanner Real-time Feed History Logs */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none flex flex-col justify-between h-full min-h-[400px]">
        <div className="space-y-3 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">Riwayat Scan Kamera</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Aktivitas decoding scan di browser lokal ini (Maks. 20 log terakhir)</p>
          </div>

          <div className="flex-1 mt-4 border border-slate-100 dark:border-slate-800/60 rounded-xl bg-slate-50 dark:bg-slate-950/50 p-2 overflow-y-auto max-h-[350px] space-y-2">
            {scannerHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 text-xs space-y-1">
                <Info size={16} />
                <p>Belum ada log scan terekam.</p>
                <p className="text-[10px] text-slate-400/80">Riwayat akan langsung muncul secara real-time saat Anda melakukan scanning QR.</p>
              </div>
            ) : (
              scannerHistory.map((h, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs transition-colors ${
                    h.status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                    h.status === 'duplicate' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                  }`}
                >
                  <div className="font-mono font-semibold pt-0.5">{h.time}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{h.name}</div>
                    <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{h.id}</div>
                    <div className="text-[10px] mt-1 font-medium opacity-80">{h.message}</div>
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
