import React, { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { TripData, Expense } from '../types/trip';
import { PageHead, Panel, Modal, Field, Empty, Meter } from './ui';
import { input, btnSolid, btnQuiet, btnLink, baht } from './ui-kit';

interface ExpensesTabProps {
  trip: TripData;
  onUpdateTrip: (trip: TripData) => void;
}

const CATEGORY_LABEL: Record<Expense['category'], string> = {
  accommodation: 'ที่พัก',
  food: 'อาหารและเครื่องดื่ม',
  fuel: 'น้ำมันและทางด่วน',
  tickets: 'ค่าเข้าและบัตรกิจกรรม',
  other: 'อื่น ๆ',
};

export const ExpensesTab: React.FC<ExpensesTabProps> = ({ trip, onUpdateTrip }) => {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [payerId, setPayerId] = useState(trip.members[0]?.id || '');
  const [category, setCategory] = useState<Expense['category']>('food');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const confirmedMembers = trip.members.filter((m) => m.status === 'confirmed');
  const memberCount = confirmedMembers.length || 1;

  const totalExpense = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = Math.round(totalExpense / memberCount);

  const categoryTotals = trip.expenses.reduce(
    (acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const memberPaidMap: Record<string, number> = {};
  trip.members.forEach((m) => {
    memberPaidMap[m.id] = 0;
  });
  trip.expenses.forEach((e) => {
    memberPaidMap[e.payerId] = (memberPaidMap[e.payerId] || 0) + e.amount;
  });

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
          ? { ...exp, title, amount: Number(amount), payerId, category, notes, date }
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
    const exp = trip.expenses.find((e) => e.id === expenseId);
    if (!window.confirm(`ลบรายการ ${exp?.title ?? 'นี้'} ออกจากบัญชี?`)) return;
    onUpdateTrip({ ...trip, expenses: trip.expenses.filter((e) => e.id !== expenseId) });
  };

  return (
    <div className="pb-16">
      <PageHead
        title="งบและการหารเงิน"
        note="บันทึกทุกยอดที่มีคนสำรองจ่ายไปก่อน แล้วดูว่าท้ายทริปใครต้องโอนให้ใคร"
        action={
          <button onClick={handleOpenNewModal} className={btnSolid}>
            บันทึกค่าใช้จ่าย
          </button>
        }
      />

      {/* The one loud element on this page: the running total. */}
      <div className="bg-ink px-6 sm:px-8 py-10 mb-px">
        <p className="text-fine text-brass-lit">ใช้ไปแล้วทั้งทริป</p>
        <p className="mt-3 font-display text-display sm:text-[4rem] leading-none text-paper">
          {baht(totalExpense)}
        </p>
        <p className="mt-4 text-body text-mist/70">
          หารกัน {memberCount} คน ตกคนละ {baht(perPerson)} · บันทึกไว้ {trip.expenses.length} รายการ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-mist-deep">
        <Panel>
          <h2 className="font-display text-lead text-ink border-b border-mist-deep pb-5">
            เงินหมดไปกับอะไร
          </h2>
          {Object.keys(categoryTotals).length === 0 ? (
            <p className="mt-6 text-body text-stone">ยังไม่มีรายการ ยอดจะขึ้นที่นี่เมื่อเริ่มบันทึก</p>
          ) : (
            <ul className="mt-6 space-y-5">
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amt]) => (
                  <li key={cat}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-body text-ink">
                        {CATEGORY_LABEL[cat as Expense['category']]}
                      </span>
                      <span className="text-fine text-stone">
                        {baht(amt)} ·{' '}
                        {totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <Meter value={amt} max={totalExpense} />
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <h2 className="font-display text-lead text-ink">ใครต้องโอนเพิ่ม</h2>
          <p className="mt-2 text-fine text-stone border-b border-mist-deep pb-5">
            ยอดสุทธิ คือเงินที่ออกไปแล้ว ลบด้วยส่วนเฉลี่ย {baht(perPerson)}
          </p>

          {confirmedMembers.length === 0 ? (
            <p className="mt-6 text-body text-stone">
              ยังไม่มีใครคอนเฟิร์มไป เพิ่มชื่อเพื่อนก่อนแล้วยอดจะคำนวณให้เอง
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-mist-deep">
              {confirmedMembers.map((member) => {
                const paid = memberPaidMap[member.id] || 0;
                const netBalance = paid - perPerson;
                const isOwed = netBalance > 0;
                const isEven = netBalance === 0;

                return (
                  <li key={member.id} className="py-4 flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-1.5 h-1.5 shrink-0"
                        style={{ backgroundColor: member.avatarColor }}
                        aria-hidden="true"
                      />
                      <span className="text-body text-ink truncate">{member.nickname}</span>
                      <span className="text-fine text-stone shrink-0">
                        ออกไป {baht(paid)}
                      </span>
                    </span>

                    <span className="text-right shrink-0">
                      <span className={`block text-body ${isEven ? 'text-stone' : 'text-ink'}`}>
                        {isOwed
                          ? `รับคืน ${baht(netBalance)}`
                          : isEven
                            ? 'พอดี'
                            : `โอนเพิ่ม ${baht(Math.abs(netBalance))}`}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel className="mt-px">
        <div className="flex items-baseline justify-between gap-4 border-b border-mist-deep pb-5">
          <h2 className="font-display text-lead text-ink">รายการทั้งหมด</h2>
          <span className="text-fine text-stone">{trip.expenses.length} รายการ</span>
        </div>

        {trip.expenses.length === 0 ? (
          <Empty
            title="ยังไม่มีใครควักเงิน"
            note="บันทึกยอดแรกไว้ เช่น มัดจำที่พัก หรือค่าของสดที่ซื้อล่วงหน้า"
            action={
              <button onClick={handleOpenNewModal} className={btnLink}>
                <Plus className="w-3.5 h-3.5" />
                บันทึกรายการแรก
              </button>
            }
          />
        ) : (
          <ul className="divide-y divide-mist-deep">
            {trip.expenses.map((exp) => {
              const payer = trip.members.find((m) => m.id === exp.payerId);

              return (
                <li key={exp.id} className="py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-body text-ink">{exp.title}</p>
                    <p className="mt-1 text-fine text-stone">
                      {CATEGORY_LABEL[exp.category]} · {payer?.nickname || 'ไม่ระบุคนจ่าย'} ·{' '}
                      {exp.date}
                      {exp.notes && ` · ${exp.notes}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-5 shrink-0">
                    <span className="text-body text-ink">{baht(exp.amount)}</span>
                    <button
                      onClick={() => handleOpenEditModal(exp)}
                      className="text-stone hover:text-ink transition-colors"
                      aria-label={`แก้ไขรายการ ${exp.title}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="text-stone hover:text-ink transition-colors"
                      aria-label={`ลบรายการ ${exp.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {isExpenseModalOpen && (
        <Modal
          title={editingExpense ? 'แก้ไขรายการ' : 'บันทึกค่าใช้จ่าย'}
          onClose={() => setIsExpenseModalOpen(false)}
          wide
        >
          <form onSubmit={handleSaveExpense} className="space-y-5">
            <Field label="ชื่อรายการ" htmlFor="exp-title">
              <input
                id="exp-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="หมูกระทะและเนื้อสัตว์ จากแม็คโคร"
                className={input}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="จำนวนเงิน บาท" htmlFor="exp-amount">
                <input
                  id="exp-amount"
                  type="number"
                  min={1}
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="3500"
                  className={input}
                />
              </Field>
              <Field label="หมวดหมู่" htmlFor="exp-cat">
                <select
                  id="exp-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Expense['category'])}
                  className={input}
                >
                  <option value="accommodation">ที่พัก</option>
                  <option value="food">อาหารและเครื่องดื่ม</option>
                  <option value="fuel">น้ำมันและทางด่วน</option>
                  <option value="tickets">ค่าเข้าและบัตรกิจกรรม</option>
                  <option value="other">อื่น ๆ</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="ใครสำรองจ่าย" htmlFor="exp-payer">
                <select
                  id="exp-payer"
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                  className={input}
                >
                  {trip.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nickname}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="วันที่จ่าย" htmlFor="exp-date">
                <input
                  id="exp-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={input}
                />
              </Field>
            </div>

            <Field label="หมายเหตุ" htmlFor="exp-notes">
              <input
                id="exp-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เก็บสลิปไว้แล้ว หารทุกคน"
                className={input}
              />
            </Field>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className={`flex-1 ${btnQuiet}`}
              >
                ยกเลิก
              </button>
              <button type="submit" className={`flex-1 ${btnSolid}`}>
                บันทึก
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
