/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BarChart3, 
  Map, 
  GraduationCap, 
  Building2, 
  PieChart,
  Users,
  CheckSquare,
  HelpCircle,
  FileText
} from 'lucide-react';
import { EventStats } from '../types';

interface StatsProps {
  stats: EventStats | null;
}

export default function AdminStats({ stats }: StatsProps) {
  if (!stats) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
        <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <PieChart className="text-slate-400 dark:text-slate-500" size={32} />
        </div>
        <h3 className="font-display font-bold text-xl text-slate-800 dark:text-slate-100 mb-2">Belum Ada Data Statistik</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Silakan aktifkan event terlebih dahulu atau tunggu hingga peserta mulai mendaftar untuk melihat analisis statistik di sini.
        </p>
      </div>
    );
  }

  // Find max value in a breakdown to scale progress bars
  const getMaxVal = (arr: { name: string; value: number }[]) => {
    return Math.max(...arr.map(item => item.value), 1);
  };

  const getPercentageOfTotal = (val: number, total: number) => {
    return total > 0 ? Math.round((val / total) * 100) : 0;
  };

  const totalRespondents = stats.totalRegistered;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-slate-800 dark:text-slate-100 text-base">Analisis & Statistik Tamu</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Visualisasi data dan sebaran peserta yang terdaftar pada sistem</p>
        </div>
        <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
          <BarChart3 size={18} />
        </div>
      </div>

      {/* Grid Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Breakdown: Instansi / Organisasi */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <Building2 className="text-teal-600" size={18} />
            <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">Top 5 Instansi / Universitas</h3>
          </div>

          <div className="space-y-3.5">
            {stats.instansiBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada sebaran data instansi</p>
            ) : (
              stats.instansiBreakdown.map((item, i) => {
                const max = getMaxVal(stats.instansiBreakdown);
                const percent = (item.value / max) * 100;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{item.name}</span>
                      <span className="text-slate-500 dark:text-slate-400">{item.value} orang ({getPercentageOfTotal(item.value, totalRespondents)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-teal-600 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Breakdown: Kota Asal */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <Map className="text-indigo-600" size={18} />
            <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">Top 5 Sebaran Kota Asal</h3>
          </div>

          <div className="space-y-3.5">
            {stats.kotaBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada sebaran data kota</p>
            ) : (
              stats.kotaBreakdown.map((item, i) => {
                const max = getMaxVal(stats.kotaBreakdown);
                const percent = (item.value / max) * 100;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{item.name}</span>
                      <span className="text-slate-500 dark:text-slate-400">{item.value} orang ({getPercentageOfTotal(item.value, totalRespondents)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Breakdown: Angkatan */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <GraduationCap className="text-amber-600" size={18} />
            <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">Sebaran Berdasarkan Angkatan</h3>
          </div>

          <div className="space-y-3.5">
            {stats.angkatanBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada sebaran data angkatan</p>
            ) : (
              stats.angkatanBreakdown.map((item, i) => {
                const max = getMaxVal(stats.angkatanBreakdown);
                const percent = (item.value / max) * 100;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-200 font-mono">Angkatan {item.name}</span>
                      <span className="text-slate-500 dark:text-slate-400">{item.value} orang ({getPercentageOfTotal(item.value, totalRespondents)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Breakdown: Status Kehadiran & Check-In */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-none space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <PieChart className="text-emerald-600" size={18} />
            <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">Statistik Status Kehadiran</h3>
          </div>

          <div className="space-y-3.5">
            {stats.statusBreakdown.map((item, i) => {
              const max = getMaxVal(stats.statusBreakdown);
              const percent = (item.value / max) * 100;
              const barColor = 
                item.name === 'Sudah Check-In' ? 'bg-emerald-600' :
                item.name === 'Belum Check-In' ? 'bg-amber-500' : 'bg-slate-400';
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-200">{item.name}</span>
                    <span className="text-slate-500 dark:text-slate-400">{item.value} orang ({getPercentageOfTotal(item.value, totalRespondents)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className={`${barColor} h-full rounded-full`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
