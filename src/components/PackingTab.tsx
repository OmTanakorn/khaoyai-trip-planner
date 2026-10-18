import React, { useState, useMemo } from 'react';
import {
  Check,
  Plus,
  Trash2,
  Pencil,
  Backpack,
  Sparkles,
  Users,
  Flame,
  ShieldCheck,
  UtensilsCrossed,
  Search,
  CheckCircle2,
  AlertCircle,
  Tag,
  User,
  Coffee,
  Waves,
} from 'lucide-react';
import { TripData, PackingItem, Member, TripListEditor } from '../types/trip';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Modal, Field, Empty, Meter } from './ui';
import { input, btnSolid, btnQuiet, btnBrass, btnLink, initialOf } from './ui-kit';

interface PackingTabProps extends TripListEditor {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
  me: Member | null;
}

interface PackingPreset {
  title: string;
  category: 'shared' | 'personal';
  subCategory: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PACKING_PRESETS: PackingPreset[] = [
  // Personal & Pool
  { title: 'ชุดว่ายน้ำ / กางเกงว่ายน้ำ (สำหรับสระน้ำเกลือ)', category: 'personal', subCategory: 'ว่ายน้ำ & พักผ่อน', icon: Waves },
  { title: 'แว่นกันแดด & ครีมกันแดด SPF50+', category: 'personal', subCategory: 'ว่ายน้ำ & พักผ่อน', icon: Waves },
  { title: 'เสื้อกันหนาวบาง / เสื้อคลุม (ลมหนาวเขาใหญ่ปลาย ต.ค.)', category: 'personal', subCategory: 'เสื้อผ้า', icon: Backpack },
  { title: 'สเปรย์กันยุง & แมลงกลางแจ้ง', category: 'personal', subCategory: 'ของใช้ส่วนตัว', icon: ShieldCheck },
  { title: 'ยารักษาโรคประจำตัว', category: 'personal', subCategory: 'สุขภาพ', icon: ShieldCheck },
  { title: 'สายชาร์จ & แบตเตอรี่สำรอง (Power Bank)', category: 'personal', subCategory: 'อุปกรณ์ไอที', icon: Backpack },

  // Villa Shared Living
  { title: 'ปลั๊กพ่วง 3 ตา สายยาว (สำหรับห้องนั่งเล่น & ริมสระ)', category: 'shared', subCategory: 'กองกลางวิลล่า', icon: Sparkles },
  { title: 'ลำโพงบลูทูธพกพาสำรอง (ริมสระว่ายน้ำ)', category: 'shared', subCategory: 'กองกลางวิลล่า', icon: Sparkles },
  { title: 'บอร์ดเกม & ไพ่สังสรรค์ยามดึก', category: 'shared', subCategory: 'กองกลางวิลล่า', icon: Sparkles },
  { title: 'ยาสามัญประจำบ้าน (พารา, ยาแก้แพ้, ยาแก้ท้องเสีย)', category: 'shared', subCategory: 'สุขภาพกองกลาง', icon: ShieldCheck },
  { title: 'กระดาษทิชชู่เปียก & ทิชชู่แห้งม้วนใหญ่', category: 'shared', subCategory: 'ของใช้ในบ้าน', icon: Sparkles },
  { title: 'ถุงขยะดำใบใหญ่สำหรับเก็บกวาดวิลล่า', category: 'shared', subCategory: 'ของใช้ในบ้าน', icon: Sparkles },

  // Kitchen & BBQ
  { title: 'น้ำจิ้มสุกี้ & น้ำจิ้มซีฟู้ดขวดใหญ่', category: 'shared', subCategory: 'ครัว & BBQ', icon: Flame },
  { title: 'ฟอยล์อะลูมิเนียมย่างเนื้อ & เนยสด', category: 'shared', subCategory: 'ครัว & BBQ', icon: Flame },
  { title: 'ที่คีบเนื้อ BBQ & ถุงมือพลาสติกทำอาหาร', category: 'shared', subCategory: 'ครัว & BBQ', icon: Flame },
  { title: 'ถ่านปิ้งย่างสำรอง & ปืนยิงแก๊ส', category: 'shared', subCategory: 'ครัว & BBQ', icon: Flame },
  { title: 'แก้วเก็บความเย็นส่วนตัว (ลดขยะแก้วพลาสติก)', category: 'personal', subCategory: 'เครื่องดื่ม', icon: Coffee },
];

export const PackingTab: React.FC<PackingTabProps> = ({
  trip,
  onSaveItem,
  onRemoveItem,
  me,
}) => {
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'mine' | 'shared' | 'unassigned' | 'personal' | 'menu'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PackingItem | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemCategory, setItemCategory] = useState<'shared' | 'personal'>('shared');
  const [itemAssignedMemberId, setItemAssignedMemberId] = useState('');

