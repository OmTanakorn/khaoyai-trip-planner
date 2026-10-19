import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  Flame,
  UtensilsCrossed,
  Soup,
  Beer,
  Wine,
  Coffee,
  ShoppingBag,
  CheckCircle2,
  Coins,
  Receipt,
  ChefHat,
  Salad,
  Sparkles,
  Check,
  Users,
  AlertCircle,
  Tag as TagIcon,
  X,
} from 'lucide-react';
import { TripData, MenuIdea, Member, PackingItem, TripListEditor } from '../types/trip';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Modal, Field, Empty } from './ui';
import { input, btnSolid, btnQuiet, btnLink, btnBrass, baht, voterLabel, initialOf } from './ui-kit';

interface FoodTabProps extends TripListEditor {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
  me: Member | null;
}

const CATEGORY_CONFIG: Record<
  MenuIdea['category'],
  { label: string; icon: React.ComponentType<{ className?: string }>; sublabel: string }
> = {
  grill: { label: 'หมูกระทะ / ปิ้งย่าง', icon: Flame, sublabel: 'BBQ & Grill' },
  main: { label: 'กับข้าว / จานหลัก', icon: UtensilsCrossed, sublabel: 'Main Dish' },
  snack: { label: 'ของทานเล่น / กับแกล้ม', icon: Salad, sublabel: 'Appetizers' },
  drink: { label: 'เครื่องดื่ม / มิกเซอร์', icon: Beer, sublabel: 'Drinks & Bar' },
  dessert: { label: 'ของหวาน / ผลไม้', icon: Coffee, sublabel: 'Dessert' },
  other: { label: 'ยำ / ส้มตำ / อื่น ๆ', icon: ChefHat, sublabel: 'Specialty' },
};

const MEAL_CONFIG: Record<
  MenuIdea['meal'],
  { label: string; jaLabel: string; desc: string }
> = {
  dinner: {
    label: 'มื้อเย็นคืนแรก (ปาร์ตี้บาร์บีคิวพูลวิลล่า)',
    jaLabel: '夕食 · バーベキュー',
    desc: 'สังสรรค์ริมสระ ย่างบาร์บีคิว ร้องคาราโอเกะ ดวลโต๊ะพูลยันดึก',
  },
  latenight: {
    label: 'มื้อดึก / กับแกล้มหลังเที่ยงคืน',
    jaLabel: '夜食 · おつまみ',
    desc: 'กับแกล้มรอบดึก ของทานเล่นเบาๆ ขณะดวลบอร์ดเกมและชนแก้ว',
  },
  breakfast: {
    label: 'มื้อเช้าวันที่สอง (Slow Morning)',
    jaLabel: '朝食 · モーニング',
    desc: 'จิบกาแฟริมสระ ไข่กระทะ ขนมปังปิ้งเบาๆ ก่อนเช็คเอาท์',
  },
  anytime: {
    label: 'เครื่องดื่ม & กินได้ทั้งวัน',
    jaLabel: '飲み物 · いつでも',
    desc: 'เบียร์เย็นฉ่ำ ไวน์ โซจูมิกซ์ น้ำอัดลม น้ำแข็ง และขนมขบเคี้ยว',
  },
};

