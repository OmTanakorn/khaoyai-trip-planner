import React, { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { TripData, Expense, Member, Payment } from '../types/trip';
import { PromptPayQR } from './PromptPayQR';
import { SlipField } from './SlipField';
import { Transfer } from '../services/settlement';
import { calculateBalances, settleUp } from '../services/settlement';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Modal, Field, Empty, Meter } from './ui';
import { input, btnSolid, btnQuiet, btnLink, baht } from './ui-kit';

interface ExpensesTabProps {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
  me: Member | null;
}

const CATEGORY_LABEL: Record<Expense['category'], string> = {
  accommodation: 'ที่พัก',
  food: 'อาหารและเครื่องดื่ม',
  fuel: 'น้ำมันและทางด่วน',
  tickets: 'ค่าเข้าและบัตรกิจกรรม',
  other: 'อื่น ๆ',
};

export const ExpensesTab: React.FC<ExpensesTabProps> = ({ trip, onUpdateTrip, me }) => {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [payerId, setPayerId] = useState(trip.members[0]?.id || '');
  const [category, setCategory] = useState<Expense['category']>('food');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [expenseSlipId, setExpenseSlipId] = useState<string | undefined>();
  const [payingTransfer, setPayingTransfer] = useState<Transfer | null>(null);
  const [paySlipId, setPaySlipId] = useState<string | undefined>();


  const totalExpense = trip.expenses.reduce((sum, e) => sum + e.amount, 0);

  const payments = trip.payments ?? [];
  const balances = calculateBalances(trip.expenses, trip.members, payments);
  // Shares can be uneven now, so this is an average rather than what anyone
  // actually owes. The transfers below are the real answer.
  const averageShare = balances.length
    ? Math.round(totalExpense / balances.length)
    : 0;
  const transfers = settleUp(balances);
  const nameOf = (id: string) =>
    trip.members.find((m) => m.id === id)?.nickname ?? 'ไม่ระบุ';

  /** PromptPay falls back to the phone number, which is what most people use. */
  const promptPayOf = (id: string) => {
    const member = trip.members.find((m) => m.id === id);
    return member?.promptPayId?.trim() || member?.phone?.trim() || '';
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingTransfer) return;

    const payment: Payment = {
      id: `pay-${Date.now()}`,
      fromId: payingTransfer.fromId,
      toId: payingTransfer.toId,
      amount: payingTransfer.amount,
      date: new Date().toISOString().split('T')[0],
      slipId: paySlipId,
    };

    onUpdateTrip((t) => ({ ...t, payments: [...(t.payments ?? []), payment] }));
    setPayingTransfer(null);
    setPaySlipId(undefined);
  };

  const handleDeletePayment = (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;
    if (
      !window.confirm(
        `ยกเลิกรายการโอน ${nameOf(payment.fromId)} ให้ ${nameOf(payment.toId)}? ยอดจะกลับไปค้างเหมือนเดิม`
      )
    ) {
      return;
    }
    onUpdateTrip((t) => ({
      ...t,
      payments: (t.payments ?? []).filter((p) => p.id !== paymentId),
    }));
  };

  const categoryTotals = trip.expenses.reduce(
    (acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleOpenNewModal = () => {
    setEditingExpense(null);
    setTitle('');
    setAmount('');
    setPayerId(trip.members[0]?.id || '');
    setCategory('food');
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    setSplitBetween([]);
    setExpenseSlipId(undefined);
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
    setSplitBetween(exp.splitBetween ?? []);
    setExpenseSlipId(exp.slipId);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    if (editingExpense) {
      onUpdateTrip((t) => ({
        ...t,
        expenses: t.expenses.map((exp) =>
          exp.id === editingExpense.id
            ? { ...exp, title, amount: Number(amount), payerId, category, notes, date, splitBetween, slipId: expenseSlipId }
            : exp
        ),
      }));
    } else {
      const newExp: Expense = {
        id: `exp-${Date.now()}`,
        title,
        amount: Number(amount),
        payerId,
        category,
        splitBetween,
        date,
        notes,
        slipId: expenseSlipId,
      };
      onUpdateTrip((t) => ({ ...t, expenses: [...t.expenses, newExp] }));
    }
    setIsExpenseModalOpen(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const exp = trip.expenses.find((e) => e.id === expenseId);
    if (!window.confirm(`ลบรายการ ${exp?.title ?? 'นี้'} ออกจากบัญชี?`)) return;
    onUpdateTrip((t) => ({
      ...t,
      expenses: t.expenses.filter((e) => e.id !== expenseId),
    }));
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
          {balances.length > 0 && `เฉลี่ยคนละ ${baht(averageShare)} · `}
          บันทึกไว้ {trip.expenses.length} รายการ
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
          <h2 className="font-display text-lead text-ink">ใครโอนให้ใคร</h2>
          <p className="mt-2 text-fine text-stone border-b border-mist-deep pb-5">
            โอนตามนี้แล้วจบ ไม่ต้องคิดต่อ
          </p>

          {transfers.length === 0 ? (
            <p className="mt-6 text-body text-stone">
              {trip.expenses.length === 0
                ? 'ยังไม่มีรายการ พอเริ่มบันทึกแล้วยอดโอนจะขึ้นตรงนี้'
                : 'ทุกคนจ่ายพอดีแล้ว ไม่มีใครต้องโอนใคร'}
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-mist-deep">
              {transfers.map((tr, i) => (
                <li key={`${tr.fromId}-${tr.toId}-${i}`} className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-body text-ink truncate">
                      {nameOf(tr.fromId)} <span className="text-stone">โอนให้</span>{' '}
                      {nameOf(tr.toId)}
                    </span>
                    <span className="text-body text-ink shrink-0">{baht(tr.amount)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <button
                      onClick={() => {
                        setPaySlipId(undefined);
                        setPayingTransfer(tr);
                      }}
                      className={btnLink}
                    >
                      {me?.id === tr.fromId ? 'จ่ายเลย' : 'เปิดคิวอาร์ให้'}
                    </button>
                    {!promptPayOf(tr.toId) && (
                      <span className="text-fine text-stone">
                        {nameOf(tr.toId)} ยังไม่ได้ใส่เลขพร้อมเพย์
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {payments.length > 0 && (
            <div className="mt-8 pt-5 border-t border-mist-deep">
              <h3 className="text-fine text-stone">โอนแล้ว</h3>
              <ul className="mt-3 divide-y divide-mist-deep">
                {payments.map((payment) => (
                  <li key={payment.id} className="py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-body text-ink truncate">
                          {nameOf(payment.fromId)}{' '}
                          <span className="text-stone">โอนให้</span> {nameOf(payment.toId)}
                        </p>
                        <p className="mt-0.5 text-fine text-stone">
                          {baht(payment.amount)} · {payment.date}
                          {!payment.slipId && ' · ยังไม่มีสลิป'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeletePayment(payment.id)}
                        className="text-stone hover:text-ink transition-colors shrink-0"
                        aria-label={`ยกเลิกรายการโอนของ ${nameOf(payment.fromId)}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {payment.slipId && (
                      <div className="mt-3">
                        <SlipField
                          tripId={trip.id}
                          slipId={payment.slipId}
                          uploadedBy={me?.nickname ?? 'เพื่อนร่วมทริป'}
                          onChange={(slipId) =>
                            onUpdateTrip((t) => ({
                              ...t,
                              payments: (t.payments ?? []).map((p) =>
                                p.id === payment.id ? { ...p, slipId } : p
                              ),
                            }))
                          }
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {balances.length > 0 && (
            <details className="mt-6 pt-5 border-t border-mist-deep">
              <summary className="text-fine text-stone cursor-pointer hover:text-ink">
                ดูยอดของแต่ละคน
              </summary>
              <ul className="mt-4 divide-y divide-mist-deep">
                {balances.map((b) => {
                  const member = trip.members.find((m) => m.id === b.memberId);
                  return (
                    <li key={b.memberId} className="py-3 flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-1.5 h-1.5 shrink-0"
                          style={{ backgroundColor: member?.avatarColor }}
                          aria-hidden="true"
                        />
                        <span className="text-body text-ink truncate">{member?.nickname}</span>
                      </span>
                      <span className="text-fine text-stone shrink-0">
                        ออกไป {baht(b.paid)} · ส่วนตัวเอง {baht(b.owes)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </details>
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
                      {exp.date} ·{' '}
                      {exp.splitBetween?.length
                        ? `หาร ${exp.splitBetween.map(nameOf).join(' ')}`
                        : 'หารทุกคน'}
                      {exp.notes && ` · ${exp.notes}`}
                    </p>
                    {exp.slipId && (
                      <div className="mt-3">
                        <SlipField
                          tripId={trip.id}
                          slipId={exp.slipId}
                          uploadedBy={me?.nickname ?? 'เพื่อนร่วมทริป'}
                          label="ใบเสร็จ"
                          onChange={(slipId) =>
                            onUpdateTrip((t) => ({
                              ...t,
                              expenses: t.expenses.map((x) =>
                                x.id === exp.id ? { ...x, slipId } : x
                              ),
                            }))
                          }
                        />
                      </div>
                    )}
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

      {payingTransfer && (
        <Modal
          title={`โอนให้ ${nameOf(payingTransfer.toId)}`}
          note={`${nameOf(payingTransfer.fromId)} ค้างอยู่ ${baht(payingTransfer.amount)}`}
          onClose={() => setPayingTransfer(null)}
        >
          <form onSubmit={handleRecordPayment} className="space-y-7">
            {promptPayOf(payingTransfer.toId) ? (
              <PromptPayQR
                promptPayId={promptPayOf(payingTransfer.toId)}
                amount={payingTransfer.amount}
                payeeName={nameOf(payingTransfer.toId)}
              />
            ) : (
              <p className="text-body text-stone">
                {nameOf(payingTransfer.toId)} ยังไม่ได้ใส่เลขพร้อมเพย์ ไปเพิ่มได้ที่หน้าเพื่อน
                แล้วคิวอาร์จะขึ้นตรงนี้ ระหว่างนี้โอนเองแล้วมาแนบสลิปได้
              </p>
            )}

            <div className="border-t border-mist-deep pt-6">
              <p className="text-fine text-stone mb-3">
                โอนแล้วแนบสลิปไว้เป็นหลักฐาน จะข้ามก็ได้
              </p>
              <SlipField
                tripId={trip.id}
                slipId={paySlipId}
                uploadedBy={me?.nickname ?? 'เพื่อนร่วมทริป'}
                onChange={setPaySlipId}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPayingTransfer(null)}
                className={`flex-1 ${btnQuiet}`}
              >
                ยังไม่โอน
              </button>
              <button type="submit" className={`flex-1 ${btnSolid}`}>
                โอนแล้ว
              </button>
            </div>
          </form>
        </Modal>
      )}

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

            <fieldset className="border-t border-mist-deep pt-5">
              <legend className="text-fine text-stone mb-3">ใครหารบ้าง</legend>
              <p className="text-fine text-stone mb-4">
                ไม่เลือกใครเลย = หารกับทุกคนที่ไปแน่ ใช้กับค่าที่พักหรือของกองกลาง
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-3">
                {trip.members
                  .filter((m) => m.status !== 'declined')
                  .map((m) => (
                    <label
                      key={m.id}
                      className="inline-flex items-center gap-2 text-body text-ink cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={splitBetween.includes(m.id)}
                        onChange={(e) =>
                          setSplitBetween((current) =>
                            e.target.checked
                              ? [...current, m.id]
                              : current.filter((id) => id !== m.id)
                          )
                        }
                        className="w-4 h-4 accent-brass"
                      />
                      {m.nickname}
                    </label>
                  ))}
              </div>
              {splitBetween.length > 0 && amount ? (
                <p className="mt-4 text-fine text-stone">
                  หาร {splitBetween.length} คน ตกคนละ{' '}
                  {baht(Math.floor(Number(amount) / splitBetween.length))}
                  <button
                    type="button"
                    onClick={() => setSplitBetween([])}
                    className="ml-4 text-ink border-b border-brass pb-0.5 hover:text-brass transition-colors"
                  >
                    หารทุกคนแทน
                  </button>
                </p>
              ) : null}
            </fieldset>

            <div className="border-t border-mist-deep pt-5">
              <p className="text-fine text-stone mb-3">สลิปหรือใบเสร็จ</p>
              <SlipField
                tripId={trip.id}
                slipId={expenseSlipId}
                uploadedBy={me?.nickname ?? 'เพื่อนร่วมทริป'}
                label="ใบเสร็จ"
                onChange={setExpenseSlipId}
              />
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