  const packingList = useMemo(() => trip.packingList ?? [], [trip.packingList]);
  const sharedItems = useMemo(
    () => packingList.filter((item) => item.category === 'shared'),
    [packingList]
  );
  const personalItems = useMemo(
    () => packingList.filter((item) => item.category === 'personal'),
    [packingList]
  );
  const unassignedItems = useMemo(
    () => sharedItems.filter((item) => !item.assignedMemberId),
    [sharedItems]
  );
  const myItems = useMemo(
    () =>
      me
        ? packingList.filter(
            (item) =>
              (item.category === 'shared' && item.assignedMemberId === me.id) ||
              item.category === 'personal'
          )
        : [],
    [packingList, me]
  );
  const fromMenuItems = useMemo(
    () => packingList.filter((item) => item.fromMenuId),
    [packingList]
  );

  const packedCount = packingList.filter((item) => item.isPacked).length;
  const totalCount = packingList.length;
  const progressPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  const handleTogglePacked = (itemId: string) => {
    const item = packingList.find((i) => i.id === itemId);
    if (!item) return;
    onSaveItem('packingList', { ...item, isPacked: !item.isPacked });
  };

  const handleAssignMember = (itemId: string, memberId?: string) => {
    const item = packingList.find((i) => i.id === itemId);
    if (!item) return;
    onSaveItem('packingList', {
      ...item,
      assignedMemberId: memberId ? memberId : undefined,
    });
  };

  const handleClaimItem = (itemId: string) => {
    if (!me) return;
    handleAssignMember(itemId, me.id);
  };

  const handleOpenAddModal = (presetTitle?: string, presetCategory?: 'shared' | 'personal') => {
    setEditingItem(null);
    setItemTitle(presetTitle || '');
    setItemCategory(presetCategory || 'shared');
    setItemAssignedMemberId(presetCategory === 'shared' ? me?.id || '' : '');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PackingItem) => {
    setEditingItem(item);
    setItemTitle(item.title);
    setItemCategory(item.category);
    setItemAssignedMemberId(item.assignedMemberId || '');
    setIsModalOpen(true);
  };

