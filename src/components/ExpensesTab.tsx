import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  QrCode,
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  Wallet,
  Coins,
  Building2,
  UtensilsCrossed,
  Fuel,
  Ticket,
  Tag,
  Copy,
  Check,
  Search,
  Users,
  RotateCcw,
  Sparkles,
  FileCheck,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { TripData, Expense, Member, Payment, TripListEditor } from '../types/trip';
import { PromptPayQR } from './PromptPayQR';
import { SlipField } from './SlipField';
import { Balance, Transfer, calculateBalances, settleUp } from '../services/settlement';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Modal, Field, Empty, Meter } from './ui';
import { input, btnSolid, btnQuiet, btnBrass, btnLink, baht, initialOf } from './ui-kit';

interface ExpensesTabProps extends TripListEditor {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
  me: Member | null;
}

const CATEGORY_CONFIG: Record<
  Expense['category'],
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    pillClass: string;
    borderClass: string;
  }
> = {
  accommodation: {
    label: 'ที่พัก',
    icon: Building2,
    pillClass: 'bg-[#e9eff1] text-[#1b3b2b]',
    borderClass: 'border-[#cbd8dc]',
  },
  food: {
    label: 'อาหาร & เครื่องดื่ม',
    icon: UtensilsCrossed,
    pillClass: 'bg-[#f7efe3] text-[#8a5b1a]',
    borderClass: 'border-[#e7d5bd]',
  },
  fuel: {
    label: 'น้ำมัน & ทางด่วน',
    icon: Fuel,
    pillClass: 'bg-[#eaf1ec] text-[#244b36]',
    borderClass: 'border-[#cfded2]',
  },
  tickets: {
    label: 'ค่าเข้า & กิจกรรม',
    icon: Ticket,
    pillClass: 'bg-[#f6ede7] text-[#934426]',
    borderClass: 'border-[#e8d1c5]',
  },
  other: {
    label: 'อื่น ๆ',
    icon: Tag,
    pillClass: 'bg-mist text-stone',
    borderClass: 'border-mist-deep',
  },
};

