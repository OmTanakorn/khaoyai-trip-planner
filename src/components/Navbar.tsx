import React, { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Member } from '../types/trip';
import { Modal } from './ui';
import { btnQuiet, initialOf } from './ui-kit';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isFirebase: boolean;
  onOpenSyncModal: () => void;
  onShare: () => void;
  confirmedCount: number;
  members: Member[];
  me: Member | null;
  onChooseMe: (id: string | null) => void;
  syncError: string | null;
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
  members,
  me,
  onChooseMe,
  syncError,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const navCategories = [
    {
      id: 'main',
      label: 'หน้าหลัก',
      items: [
        { id: 'overview', label: 'ภาพรวม' },
        { id: 'dayof', label: 'วันเดินทาง' },
      ],
    },
    {
      id: 'plan',
      label: 'เตรียมทริป',
      items: [
        { id: 'stay', label: 'ที่พัก' },
        { id: 'cars', label: 'รถ และที่นั่ง' },
        { id: 'members', label: `เพื่อน (${confirmedCount})` },
      ],
    },
    {
      id: 'itinerary',
      label: 'แผนเที่ยว & กิน',
      items: [
        { id: 'itinerary', label: 'ตารางเที่ยว' },
        { id: 'food', label: 'เมนูอาหาร' },
      ],
    },
    {
      id: 'manage',
      label: 'จัดการ',
      items: [
        { id: 'expenses', label: 'งบและหารเงิน' },
        { id: 'packing', label: 'ของเตรียม' },
        { id: 'board', label: 'บอร์ดรวม' },
      ],
    },
  ];

  // Detect which category is currently active
  const activeCategory =
    navCategories.find((cat) => cat.items.some((item) => item.id === activeTab)) ||
    navCategories[0];

  return (
    <header className="sticky top-0 z-40 bg-mist/90 backdrop-blur-md" data-print="hide">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <button
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2.5 text-left"
          >
            <RidgeMark className="w-8 h-5.5 text-ink shrink-0" />
            <span className="text-lead font-semibold text-ink leading-none tracking-tight">
              เขาใหญ่
            </span>
            <span className="hidden sm:block text-fine text-stone leading-none pl-1">
              31 ต.ค. – 1 พ.ย. 2569
            </span>
          </button>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onOpenSyncModal}
              title={
                isFirebase
                  ? 'ข้อมูลซิงก์ขึ้นคลาวด์ เพื่อนเห็นการแก้ไขทันที'
                  : 'ข้อมูลเก็บในเครื่องนี้เท่านั้น กดเพื่อเปิดการซิงก์'
              }
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-ctl text-fine text-stone hover:text-ink hover:bg-surface transition-colors"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isFirebase ? 'bg-moss' : 'bg-brass'}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">
                {isFirebase ? 'ซิงก์อยู่' : 'เก็บในเครื่อง'}
              </span>
            </button>

            <button
              onClick={onShare}
              className="hidden sm:inline px-2.5 py-1.5 rounded-ctl text-fine text-stone hover:text-ink hover:bg-surface transition-colors"
            >
              แชร์ทริป
            </button>

            <button
              onClick={() => setIsPickerOpen(true)}
              className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-surface hover:bg-mist-deep/70 text-fine text-ink font-medium transition-colors"
            >
              <span
                className="w-5 h-5 rounded-full grid place-items-center text-[10px] text-paper"
                style={{ backgroundColor: me?.avatarColor ?? '#6f6a60' }}
                aria-hidden="true"
              >
                {me ? initialOf(me.nickname) : '?'}
              </span>
              {me ? me.nickname : 'คุณคือใคร'}
            </button>

            <button
              onClick={onOpenSyncModal}
              className="text-stone hover:text-ink hover:bg-surface rounded-ctl transition-colors p-2"
              title="ตั้งค่าการซิงก์ข้อมูล"
              aria-label="ตั้งค่าการซิงก์ข้อมูล"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop: four groups, told apart by space rather than rules */}
        <nav className="hidden sm:flex items-center gap-7 overflow-x-auto no-scrollbar">
          {navCategories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-5 shrink-0">
              {cat.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative py-3 text-body whitespace-nowrap transition-colors ${
                      isActive ? 'text-ink font-medium' : 'text-stone hover:text-ink'
                    }`}
                  >
                    {item.label}
                    <span
                      className={`absolute left-0 right-0 bottom-0 h-0.5 rounded-full transition-colors ${
                        isActive ? 'bg-ink' : 'bg-transparent'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Mobile: pick a group, then a page within it */}
        <div className="sm:hidden pb-2.5 space-y-2">
          <div className="flex items-center gap-1 p-0.5 bg-surface rounded-ctl">
            {navCategories.map((cat) => {
              const isCatActive = activeCategory.id === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.items[0].id)}
                  className={`flex-1 text-fine py-1.5 rounded-[6px] whitespace-nowrap transition-colors ${
                    isCatActive ? 'bg-paper text-ink font-medium' : 'text-stone'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar px-1">
            {activeCategory.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-1.5 text-body whitespace-nowrap transition-colors ${
                    isActive ? 'text-ink font-medium' : 'text-stone'
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute left-0 right-0 bottom-0 h-0.5 rounded-full ${
                      isActive ? 'bg-ink' : 'bg-transparent'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="h-px bg-mist-deep/70" aria-hidden="true" />

      {syncError && (
        <p role="status" className="bg-brass/15 text-ink text-fine px-5 sm:px-8 py-2.5">
          {syncError}
        </p>
      )}

      {isPickerOpen && (
        <Modal
          title="คุณคือใคร"
          note="เลือกชื่อตัวเองไว้ครั้งเดียว เครื่องนี้จะจำให้ แล้วเวลาโหวตหรือจองที่นั่งจะรู้ว่าเป็นคุณ"
          onClose={() => setIsPickerOpen(false)}
        >
          {members.length === 0 ? (
            <div>
              <p className="text-body text-stone">
                ยังไม่มีใครอยู่ในรายชื่อ ไปที่แถบเพื่อนแล้วเพิ่มชื่อตัวเองก่อน
              </p>
              <button
                onClick={() => {
                  setIsPickerOpen(false);
                  setActiveTab('members');
                }}
                className={`mt-6 ${btnQuiet}`}
              >
                ไปเพิ่มชื่อ
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-mist-deep">
              {members.map((member) => (
                <li key={member.id}>
                  <button
                    onClick={() => {
                      onChooseMe(member.id);
                      setIsPickerOpen(false);
                    }}
                    aria-pressed={me?.id === member.id}
                    className="w-full flex items-center justify-between gap-4 py-3 text-left group"
                  >
                    <span className="inline-flex items-center gap-2.5 text-body text-ink group-hover:text-brass transition-colors">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: member.avatarColor }}
                        aria-hidden="true"
                      />
                      {member.nickname}
                      <span className="text-fine text-stone">{member.name}</span>
                    </span>
                    {me?.id === member.id && (
                      <span className="text-fine text-brass">นี่คือคุณ</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {me && (
            <button
              onClick={() => {
                onChooseMe(null);
                setIsPickerOpen(false);
              }}
              className={`mt-6 ${btnQuiet}`}
            >
              ไม่ใช่คนนี้
            </button>
          )}
        </Modal>
      )}
    </header>
  );
};
