import React, { useState, useMemo } from 'react';
import {
  Check,
  Plus,
  Trash2,
  Pencil,
  Backpack,
  UtensilsCrossed,
  Search,
  CheckCircle2,
  AlertCircle,
  Tag,
  User,
  ExternalLink,
  Upload,
  X,
  Eye,
  ShoppingBag,
} from 'lucide-react';
import { TripData, PackingItem, Member, TripListEditor } from '../types/trip';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Modal, Field, Empty, Meter } from './ui';
import { input, btnSolid, btnQuiet, btnBrass, btnLink, initialOf } from './ui-kit';

function compressImageFile(file: File, maxWidth = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(e.target?.result as string);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface PackingTabProps extends TripListEditor {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
  me: Member | null;
}

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
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemMakroUrl, setItemMakroUrl] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [previewImageModalUrl, setPreviewImageModalUrl] = useState<string | null>(null);

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

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setItemTitle('');
    setItemCategory('shared');
    setItemAssignedMemberId(me?.id || '');
    setItemImageUrl('');
    setItemMakroUrl('');
    setItemNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PackingItem) => {
    setEditingItem(item);
    setItemTitle(item.title);
    setItemCategory(item.category);
    setItemAssignedMemberId(item.assignedMemberId || '');
    setItemImageUrl(item.imageUrl || '');
    setItemMakroUrl(item.makroUrl || '');
    setItemNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    const fields = {
      title: itemTitle.trim(),
      category: itemCategory,
      assignedMemberId:
        itemCategory === 'shared' && itemAssignedMemberId ? itemAssignedMemberId : undefined,
      imageUrl: itemImageUrl.trim() || undefined,
      makroUrl: itemMakroUrl.trim() || undefined,
      notes: itemNotes.trim() || undefined,
    };

    if (editingItem) {
      onSaveItem('packingList', {
        ...editingItem,
        ...fields,
      });
    } else {
      const newItem: PackingItem = {
        id: `p-${Date.now()}`,
        isPacked: false,
        ...fields,
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

      {/* Main Checklist Items Container */}
      <div className="bg-paper rounded-panel border border-mist-deep shadow-sm overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-10 text-center">
            <Empty
              title={searchQuery ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีรายการในหมวดนี้'}
              note={
                searchQuery
                  ? 'ลองค้นหาด้วยคำอื่น หรือกดล้างการค้นหา'
                  : 'กดเพิ่มรายการใหม่เพื่อเริ่มจัดเตรียมของ'
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

                  {/* Product/Dish Thumbnail with Zoom */}
                  {item.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewImageModalUrl(item.imageUrl!)}
                      className="group relative shrink-0 mt-0.5 cursor-zoom-in rounded-lg overflow-hidden border border-mist-deep shadow-2xs"
                      title="กดเพื่อดูรูปภาพขนาดใหญ่"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-12 h-12 sm:w-14 sm:h-14 object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Eye className="w-3.5 h-3.5 drop-shadow" />
                      </div>
                    </button>
                  )}

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

                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-fine text-stone">
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

                        {/* Makro Pro Product Link / Search Shortcut */}
                        {item.makroUrl ? (
                          <a
                            href={item.makroUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fee9ec] text-[#e82026] hover:bg-[#fed2d8] border border-[#fcc5cd] transition-colors"
                            title="เปิดดูสินค้าบน Makro Pro"
                          >
                            <span className="font-bold text-[9px] bg-[#e82026] text-white px-1 rounded-sm leading-none py-0.5">
                              PRO
                            </span>
                            <span>ดูใน Makro Pro</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : item.category === 'shared' || forDish ? (
                          <a
                            href={`https://www.makro.pro/th/search?q=${encodeURIComponent(
                              item.title.replace(/\(.*?\)/g, '').trim()
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface text-stone hover:text-[#e82026] hover:bg-[#fee9ec] border border-mist-deep hover:border-[#fcc5cd] transition-colors"
                            title="ค้นหาชื่อนี้บน Makro Pro"
                          >
                            <span className="font-bold text-[9px] bg-stone/70 text-white px-1 rounded-sm leading-none py-0.5">
                              PRO
                            </span>
                            <span>ค้นใน Makro</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        ) : null}

                        {item.notes && (
                          <span className="text-[11px] text-stone italic">
                            • {item.notes}
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

            {/* Makro Pro Product Link */}
            <Field
              label="ลิงก์สินค้า Makro Pro (ไม่บังคับ)"
              htmlFor="item-makro"
              hint="ใส่ลิงก์สินค้าจาก makro.pro หรือกดปุ่มค้นหาเพื่อเปิดดูสินค้า"
            >
              <div className="flex gap-2">
                <input
                  id="item-makro"
                  type="url"
                  value={itemMakroUrl}
                  onChange={(e) => setItemMakroUrl(e.target.value)}
                  placeholder="https://www.makro.pro/th/p/..."
                  className={input}
                />
                <a
                  href={`https://www.makro.pro/th/search?q=${encodeURIComponent(
                    itemTitle.replace(/\(.*?\)/g, '').trim() || 'ของสด'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-ctl bg-[#fee9ec] text-[#e82026] hover:bg-[#fed2d8] border border-[#fcc5cd] text-fine font-medium transition-colors shrink-0"
                  title="เปิดค้นหาชื่อนี้บน Makro Pro เพื่อคัดลอกลิงก์"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>ค้นใน Makro</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Field>

            {/* Image Attachment (URL or File Upload) */}
            <Field
              label="รูปภาพสินค้า / สิ่งของ (ไม่บังคับ)"
              htmlFor="item-image"
              hint="วางลิงก์รูปภาพ หรือกดอัปโหลดรูปจากโทรศัพท์/คอมพิวเตอร์"
            >
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    id="item-image"
                    type="url"
                    value={itemImageUrl}
                    onChange={(e) => setItemImageUrl(e.target.value)}
                    placeholder="https://... ลิงก์รูปภาพ"
                    className={input}
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-ctl bg-surface hover:bg-mist-deep border border-mist-deep text-ink text-fine font-medium cursor-pointer transition-colors shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลดรูป</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const dataUrl = await compressImageFile(file);
                            setItemImageUrl(dataUrl);
                          } catch (err) {
                            console.error('Error reading image file', err);
                          }
                        }
                      }}
                    />
                  </label>
                </div>

                {itemImageUrl && (
                  <div className="relative inline-block mt-1">
                    <img
                      src={itemImageUrl}
                      alt="Preview"
                      className="w-20 h-20 rounded-lg object-cover border border-mist-deep shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setItemImageUrl('')}
                      className="absolute -top-1.5 -right-1.5 p-1 bg-ink text-paper rounded-full hover:bg-red-600 transition-colors shadow-xs cursor-pointer"
                      title="ลบรูป"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </Field>

            {/* Item Notes */}
            <Field label="บันทึกเพิ่มเติม / ระบุยี่ห้อหรือขนาด" htmlFor="item-notes">
              <input
                id="item-notes"
                type="text"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="เช่น เอาขนาด 1 กิโลกรัม, ซื้อที่ Makro ปากช่อง"
                className={input}
              />
            </Field>

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

      {/* Image Lightbox Modal */}
      {previewImageModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer backdrop-blur-xs"
          onClick={() => setPreviewImageModalUrl(null)}
        >
          <div
            className="relative max-w-2xl max-h-[85vh] bg-paper rounded-panel overflow-hidden border border-mist-deep shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImageModalUrl}
              alt="Item Preview"
              className="w-full h-auto max-h-[75vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setPreviewImageModalUrl(null)}
              className="absolute top-4 right-4 p-1.5 bg-ink/80 text-white rounded-full hover:bg-ink transition-colors cursor-pointer shadow-md"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackingTab;
