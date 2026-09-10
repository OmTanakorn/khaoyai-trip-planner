import React from 'react';
import { 
  Compass, 
  Car, 
  Home, 
  CalendarDays, 
  Receipt, 
  CheckSquare, 
  Users, 
  Cloud, 
  Share2, 
  Settings2,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isFirebase: boolean;
  onOpenSyncModal: () => void;
  onShare: () => void;
  confirmedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isFirebase,
  onOpenSyncModal,
  onShare,
  confirmedCount,
}) => {
  const navItems = [
    { id: 'overview', label: 'ภาพรวมทริป', icon: Compass },
    { id: 'cars', label: 'รถ & ที่นั่ง', icon: Car },
    { id: 'stay', label: 'ที่พัก & ห้องนอน', icon: Home },
    { id: 'itinerary', label: 'ตารางเที่ยว', icon: CalendarDays },
    { id: 'expenses', label: 'งบ & หารเงิน', icon: Receipt },
    { id: 'packing', label: 'เช็คลิสต์ของ', icon: CheckSquare },
    { id: 'members', label: `เพื่อน (${confirmedCount})`, icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                  ทริปเขาใหญ่ 🌿
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
                  10-12 คน
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Khao Yai Roadtrip & Pool Villa Planner</p>
            </div>
          </div>

          {/* Action buttons on desktop */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sync status indicator */}
            <button
              onClick={onOpenSyncModal}
              title={isFirebase ? 'เชื่อมต่อ Firebase Cloud แล้ว (Realtime)' : 'บันทึกในเครื่อง (คลิกเพื่อเชื่อมต่อคลาวด์/แชร์)'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isFirebase 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full animate-pulse ${isFirebase ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <Cloud className="w-3.5 h-3.5 hidden sm:inline" />
              <span>{isFirebase ? 'Realtime Cloud' : 'Local Data'}</span>
            </button>

            {/* Share button */}
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">แชร์ทริป</span>
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSyncModal}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="ตั้งค่าระบบและคลาวด์"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation - Scrollable on mobile */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 pt-1 no-scrollbar border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 font-semibold'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
