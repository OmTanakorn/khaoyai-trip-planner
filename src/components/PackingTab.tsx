import React, { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { TripData, PackingItem, TripListEditor } from '../types/trip';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Empty, Meter } from './ui';
import { input, btnSolid } from './ui-kit';

interface PackingTabProps extends TripListEditor {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
}

export const PackingTab: React.FC<PackingTabProps> = ({ trip, onSaveItem, onRemoveItem }) => {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'shared' | 'personal'>('shared');
  const [newItemAssignedTo, setNewItemAssignedTo] = useState('');
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

      <Panel className="mb-px">
        <form onSubmit={handleAddItem} className="flex flex-col lg:flex-row gap-3">
          <input
            type="text"
            required
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="น้ำจิ้มสุกี้ ลำโพงบลูทูธ ไดร์เป่าผม"
            className={`${input} flex-1`}
            aria-label="ของที่ต้องเตรียม"
          />

          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value as 'shared' | 'personal')}
            className={`${input} lg:w-48`}
            aria-label="ประเภทของ"
          >
            <option value="shared">ของกองกลาง</option>
            <option value="personal">ของส่วนตัว</option>
          </select>

          {newItemCategory === 'shared' && (
            <select
              value={newItemAssignedTo}
              onChange={(e) => setNewItemAssignedTo(e.target.value)}
              className={`${input} lg:w-48`}
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

          <button type="submit" className={`${btnSolid} shrink-0`}>
            <span className="inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              เพิ่ม
            </span>
          </button>
        </form>
      </Panel>

      <div className="bg-paper">
        <div className="flex gap-6 px-6 sm:px-8 border-b border-mist-deep">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              aria-pressed={activeFilter === f.id}
              className={`py-4 text-fine border-b-2 -mb-px transition-colors ${
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
          <ul className="divide-y divide-mist-deep">
            {filteredItems.map((item) => (
              <li
                key={item.id}
                className="px-6 sm:px-8 py-4 flex items-center gap-4"
              >
                <button
                  onClick={() => handleTogglePacked(item.id)}
                  aria-pressed={item.isPacked}
                  aria-label={`ทำเครื่องหมายว่าเตรียม ${item.title} แล้ว`}
                  className={`w-5 h-5 shrink-0 rounded-ctl border flex items-center justify-center transition-colors ${
                    item.isPacked
                      ? 'bg-ink border-ink text-paper'
                      : 'border-mist-deep hover:border-brass'
                  }`}
                >
                  {item.isPacked && <Check className="w-3 h-3" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-body ${
                      item.isPacked ? 'line-through text-stone' : 'text-ink'
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="text-fine text-stone truncate">
                    {item.category === 'shared' ? 'ของกองกลาง' : 'ของส่วนตัว'}
                    {menuTitleOf(item.fromMenuId) && ` · สำหรับ ${menuTitleOf(item.fromMenuId)}`}
                  </p>
                </div>

                {item.category === 'shared' && (
                  <select
                    value={item.assignedMemberId || ''}
                    onChange={(e) => handleAssignMember(item.id, e.target.value)}
                    aria-label={`คนที่เตรียม ${item.title}`}
                    className="text-fine py-1.5 px-2 rounded-ctl border border-mist-deep bg-mist/40 text-ink focus:outline-none focus:border-brass"
                  >
                    <option value="">ยังไม่มีคนรับ</option>
                    {trip.members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nickname}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-stone hover:text-ink transition-colors shrink-0"
                  aria-label={`ลบ ${item.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
