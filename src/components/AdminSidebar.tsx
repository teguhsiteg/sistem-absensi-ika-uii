/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  QrCode, 
  BarChart3, 
  Settings, 
  History, 
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  adminEmail: string;
  onLogout: () => void;
  eventName: string;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export default function AdminSidebar({ currentTab, setCurrentTab, adminEmail, onLogout, eventName, theme, setTheme }: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'participants', label: 'Kelola Peserta', icon: Users },
    { id: 'scanner', label: 'QR Scanner', icon: QrCode },
    { id: 'statistics', label: 'Statistik & Grafik', icon: BarChart3 },
    { id: 'logs', label: 'Riwayat Aktivitas', icon: History },
    { id: 'settings', label: 'Pengaturan Event', icon: Settings },
  ];

  return (
    <aside 
      className={`bg-[#0b1329] text-white flex flex-col h-screen border-r border-slate-800 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-display font-bold text-white shadow-lg shadow-blue-950/40">
              UII
            </div>
            <div>
              <h1 className="font-display font-bold text-sm tracking-tight text-slate-100">DPW IKA UII DIY</h1>
              <p className="text-[10px] text-slate-400 font-mono">E-Attendance v1.0</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 mx-auto bg-blue-600 rounded-lg flex items-center justify-center font-display font-bold text-white">
            U
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 transition-colors hidden md:block"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Active Event Indicator */}
      {!collapsed && (
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/40">
          <p className="text-[10px] uppercase tracking-wider text-yellow-400 font-semibold mb-0.5">Event Aktif</p>
          <p className="text-xs text-slate-300 font-medium truncate" title={eventName}>
            {eventName}
          </p>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950/30 font-semibold' 
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        {!collapsed && (
          <div className="mb-4">
            <p className="text-xs text-slate-400">Masuk sebagai</p>
            <p className="text-sm font-medium text-slate-200 truncate">{adminEmail}</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={onLogout}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-all ${collapsed ? 'justify-center' : 'flex-1'}`}
          >
            <LogOut size={18} />
            {!collapsed && <span>Keluar</span>}
          </button>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </div>
    </aside>
  );
}