const SUGGESTED_PRESETS: Array<{
  title: string;
  category: Expense['category'];
  amount: number;
  notes: string;
}> = [
  {
    title: 'มัดจำที่พัก Harper Pool Villa Khaoyai',
    category: 'accommodation',
    amount: 12900,
    notes: 'บ้านพักสไตล์มินิมอลญี่ปุ่น 4 ห้องนอน 4 ห้องน้ำ คืน 31 ต.ค.',
  },
  {
    title: 'เสบียงบาร์บีคิว & เครื่องดื่ม (แม็คโคร ปากช่อง)',
    category: 'food',
    amount: 4200,
    notes: 'เนื้อย่าง หมูหมัก ผักสด ขนม และเครื่องดื่มปาร์ตี้ริมสระ',
  },
  {
    title: 'บัตรประลองความเร็ว Khaoyai Speedkart',
    category: 'tickets',
    amount: 2800,
    notes: 'รอบประลองโกคาร์ทช่วงสาย',
  },
  {
    title: 'ค่าน้ำมัน & ทางด่วน มุ่งหน้าสู่เขาใหญ่',
    category: 'fuel',
    amount: 1200,
    notes: 'ค่าน้ำมันและค่าผ่านทางกองกลาง',
  },
];

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  trip,
  onSaveItem,
  onRemoveItem,
  me,
}) => {
  const [view, setView] = useState<'list' | 'settle' | 'ledger'>('list');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Expense['category']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedExpenseIds, setExpandedExpenseIds] = useState<Record<string, boolean>>({});

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const defaultPayerId = me?.id || trip.members[0]?.id || '';
  const [payerId, setPayerId] = useState(defaultPayerId);
  const [category, setCategory] = useState<Expense['category']>('food');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('2026-10-31');
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [isCustomSplit, setIsCustomSplit] = useState(false);
  const [expenseSlipId, setExpenseSlipId] = useState<string | undefined>();

  // Payment / Settlement Modal
  const [payingTransfer, setPayingTransfer] = useState<Transfer | null>(null);
  const [paySlipId, setPaySlipId] = useState<string | undefined>();
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // Calculated balances & settlement
  const payments = useMemo(() => trip.payments ?? [], [trip.payments]);
  const balances = useMemo(
    () => calculateBalances(trip.expenses, trip.members, payments),
    [trip.expenses, trip.members, payments]
  );
  const transfers = useMemo(() => settleUp(balances), [balances]);

  const totalExpense = useMemo(
    () => trip.expenses.reduce((sum, e) => sum + e.amount, 0),
    [trip.expenses]
  );

  const confirmedMembers = useMemo(
    () => trip.members.filter((m) => m.status === 'confirmed'),
    [trip.members]
  );

  const eligibleMembers = useMemo(
    () => trip.members.filter((m) => m.status !== 'declined'),
    [trip.members]
  );

  const averageShare = balances.length ? Math.round(totalExpense / balances.length) : 0;

  const nameOf = (id: string) =>
    trip.members.find((m) => m.id === id)?.nickname ?? 'ไม่ระบุ';

  const memberOf = (id: string) => trip.members.find((m) => m.id === id);

  const promptPayOf = (id: string) => {
    const member = trip.members.find((m) => m.id === id);
    return member?.promptPayId?.trim() || member?.phone?.trim() || '';
  };

  const myBalance = useMemo(
    () => (me ? balances.find((b) => b.memberId === me.id) : null),
    [me, balances]
  );

  // Category summary groups
  const categoryGroups = useMemo(() => {
    return (Object.keys(CATEGORY_CONFIG) as Expense['category'][])
      .map((cat) => {
        const items = trip.expenses.filter((e) => e.category === cat);
        return {
          cat,
          label: CATEGORY_CONFIG[cat].label,
          icon: CATEGORY_CONFIG[cat].icon,
          count: items.length,
          total: items.reduce((n, e) => n + e.amount, 0),
        };
      })
      .filter((g) => g.count > 0)
      .sort((a, b) => b.total - a.total);
  }, [trip.expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return trip.expenses.filter((exp) => {
      const matchCat = categoryFilter === 'all' || exp.category === categoryFilter;
      const payerName = nameOf(exp.payerId).toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payerName.includes(searchQuery.toLowerCase()) ||
        (exp.notes && exp.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [trip.expenses, categoryFilter, searchQuery]);

  const toggleExpenseExpand = (id: string) => {
    setExpandedExpenseIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSeedSampleExpenses = () => {
    const p0 = trip.members[0]?.id || 'm-1';
    const p1 = trip.members[1]?.id || p0;
    const p2 = trip.members[2]?.id || p0;
    const p3 = trip.members[3]?.id || p0;

    const sampleItems: Expense[] = [
      {
        id: `exp-${Date.now()}-1`,
        title: 'มัดจำที่พัก Harper Pool Villa Khaoyai',
        amount: 12900,
        payerId: p0,
        category: 'accommodation',
        date: '2026-10-31',
        notes: 'บ้านพักสไตล์มินิมอลญี่ปุ่น 4 ห้องนอน 4 ห้องน้ำ สระน้ำเกลือ',
      },
      {
        id: `exp-${Date.now()}-2`,
        title: 'เสบียงบาร์บีคิว & เครื่องดื่ม (แม็คโคร ปากช่อง)',
        amount: 4200,
        payerId: p1,
        category: 'food',
        date: '2026-10-31',
        notes: 'เนื้อริบอาย, หมูหมัก, ผักสด, ขนม และเครื่องดื่มปาร์ตี้ริมสระ',
      },
      {
        id: `exp-${Date.now()}-3`,
        title: 'บัตรประลองความเร็ว Khaoyai Speedkart',
        amount: 2800,
        payerId: p2,
        category: 'tickets',
        date: '2026-10-31',
        notes: 'รอบประลองโกคาร์ทช่วงสาย',
      },
      {
        id: `exp-${Date.now()}-4`,
        title: 'ค่าน้ำมัน & ทางด่วน มุ่งหน้าสู่เขาใหญ่',
        amount: 1200,
        payerId: p3,
        category: 'fuel',
        date: '2026-10-31',
        notes: 'ค่าน้ำมันและค่าผ่านทางกองกลาง',
      },
    ];

    sampleItems.forEach((item) => onSaveItem('expenses', item));
  };

  const handleOpenNewModal = (preset?: (typeof SUGGESTED_PRESETS)[0]) => {
    setEditingExpense(null);
    if (preset) {
      setTitle(preset.title);
      setAmount(preset.amount);
      setCategory(preset.category);
      setNotes(preset.notes);
    } else {
      setTitle('');
      setAmount('');
      setCategory('food');
      setNotes('');
    }
    setPayerId(defaultPayerId);
    setDate('2026-10-31');
    setSplitBetween([]);
    setIsCustomSplit(false);
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
    const hasCustom = Boolean(exp.splitBetween && exp.splitBetween.length > 0);
    setIsCustomSplit(hasCustom);
    setSplitBetween(exp.splitBetween ?? []);
    setExpenseSlipId(exp.slipId);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const expensePayload: Expense = {
      id: editingExpense ? editingExpense.id : `exp-${Date.now()}`,
      title: title.trim(),
      amount: Number(amount),
      payerId,
      category,
      splitBetween: isCustomSplit && splitBetween.length > 0 ? splitBetween : undefined,
      date,
      notes: notes.trim() || undefined,
      slipId: expenseSlipId,
    };

    onSaveItem('expenses', expensePayload);
    setIsExpenseModalOpen(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const exp = trip.expenses.find((e) => e.id === expenseId);
    if (!window.confirm(`ลบรายการ "${exp?.title ?? 'นี้'}" ออกจากบัญชี?`)) return;
    onRemoveItem('expenses', expenseId);
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

    onSaveItem('payments', payment);
    setPayingTransfer(null);
    setPaySlipId(undefined);
  };

  const handleDeletePayment = (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;
    if (
      !window.confirm(
        `ยกเลิกรายการโอนของ ${nameOf(payment.fromId)} ให้ ${nameOf(payment.toId)} (${baht(
          payment.amount
        )})? ยอดจะกลับมาค้างชำระเหมือนเดิม`
      )
    ) {
      return;
    }
    onRemoveItem('payments', paymentId);
  };

  const copyToClipboard = (text: string, type: 'promptpay' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'promptpay') {
      setCopiedPromptPay(true);
      setTimeout(() => setCopiedPromptPay(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  // Split calculation helper
  const getExpenseSplit = (exp: Expense) => {
    const eligibleIds = new Set(eligibleMembers.map((m) => m.id));
    const targetIds = exp.splitBetween?.length
      ? exp.splitBetween.filter((id) => eligibleIds.has(id))
      : confirmedMembers.map((m) => m.id);

    if (targetIds.length === 0) return null;
    const base = Math.floor(exp.amount / targetIds.length);
    const remainder = exp.amount - base * targetIds.length;
    return { targetIds, base, remainder };
  };

  // Settlement metrics
  const totalSettledAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPendingTransfersAmount = transfers.reduce((sum, t) => sum + t.amount, 0);
  const totalTransfersRequired = transfers.length;

  return (
    <div className="pb-20 max-w-5xl mx-auto">
      {/* Editorial Page Head */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface text-[11px] font-medium text-ink tracking-wide uppercase mb-2">
            <Receipt className="w-3.5 h-3.5 text-brass" />
            <span>旅の会計 · Khao Yai Settlement</span>
          </div>
          <h1 className="font-display text-display text-ink leading-tight">
            งบและการหารเงิน
          </h1>
          <p className="mt-1 text-body text-stone">
            บันทึกทุกยอดที่มีคนสำรองจ่าย หารบิลตามจริง แล้วเคลียร์เงินคืนด้วย PromptPay ไร้เศษค้าง
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2.5">
          <button
            onClick={() => handleOpenNewModal()}
            className={`${btnSolid} flex items-center gap-2 shadow-sm`}
          >
            <Plus className="w-4 h-4" />
            <span>บันทึกค่าใช้จ่าย</span>
          </button>
        </div>
      </div>

      {/* Financial Executive Summary Bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 mb-6">
        {/* Total Expense Card */}
        <div className="md:col-span-2 bg-paper rounded-panel p-5 sm:p-6 border border-mist-deep shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-fine font-medium text-stone flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-brass" />
                ยอดรวมค่าใช้จ่ายทั้งทริป
              </span>
              <span className="text-fine text-stone font-mono">
                {trip.expenses.length} รายการ
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-display text-display sm:text-[3rem] text-ink leading-none tabular-nums font-semibold tracking-tight">
                {baht(totalExpense)}
              </span>
            </div>
            <p className="mt-2 text-fine text-stone">
              เฉลี่ยคนละ <span className="text-ink font-medium tabular-nums">{baht(averageShare)}</span>{' '}
              (คำนวณจากเพื่อน {balances.length} คน)
            </p>
          </div>

          {/* Visual Category Distribution Bar */}
          {totalExpense > 0 && categoryGroups.length > 0 && (
            <div className="mt-5 pt-4 border-t border-mist-deep">
              <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-mist gap-0.5">
                {categoryGroups.map((g) => {
                  const pct = (g.total / totalExpense) * 100;
                  const bgClass =
                    g.cat === 'accommodation'
                      ? 'bg-[#406859]'
                      : g.cat === 'food'
                      ? 'bg-[#c89b4b]'
                      : g.cat === 'fuel'
                      ? 'bg-[#5b8772]'
                      : g.cat === 'tickets'
                      ? 'bg-[#b86949]'
                      : 'bg-[#8c948e]';
                  return (
                    <div
                      key={g.cat}
                      style={{ width: `${pct}%` }}
                      className={`${bgClass} transition-all duration-300`}
                      title={`${g.label}: ${baht(g.total)} (${Math.round(pct)}%)`}
                    />
                  );
                })}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone">
                {categoryGroups.map((g) => (
                  <span key={g.cat} className="inline-flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        g.cat === 'accommodation'
                          ? 'bg-[#406859]'
                          : g.cat === 'food'
                          ? 'bg-[#c89b4b]'
                          : g.cat === 'fuel'
                          ? 'bg-[#5b8772]'
                          : g.cat === 'tickets'
                          ? 'bg-[#b86949]'
                          : 'bg-[#8c948e]'
                      }`}
                    />
                    <span>{g.label}</span>
                    <span className="tabular-nums font-mono text-ink/80">
                      {Math.round((g.total / totalExpense) * 100)}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Personal Status Card */}
        <div className="bg-paper rounded-panel p-5 sm:p-6 border border-mist-deep shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-fine font-medium text-stone flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-brass" />
                สถานะของคุณ
              </span>
              {me && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface text-ink font-medium">
                  {me.nickname}
                </span>
              )}
            </div>

            {me && myBalance ? (
              <div className="mt-3">
                {myBalance.net < 0 ? (
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#faeee9] text-[#934426] text-fine font-medium mb-1">
                      คุณต้องโอนให้เพื่อน
                    </span>
                    <p className="font-display text-title sm:text-[2rem] text-[#934426] font-semibold tabular-nums leading-none mt-1">
                      {baht(Math.abs(myBalance.net))}
                    </p>
                    <p className="mt-2 text-fine text-stone">
                      จากส่วนแบ่ง {baht(myBalance.owes)}
                    </p>
                    <button
                      onClick={() => setView('settle')}
                      className="mt-3 inline-flex items-center gap-1.5 text-fine text-brass font-medium hover:underline cursor-pointer"
                    >
                      ดูรายการที่ต้องโอน <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : myBalance.net > 0 ? (
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#eaf1ec] text-[#244b36] text-fine font-medium mb-1">
                      เพื่อนต้องโอนคืนคุณ
                    </span>
                    <p className="font-display text-title sm:text-[2rem] text-[#244b36] font-semibold tabular-nums leading-none mt-1">
                      {baht(myBalance.net)}
                    </p>
                    <p className="mt-2 text-fine text-stone">
                      สำรองจ่ายแล้ว {baht(myBalance.paid)}
                    </p>
                    <button
                      onClick={() => setView('settle')}
                      className="mt-3 inline-flex items-center gap-1.5 text-fine text-moss font-medium hover:underline cursor-pointer"
                    >
                      เช็คยอดรอรับเงิน <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface text-stone text-fine font-medium mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-moss" />
                      เคลียร์พอดี
                    </span>
                    <p className="font-display text-title text-ink font-semibold tabular-nums leading-none mt-1">
                      ฿0
                    </p>
                    <p className="mt-2 text-fine text-stone">
                      ยอดเงินของคุณเคลียร์ลงตัวเรียบร้อยแล้ว
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-fine text-stone">
                  ยังไม่ได้เลือกชื่อของคุณ ระบุชื่อที่มุมขวาบนเพื่อดูยอดส่วนตัว
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {confirmedMembers.slice(0, 4).map((m) => (
                    <span
                      key={m.id}
                      className="text-[11px] px-2 py-1 rounded bg-surface text-stone"
                    >
                      {m.nickname}
                    </span>
                  ))}
                  {confirmedMembers.length > 4 && (
                    <span className="text-[11px] px-1.5 py-1 text-stone/70">
                      +{confirmedMembers.length - 4} คน
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settlement Progress Card */}
        <div className="bg-paper rounded-panel p-5 sm:p-6 border border-mist-deep shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-fine font-medium text-stone flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-brass" />
                สถานะการเคลียร์บิล
              </span>
              <span className="text-fine text-stone">
                {totalTransfersRequired === 0 ? 'ครบ 100%' : `รอโอน ${transfers.length}`}
              </span>
            </div>

            <div className="mt-3">
              <p className="font-display text-title sm:text-[2rem] text-ink font-semibold tabular-nums leading-none">
                {transfers.length === 0 ? '0 ยอดค้าง' : `${transfers.length} ยอดรอโอน`}
              </p>
              <p className="mt-2 text-fine text-stone tabular-nums">
                โอนเรียบร้อยแล้ว {payments.length} รายการ ({baht(totalSettledAmount)})
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-mist-deep flex items-center justify-between text-fine">
            <span className="text-stone">ยอดคงเหลือรอโอน</span>
            <span className="text-ink font-medium font-mono tabular-nums">
              {baht(totalPendingTransfersAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-paper rounded-panel p-1.5 sm:p-2 mb-6 border border-mist-deep shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setView('list')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-ctl text-body transition-all cursor-pointer whitespace-nowrap ${
            view === 'list'
              ? 'bg-ink text-paper font-medium shadow-xs'
              : 'text-stone hover:text-ink hover:bg-surface/80'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>รายการค่าใช้จ่าย</span>
          <span
            className={`text-fine px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
              view === 'list' ? 'bg-paper/20 text-paper' : 'bg-surface text-stone'
            }`}
          >
            {trip.expenses.length}
          </span>
        </button>

        <button
          onClick={() => setView('settle')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-ctl text-body transition-all cursor-pointer whitespace-nowrap ${
            view === 'settle'
              ? 'bg-ink text-paper font-medium shadow-xs'
              : 'text-stone hover:text-ink hover:bg-surface/80'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>คิดตังกัน & ใครโอนให้ใคร</span>
          {transfers.length > 0 && (
            <span
              className={`text-fine px-2 py-0.2 rounded-full font-mono tabular-nums ${
                view === 'settle'
                  ? 'bg-brass text-ink font-semibold'
                  : 'bg-brass/20 text-brass font-medium'
              }`}
            >
              {transfers.length} รอโอน
            </span>
          )}
        </button>

        <button
          onClick={() => setView('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-ctl text-body transition-all cursor-pointer whitespace-nowrap ${
            view === 'ledger'
              ? 'bg-ink text-paper font-medium shadow-xs'
              : 'text-stone hover:text-ink hover:bg-surface/80'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>สมุดบัญชีรายบุคคล</span>
          <span
            className={`text-fine px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
              view === 'ledger' ? 'bg-paper/20 text-paper' : 'bg-surface text-stone'
            }`}
          >
            {balances.length}
          </span>
        </button>
      </div>

      {/* VIEW 1: EXPENSES LOG */}
      {view === 'list' && (
        <div className="space-y-4">
          {/* Filter, Search & Quick Presets */}
          <div className="bg-paper rounded-panel p-4 sm:p-5 border border-mist-deep shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone/70 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาตามชื่อรายการ หรือคนสำรองจ่าย…"
                  className="w-full pl-9 pr-3.5 py-2 text-fine rounded-ctl bg-surface/80 border border-transparent focus:outline-none focus:border-ink/40 focus:bg-paper transition-colors"
                />
              </div>

              {/* Add Expense Action */}
              <button
                onClick={() => handleOpenNewModal()}
                className={`${btnBrass} flex items-center gap-1.5 text-fine py-2 px-4 shrink-0`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มรายการใหม่</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="mt-4 pt-3 border-t border-mist-deep flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-full text-fine font-medium transition-colors cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-ink text-paper'
                    : 'bg-surface text-stone hover:text-ink'
                }`}
              >
                ทั้งหมด ({trip.expenses.length})
              </button>

              {(Object.keys(CATEGORY_CONFIG) as Expense['category'][]).map((cat) => {
                const count = trip.expenses.filter((e) => e.category === cat).length;
                const IconComponent = CATEGORY_CONFIG[cat].icon;
                const isSelected = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-fine font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-ink text-paper'
                        : 'bg-surface text-stone hover:text-ink'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{CATEGORY_CONFIG[cat].label}</span>
                    <span className="font-mono tabular-nums opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Suggestion Presets (Shown when 0 or few expenses) */}
          {trip.expenses.length === 0 && (
            <div className="bg-paper rounded-panel p-5 border border-dashed border-brass/50 bg-[#fffdfa]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                <div className="flex items-center gap-2 text-fine text-brass font-medium">
                  <Sparkles className="w-4 h-4 text-brass shrink-0" />
                  <span>คลิกเพื่อเพิ่มรายการยอดนิยมของทริปเขาใหญ่ทันที (Presets)</span>
                </div>
                <button
                  type="button"
                  onClick={handleSeedSampleExpenses}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brass/15 text-brass text-fine font-medium hover:bg-brass hover:text-paper transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>โหลด 4 รายการแนะนำทั้งหมด</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUGGESTED_PRESETS.map((preset, idx) => {
                  const Icon = CATEGORY_CONFIG[preset.category].icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOpenNewModal(preset)}
                      className="flex items-start justify-between gap-3 p-3 rounded-ctl bg-paper border border-mist-deep hover:border-brass/70 text-left transition-colors group cursor-pointer"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-md ${
                            CATEGORY_CONFIG[preset.category].pillClass
                          } shrink-0 mt-0.5`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-fine font-medium text-ink group-hover:text-brass transition-colors truncate">
                            {preset.title}
                          </p>
                          <p className="text-[11px] text-stone truncate">{preset.notes}</p>
                        </div>
                      </div>
                      <span className="text-fine font-semibold font-mono text-ink shrink-0 tabular-nums">
                        {baht(preset.amount)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expenses List */}
          {filteredExpenses.length === 0 ? (
            <Panel>
              <Empty
                title={
                  searchQuery
                    ? 'ไม่พบรายการที่ค้นหา'
                    : 'ยังไม่มีรายการค่าใช้จ่ายในหมวดนี้'
                }
                note={
                  searchQuery
                    ? 'ลองค้นหาด้วยคำอื่น หรือกดล้างการค้นหา'
                    : 'บันทึกค่าที่พัก ค่าของสด หรือค่าน้ำมัน เพื่อเริ่มหารเงินกับเพื่อน'
                }
                action={
                  <button onClick={() => handleOpenNewModal()} className={btnSolid}>
                    <Plus className="w-4 h-4 mr-1.5 inline" />
                    บันทึกค่าใช้จ่าย
                  </button>
                }
              />
            </Panel>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((exp) => {
                const payer = memberOf(exp.payerId);
                const split = getExpenseSplit(exp);
                const isExpanded = Boolean(expandedExpenseIds[exp.id]);
                const IconComponent = CATEGORY_CONFIG[exp.category].icon;

                return (
                  <div
                    key={exp.id}
                    className="bg-paper rounded-panel border border-mist-deep shadow-xs hover:border-ink/20 transition-all overflow-hidden"
                  >
                    {/* Header Row */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className={`p-2.5 rounded-ctl ${
                            CATEGORY_CONFIG[exp.category].pillClass
                          } shrink-0 mt-0.5`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display text-lead font-medium text-ink truncate">
                              {exp.title}
                            </h3>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full ${
                                CATEGORY_CONFIG[exp.category].pillClass
                              }`}
                            >
                              {CATEGORY_CONFIG[exp.category].label}
                            </span>
                            {exp.slipId && (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#eaf1ec] text-[#244b36]">
                                <FileCheck className="w-3 h-3" />
                                แนบสลิปแล้ว
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-fine text-stone">
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: payer?.avatarColor ?? '#999' }}
                              />
                              <span className="text-ink font-medium">
                                {payer?.nickname ?? 'ไม่ระบุคนจ่าย'}
                              </span>
                              <span>สำรองจ่าย</span>
                            </span>
                            <span>·</span>
                            <span>{exp.date}</span>
                            <span>·</span>
                            {split && (
                              <span className="text-ink font-mono tabular-nums">
                                ตกคนละ {baht(split.base)} ({split.targetIds.length} คน)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-mist-deep/60">
                        <div className="text-left sm:text-right">
                          <span className="font-display text-title sm:text-[1.5rem] font-semibold text-ink tabular-nums block">
                            {baht(exp.amount)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(exp)}
                            className="p-1.5 rounded text-stone hover:text-ink hover:bg-surface transition-colors"
                            title="แก้ไขรายการ"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 rounded text-stone hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="ลบรายการ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleExpenseExpand(exp.id)}
                            className="p-1.5 rounded text-stone hover:text-ink hover:bg-surface transition-colors ml-1"
                            title={isExpanded ? 'ย่อรายละเอียด' : 'ดูรายละเอียดการหาร'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Breakdown Fold */}
                    {isExpanded && (
                      <div className="bg-surface/50 px-5 py-4 border-t border-mist-deep space-y-4 text-fine">
                        {exp.notes && (
                          <div className="text-stone">
                            <span className="font-medium text-ink">หมายเหตุ:</span>{' '}
                            {exp.notes}
                          </div>
                        )}

                        {split && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-ink flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-brass" />
                                ผู้ร่วมหารยอดนี้ ({split.targetIds.length} คน)
                              </span>
                              <span className="text-stone font-mono tabular-nums">
                                {baht(exp.amount)} ÷ {split.targetIds.length} คน ={' '}
                                {baht(split.base)}/คน
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                              {split.targetIds.map((id) => {
                                const m = memberOf(id);
                                return (
                                  <span
                                    key={id}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-paper border border-mist-deep text-ink"
                                  >
                                    <span
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{ backgroundColor: m?.avatarColor ?? '#999' }}
                                    />
                                    <span>{m?.nickname ?? nameOf(id)}</span>
                                    <span className="text-stone font-mono tabular-nums">
                                      {baht(split.base)}
                                    </span>
                                  </span>
                                );
                              })}
                            </div>

                            {split.remainder > 0 && (
                              <p className="mt-2 text-[11px] text-stone/80">
                                เศษปัดเศษ {split.remainder} บาท เฉลี่ยให้{' '}
                                {split.targetIds
                                  .slice(0, split.remainder)
                                  .map(nameOf)
                                  .join(', ')}{' '}
                                คนละ 1 บาท
                              </p>
                            )}
                          </div>
                        )}

                        {/* Slip Attachment View */}
                        {exp.slipId && (
                          <div className="pt-2 border-t border-mist-deep/60">
                            <span className="block font-medium text-ink mb-2">
                              ใบเสร็จ / หลักฐานการจ่าย
                            </span>
                            <SlipField
                              tripId={trip.id}
                              slipId={exp.slipId}
                              uploadedBy={me?.nickname ?? 'เพื่อนร่วมทริป'}
                              label="ใบเสร็จ"
                              onChange={(slipId) =>
                                onSaveItem('expenses', { ...exp, slipId })
                              }
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SETTLEMENT & TRANSFERS */}
      {view === 'settle' && (
        <div className="space-y-6">
          {/* Guide Banner */}
          <div className="bg-paper rounded-panel p-5 sm:p-6 border border-mist-deep shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-full bg-brass/15 text-brass shrink-0 mt-0.5">
                <ArrowRightLeft className="w-5 h-5 text-brass" />
              </div>
              <div>
                <h2 className="font-display text-lead font-semibold text-ink">
                  สรุปยอดโอนเคลียร์เงิน (Settlement Plan)
                </h2>
                <p className="mt-1 text-fine text-stone leading-relaxed">
                  ระบบคำนวณการโอนเงินที่กระชับที่สุด (Minimised Transfers)
                  เพื่อให้ทุกคนเคลียร์หนี้ค้างให้หมดด้วยจำนวนครั้งการโอนน้อยที่สุด
                  โอนตามรายการด้านล่างนี้แล้วจบครบทุกคนทันที
                </p>
              </div>
            </div>
          </div>

          {/* Transfers List */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-display text-lead font-medium text-ink flex items-center gap-2">
                <span>รายการที่ต้องโอน</span>
                <span className="text-fine px-2 py-0.5 rounded-full bg-surface text-stone font-mono">
                  {transfers.length} ยอด
                </span>
              </h3>
              {transfers.length > 0 && (
                <span className="text-fine text-stone">
                  ยอดรวมที่ต้องโอน {baht(totalPendingTransfersAmount)}
                </span>
              )}
            </div>

            {transfers.length === 0 ? (
              <div className="bg-paper rounded-panel p-10 text-center border border-mist-deep">
                <div className="w-12 h-12 rounded-full bg-[#eaf1ec] text-[#244b36] mx-auto flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lead font-semibold text-ink">
                  ยอดเงินลงตัวเรียบร้อยแล้ว
                </h3>
                <p className="mt-1.5 text-fine text-stone max-w-md mx-auto">
                  {trip.expenses.length === 0
                    ? 'ยังไม่มีรายการค่าใช้จ่าย พอเริ่มบันทึกบิลแล้ว ยอดโอนคืนจะคำนวณขึ้นตรงนี้โดยอัตโนมัติ'
                    : 'ทุกคนจ่ายและรับคืนครบถ้วนสมบูรณ์แล้ว ไม่มีหนี้ค้างกันอีกต่อไป'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {transfers.map((tr, index) => {
                  const fromMember = memberOf(tr.fromId);
                  const toMember = memberOf(tr.toId);
                  const payeePromptPay = promptPayOf(tr.toId);
                  const isMyTransfer = me?.id === tr.fromId;
                  const isTransferToMe = me?.id === tr.toId;

                  return (
                    <div
                      key={`${tr.fromId}-${tr.toId}-${index}`}
                      className={`bg-paper rounded-panel p-5 border transition-all shadow-xs ${
                        isMyTransfer
                          ? 'border-brass bg-[#fffdf9]'
                          : 'border-mist-deep'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Payer and Payee Diagram */}
                        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                          {/* Sender */}
                          <div className="flex items-center gap-2.5 min-w-[120px]">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-paper font-semibold text-fine shrink-0"
                              style={{
                                backgroundColor: fromMember?.avatarColor ?? '#444',
                              }}
                            >
                              {initialOf(fromMember?.nickname ?? nameOf(tr.fromId))}
                            </div>
                            <div className="min-w-0">
                              <span className="block font-medium text-body text-ink truncate">
                                {fromMember?.nickname ?? nameOf(tr.fromId)}
                              </span>
                              <span className="block text-[11px] text-stone">ผู้โอน</span>
                            </div>
                          </div>

                          {/* Arrow & Amount */}
                          <div className="flex flex-col items-center justify-center px-2">
                            <span className="font-display text-lead sm:text-title font-bold text-ink tabular-nums">
                              {baht(tr.amount)}
                            </span>
                            <div className="flex items-center gap-1 text-brass text-[11px] font-medium">
                              <span>โอนให้</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          {/* Receiver */}
                          <div className="flex items-center gap-2.5 min-w-[140px]">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-paper font-semibold text-fine shrink-0"
                              style={{
                                backgroundColor: toMember?.avatarColor ?? '#444',
                              }}
                            >
                              {initialOf(toMember?.nickname ?? nameOf(tr.toId))}
                            </div>
                            <div className="min-w-0">
                              <span className="block font-medium text-body text-ink truncate">
                                {toMember?.nickname ?? nameOf(tr.toId)}
                              </span>
                              <span className="block text-[11px] text-stone truncate">
                                {payeePromptPay
                                  ? `พร้อมเพย์: ${payeePromptPay}`
                                  : 'ยังไม่ใส่เลขพร้อมเพย์'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-mist-deep">
                          <button
                            onClick={() => {
                              setPaySlipId(undefined);
                              setPayingTransfer(tr);
                            }}
                            className={`${btnSolid} flex items-center gap-2 text-fine py-2 px-4`}
                          >
                            <QrCode className="w-4 h-4 text-brass" />
                            <span>
                              {isMyTransfer
                                ? 'สแกนจ่าย QR'
                                : isTransferToMe
                                ? 'เปิด QR ให้เพื่อน'
                                : 'เปิด QR จ่าย'}
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              // Quick settle without slip
                              const payment: Payment = {
                                id: `pay-${Date.now()}`,
                                fromId: tr.fromId,
                                toId: tr.toId,
                                amount: tr.amount,
                                date: new Date().toISOString().split('T')[0],
                              };
                              onSaveItem('payments', payment);
                            }}
                            className="p-2 rounded-ctl text-stone hover:text-moss hover:bg-[#eaf1ec] transition-colors"
                            title="บันทึกว่าโอนแล้วโดยไม่แนบสลิป"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Payments Section */}
          {payments.length > 0 && (
            <div className="bg-paper rounded-panel p-5 sm:p-6 border border-mist-deep">
              <div className="flex items-center justify-between pb-4 border-b border-mist-deep">
                <h3 className="font-display text-lead font-medium text-ink flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-moss" />
                  <span>รายการที่โอนเรียบร้อยแล้ว ({payments.length})</span>
                </h3>
                <span className="text-fine font-mono tabular-nums text-stone">
                  รวม {baht(totalSettledAmount)}
                </span>
              </div>

              <div className="divide-y divide-mist-deep">
                {payments.map((p) => {
                  const fromM = memberOf(p.fromId);
                  const toM = memberOf(p.toId);
                  return (
                    <div key={p.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-[#eaf1ec] text-[#244b36] flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-fine text-ink truncate">
                            <span className="font-medium">
                              {fromM?.nickname ?? nameOf(p.fromId)}
                            </span>{' '}
                            <span className="text-stone">โอนให้</span>{' '}
                            <span className="font-medium">
                              {toM?.nickname ?? nameOf(p.toId)}
                            </span>
                          </p>
                          <p className="text-[11px] text-stone font-mono tabular-nums">
                            {baht(p.amount)} · {p.date}
                            {p.slipId && ' · มีสลิปยืนยัน'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {p.slipId && (
                          <SlipField
                            tripId={trip.id}
                            slipId={p.slipId}
                            uploadedBy={me?.nickname ?? 'เพื่อนร่วมทริป'}
                            onChange={(slipId) =>
                              onSaveItem('payments', { ...p, slipId })
                            }
                          />
                        )}
                        <button
                          onClick={() => handleDeletePayment(p.id)}
                          className="p-1.5 text-stone hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="ยกเลิกรายการนี้ เพื่อให้กลับมาค้างใหม่"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: MEMBER LEDGER */}
      {view === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-paper rounded-panel p-5 sm:p-6 border border-mist-deep shadow-sm">
            <h2 className="font-display text-lead font-semibold text-ink">
              สมุดบัญชีรายบุคคล (Individual Statements)
            </h2>
            <p className="mt-1 text-fine text-stone">
              ตรวจสอบที่มาของเงินทุกบาท ทุกบิลที่ร่วมหาร และทุกยอดที่สำรองจ่ายไป
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {balances.map((balance) => {
              const member = memberOf(balance.memberId);
              const { paid, owes, net, shares, fronted, settledOut, settledIn } = balance;

              return (
                <div
                  key={balance.memberId}
                  className="bg-paper rounded-panel p-5 border border-mist-deep shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-mist-deep">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-paper font-semibold text-fine shrink-0"
                          style={{ backgroundColor: member?.avatarColor ?? '#666' }}
                        >
                          {initialOf(member?.nickname ?? 'U')}
                        </div>
                        <div>
                          <span className="font-display text-body font-medium text-ink block">
                            {member?.nickname ?? nameOf(balance.memberId)}
                            {me?.id === balance.memberId && ' (คุณ)'}
                          </span>
                          <span className="text-[11px] text-stone">
                            {member?.role === 'organizer' ? 'ผู้จัดทริป' : 'สมาชิก'}
                          </span>
                        </div>
                      </div>

                      {/* Net Status Badge */}
                      <span
                        className={`text-fine px-2.5 py-1 rounded-full font-medium font-mono tabular-nums ${
                          net < 0
                            ? 'bg-[#faeee9] text-[#934426]'
                            : net > 0
                            ? 'bg-[#eaf1ec] text-[#244b36]'
                            : 'bg-surface text-stone'
                        }`}
                      >
                        {net < 0
                          ? `ต้องโอนอีก ${baht(Math.abs(net))}`
                          : net > 0
                          ? `รอรับคืน ${baht(net)}`
                          : 'เคลียร์พอดี ฿0'}
                      </span>
                    </div>

                    {/* Breakdown Numbers */}
                    <dl className="mt-3.5 space-y-2 text-fine">
                      <div className="flex justify-between text-stone">
                        <dt>ส่วนแบ่งของตนเอง ({shares.length} รายการ)</dt>
                        <dd className="font-mono tabular-nums text-ink">{baht(owes)}</dd>
                      </div>
                      <div className="flex justify-between text-stone">
                        <dt>สำรองจ่ายไปก่อน ({fronted.length} รายการ)</dt>
                        <dd className="font-mono tabular-nums text-ink">−{baht(paid)}</dd>
                      </div>
                      {settledOut > 0 && (
                        <div className="flex justify-between text-stone">
                          <dt>โอนคืนไปแล้ว</dt>
                          <dd className="font-mono tabular-nums text-ink">−{baht(settledOut)}</dd>
                        </div>
                      )}
                      {settledIn > 0 && (
                        <div className="flex justify-between text-stone">
                          <dt>ได้รับโอนมาแล้ว</dt>
                          <dd className="font-mono tabular-nums text-ink">+{baht(settledIn)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Details Accordion */}
                  <div className="mt-4 pt-3 border-t border-mist-deep">
                    {shares.length > 0 && (
                      <details className="text-fine">
                        <summary className="text-stone hover:text-ink cursor-pointer">
                          ดูรายละเอียดส่วนแบ่ง ({shares.length} รายการ)
                        </summary>
                        <ul className="mt-2.5 space-y-1.5 pl-2 border-l border-mist-deep text-[11px] text-stone font-mono">
                          {shares.map((line) => (
                            <li
                              key={line.expenseId}
                              className="flex justify-between items-baseline gap-2"
                            >
                              <span className="truncate text-ink/90 font-sans">
                                {line.title}
                              </span>
                              <span className="shrink-0 tabular-nums">
                                {baht(line.share)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}

                    {fronted.length > 0 && (
                      <details className="mt-2 text-fine">
                        <summary className="text-stone hover:text-ink cursor-pointer">
                          ดูรายการที่สำรองจ่าย ({fronted.length} รายการ)
                        </summary>
                        <ul className="mt-2.5 space-y-1.5 pl-2 border-l border-mist-deep text-[11px] text-stone font-mono">
                          {fronted.map((line) => (
                            <li
                              key={line.expenseId}
                              className="flex justify-between items-baseline gap-2"
                            >
                              <span className="truncate text-ink/90 font-sans">
                                {line.title}
                              </span>
                              <span className="shrink-0 tabular-nums">
                                {baht(line.amount)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PROMPTPAY PAYMENT MODAL */}
      {payingTransfer && (
        <Modal
          title={`โอนเงินให้ ${nameOf(payingTransfer.toId)}`}
          note={`${nameOf(payingTransfer.fromId)} มียอดค้างชำระ ${baht(
            payingTransfer.amount
          )}`}
          onClose={() => setPayingTransfer(null)}
        >
          <form onSubmit={handleRecordPayment} className="space-y-6">
            {promptPayOf(payingTransfer.toId) ? (
              <div className="space-y-4">
                <PromptPayQR
                  promptPayId={promptPayOf(payingTransfer.toId)}
                  amount={payingTransfer.amount}
                  payeeName={nameOf(payingTransfer.toId)}
                />

                {/* Quick Copy Buttons */}
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(promptPayOf(payingTransfer.toId), 'promptpay')
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ctl bg-surface hover:bg-mist-deep text-fine text-ink font-medium transition-colors"
                  >
                    {copiedPromptPay ? (
                      <Check className="w-3.5 h-3.5 text-moss" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-stone" />
                    )}
                    <span>
                      {copiedPromptPay
                        ? 'คัดลอกเลขพร้อมเพย์แล้ว'
                        : `คัดลอกเลข ${promptPayOf(payingTransfer.toId)}`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(String(payingTransfer.amount), 'amount')
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ctl bg-surface hover:bg-mist-deep text-fine text-ink font-medium transition-colors"
                  >
                    {copiedAmount ? (
                      <Check className="w-3.5 h-3.5 text-moss" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-stone" />
                    )}
                    <span>
                      {copiedAmount ? 'คัดลอกยอดเงินแล้ว' : `คัดลอก ${baht(payingTransfer.amount)}`}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-panel bg-[#fffbf2] border border-brass/40 text-fine text-ink">
                <p className="font-medium text-brass">ยังไม่มีเลขพร้อมเพย์</p>
                <p className="mt-1 text-stone">
                  {nameOf(payingTransfer.toId)} ยังไม่ได้บันทึกเบอร์โทรหรือเลขพร้อมเพย์
                  สามารถโอนผ่านเลขบัญชีธนาคารแล้วนำสลิปมาแนบยืนยันด้านล่างได้
                </p>
              </div>
            )}

            {/* Slip Attachment */}
            <div className="border-t border-mist-deep pt-4">
              <span className="block text-fine font-medium text-ink mb-1.5">
                แนบสลิปหลักฐานการโอน (แนะนำ)
              </span>
              <p className="text-[11px] text-stone mb-3">
                สลิปจะถูกย่อไฟล์และบันทึกให้เพื่อนทุกคนเห็นทันที
              </p>
              <SlipField
                tripId={trip.id}
                slipId={paySlipId}
                uploadedBy={me?.nickname ?? 'เพื่อนร่วมทริป'}
                onChange={setPaySlipId}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPayingTransfer(null)}
                className={`flex-1 ${btnQuiet}`}
              >
                ปิด
              </button>
              <button type="submit" className={`flex-1 ${btnSolid}`}>
                บันทึกว่าโอนเรียบร้อย
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ADD / EDIT EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <Modal
          title={editingExpense ? 'แก้ไขรายการค่าใช้จ่าย' : 'บันทึกค่าใช้จ่ายใหม่'}
          note="ระบุยอดเงิน คนสำรองจ่าย และเลือกเพื่อนร่วมหาร"
          onClose={() => setIsExpenseModalOpen(false)}
          wide
        >
          <form onSubmit={handleSaveExpense} className="space-y-5">
            {/* Quick Title Suggestions */}
            {!editingExpense && (
              <div>
                <span className="block text-[11px] text-stone mb-1.5">
                  เลือกรายการแนะนำด่วน:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTitle(p.title);
                        setAmount(p.amount);
                        setCategory(p.category);
                        setNotes(p.notes);
                      }}
                      className="px-2.5 py-1 rounded-full bg-surface hover:bg-mist-deep text-[11px] text-ink transition-colors cursor-pointer"
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title */}
            <Field label="ชื่อรายการค่าใช้จ่าย" htmlFor="exp-title">
              <input
                id="exp-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น ค่ามัดจำพูลวิลล่า, เนื้อย่างแม็คโคร, ค่าน้ำมัน"
                className={input}
              />
            </Field>

            {/* Amount & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="จำนวนเงิน (บาท)" htmlFor="exp-amount">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone font-display text-body">
                    ฿
                  </span>
                  <input
                    id="exp-amount"
                    type="number"
                    min={1}
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="3500"
                    className={`${input} pl-8 font-mono tabular-nums text-lead font-semibold`}
                  />
                </div>
              </Field>

              <Field label="หมวดหมู่ค่าใช้จ่าย" htmlFor="exp-cat">
                <select
                  id="exp-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Expense['category'])}
                  className={input}
                >
                  <option value="accommodation">ที่พัก</option>
                  <option value="food">อาหาร & เครื่องดื่ม</option>
                  <option value="fuel">น้ำมัน & ทางด่วน</option>
                  <option value="tickets">ค่าเข้า & กิจกรรม</option>
                  <option value="other">อื่น ๆ</option>
                </select>
              </Field>
            </div>

            {/* Payer & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="ใครสำรองจ่ายออกไปก่อน" htmlFor="exp-payer">
                <select
                  id="exp-payer"
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                  className={input}
                >
                  {trip.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nickname} {m.id === me?.id ? ' (ฉัน)' : ''}
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
                >
                </input>
              </Field>
            </div>

            {/* Split Options */}
            <div className="border-t border-mist-deep pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-fine font-medium text-ink">ผู้ร่วมหารค่าใช้จ่าย</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomSplit(false);
                      setSplitBetween([]);
                    }}
                    className={`px-3 py-1 rounded text-fine font-medium transition-colors ${
                      !isCustomSplit
                        ? 'bg-ink text-paper'
                        : 'bg-surface text-stone hover:text-ink'
                    }`}
                  >
                    หารทุกคน ({confirmedMembers.length} คน)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomSplit(true);
                      if (splitBetween.length === 0) {
                        setSplitBetween(confirmedMembers.map((m) => m.id));
                      }
                    }}
                    className={`px-3 py-1 rounded text-fine font-medium transition-colors ${
                      isCustomSplit
                        ? 'bg-ink text-paper'
                        : 'bg-surface text-stone hover:text-ink'
                    }`}
                  >
                    เลือกคนหารเอง
                  </button>
                </div>
              </div>

              {isCustomSplit && (
                <div className="p-3.5 bg-surface/60 rounded-panel border border-mist-deep space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-stone">
                    <span>ติ๊กเลือกผู้ที่ร่วมหารรายการนี้:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSplitBetween(eligibleMembers.map((m) => m.id))}
                        className="text-brass hover:underline"
                      >
                        เลือกทั้งหมด
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setSplitBetween([])}
                        className="text-stone hover:underline"
                      >
                        ล้างทั้งหมด
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {eligibleMembers.map((m) => {
                      const isChecked = splitBetween.includes(m.id);
                      return (
                        <label
                          key={m.id}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-fine cursor-pointer transition-colors border ${
                            isChecked
                              ? 'bg-paper text-ink border-ink/40 font-medium'
                              : 'bg-surface/50 text-stone border-transparent hover:bg-surface'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSplitBetween((prev) => [...prev, m.id]);
                              } else {
                                setSplitBetween((prev) => prev.filter((id) => id !== m.id));
                              }
                            }}
                            className="w-3.5 h-3.5 accent-brass"
                          />
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: m.avatarColor }}
                          />
                          <span>{m.nickname}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Real-time Share Calculation Pill */}
              {amount && amount > 0 && (
                <div className="mt-3 p-2.5 rounded-ctl bg-[#fffdf9] border border-brass/30 flex items-center justify-between text-fine">
                  <span className="text-stone flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-brass" />
                    จำนวนคนหาร:{' '}
                    <span className="text-ink font-semibold">
                      {isCustomSplit && splitBetween.length > 0
                        ? splitBetween.length
                        : confirmedMembers.length}{' '}
                      คน
                    </span>
                  </span>
                  <span className="text-ink font-mono tabular-nums font-semibold">
                    ตกคนละ{' '}
                    {baht(
                      Math.floor(
                        Number(amount) /
                          (isCustomSplit && splitBetween.length > 0
                            ? splitBetween.length
                            : confirmedMembers.length || 1)
                      )
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Slip Attachment */}
            <div className="border-t border-mist-deep pt-4">
              <span className="block text-fine font-medium text-ink mb-1.5">
                สลิปหรือใบเสร็จรับเงิน (ถ้ามี)
              </span>
              <SlipField
                tripId={trip.id}
                slipId={expenseSlipId}
                uploadedBy={me?.nickname ?? 'เพื่อนร่วมทริป'}
                label="ใบเสร็จ"
                onChange={setExpenseSlipId}
              />
            </div>

            {/* Notes */}
            <Field label="หมายเหตุเพิ่มเติม" htmlFor="exp-notes">
              <input
                id="exp-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น รวมค่าจอดรถด้วยแล้ว, ของสดสำหรับมื้อค่ำ"
                className={input}
              />
            </Field>

            {/* Submit / Cancel */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className={`flex-1 ${btnQuiet}`}
              >
                ยกเลิก
              </button>
              <button type="submit" className={`flex-1 ${btnSolid}`}>
                {editingExpense ? 'บันทึกการแก้ไข' : 'บันทึกค่าใช้จ่าย'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ExpensesTab;
