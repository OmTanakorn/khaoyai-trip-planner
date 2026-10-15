import React, { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { TripData, PackingItem, Member, TripListEditor } from '../types/trip';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Empty, Meter } from './ui';
import { input, btnSolid } from './ui-kit';

interface PackingTabProps extends TripListEditor {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
  me: Member | null;
}

export const PackingTab: React.FC<PackingTabProps> = ({ trip, onSaveItem, onRemoveItem, me }) => {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'shared' | 'personal'>('shared');
  const [newItemAssignedTo, setNewItemAssignedTo] = useState(me?.id || '');
  const [activeFilter, setActiveFilter] = useState<'all' | 'shared' | 'personal' | 'menu'>(
    'all'
  );

  const sharedItems = trip.packingList.filter((item) => item.category === 'shared');
  const personalItems = trip.packingList.filter((item) => item.category === 'personal');

  const packedCount = trip.packingList.filter((item) => item.isPacked).length;
  const totalCount = trip.packingList.length;

  const handleTogglePacked = (itemId: string) => {
    const item = trip.packingList.find((i) => i.id === itemId);
    const isPacked = !item?.isPacked;
    const packed = trip.packingList.find((i) => i.id === itemId);
    if (packed) onSaveItem('packingList', { ...packed, isPacked });
  };

  const handleAssignMember = (itemId: string, memberId: string) => {
    const assigned = trip.packingList.find((i) => i.id === itemId);
    if (assigned)
      onSaveItem('packingList', { ...assigned, assignedMemberId: memberId || undefined });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newItem: PackingItem = {
      id: `p-${Date.now()}`,
      title: newItemTitle.trim(),
      category: newItemCategory,
      assignedMemberId:
        newItemCategory === 'shared' && newItemAssignedTo ? newItemAssignedTo : undefined,
      isPacked: false,
    };

    onSaveItem('packingList', newItem);
    setNewItemTitle('');
  };

  const handleDeleteItem = (itemId: string) => {
    onRemoveItem('packingList', itemId);
  };

  const fromMenuItems = trip.packingList.filter((item) => item.fromMenuId);

  const filteredItems = trip.packingList.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'menu') return !!item.fromMenuId;
    return item.category === activeFilter;
  });

  /** The dish an item was broken out of, so its row can say where it came from. */
  const menuTitleOf = (menuId?: string) =>
    menuId ? (trip.menuIdeas ?? []).find((m) => m.id === menuId)?.title : undefined;

  const filters = [
    { id: 'all' as const, label: 'ทั้งหมด', count: trip.packingList.length },
    { id: 'shared' as const, label: 'ของกองกลาง', count: sharedItems.length },
    { id: 'personal' as const, label: 'ของส่วนตัว', count: personalItems.length },
    ...(fromMenuItems.length > 0
      ? [{ id: 'menu' as const, label: 'ของทำกับข้าว', count: fromMenuItems.length }]
      : []),
  ];

  return (
    <div className="pb-16">
      <PageHead
        title="ของที่ต้องเตรียม"
        note="ของกองกลางมอบหมายให้คนใดคนหนึ่งหิ้วมา ของส่วนตัวต่างคนต่างเตรียม"
        aside={
          <div className="mt-4 max-w-xs">
            <p className="text-fine text-stone">
              เตรียมแล้ว {packedCount} จาก {totalCount} รายการ
            </p>
            <div className="mt-2">
              <Meter value={packedCount} max={totalCount} />
            </div>
          </div>
        }
      />

      <Panel className="mb-3">
        <form
          onSubmit={handleAddItem}
          className="grid grid-cols-[1fr_auto] gap-2 lg:grid-cols-[1fr_12rem_12rem_auto] lg:gap-3"
        >
          <input
            type="text"
            required
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="น้ำจิ้มสุกี้ ลำโพงบลูทูธ ไดร์เป่าผม"
            className={`${input} min-w-0`}
            aria-label="ของที่ต้องเตรียม"
          />

          <button type="submit" className={`${btnSolid} shrink-0 lg:order-last`}>
            <span className="inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              เพิ่ม
            </span>
          </button>

          {/* Second row on a phone; on a wide screen these sit in the first */}
          <div className="col-span-2 grid grid-cols-2 gap-2 lg:contents">
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as 'shared' | 'personal')}
              className={input}
              aria-label="ประเภทของ"
            >
              <option value="shared">ของกองกลาง</option>
              <option value="personal">ของส่วนตัว</option>
            </select>

            {newItemCategory === 'shared' && (
              <select
                value={newItemAssignedTo}
                onChange={(e) => setNewItemAssignedTo(e.target.value)}
                className={input}
                aria-label="คนที่รับไปเตรียม"
              >
                <option value="">ยังไม่มีคนรับ</option>
                {trip.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nickname}
                  </option>
                ))}
              </select>
            )}
          </div>
        </form>
      </Panel>

      <div className="bg-paper rounded-panel overflow-hidden">
        <div className="flex gap-6 px-5 sm:px-8 border-b border-mist-deep overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              aria-pressed={activeFilter === f.id}
              className={`py-4 text-fine whitespace-nowrap shrink-0 border-b-2 -mb-px transition-colors ${
                activeFilter === f.id
                  ? 'border-brass text-ink'
                  : 'border-transparent text-stone hover:text-ink'
              }`}
            >
              {f.label} {f.count}
            </button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <Empty
            title="ยังไม่มีของในหมวดนี้"
            note={
              activeFilter === 'menu'
                ? 'ของหมวดนี้มาจากหน้าเมนูอาหาร กดแตกเมนูที่ผ่านโหวตแล้วของจะมาโผล่ที่นี่'
                : 'พิมพ์ของที่นึกออกในช่องด้านบน แล้วเลือกว่าใครหิ้วมา'
            }
          />
        ) : (
          <ul className="divide-y divide-mist-deep/70">
            {filteredItems.map((item) => {
              const holder = trip.members.find((m) => m.id === item.assignedMemberId);
              const isMine = !!me && item.assignedMemberId === me.id;
              const forDish = menuTitleOf(item.fromMenuId);
              return (
                <li key={item.id} className="px-4 sm:px-8 py-4 flex items-start gap-3 sm:gap-4">
                  {/* The hit area is bigger than the box, for thumbs */}
                  <button
                    onClick={() => handleTogglePacked(item.id)}
                    aria-pressed={item.isPacked}
                    aria-label={`ทำเครื่องหมายว่าเตรียม ${item.title} แล้ว`}
                    className="p-1.5 -m-1.5 mt-0 shrink-0 group"
                  >
                    <span
                      className={`w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center transition-colors ${
                        item.isPacked
                          ? 'bg-ink border-ink text-paper'
                          : 'border-stone/50 group-hover:border-ink'
                      }`}
                    >
                      {item.isPacked && <Check className="w-3 h-3" />}
                    </span>
                  </button>

                  <div className="flex-1 min-w-0 sm:flex sm:items-center sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                      <p
                        className={`text-body break-words ${
                          item.isPacked ? 'line-through text-stone' : 'text-ink'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-fine text-stone">
                        {item.category === 'personal'
                          ? 'ของส่วนตัว ทุกคนเตรียมเอง'
                          : holder
                          ? `${isMine ? 'คุณ' : holder.nickname}เตรียม`
                          : 'ของกองกลาง ยังไม่มีคนรับ'}
                        {forDish && `, สำหรับ${forDish}`}
                      </p>
                    </div>

                    {item.category === 'shared' && (
                      <div className="mt-2.5 sm:mt-0 flex items-center gap-3 shrink-0">
                        {me && !item.assignedMemberId && (
                          <button
                            onClick={() => handleAssignMember(item.id, me.id)}
                            className="px-3 py-1.5 rounded-ctl bg-ink text-paper text-fine font-medium hover:bg-ink-soft transition-colors whitespace-nowrap"
                          >
                            ฉันรับเอง
                          </button>
                        )}
                        <select
                          value={item.assignedMemberId || ''}
                          onChange={(e) => handleAssignMember(item.id, e.target.value)}
                          aria-label={`คนที่เตรียม ${item.title}`}
                          className="text-fine py-1.5 pl-2.5 pr-7 rounded-ctl bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-ink/40 max-w-[11rem]"
                        >
                          <option value="">{item.assignedMemberId ? 'ไม่มีคนรับ' : 'ให้คนอื่นรับ'}</option>
                          {trip.members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nickname} {me && m.id === me.id ? '(คุณ)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 -m-1.5 text-stone/60 hover:text-ink transition-colors shrink-0"
                    aria-label={`ลบ ${item.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
