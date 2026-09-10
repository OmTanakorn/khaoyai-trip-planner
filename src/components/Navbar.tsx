import React from 'react';
import { Settings2 } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isFirebase: boolean;
  onOpenSyncModal: () => void;
  onShare: () => void;
  confirmedCount: number;
}

/** Khao Yai ridgeline — three peaks and a low mist band. */
const RidgeMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 44 30" fill="none" aria-hidden="true" className={className}>
    <path
      d="M1 25.5 12.5 8l7.5 10.5L27.5 3l15.5 22.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
    <path d="M5 29h34" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" opacity="0.35" />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isFirebase,
  onOpenSyncModal,
  onShare,
  confirmedCount,
}) => {
  const navItems = [
    { id: 'overview', label: 'ภาพรวม' },
    { id: 'cars', label: 'รถ และที่นั่ง' },
    { id: 'stay', label: 'ที่พัก' },
    { id: 'itinerary', label: 'ตารางเที่ยว' },
    { id: 'expenses', label: 'งบและหารเงิน' },
    { id: 'packing', label: 'ของที่ต้องเตรียม' },
    { id: 'members', label: `เพื่อน ${confirmedCount}` },
  ];

  return (
    <header className="sticky top-0 z-40 bg-mist/95 backdrop-blur-sm border-b border-mist-deep">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <button
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-3 text-left"
          >
            <RidgeMark className="w-9 h-6 sm:w-11 sm:h-8 text-ink shrink-0" />
            <span className="font-display text-lead sm:text-title font-normal text-ink leading-none">
              เขาใหญ่
            </span>
            <span className="hidden sm:block text-fine text-stone border-l border-mist-deep pl-3 leading-snug">
              31 ต.ค. — 1 พ.ย. 2569
              <br />
              สองวันหนึ่งคืน
            </span>
          </button>

          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={onOpenSyncModal}
              title={
                isFirebase
                  ? 'ข้อมูลซิงก์ขึ้นคลาวด์ เพื่อนเห็นการแก้ไขทันที'
                  : 'ข้อมูลเก็บในเครื่องนี้เท่านั้น กดเพื่อเปิดการซิงก์'
              }
              className="flex items-center gap-2 text-fine text-stone hover:text-ink transition-colors"
            >
              <span
                className={`w-1.5 h-1.5 ${isFirebase ? 'bg-moss' : 'bg-brass'}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">
                {isFirebase ? 'ซิงก์อยู่' : 'เก็บในเครื่อง'}
              </span>
            </button>

            <button
              onClick={onShare}
              className="text-fine text-ink border-b border-brass pb-0.5 hover:text-brass transition-colors"
            >
              แชร์ทริป
            </button>

            <button
              onClick={onOpenSyncModal}
              className="text-stone hover:text-ink transition-colors"
              title="ตั้งค่าการซิงก์ข้อมูล"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <nav className="flex gap-6 sm:gap-8 overflow-x-auto no-scrollbar -mb-px">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`shrink-0 pb-3 pt-1 text-fine sm:text-body whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-brass text-ink'
                    : 'border-transparent text-stone hover:text-ink'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