const parseIngredients = (text: string): string[] | undefined => {
  const lines = text
    .split('\n')
    .map((line) => line.replace(/^[-•*\s]+/, '').trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : undefined;
};

const MEAL_ORDER: MenuIdea['meal'][] = ['dinner', 'latenight', 'breakfast', 'anytime'];

export const FoodTab: React.FC<FoodTabProps> = ({ trip, onSaveItem, onRemoveItem, me }) => {
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuIdea | null>(null);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MenuIdea['category']>('grill');
  const [meal, setMeal] = useState<MenuIdea['meal']>('dinner');
  const [perHead, setPerHead] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [suggestedBy, setSuggestedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState('');

  const menuIdeas = trip.menuIdeas ?? [];
  const confirmedMembers = trip.members.filter((m) => m.status === 'confirmed');
  const eaters = confirmedMembers.length || 10;
  const mostVotes = menuIdeas.reduce((max, m) => Math.max(max, m.votes.length), 0);

  const threshold = Math.max(1, Math.ceil(eaters / 2));
  const isGoing = (m: MenuIdea) => m.approved === true || m.votes.length >= threshold;
  const shortlisted = menuIdeas.filter(isGoing);
  const approvedCount = shortlisted.filter((m) => m.approved === true).length;
  const estimatedPerHead = shortlisted.reduce(
    (sum, m) => sum + (m.estimatedPerHead ?? 0),
    0
  );
  const totalGroupBudget = shortlisted.reduce(
    (sum, m) =>
      sum + (m.totalEstimatedPrice ?? (m.estimatedPerHead ? m.estimatedPerHead * eaters : 0)),
    0
  );

  const openNewModal = () => {
    setEditingMenu(null);
    setTitle('');
    setCategory('grill');
    setMeal('dinner');
    setPerHead('');
    setTotalPrice('');
    setImageUrl('');
    setSuggestedBy(me?.nickname ?? '');
    setNotes('');
    setIngredients('');
    setIsMenuModalOpen(true);
  };

  const openEditModal = (item: MenuIdea) => {
    setEditingMenu(item);
    setTitle(item.title);
    setCategory(item.category);
    setMeal(item.meal);
    setPerHead(item.estimatedPerHead ? String(item.estimatedPerHead) : '');
    setTotalPrice(item.totalEstimatedPrice ? String(item.totalEstimatedPrice) : '');
    setImageUrl(item.imageUrl ?? '');
    setSuggestedBy(item.suggestedBy);
    setNotes(item.notes ?? '');
    setIngredients((item.ingredients ?? []).join('\n'));
    setIsMenuModalOpen(true);
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const price = Number(perHead);
    const totPrice = Number(totalPrice);
    const fields = {
      title: title.trim(),
      category,
      meal,
      suggestedBy: suggestedBy.trim() || me?.nickname || 'เพื่อนร่วมทริป',
      notes: notes.trim() || undefined,
      totalEstimatedPrice:
        totalPrice.trim() && Number.isFinite(totPrice) && totPrice > 0 ? totPrice : undefined,
      estimatedPerHead:
        perHead.trim() && Number.isFinite(price) && price > 0
          ? price
          : totalPrice.trim() && Number.isFinite(totPrice) && totPrice > 0
          ? Math.round(totPrice / eaters)
          : undefined,
      imageUrl: imageUrl.trim() || undefined,
      ingredients: parseIngredients(ingredients),
    };

    onSaveItem(
      'menuIdeas',
      editingMenu
        ? { ...editingMenu, ...fields }
        : ({ id: `menu-${Date.now()}`, votes: me ? [me.id] : [], ...fields } as MenuIdea)
    );
    setIsMenuModalOpen(false);
  };

  const handleVote = (menuId: string) => {
    if (!me) {
      alert('กรุณาเลือกชื่อผู้ใช้งานของคุณที่แถบ "สมาชิก" เพื่อร่วมโหวตเมนู');
      return;
    }
    const voter = me.id;
    const isAdding = !menuIdeas.find((m) => m.id === menuId)?.votes.includes(voter);

    const item = menuIdeas.find((m) => m.id === menuId);
    if (!item) return;
    const votes = item.votes.filter((v) => v !== voter);
    onSaveItem('menuIdeas', { ...item, votes: isAdding ? [...votes, voter] : votes });
  };

  const handleApprove = (item: MenuIdea) => {
    if (item.approved && !window.confirm(`ยกเลิกอนุมัติ "${item.title}"? เมนูจะกลับไปนับตามคะแนนโหวต`)) {
      return;
    }
    onSaveItem('menuIdeas', { ...item, approved: item.approved ? undefined : true });
  };

  const handleDelete = (menuId: string) => {
    const item = menuIdeas.find((m) => m.id === menuId);
    if (!window.confirm(`ลบเมนู "${item?.title ?? 'นี้'}" ออกจากรายการ?`)) return;
    onRemoveItem('menuIdeas', menuId);
  };

  const packingFromMenu = (menuId: string) =>
    trip.packingList.filter((p) => p.fromMenuId === menuId);

  const pendingFor = (item: MenuIdea) => {
    const already = new Set(packingFromMenu(item.id).map((p) => p.title));
    return (item.ingredients ?? []).filter((name) => !already.has(name));
  };

  const sendToPacking = (items: MenuIdea[]) => {
    let n = 0;
    for (const item of items) {
      for (const name of pendingFor(item)) {
        const keyword = name.replace(/\(.*?\)/g, '').trim();
        const packed: PackingItem = {
          id: `p-${Date.now()}-${n}`,
          title: name,
          category: 'shared',
          isPacked: false,
          fromMenuId: item.id,
          imageUrl: item.imageUrl,
          makroUrl: `https://www.makro.pro/th/search?q=${encodeURIComponent(keyword)}`,
        };
        onSaveItem('packingList', packed);
        n += 1;
      }
    }
  };

  const takeBackFromPacking = (item: MenuIdea) => {
    const mine = packingFromMenu(item.id);
    const packed = mine.filter((p) => p.isPacked).length;
    const message =
      packed > 0
        ? `เอาวัตถุดิบของ "${item.title}" ออกจากรายการเตรียมของ? (มี ${packed} รายการที่ติ๊กซื้อแล้ว)`
        : `เอาวัตถุดิบ ${mine.length} รายการของ "${item.title}" ออกจากรายการเตรียมของ?`;
    if (!window.confirm(message)) return;
    mine.forEach((p) => onRemoveItem('packingList', p.id));
  };

  const shortlistPending = shortlisted.reduce((n, m) => n + pendingFor(m).length, 0);

  // Filtered menu ideas
  const filteredIdeas = menuIdeas.filter((m) => {
    if (selectedFilterCategory === 'all') return true;
    if (selectedFilterCategory === 'confirmed') return isGoing(m);
    return m.category === selectedFilterCategory;
  });

  const groups = MEAL_ORDER.map((mealKey) => ({
    meal: mealKey,
    config: MEAL_CONFIG[mealKey],
    items: filteredIdeas
      .filter((m) => m.meal === mealKey)
      .sort((a, b) => {
        // Confirmed items first, then by vote count
        const aGoing = isGoing(a) ? 1 : 0;
        const bGoing = isGoing(b) ? 1 : 0;
        if (aGoing !== bGoing) return bGoing - aGoing;
        return b.votes.length - a.votes.length;
      }),
  })).filter((g) => g.items.length > 0);

  const getMember = (idOrNick: string) =>
    trip.members.find((m) => m.id === idOrNick || m.nickname === idOrNick);

  return (
    <div className="pb-16 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <PageHead
        title="เมนูอาหาร & ปาร์ตี้ (Food & Bar)"
        note="โหวตเมนูสำหรับปาร์ตี้บาร์บีคิวพูลวิลล่าและมื้ออาหารในทริป เมนูที่ผ่านเกณฑ์จะถูกแตกเป็นรายการซื้อของที่ Makro ปากช่อง โดยอัตโนมัติ"
        action={
          <button onClick={openNewModal} className={btnSolid}>
            <Plus className="w-4 h-4 mr-1.5 inline" />
            เสนอเมนู
          </button>
        }
      />

      {/* Top Culinary Dashboard */}
      <section className="bg-paper rounded-panel border border-mist-deep p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-mist-deep">
          <div className="p-2">
            <span className="text-fine text-stone block">เมนูที่เสนอทั้งหมด</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold text-ink">
                {menuIdeas.length}
              </span>
              <span className="text-fine text-stone">เมนู</span>
            </div>
            <span className="text-fine text-stone/80 mt-1 block">
              โหวตสูงสุด {mostVotes} เสียง
            </span>
          </div>

          <div className="p-2 pt-4 md:pt-2 md:pl-6">
            <span className="text-fine text-stone block">ยืนยันทำแน่นอน</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold text-brass">
                {shortlisted.length}
              </span>
              <span className="text-fine text-stone">เมนู</span>
            </div>
            <span className="text-fine text-stone/80 mt-1 block">
              เกณฑ์ {threshold} โหวต {approvedCount > 0 && `(อนุมัติ ${approvedCount})`}
            </span>
          </div>

          <div className="p-2 pt-4 md:pt-2 md:pl-6">
            <span className="text-fine text-stone block">งบอาหาร & บาร์ รวมทั้งกลุ่ม</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold text-brass">
                {totalGroupBudget > 0 ? baht(totalGroupBudget) : '—'}
              </span>
            </div>
            <span className="text-fine text-stone/80 mt-1 block">
              {totalGroupBudget > 0
                ? `เฉลี่ยคนละ ≈ ${baht(Math.round(totalGroupBudget / Math.max(eaters, 1)))} (คำนวณจาก ${eaters} คน)`
                : 'ระบุราคาในเมนูเพื่อคำนวณ'}
            </span>
          </div>

          <div className="p-2 pt-4 md:pt-2 md:pl-6">
            <span className="text-fine text-stone block">เสบียงเตรียมซื้อ Makro</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold text-moss">
                {shortlisted.reduce((sum, m) => sum + (m.ingredients?.length || 0), 0)}
              </span>
              <span className="text-fine text-stone">รายการ</span>
            </div>
            <span className="text-fine text-moss mt-1 block font-medium">
              แวะซื้อ 13:00 น. วันที่ 31 ต.ค.
            </span>
          </div>
        </div>

        {/* Grocery Run Sync Banner */}
        {shortlisted.length > 0 && (
          <div className="mt-6 pt-5 border-t border-mist-deep flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface/60 -mx-6 -mb-6 p-5 rounded-b-panel">
            <div className="space-y-1">
              <p className="text-body font-medium text-ink flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-brass" />
                <span>เสบียงสำหรับแวะซื้อที่ Makro / Lotus ปากช่อง</span>
              </p>
              <p className="text-fine text-stone">
                {shortlistPending > 0
                  ? `มีวัตถุดิบจากเมนูที่ยืนยันแล้วอีก ${shortlistPending} รายการ ที่ยังไม่ได้ส่งเข้าหน้า "ของเตรียม"`
                  : 'วัตถุดิบจากทุกเมนูที่ยืนยันแล้ว อยู่ในลิสต์หน้า "ของเตรียม" ครบถ้วนแล้ว'}
              </p>
            </div>
            {shortlistPending > 0 && (
              <button
                onClick={() => sendToPacking(shortlisted)}
                className={`${btnSolid} inline-flex items-center gap-2 shrink-0 self-start sm:self-center`}
              >
                <Plus className="w-4 h-4" />
                <span>ส่ง {shortlistPending} รายการเข้าลิสต์ซื้อของ</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setSelectedFilterCategory('all')}
          className={`px-3.5 py-1.5 rounded-full text-fine font-medium transition-colors cursor-pointer shrink-0 ${
            selectedFilterCategory === 'all'
              ? 'bg-ink text-paper'
              : 'bg-paper text-stone border border-mist-deep hover:text-ink hover:bg-surface'
          }`}
        >
          ทั้งหมด ({menuIdeas.length})
        </button>

        <button
          onClick={() => setSelectedFilterCategory('confirmed')}
          className={`px-3.5 py-1.5 rounded-full text-fine font-medium transition-colors cursor-pointer shrink-0 ${
            selectedFilterCategory === 'confirmed'
              ? 'bg-brass text-paper'
              : 'bg-paper text-stone border border-mist-deep hover:text-ink hover:bg-surface'
          }`}
        >
          ยืนยันทำ ({shortlisted.length})
        </button>

        {(Object.keys(CATEGORY_CONFIG) as MenuIdea['category'][]).map((catKey) => {
          const cfg = CATEGORY_CONFIG[catKey];
          const count = menuIdeas.filter((m) => m.category === catKey).length;
          if (count === 0) return null;
          const Icon = cfg.icon;
          const isActive = selectedFilterCategory === catKey;

          return (
            <button
              key={catKey}
              onClick={() => setSelectedFilterCategory(catKey)}
              className={`px-3.5 py-1.5 rounded-full text-fine font-medium transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5 ${
                isActive
                  ? 'bg-ink text-paper'
                  : 'bg-paper text-stone border border-mist-deep hover:text-ink hover:bg-surface'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cfg.label}</span>
              <span className="opacity-70 text-[11px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Menus List By Meal */}
      {filteredIdeas.length === 0 ? (
        <Panel>
          <Empty
            title="ยังไม่มีเมนูในหมวดนี้"
            note="หมูกระทะ บาร์บีคิวเนื้อย่าง ต้มแซ่บ ส้มตำ หรือเบียร์เย็น ๆ เสนอมาได้เลย"
            action={
              <button onClick={openNewModal} className={btnLink}>
                <Plus className="w-3.5 h-3.5" />
                เสนอเมนูแรก
              </button>
            }
          />
        </Panel>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.meal} className="space-y-4">
              {/* Meal Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-mist-deep pb-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-display text-lead text-ink font-semibold">
                      {group.config.label}
                    </h2>
                    <span className="text-[11px] font-sans text-brass px-2 py-0.5 rounded-md bg-brass-lit/30 border border-brass/30">
                      {group.config.jaLabel}
                    </span>
                  </div>
                  <p className="text-fine text-stone mt-1">{group.config.desc}</p>
                </div>
                <span className="text-fine text-stone shrink-0">
                  {group.items.length} เมนู
                </span>
              </div>

              {/* Dish Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {group.items.map((item) => {
                  const catConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
                  const CatIcon = catConfig.icon;
                  const hasVoted = !!me && item.votes.includes(me.id);
                  const isConfirmed = isGoing(item);
                  const inPacking = packingFromMenu(item.id);
                  const pending = pendingFor(item);
                  const votePercent = Math.min(
                    100,
                    Math.round((item.votes.length / threshold) * 100)
                  );

                  return (
                    <article
                      key={item.id}
                      className={`bg-paper rounded-panel border p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between ${
                        isConfirmed
                          ? 'border-brass/70 ring-1 ring-brass/20 shadow-xs'
                          : 'border-mist-deep hover:border-ink/20 shadow-2xs'
                      }`}
                    >
                      <div>
                        {/* Card Top Meta */}
                        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-mist-deep/70">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface text-fine font-medium text-stone border border-mist-deep">
                              <CatIcon className="w-3.5 h-3.5 text-brass" />
                              {catConfig.label}
                            </span>
                            {isConfirmed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brass-lit text-ink text-fine font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-brass" />
                                {item.approved ? 'อนุมัติแล้ว' : 'ผ่านโหวต'}
                              </span>
                            ) : (
                              <span className="text-[11px] text-stone">
                                ต้องการอีก {Math.max(0, threshold - item.votes.length)} โหวต
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1 text-stone hover:text-ink rounded-ctl transition-colors"
                              title="แก้ไขเมนู"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-stone hover:text-red-600 rounded-ctl transition-colors"
                              title="ลบเมนู"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Dish / Product Image from Makro Pro */}
                        {item.imageUrl && (
                          <div className="relative w-full h-44 mb-3.5 rounded-lg overflow-hidden border border-mist-deep bg-mist/20">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                        )}

                        {/* Title & Proposer */}
                        <h3 className="font-display text-lead text-ink font-semibold">
                          {item.title}
                        </h3>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-fine text-stone">
                          <span>
                            เสนอโดย <strong className="text-ink font-medium">{item.suggestedBy}</strong>
                          </span>
                          {(item.totalEstimatedPrice || item.estimatedPerHead) && (
                            <div className="inline-flex items-center gap-1.5 flex-wrap">
                              {item.totalEstimatedPrice && (
                                <span className="inline-flex items-center gap-1 font-semibold text-brass px-2 py-0.5 rounded-md bg-brass/10 border border-brass/25 text-fine">
                                  <Coins className="w-3.5 h-3.5" />
                                  งบรวม {baht(item.totalEstimatedPrice)}
                                </span>
                              )}
                              {item.estimatedPerHead && (
                                <span className="text-[12px] text-stone font-medium">
                                  (~{baht(item.estimatedPerHead)} / คน)
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Proposer's Cooking Notes */}
                        {item.notes && (
                          <div className="mt-3 p-3 bg-surface/50 rounded-ctl border border-mist-deep/60 text-fine text-stone leading-relaxed italic">
                            "{item.notes}"
                          </div>
                        )}

                        {/* Ingredients Tag Cloud */}
                        {item.ingredients && item.ingredients.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-mist-deep/60">
                            <span className="text-[11px] font-semibold text-stone block mb-2 uppercase tracking-wider">
                              วัตถุดิบที่ต้องซื้อ ({item.ingredients.length} อย่าง):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.ingredients.map((ing, ingIdx) => (
                                <span
                                  key={ingIdx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface text-fine text-ink border border-mist-deep/80"
                                >
                                  {ing}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Bottom / Voting & Shopping Integration */}
                      <div className="mt-6 pt-4 border-t border-mist-deep/70 space-y-3">
                        {/* Vote Button & Voter Avatars */}
                        <div className="flex items-center justify-between gap-3">
                          <button
                            onClick={() => handleVote(item.id)}
                            className={`px-3.5 py-1.5 rounded-full text-fine font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                              hasVoted
                                ? 'bg-ink text-paper shadow-2xs'
                                : 'bg-surface hover:bg-mist-deep text-ink border border-mist-deep'
                            }`}
                          >
                            {hasVoted ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-brass" />
                                <span>อยากกินแล้ว</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>อยากกิน ({item.votes.length})</span>
                              </>
                            )}
                          </button>

                          {/* Voter Avatars */}
                          <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {item.votes.length > 0 ? (
                                item.votes.map((voterToken) => {
                                  const voter = getMember(voterToken);
                                  const nick = voterLabel(trip.members, voterToken);
                                  return (
                                    <span
                                      key={voterToken}
                                      title={nick}
                                      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-paper border border-paper shadow-2xs"
                                      style={{
                                        backgroundColor: voter?.avatarColor || '#1b3b2b',
                                      }}
                                    >
                                      {initialOf(nick)}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-fine text-stone/70">ยังไม่มีโหวต</span>
                              )}
                            </div>
                            <span className="text-fine text-stone font-mono ml-1">
                              {item.votes.length}/{threshold}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar toward Consensus */}
                        <div className="w-full bg-mist-deep h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isConfirmed ? 'bg-brass' : 'bg-stone/50'
                            }`}
                            style={{ width: `${votePercent}%` }}
                          />
                        </div>

                        {/* Bottom Actions: Approve & Shopping List */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          {/* Shopping List Integration */}
                          {item.ingredients && item.ingredients.length > 0 ? (
                            <div>
                              {pending.length > 0 ? (
                                <button
                                  onClick={() => sendToPacking([item])}
                                  className="text-fine text-brass hover:text-ink font-medium inline-flex items-center gap-1 transition-colors"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>ส่ง {pending.length} อย่างเข้าลิสต์ซื้อ</span>
                                </button>
                              ) : (
                                <span className="text-fine text-moss font-medium inline-flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>อยู่ในลิสต์ซื้อของแล้ว</span>
                                </span>
                              )}
                              {inPacking.length > 0 && (
                                <button
                                  onClick={() => takeBackFromPacking(item)}
                                  className="text-[11px] text-stone/80 hover:text-red-600 underline ml-2 transition-colors"
                                >
                                  เอาออก
                                </button>
                              )}
                            </div>
                          ) : isConfirmed ? (
                            <button
                              onClick={() => openEditModal(item)}
                              className="text-fine text-stone hover:text-ink underline"
                            >
                              + ใส่รายการวัตถุดิบ
                            </button>
                          ) : (
                            <span />
                          )}

                          {/* Fast Admin Approve */}
                          <button
                            onClick={() => handleApprove(item)}
                            className={`text-fine transition-colors cursor-pointer ${
                              item.approved
                                ? 'text-stone hover:text-ink'
                                : 'text-stone hover:text-brass'
                            }`}
                          >
                            {item.approved ? 'ยกเลิกอนุมัติ' : 'อนุมัติเลย'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Menu Add / Edit Modal */}
      {isMenuModalOpen && (
        <Modal
          title={editingMenu ? 'แก้ไขเมนูอาหาร' : 'เสนอเมนูอาหาร & เครื่องดื่ม'}
          note="เสนอเมนูที่อยากทานในทริป เพื่อให้เพื่อนๆ โหวตและรวบรวมเป็นเสบียงซื้อที่ Makro"
          onClose={() => setIsMenuModalOpen(false)}
          wide
        >
          <form onSubmit={handleSaveMenu} className="space-y-4">
            <Field label="ชื่อเมนูอาหาร / เครื่องดื่ม" htmlFor="menu-title">
              <input
                id="menu-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น เนื้อวัวออสเตรเลียย่าง, ตำแซลมอน, ต้มแซ่บ, โซจูมิกซ์"
                className={input}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="หมวดหมู่อาหาร" htmlFor="menu-cat">
                <select
                  id="menu-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MenuIdea['category'])}
                  className={input}
                >
                  {(Object.keys(CATEGORY_CONFIG) as MenuIdea['category'][]).map((key) => (
                    <option key={key} value={key}>
                      {CATEGORY_CONFIG[key].label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="มื้ออาหารที่เสิร์ฟ" htmlFor="menu-meal">
                <select
                  id="menu-meal"
                  value={meal}
                  onChange={(e) => setMeal(e.target.value as MenuIdea['meal'])}
                  className={input}
                >
                  {MEAL_ORDER.map((key) => (
                    <option key={key} value={key}>
                      {MEAL_CONFIG[key].label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="งบประมาณรวมทั้งเมนู (บาท)"
                htmlFor="menu-total-price"
                hint="เช่น 1650 หรือ 450 (คำนวณเฉลี่ยต่อคนให้อัตโนมัติ)"
              >
                <input
                  id="menu-total-price"
                  type="number"
                  min={0}
                  value={totalPrice}
                  onChange={(e) => {
                    setTotalPrice(e.target.value);
                    if (e.target.value && Number(e.target.value) > 0) {
                      setPerHead(String(Math.round(Number(e.target.value) / eaters)));
                    }
                  }}
                  placeholder="เช่น 1650"
                  className={input}
                />
              </Field>

              <Field
                label="งบเฉลี่ยต่อคน (บาท)"
                htmlFor="menu-price"
                hint="คำนวณอัตโนมัติหรือระบุเอง"
              >
                <input
                  id="menu-price"
                  type="number"
                  min={0}
                  value={perHead}
                  onChange={(e) => setPerHead(e.target.value)}
                  placeholder="เช่น 165"
                  className={input}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="เสนอโดย" htmlFor="menu-by">
                <input
                  id="menu-by"
                  type="text"
                  required
                  value={suggestedBy}
                  onChange={(e) => setSuggestedBy(e.target.value)}
                  placeholder="ชื่อเล่นของคุณ"
                  className={input}
                />
              </Field>

              <Field label="ลิงก์รูปภาพสินค้า / อาหาร (Image URL)" htmlFor="menu-image">
                <input
                  id="menu-image"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... ลิงก์รูปภาพอาหารหรือสินค้า Makro"
                  className={input}
                />
              </Field>
            </div>

            <Field
              label="วัตถุดิบที่ต้องซื้อ (สำหรับ Makro Grocery Run)"
              htmlFor="menu-ingredients"
              hint="พิมพ์แยก 1 บรรทัดต่อ 1 อย่าง (ระบบจะแตกเป็นรายการซื้อของให้โดยอัตโนมัติ)"
            >
              <textarea
                id="menu-ingredients"
                rows={4}
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder={'เนื้อวัวริบอาย 2 กก.\nเนยสด\nเกลือหิมาลายัน\nพริกไทยดำ\nโรสแมรี่'}
                className={input}
              />
            </Field>

            <Field label="บันทึกเพิ่มเติม / เคล็ดลับความอร่อย" htmlFor="menu-notes">
              <textarea
                id="menu-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น เผ็ดน้อยหน่อยมีคนไม่กินเผ็ด, ซื้อที่ Makro ปากช่องสดดีมาก"
                className={input}
              />
            </Field>

            <div className="pt-3 flex justify-end gap-3 border-t border-mist-deep">
              <button
                type="button"
                onClick={() => setIsMenuModalOpen(false)}
                className={btnQuiet}
              >
                ยกเลิก
              </button>
              <button type="submit" className={btnSolid}>
                {editingMenu ? 'บันทึกการแก้ไข' : 'เสนอเมนู'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
