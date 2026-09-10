import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  DollarSign, 
  Users, 
  Trash2, 
  Edit3, 
  X, 
  ArrowRight,
  PieChart,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { TripData, Expense, Member } from '../types/trip';

interface ExpensesTabProps {
  trip: TripData;
  onUpdateTrip: (trip: TripData) => void;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({ trip, onUpdateTrip }) => {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [payerId, setPayerId] = useState(trip.members[0]?.id || '');
  const [category, setCategory] = useState<Expense['category']>('food');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const confirmedMembers = trip.members.filter((m) => m.status === 'confirmed');
  const memberCount = confirmedMembers.length || 1;

  // Calculations
  const totalExpense = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = Math.round(totalExpense / memberCount);

  // Category totals
  const categoryTotals = trip.expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  // Spending per member
  const memberPaidMap: Record<string, number> = {};
  trip.members.forEach((m) => {
    memberPaidMap[m.id] = 0;
  });
  trip.expenses.forEach((e) => {
    memberPaidMap[e.payerId] = (memberPaidMap[e.payerId] || 0) + e.amount;
  });

  const getCategoryLabel = (cat: Expense['category']) => {
    switch (cat) {
      case 'accommodation': return '🏡 ที่พัก';
      case 'food': return '🍲 อาหาร/เครื่องดื่ม';
      case 'fuel': return '⛽ น้ำมัน/ทางด่วน';
      case 'tickets': return '🎟️ ค่าเข้า/ตั๋ว';
      default: return '📦 อื่นๆ';
    }
  };

  const handleOpenNewModal = () => {
    setEditingExpense(null);
    setTitle('');
    setAmount('');
    setPayerId(trip.members[0]?.id || '');
    setCategory('food');
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setAmount(exp.amount);
    setPayerId(exp.payerId);
    setCategory(exp.category);
    setNotes(exp.notes || '');
    setDate(exp.date);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    if (editingExpense) {
      const updatedExpenses = trip.expenses.map((exp) =>
        exp.id === editingExpense.id
          ? {
              ...exp,
              title,
              amount: Number(amount),
              payerId,
              category,
              notes,
              date,
            }
          : exp
      );
      onUpdateTrip({ ...trip, expenses: updatedExpenses });
    } else {
      const newExp: Expense = {
        id: `exp-${Date.now()}`,
        title,
        amount: Number(amount),
        payerId,
        category,
        splitBetween: [],
        date,
        notes,
      };
      onUpdateTrip({ ...trip, expenses: [...trip.expenses, newExp] });
    }
    setIsExpenseModalOpen(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (window.confirm('คุณต้องการลบรายการค่าใช้จ่ายนี้ใช่หรือไม่?')) {
      const updatedExpenses = trip.expenses.filter((e) => e.id !== expenseId);
      onUpdateTrip({ ...trip, expenses: updatedExpenses });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick Action */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">งบประมาณ & ระบบหารเงิน (Expenses & Split)</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            บันทึกยอดเงินกองกลาง ค่าที่พัก ของสด ค่าน้ำมัน และคำนวณเงินโอนเคลียร์หนี้อัตโนมัติ
          </p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ บันทึกค่าใช้จ่าย</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-6 rounded-3xl shadow-md shadow-purple-200">
          <span className="text-xs font-semibold text-purple-200 block mb-1">ยอดรวมค่าใช้จ่ายทั้งหมด</span>
          <div className="text-3xl font-black">฿{totalExpense.toLocaleString()}</div>
          <p className="text-xs text-purple-200 mt-2">
            บันทึกแล้ว {trip.expenses.length} รายการ
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">ยอดเฉลี่ยต่อคน (หารเท่า)</span>
          <div className="text-3xl font-black text-slate-800">฿{perPerson.toLocaleString()}</div>
          <p className="text-xs text-emerald-600 font-medium mt-2">
            คำนวณจากเพื่อนที่คอนเฟิร์ม {memberCount} คน
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-2">สัดส่วนตามหมวดหมู่</span>
          <div className="space-y-1.5 text-xs">
            {Object.entries(categoryTotals).map(([cat, amt]) => {
              const pct = totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0;
              return (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-slate-600">{getCategoryLabel(cat as Expense['category'])}</span>
                  <span className="font-bold text-slate-800">฿{amt.toLocaleString()} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Settlement Balance Table (ใครต้องโอนให้ใคร) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 mb-1">
          📊 สรุปยอดเงินแต่ละคน (ใครจ่ายแล้ว / ใครต้องโอนเพิ่ม)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          ยอดสุทธิ = (ยอดที่ออกเงินไปแล้ว) ลบ (ยอดเฉลี่ยกองกลาง ฿{perPerson.toLocaleString()})
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {confirmedMembers.map((member) => {
            const paid = memberPaidMap[member.id] || 0;
            const netBalance = paid - perPerson;
            const isOwed = netBalance > 0;
            const isEven = netBalance === 0;

            return (
              <div
                key={member.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: member.avatarColor }}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{member.nickname}</h4>
                    <span className="text-[11px] text-slate-500">
                      ออกไปแล้ว: ฿{paid.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold block ${
                      isOwed ? 'text-emerald-700' : isEven ? 'text-slate-500' : 'text-rose-600'
                    }`}
                  >
                    {isOwed ? `+฿${netBalance.toLocaleString()}` : isEven ? 'ครบแล้ว' : `-฿${Math.abs(netBalance).toLocaleString()}`}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isOwed ? 'รอรับเงินคืน' : isEven ? 'พอดีเป๊ะ' : 'ต้องโอนเพิ่ม'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expenses History List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">รายการค่าใช้จ่ายทั้งหมด</h3>
          <span className="text-xs text-slate-400">{trip.expenses.length} รายการ</span>
        </div>

        <div className="divide-y divide-slate-100">
          {trip.expenses.map((exp) => {
            const payer = trip.members.find((m) => m.id === exp.payerId);

            return (
              <div key={exp.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{exp.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                      {getCategoryLabel(exp.category)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      จ่ายโดย:{' '}
                      <strong className="text-purple-700">{payer?.nickname || 'ไม่ระบุ'}</strong>
                    </span>
                    <span>•</span>
                    <span>{exp.date}</span>
                    {exp.notes && (
                      <>
                        <span>•</span>
                        <span className="italic text-slate-400">{exp.notes}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-900">
                    ฿{exp.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleOpenEditModal(exp)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Add or Edit Expense */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {editingExpense ? 'แก้ไขรายการค่าใช้จ่าย' : 'เพิ่มรายการค่าใช้จ่ายกองกลาง'}
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อรายการ *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น ค่าหมูกระทะและเนื้อสัตว์ (แม็คโคร)"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">จำนวนเงิน (บาท) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="เช่น 3500"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">หมวดหมู่</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Expense['category'])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                  >
                    <option value="accommodation">🏡 ค่าที่พัก/พูลวิลล่า</option>
                    <option value="food">🍲 อาหาร & เครื่องดื่ม</option>
                    <option value="fuel">⛽ น้ำมัน & ทางด่วน</option>
                    <option value="tickets">🎟️ ค่าเข้า & บัตรกิจกรรม</option>
                    <option value="other">📦 อื่นๆ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ใครเป็นคนสำรองจ่าย? *</label>
                  <select
                    value={payerId}
                    onChange={(e) => setPayerId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                  >
                    {trip.members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nickname} ({m.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">วันที่จ่าย</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมายเหตุ</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น เก็บสลิปไว้แล้ว, หารทุกคน"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-xs transition-colors"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
