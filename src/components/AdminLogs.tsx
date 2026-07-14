/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  History, 
  Search, 
  Info,
  ShieldCheck,
  UserCheck,
  Trash2,
  Lock,
  PlusCircle,
  Settings
} from 'lucide-react';
import { AuditLog } from '../types';

interface LogsProps {
  logs: AuditLog[];
}

export default function AdminLogs({ logs }: LogsProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  if (!logs) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
        <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <History className="text-slate-400 dark:text-slate-500" size={32} />
        </div>
        <h3 className="font-display font-bold text-xl text-slate-800 dark:text-slate-100 mb-2">Belum Ada Aktivitas</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Silakan aktifkan event terlebih dahulu atau tunggu hingga ada aktivitas untuk melihat log sistem.
        </p>
      </div>
    );
  }

  const filteredLogs = React.useMemo(() => {
    return logs.filter(l => {
      const matchSearch = 
        l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.adminUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.details.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [logs, searchQuery]);

  const getActionBadgeColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('login')) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (act.includes('delete') || act.includes('remove')) return 'bg-rose-50 text-rose-700 border border-rose-200';
    if (act.includes('create')) return 'bg-blue-50 text-blue-700 border border-blue-200';
    if (act.includes('check-in')) return 'bg-teal-50 text-teal-700 border border-teal-200';
    if (act.includes('settings') || act.includes('update')) return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    return 'bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800';
  };

  const getActionIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('login')) return <Lock size={14} className="text-emerald-600" />;
    if (act.includes('delete')) return <Trash2 size={14} className="text-rose-600" />;
    if (act.includes('create')) return <PlusCircle size={14} className="text-blue-600" />;
    if (act.includes('check-in')) return <UserCheck size={14} className="text-teal-600" />;
    if (act.includes('settings')) return <Settings size={14} className="text-indigo-600" />;
    return <ShieldCheck size={14} className="text-slate-500 dark:text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-slate-800 dark:text-slate-100 text-base">Riwayat Aktivitas & Audit Log</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Log transparansi keamanan aksi admin dan aktivitas scanning sistem</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Cari aktivitas, admin, rincian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-all text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Logs Timelines */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-4 font-display">Waktu & Tanggal</th>
                <th className="px-5 py-4 font-display">Aktor Admin</th>
                <th className="px-5 py-4 font-display">Jenis Aktivitas</th>
                <th className="px-5 py-4 font-display">Deskripsi Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-slate-400 font-sans">
                    Tidak ada log riwayat aktivitas yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:bg-slate-950/40 transition-colors">
                    {/* Timestamp */}
                    <td className="px-5 py-4 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                      {new Date(log.timestamp).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })} &nbsp;
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                      </span>
                    </td>
                    {/* Admin User */}
                    <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-slate-700 dark:text-slate-200">
                      {log.adminUser}
                    </td>
                    {/* Action */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full ${getActionBadgeColor(log.action)}`}>
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                    </td>
                    {/* Details */}
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-sans max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
