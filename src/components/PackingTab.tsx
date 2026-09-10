import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Package, 
  UserCheck, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { TripData, PackingItem } from '../types/trip';

interface PackingTabProps {
  trip: TripData;
  onUpdateTrip: (trip: TripData) => void;
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
  const progressPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  const handleTogglePacked = (itemId: string) => {
    const updatedList = trip.packingList.map((item) =>
      item.id === itemId ? { ...item, isPacked: !item.isPacked } : item
    );
    onUpdateTrip({ ...trip, packingList: updatedList });
  };

  const handleAssignMember = (itemId: string, memberId: string) => {
    const updatedList = trip.packingList.map((item) =>
      item.id === itemId ? { ...item, assignedMemberId: memberId || undefined } : item
    );
    onUpdateTrip({ ...trip, packingList: updatedList });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newItem: PackingItem = {
      id: `p-${Date.now()}`,
      title: newItemTitle.trim(),
      category: newItemCategory,
      assignedMemberId: newItemCategory === 'shared' && newItemAssignedTo ? newItemAssignedTo : undefined,
      isPacked: false,
    };

    onUpdateTrip({
      ...trip,
      packingList: [...trip.packingList, newItem],
    });

    setNewItemTitle('');
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedList = trip.packingList.filter((item) => item.id !== itemId);
    onUpdateTrip({ ...trip, packingList: updatedList });
  };

  const filteredItems = trip.packingList.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.category === activeFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Progress */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">เช็คลิสต์สิ่งของสัมภาระ (Packing List)</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            แบ่งชัดเจนระหว่างของกองกลาง (มอบหมายคนเตรียมมา) และของใช้ส่วนตัว
          </p>
        </div>

        <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200/80 flex items-center gap-4">
          <div>
            <span className="text-xs font-bold text-slate-700 block">
              เตรียมพร้อมแล้ว ({packedCount}/{totalCount})
            </span>
            <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <span className="text-lg font-black text-emerald-600">{progressPercent}%</span>
        </div>
      </div>

      {/* Add Item Form */}
      <form onSubmit={handleAddItem} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            required
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="พิมพ์ของที่ต้องเตรียม เช่น 'น้ำจิ้มสุกี้', 'ลำโพงบลูทูธ', 'ไดร์เป่าผม'..."
            className="flex-1 p-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />

          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value as 'shared' | 'personal')}
            className="p-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-700"
          >
            <option value="shared">📦 ของกองกลาง (นำมาแชร์)</option>
            <option value="personal">🎒 ของส่วนตัว (เตรียมเอง)</option>
          </select>

          {newItemCategory === 'shared' && (
            <select
              value={newItemAssignedTo}
              onChange={(e) => setNewItemAssignedTo(e.target.value)}
              className="p-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-700"
            >
              <option value="">-- ใครเป็นคนเตรียม? --</option>
              {trip.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nickname}
                </option>
              ))}
            </select>
          )}

          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรายการ</span>
          </button>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeFilter === 'all'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          ทั้งหมด ({trip.packingList.length})
        </button>
        <button
          onClick={() => setActiveFilter('shared')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeFilter === 'shared'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          📦 ของกองกลาง ({sharedItems.length})
        </button>
        <button
          onClick={() => setActiveFilter('personal')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeFilter === 'personal'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          🎒 ของส่วนตัว ({personalItems.length})
        </button>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filteredItems.map((item) => {
          const assignedMember = trip.members.find((m) => m.id === item.assignedMemberId);

          return (
            <div
              key={item.id}
              className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                item.isPacked ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => handleTogglePacked(item.id)}
                  className="text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  {item.isPacked ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-md border-2 border-slate-300 hover:border-emerald-500" />
                  )}
                </button>

                <div>
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      item.isPacked ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {item.title}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-2 py-0.2 text-slate-500 bg-slate-100 rounded">
                      {item.category === 'shared' ? 'ของกองกลาง' : 'ของส่วนตัว'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {item.category === 'shared' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 hidden sm:inline">ผู้เตรียม:</span>
                    <select
                      value={item.assignedMemberId || ''}
                      onChange={(e) => handleAssignMember(item.id, e.target.value)}
                      className="text-xs py-1 px-2 rounded-lg border border-slate-200 bg-white text-slate-700"
                    >
                      <option value="">ยังไม่มีคนรับ</option>
                      {trip.members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nickname}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="ลบรายการ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-400">
            ไม่มีรายการสิ่งของในหมวดนี้
          </div>
        )}
      </div>
    </div>
  );
};
