import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { TripData, MenuIdea, Member, TripListEditor } from '../types/trip';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Modal, Field, Empty, Meter } from './ui';
import { input, btnSolid, btnQuiet, btnLink, baht, voterLabel } from './ui-kit';

interface FoodTabProps extends TripListEditor {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
  me: Member | null;
}

const CATEGORY_LABEL: Record<MenuIdea['category'], string> = {
  grill: 'หมูกระทะ / ปิ้งย่าง',
  main: 'กับข้าว',
  snack: 'ของทานเล่น',
  drink: 'เครื่องดื่ม',
  dessert: 'ของหวาน',
  other: 'อื่น ๆ',
};

const MEAL_LABEL: Record<MenuIdea['meal'], string> = {
  dinner: 'มื้อเย็นคืนแรก',
  breakfast: 'มื้อเช้าวันที่สอง',
  latenight: 'มื้อดึก',
  anytime: 'กินตอนไหนก็ได้',
};

/** The order the sittings actually happen, so the groups read as a timeline. */
const MEAL_ORDER: MenuIdea['meal'][] = ['dinner', 'latenight', 'breakfast', 'anytime'];

export const FoodTab: React.FC<FoodTabProps> = ({ trip, onSaveItem, onRemoveItem, me }) => {
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuIdea | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MenuIdea['category']>('grill');
  const [meal, setMeal] = useState<MenuIdea['meal']>('dinner');
  const [perHead, setPerHead] = useState('');
  const [suggestedBy, setSuggestedBy] = useState('');
  const [notes, setNotes] = useState('');

  const menuIdeas = trip.menuIdeas ?? [];
  const eaters = trip.members.filter((m) => m.status === 'confirmed').length;
  const mostVotes = menuIdeas.reduce((max, m) => Math.max(max, m.votes.length), 0);

  // A dish is "in" once half the confirmed crowd wants it — enough of a signal
  // to go shopping on, without waiting for everyone to tap.
  const threshold = Math.max(1, Math.ceil(eaters / 2));
  const shortlisted = menuIdeas.filter((m) => m.votes.length >= threshold);
  const estimatedPerHead = shortlisted.reduce(
    (sum, m) => sum + (m.estimatedPerHead ?? 0),
    0
  );

  const openNewModal = () => {
    setEditingMenu(null);
    setTitle('');
    setCategory('grill');
    setMeal('dinner');
    setPerHead('');
    setSuggestedBy(me?.nickname ?? '');
    setNotes('');
    setIsMenuModalOpen(true);
  };

  const openEditModal = (item: MenuIdea) => {
    setEditingMenu(item);
    setTitle(item.title);
    setCategory(item.category);
    setMeal(item.meal);
    setPerHead(item.estimatedPerHead ? String(item.estimatedPerHead) : '');
    setSuggestedBy(item.suggestedBy);
    setNotes(item.notes ?? '');
    setIsMenuModalOpen(true);
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const price = Number(perHead);
    const fields = {
      title: title.trim(),
      category,
      meal,
      suggestedBy: suggestedBy.trim() || 'เพื่อนร่วมทริป',
      notes: notes.trim(),
      // Left undefined when the box is blank, which drops the field on the way
      // out — a price someone cleared has to actually go.
      estimatedPerHead:
        perHead.trim() && Number.isFinite(price) && price > 0 ? price : undefined,
    };

    onSaveItem(
      'menuIdeas',
      editingMenu
        ? { ...editingMenu, ...fields }
        : ({ id: `menu-${Date.now()}`, votes: [], ...fields } as MenuIdea)
    );
    setIsMenuModalOpen(false);
  };

  const handleVote = (menuId: string) => {
    if (!me) return;
    const voter = me.id;
    const isAdding = !menuIdeas.find((m) => m.id === menuId)?.votes.includes(voter);

    const item = (trip.menuIdeas ?? []).find((m) => m.id === menuId);
    if (!item) return;
    const votes = item.votes.filter((v) => v !== voter);
    onSaveItem('menuIdeas', { ...item, votes: isAdding ? [...votes, voter] : votes });
  };

  const handleDelete = (menuId: string) => {
    const item = menuIdeas.find((m) => m.id === menuId);
    if (!window.confirm(`ลบ ${item?.title ?? 'เมนูนี้'} ออกจากรายการโหวต?`)) return;

    onRemoveItem('menuIdeas', menuId);
  };

  const groups = MEAL_ORDER.map((mealKey) => ({
    meal: mealKey,
    items: menuIdeas
      .filter((m) => m.meal === mealKey)
      // Most wanted first; ties keep the order they were suggested in.
      .sort((a, b) => b.votes.length - a.votes.length),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="pb-16">
      <PageHead
        title="เมนูอาหาร"
        note="เสนอเมนูที่อยากกิน แล้วโหวตกัน เมนูที่คนอยากกินเกินครึ่งจะขึ้นเป็นรายการซื้อของ"
        action={
          <button onClick={openNewModal} className={btnSolid}>
            เสนอเมนู
          </button>
        }
      />

      {/* Where the vote stands right now */}
      <Panel className="mb-px">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
          <div>
            <p className="text-fine text-stone">เมนูที่เสนอมา</p>
            <p className="mt-2 font-display text-title text-ink leading-none">
              {menuIdeas.length}
              <span className="ml-2 font-sans text-fine text-stone">เมนู</span>
            </p>
          </div>
          <div>
            <p className="text-fine text-stone">ผ่านโหวตแล้ว</p>
            <p className="mt-2 font-display text-title text-ink leading-none">
              {shortlisted.length}
              <span className="ml-2 font-sans text-fine text-stone">
                ถึงเกณฑ์ {threshold} โหวต
              </span>
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-fine text-stone">ค่าอาหารคร่าว ๆ ต่อคน</p>
            <p className="mt-2 font-display text-title text-ink leading-none">
              {estimatedPerHead > 0 ? baht(estimatedPerHead) : '—'}
            </p>
            <p className="mt-2 text-fine text-stone">
              {estimatedPerHead > 0
                ? `รวมทั้งกลุ่มราว ${baht(estimatedPerHead * Math.max(eaters, 1))}`
                : 'ใส่ราคาต่อหัวในเมนูเพื่อประเมินงบ'}
            </p>
          </div>
        </div>
      </Panel>

      {menuIdeas.length === 0 ? (
        <Panel>
          <Empty
            title="ยังไม่มีใครเสนอเมนู"
            note="หมูกระทะ คอหมูย่าง ต้มยำ ข้าวต้มเช้า เบียร์เย็น ๆ เสนอมาได้เลย เดี๋ยวค่อยโหวตกัน"
            action={
              <button onClick={openNewModal} className={btnLink}>
                <Plus className="w-3.5 h-3.5" />
                เสนอเมนูแรก
              </button>
            }
          />
        </Panel>
      ) : (
        groups.map((group) => (
          <Panel key={group.meal} className="mb-px">
            <div className="flex items-baseline justify-between gap-4 border-b border-mist-deep pb-5">
              <h2 className="font-display text-lead text-ink">{MEAL_LABEL[group.meal]}</h2>
              <span className="text-fine text-stone">{group.items.length} เมนู</span>
            </div>

            <ul className="divide-y divide-mist-deep">
              {group.items.map((item) => {
                const hasVoted = !!me && item.votes.includes(me.id);
                const isShortlisted = item.votes.length >= threshold;

                return (
                  <li key={item.id} className="py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-body text-ink">
                          {item.title}
                          {isShortlisted && (
                            <span className="ml-3 text-fine text-brass">เข้ารายการซื้อ</span>
                          )}
                        </p>
                        <p className="mt-1 text-fine text-stone">
                          {CATEGORY_LABEL[item.category]} · เสนอโดย {item.suggestedBy}
                          {item.estimatedPerHead
                            ? ` · ราว ${baht(item.estimatedPerHead)} ต่อคน`
                            : ''}
                        </p>
                        {item.notes && (
                          <p className="mt-2 text-fine text-stone">{item.notes}</p>
                        )}
                        {item.votes.length > 0 && (
                          <p className="mt-2 text-fine text-stone">
                            {item.votes
                              .map((v) => voterLabel(trip.members, v))
                              .join(', ')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-fine text-stone hover:text-ink transition-colors"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-stone hover:text-ink transition-colors"
                          aria-label={`ลบ ${item.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-6">
                      <button
                        onClick={() => handleVote(item.id)}
                        disabled={!me}
                        aria-pressed={hasVoted}
                        title={me ? undefined : 'เลือกชื่อคุณที่มุมขวาบนก่อนจึงจะโหวตได้'}
                        className={`${btnLink} disabled:opacity-40 disabled:pointer-events-none`}
                      >
                        {hasVoted ? 'โหวตแล้ว' : 'อยากกิน'} {item.votes.length}
                      </button>
                      <div className="flex-1 max-w-xs">
                        <Meter
                          value={item.votes.length}
                          max={Math.max(mostVotes, threshold)}
                          tone={isShortlisted ? 'brass' : 'ink'}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        ))
      )}

      {isMenuModalOpen && (
        <Modal
          title={editingMenu ? 'แก้ไขเมนู' : 'เสนอเมนู'}
          note="เมนูเดียวต่อหนึ่งรายการ เพื่อนจะได้โหวตเป็นอย่าง ๆ"
          onClose={() => setIsMenuModalOpen(false)}
          wide
        >
          <form onSubmit={handleSaveMenu} className="space-y-5">
            <Field label="ชื่อเมนู" htmlFor="menu-title">
              <input
                id="menu-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="คอหมูย่าง, ต้มยำกุ้ง, ข้าวต้มหมูสับ"
                className={input}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="ประเภท" htmlFor="menu-cat">
                <select
                  id="menu-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MenuIdea['category'])}
                  className={input}
                >
                  {(Object.keys(CATEGORY_LABEL) as MenuIdea['category'][]).map((key) => (
                    <option key={key} value={key}>
                      {CATEGORY_LABEL[key]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="มื้อไหน" htmlFor="menu-meal">
                <select
                  id="menu-meal"
                  value={meal}
                  onChange={(e) => setMeal(e.target.value as MenuIdea['meal'])}
                  className={input}
                >
                  {MEAL_ORDER.map((key) => (
                    <option key={key} value={key}>
                      {MEAL_LABEL[key]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="ราคาต่อคน (บาท)"
                htmlFor="menu-price"
                hint="ใส่หรือไม่ใส่ก็ได้ ใช้ประเมินงบเฉย ๆ"
              >
                <input
                  id="menu-price"
                  type="number"
                  min={0}
                  value={perHead}
                  onChange={(e) => setPerHead(e.target.value)}
                  placeholder="120"
                  className={input}
                />
              </Field>
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
            </div>

            <Field label="โน้ต" htmlFor="menu-notes">
              <textarea
                id="menu-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ซื้อที่ตลาดปากช่องก่อนขึ้นเขา เผ็ดน้อยนะมีคนกินเผ็ดไม่ได้"
                className={input}
              />
            </Field>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsMenuModalOpen(false)}
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