  const handleSaveItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    if (editingItem) {
      onSaveItem('packingList', {
        ...editingItem,
        title: itemTitle.trim(),
        category: itemCategory,
        assignedMemberId:
          itemCategory === 'shared' && itemAssignedMemberId ? itemAssignedMemberId : undefined,
      });
    } else {
      const newItem: PackingItem = {
        id: `p-${Date.now()}`,
        title: itemTitle.trim(),
        category: itemCategory,
        assignedMemberId:
          itemCategory === 'shared' && itemAssignedMemberId ? itemAssignedMemberId : undefined,
        isPacked: false,
      };
      onSaveItem('packingList', newItem);
    }
    setIsModalOpen(false);
  };

  const handleDeleteItem = (itemId: string) => {
    const item = packingList.find((i) => i.id === itemId);
    if (!window.confirm(`ลบรายการ "${item?.title ?? 'นี้'}" ออกจากรายการเตรียม?`)) return;
    onRemoveItem('packingList', itemId);
  };

  const handleLoadAllPresets = () => {
    const existingTitles = new Set(packingList.map((i) => i.title.toLowerCase().trim()));
    const itemsToAdd = PACKING_PRESETS.filter(
      (preset) => !existingTitles.has(preset.title.toLowerCase().trim())
    );

    if (itemsToAdd.length === 0) {
      alert('มีรายการแนะนำเหล่านี้อยู่ในเช็กลิสต์แล้ว');
      return;
    }

    itemsToAdd.forEach((preset, idx) => {
      const newItem: PackingItem = {
        id: `p-${Date.now()}-${idx}`,
        title: preset.title,
        category: preset.category,
        assignedMemberId: undefined,
        isPacked: false,
      };
      onSaveItem('packingList', newItem);
    });
  };

  const menuTitleOf = (menuId?: string) =>
    menuId ? (trip.menuIdeas ?? []).find((m) => m.id === menuId)?.title : undefined;

  const memberOf = (id?: string) => trip.members.find((m) => m.id === id);

  const filteredItems = useMemo(() => {
    return packingList.filter((item) => {
      // Category filter
      let matchFilter = true;
      if (activeFilter === 'mine') {
        matchFilter =
          (item.category === 'shared' && item.assignedMemberId === me?.id) ||
          item.category === 'personal';
      } else if (activeFilter === 'shared') {
        matchFilter = item.category === 'shared';
      } else if (activeFilter === 'unassigned') {
        matchFilter = item.category === 'shared' && !item.assignedMemberId;
      } else if (activeFilter === 'personal') {
        matchFilter = item.category === 'personal';
      } else if (activeFilter === 'menu') {
        matchFilter = Boolean(item.fromMenuId);
      }

      // Search query
      const matchSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.assignedMemberId &&
          memberOf(item.assignedMemberId)?.nickname.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchFilter && matchSearch;
    });
  }, [packingList, activeFilter, searchQuery, me, trip.members]);

  return (
    <div className="pb-20 max-w-5xl mx-auto">
      {/* Editorial Page Head */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface text-[11px] font-medium text-ink tracking-wide uppercase mb-2">
            <Backpack className="w-3.5 h-3.5 text-brass" />
            <span>持ち物リスト · PACKING & VILLA ESSENTIALS</span>
          </div>
          <h1 className="font-display text-display text-ink leading-tight">
            ของที่ต้องเตรียม
          </h1>
          <p className="mt-1 text-body text-stone">
            เช็กลิสต์ของใช้ส่วนตัว และแบ่งหน้าที่จัดเตรียมของกองกลางสำหรับปาร์ตี้พูลวิลล่าเขาใหญ่
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2.5">
          <button
            onClick={() => handleOpenAddModal()}
            className={`${btnSolid} flex items-center gap-2 shadow-sm`}
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรายการใหม่</span>
          </button>
        </div>
      </div>

      {/* Progress & Overview Bento (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
        {/* Card 1: Total Progress */}
        <div className="bg-paper rounded-panel p-5 sm:p-6 border border-mist-deep shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-fine font-medium text-stone flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-moss" />
                ความคืบหน้าการจัดของ
              </span>
              <span className="text-fine font-mono tabular-nums text-stone">
                {packedCount}/{totalCount} รายการ
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-display sm:text-[2.75rem] text-ink leading-none font-semibold tabular-nums">
                {progressPercent}%
              </span>
              <span className="text-fine text-stone">เตรียมแล้ว</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-mist-deep">
            <Meter value={packedCount} max={totalCount || 1} tone="ink" />
          </div>
        </div>

        {/* Card 2: My Items */}
        <div className="bg-paper rounded-panel p-5 sm:p-6 border border-mist-deep shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-fine font-medium text-stone flex items-center gap-1.5">
                <User className="w-4 h-4 text-brass" />
                ของที่ฉันต้องเตรียม
              </span>
              {me && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface text-ink font-medium">
                  {me.nickname}
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-display sm:text-[2.75rem] text-ink leading-none font-semibold tabular-nums">
                {myItems.length}
              </span>
              <span className="text-fine text-stone">รายการ</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-mist-deep flex items-center justify-between">
            <span className="text-fine text-stone">
              เตรียมเสร็จแล้ว {myItems.filter((i) => i.isPacked).length} จาก {myItems.length}
            </span>
            <button
              onClick={() => setActiveFilter('mine')}
              className="text-fine text-brass font-medium hover:underline cursor-pointer"
            >
              ดูของฉัน →
            </button>
          </div>
        </div>

        {/* Card 3: Unassigned Shared Items */}
        <div className="bg-paper rounded-panel p-5 sm:p-6 border border-mist-deep shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-fine font-medium text-stone flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#934426]" />
                ของกองกลางที่ยังไม่มีคนรับ
              </span>
              <span
                className={`text-fine font-mono tabular-nums px-2 py-0.5 rounded-full ${
                  unassignedItems.length > 0
                    ? 'bg-[#faeee9] text-[#934426] font-semibold'
                    : 'bg-[#eaf1ec] text-[#244b36]'
                }`}
              >
                {unassignedItems.length} รายการ
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`font-display text-display sm:text-[2.75rem] leading-none font-semibold tabular-nums ${
                  unassignedItems.length > 0 ? 'text-[#934426]' : 'text-ink'
                }`}
              >
                {unassignedItems.length}
              </span>
              <span className="text-fine text-stone">รอคนอาสารับ</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-mist-deep flex items-center justify-between">
            <span className="text-fine text-stone">
              {unassignedItems.length === 0
                ? 'ครบทุกคนรับผิดชอบเรียบร้อย'
                : 'ช่วยกันเลือกไปคนละอย่าง'}
            </span>
            {unassignedItems.length > 0 && (
              <button
                onClick={() => setActiveFilter('unassigned')}
                className="text-fine text-[#934426] font-medium hover:underline cursor-pointer"
              >
                ดูรายการรอคนรับ →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search, Actions & Filter Pills */}
      <div className="bg-paper rounded-panel p-4 sm:p-5 border border-mist-deep shadow-sm mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone/70 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อของ หรือชื่อคนเตรียม…"
              className="w-full pl-9 pr-3.5 py-2 text-fine rounded-ctl bg-surface/80 border border-transparent focus:outline-none focus:border-ink/40 focus:bg-paper transition-colors"
            />
          </div>

          {/* Quick Preset Action Button */}
          <button
            type="button"
            onClick={handleLoadAllPresets}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-ctl bg-brass/15 text-brass hover:bg-brass hover:text-paper text-fine font-medium transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>โหลดรายการแนะนำสำหรับพูลวิลล่า</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="mt-4 pt-3 border-t border-mist-deep flex flex-wrap items-center gap-2">
          {[
            { id: 'all' as const, label: 'ทั้งหมด', count: totalCount },
            { id: 'mine' as const, label: 'ของฉัน', count: myItems.length },
            { id: 'shared' as const, label: 'ของกองกลาง', count: sharedItems.length },
            { id: 'unassigned' as const, label: 'ยังไม่มีคนรับ', count: unassignedItems.length },
            { id: 'personal' as const, label: 'ของส่วนตัว', count: personalItems.length },
            ...(fromMenuItems.length > 0
              ? [{ id: 'menu' as const, label: 'ของทำกับข้าว', count: fromMenuItems.length }]
              : []),
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-fine font-medium transition-colors cursor-pointer ${
                activeFilter === pill.id
                  ? 'bg-ink text-paper'
                  : 'bg-surface text-stone hover:text-ink'
              }`}
            >
              <span>{pill.label}</span>
              <span className="font-mono tabular-nums opacity-80">({pill.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Quick Presets Drawer (Show if empty or as helpful shortcuts) */}
      {packingList.length === 0 && (
        <div className="bg-paper rounded-panel p-5 border border-dashed border-brass/50 bg-[#fffdfa] mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
            <div className="flex items-center gap-2 text-fine text-brass font-medium">
              <Sparkles className="w-4 h-4 text-brass shrink-0" />
              <span>รายการของแนะนำประจำทริป Harper Pool Villa (คลิกเพื่อเพิ่มทันที)</span>
            </div>
            <button
              type="button"
              onClick={handleLoadAllPresets}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brass text-paper text-fine font-medium hover:bg-brass/90 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>โหลดครบทั้งหมด 17 รายการ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {PACKING_PRESETS.slice(0, 6).map((preset, idx) => {
              const Icon = preset.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleOpenAddModal(preset.title, preset.category)}
                  className="flex items-start gap-2.5 p-3 rounded-ctl bg-paper border border-mist-deep hover:border-brass/70 text-left transition-colors group cursor-pointer"
                >
                  <div className="p-1.5 rounded-md bg-surface text-brass shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-fine font-medium text-ink group-hover:text-brass transition-colors truncate">
                      {preset.title}
                    </p>
                    <span className="text-[11px] text-stone">
                      {preset.category === 'shared' ? 'ของกองกลาง' : 'ของส่วนตัว'} · {preset.subCategory}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Checklist Items Container */}
      <div className="bg-paper rounded-panel border border-mist-deep shadow-sm overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-10 text-center">
            <Empty
              title={searchQuery ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีรายการในหมวดนี้'}
              note={
                searchQuery
                  ? 'ลองค้นหาด้วยคำอื่น หรือกดล้างการค้นหา'
                  : 'กดเพิ่มรายการใหม่ หรือกดโหลดรายการแนะนำประจำทริปด้านบน'
              }
              action={
                <button onClick={() => handleOpenAddModal()} className={btnSolid}>
                  <Plus className="w-4 h-4 mr-1.5 inline" />
                  เพิ่มรายการแรก
                </button>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-mist-deep/70">
            {filteredItems.map((item) => {
              const holder = memberOf(item.assignedMemberId);
              const isMine = Boolean(me && item.assignedMemberId === me.id);
              const forDish = menuTitleOf(item.fromMenuId);

              return (
                <li
                  key={item.id}
                  className={`px-4 sm:px-6 py-4 flex items-start gap-3.5 transition-colors ${
                    item.isPacked ? 'bg-surface/30' : 'hover:bg-surface/20'
                  }`}
                >
                  {/* Large Touch Target Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleTogglePacked(item.id)}
                    aria-pressed={item.isPacked}
                    aria-label={`ทำเครื่องหมายว่าเตรียม ${item.title} แล้ว`}
                    className="p-1 -m-1 mt-0.5 shrink-0 cursor-pointer group"
                  >
                    <span
                      className={`w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center transition-all ${
                        item.isPacked
                          ? 'bg-moss border-moss text-paper'
                          : 'border-stone/40 bg-paper group-hover:border-ink'
                      }`}
                    >
                      {item.isPacked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </span>
                  </button>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p
                        className={`text-body break-words font-medium transition-all ${
                          item.isPacked
                            ? 'line-through text-stone/70 decoration-stone/50'
                            : 'text-ink'
                        }`}
                      >
                        {item.title}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-fine text-stone">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[11px] font-medium ${
                            item.category === 'shared'
                              ? 'bg-[#eaf1ec] text-[#244b36]'
                              : 'bg-surface text-stone'
                          }`}
                        >
                          <Tag className="w-3 h-3" />
                          {item.category === 'shared' ? 'ของกองกลาง' : 'ของส่วนตัว'}
                        </span>

                        {forDish && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-brass">
                            <UtensilsCrossed className="w-3 h-3" />
                            สำหรับ: {forDish}
                          </span>
                        )}

                        {item.category === 'shared' && (
                          <span className="inline-flex items-center gap-1.5 text-[11px]">
                            {holder ? (
                              <>
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: holder.avatarColor }}
                                />
                                <span className="text-ink font-medium">
                                  {isMine ? 'คุณรับหน้าที่นี้' : `${holder.nickname} รับเตรียม`}
                                </span>
                              </>
                            ) : (
                              <span className="text-[#934426] font-medium inline-flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                ยังไม่มีคนรับเตรียม
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Shared Item Assign Action Buttons */}
                    <div className="mt-3 sm:mt-0 flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                      {item.category === 'shared' && (
                        <>
                          {me && !item.assignedMemberId && (
                            <button
                              type="button"
                              onClick={() => handleClaimItem(item.id)}
                              className="px-2.5 py-1 rounded-ctl bg-ink text-paper text-fine font-medium hover:bg-ink-soft transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                            >
                              ฉันรับเอง
                            </button>
                          )}

                          <select
                            value={item.assignedMemberId || ''}
                            onChange={(e) => handleAssignMember(item.id, e.target.value)}
                            aria-label={`คนที่เตรียม ${item.title}`}
                            className="text-fine py-1 pl-2.5 pr-7 rounded-ctl bg-surface text-ink border border-transparent focus:outline-none focus:border-ink/40 max-w-[10rem] cursor-pointer"
                          >
                            <option value="">
                              {item.assignedMemberId ? 'ไม่มีคนรับ' : 'มอบหมายให้...'}
                            </option>
                            {trip.members.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.nickname} {me && m.id === me.id ? '(คุณ)' : ''}
                              </option>
                            ))}
                          </select>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-stone hover:text-ink hover:bg-surface rounded transition-colors"
                        title="แก้ไขรายการ"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-stone hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="ลบรายการ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ADD / EDIT ITEM MODAL */}
      {isModalOpen && (
        <Modal
          title={editingItem ? 'แก้ไขรายการของที่ต้องเตรียม' : 'เพิ่มของที่ต้องเตรียม'}
          note="ระบุชื่อสิ่งของ และเลือกว่าเป็นของกองกลางหรือของส่วนตัว"
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSaveItemSubmit} className="space-y-4">
            {/* Quick Suggestion Chips */}
            {!editingItem && (
              <div>
                <span className="block text-[11px] text-stone mb-1.5">
                  เลือกรายการแนะนำด่วน:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'ชุดว่ายน้ำ',
                    'แว่นกันแดด',
                    'ปลั๊กพ่วง 3 ตา',
                    'ลำโพงบลูทูธ',
                    'น้ำจิ้มสุกี้',
                    'สเปรย์กันยุง',
                    'ถุงขยะดำ',
                  ].map((presetName) => (
                    <button
                      key={presetName}
                      type="button"
                      onClick={() => setItemTitle(presetName)}
                      className="px-2.5 py-1 rounded-full bg-surface hover:bg-mist-deep text-[11px] text-ink transition-colors cursor-pointer"
                    >
                      {presetName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Field label="ชื่อสิ่งของ" htmlFor="item-title">
              <input
                id="item-title"
                type="text"
                required
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
                placeholder="เช่น ปลั๊กพ่วง 3 ตา, ลำโพงบลูทูธ, แว่นกันแดด"
                className={input}
              />
            </Field>

            <Field label="ประเภทสิ่งของ" htmlFor="item-cat">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setItemCategory('shared')}
                  className={`p-3 rounded-ctl border text-left transition-colors cursor-pointer ${
                    itemCategory === 'shared'
                      ? 'border-ink bg-surface text-ink font-semibold'
                      : 'border-mist-deep bg-paper text-stone hover:text-ink'
                  }`}
                >
                  <p className="text-fine font-medium">ของกองกลาง</p>
                  <p className="text-[11px] text-stone mt-0.5">
                    มอบหมายให้คนใดคนหนึ่งรับผิดชอบนำมา
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setItemCategory('personal')}
                  className={`p-3 rounded-ctl border text-left transition-colors cursor-pointer ${
                    itemCategory === 'personal'
                      ? 'border-ink bg-surface text-ink font-semibold'
                      : 'border-mist-deep bg-paper text-stone hover:text-ink'
                  }`}
                >
                  <p className="text-fine font-medium">ของส่วนตัว</p>
                  <p className="text-[11px] text-stone mt-0.5">
                    ต่างคนต่างจัดเตรียมมาเองในกระเป๋า
                  </p>
                </button>
              </div>
            </Field>

            {itemCategory === 'shared' && (
              <Field
                label="คนที่รับหน้าที่เตรียม"
                htmlFor="item-assignee"
                hint={me ? 'คุณสามารถเลือกรับหน้าที่นี้เอง หรือเลือกเพื่อนที่ไปร่วมทริป' : undefined}
              >
                <select
                  id="item-assignee"
                  value={itemAssignedMemberId}
                  onChange={(e) => setItemAssignedMemberId(e.target.value)}
                  className={input}
                >
                  <option value="">ยังไม่มีคนรับ (รอคนอาสา)</option>
                  {trip.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nickname} {me && m.id === me.id ? '(คุณ)' : ''}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={`flex-1 ${btnQuiet}`}
              >
                ยกเลิก
              </button>
              <button type="submit" className={`flex-1 ${btnSolid}`}>
                {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PackingTab;
