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
  ChevronLeft,
  ChevronRight,
  Menu,
  X
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
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'participants', label: 'Kelola Peserta', icon: Users },
    { id: 'scanner', label: 'QR Scanner', icon: QrCode },
    { id: 'statistics', label: 'Statistik & Grafik', icon: BarChart3 },
    { id: 'logs', label: 'Riwayat Aktivitas', icon: History },
    { id: 'settings', label: 'Pengaturan Event', icon: Settings },
  ];

  // Bottom bar items for mobile (subset, scanner is the FAB)
  const bottomBarItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'participants', label: 'Peserta', icon: Users },
    // scanner is the center FAB
    { id: 'statistics', label: 'Statistik', icon: BarChart3 },
    { id: 'settings', label: 'Lainnya', icon: Settings },
  ];

  const handleMobileTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* ===== DESKTOP SIDEBAR (hidden on mobile) ===== */}
      <aside 
        className={`hidden md:flex bg-[#0b1329] text-white flex-col h-screen border-r border-slate-800 transition-all duration-300 ${
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
            className="p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 transition-colors"
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

      {/* ===== MOBILE BOTTOM NAVIGATION BAR (visible only on mobile) ===== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Bottom bar background with glass effect */}
        <div className="bg-[#0b1329]/95 backdrop-blur-xl border-t border-slate-700/60 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-end justify-around relative">
            {/* Left two items */}
            {bottomBarItems.slice(0, 2).map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMobileTabClick(item.id)}
                  className={`flex flex-col items-center justify-center pt-2 pb-1.5 px-3 min-w-[60px] transition-colors ${
                    isActive ? 'text-blue-400' : 'text-slate-400'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}

            {/* CENTER QR SCANNER FAB */}
            <div className="flex flex-col items-center -mt-5 relative z-10">
              <button
                onClick={() => handleMobileTabClick('scanner')}
                className={`w-[58px] h-[58px] rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-95 ${
                  currentTab === 'scanner'
                    ? 'bg-blue-500 ring-4 ring-blue-500/25'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500'
                }`}
              >
                <QrCode size={26} className="text-white" strokeWidth={2.2} />
              </button>
              <span className={`text-[10px] mt-1 font-semibold ${
                currentTab === 'scanner' ? 'text-blue-400' : 'text-slate-400'
              }`}>
                Scan QR
              </span>
            </div>

            {/* Right two items */}
            {bottomBarItems.slice(2).map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id || 
                (item.id === 'settings' && (currentTab === 'settings' || currentTab === 'logs'));
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'settings') {
                      setMobileOpen(!mobileOpen);
                    } else {
                      handleMobileTabClick(item.id);
                    }
                  }}
                  className={`flex flex-col items-center justify-center pt-2 pb-1.5 px-3 min-w-[60px] transition-colors ${
                    isActive ? 'text-blue-400' : 'text-slate-400'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== MOBILE "MORE" SLIDE-UP MENU ===== */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60]" onClick={() => setMobileOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Menu Panel */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-[#0b1329] rounded-t-3xl border-t border-slate-700/60 pb-[env(safe-area-inset-bottom)] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-600 rounded-full" />
            </div>

            {/* User info header */}
            <div className="px-5 py-3 border-b border-slate-800/60">
              <p className="text-[10px] uppercase tracking-wider text-yellow-400 font-semibold">Event Aktif</p>
              <p className="text-sm text-slate-200 font-medium truncate">{eventName}</p>
              <p className="text-xs text-slate-400 mt-1">{adminEmail}</p>
            </div>

            {/* Extra menu items */}
            <div className="p-3 space-y-1">
              {menuItems.filter(item => !bottomBarItems.find(b => b.id === item.id) && item.id !== 'scanner').map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMobileTabClick(item.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Settings (since it's the "Lainnya" trigger, also add it here) */}
              <button
                onClick={() => handleMobileTabClick('settings')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  currentTab === 'settings' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <Settings size={20} />
                <span>Pengaturan Event</span>
              </button>
            </div>

            {/* Footer actions */}
            <div className="p-3 border-t border-slate-800/60 flex items-center gap-2">
              <button
                onClick={onLogout}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
              >
                <LogOut size={18} />
                <span>Keluar</span>
              </button>
              <ThemeToggle theme={theme} setTheme={setTheme} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
