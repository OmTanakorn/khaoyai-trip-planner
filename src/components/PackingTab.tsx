import React, { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { TripData, PackingItem } from '../types/trip';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Empty, Meter } from './ui';
import { input, btnSolid } from './ui-kit';

interface PackingTabProps {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
}

export const PackingTab: React.FC<PackingTabProps> = ({ trip, onUpdateTrip }) => {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'shared' | 'personal'>('shared');
  const [newItemAssignedTo, setNewItemAssignedTo] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'shared' | 'personal'>('all');

  const sharedItems = trip.packingList.filter((item) => item.category === 'shared');
  const personalItems = trip.packingList.filter((item) => item.category === 'personal');

  const packedCount = trip.packingList.filter((item) => item.isPacked).length;
  const totalCount = trip.packingList.length;

  const handleTogglePacked = (itemId: string) => {
    const item = trip.packingList.find((i) => i.id === itemId);
    const isPacked = !item?.isPacked;
    onUpdateTrip((t) => ({
      ...t,
      packingList: t.packingList.map((i) => (i.id === itemId ? { ...i, isPacked } : i)),
    }));
  };

  const handleAssignMember = (itemId: string, memberId: string) => {
    onUpdateTrip((t) => ({
      ...t,
      packingList: t.packingList.map((item) =>
        item.id === itemId ? { ...item, assignedMemberId: memberId || undefined } : item
      ),
    }));
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

    onUpdateTrip((t) => ({ ...t, packingList: [...t.packingList, newItem] }));
    setNewItemTitle('');
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdateTrip((t) => ({
      ...t,
      packingList: t.packingList.filter((item) => item.id !== itemId),
    }));
  };

  const filteredItems = trip.packingList.filter((item) =>
    activeFilter === 'all' ? true : item.category === activeFilter
  );

  const filters = [
    { id: 'all' as const, label: 'ทั้งหมด', count: trip.packingList.length },
    { id: 'shared' as const, label: 'ของกองกลาง', count: sharedItems.length },
    { id: 'personal' as const, label: 'ของส่วนตัว', count: personalItems.length },
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
            note="พิมพ์ของที่นึกออกในช่องด้านบน แล้วเลือกว่าใครหิ้วมา"
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
                  <p className="text-fine text-stone">
                    {item.category === 'shared' ? 'ของกองกลาง' : 'ของส่วนตัว'}
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
