import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { TripData, MenuIdea, Member, PackingItem, TripListEditor } from '../types/trip';
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

/**
 * The ingredient box is free text — one thing per line is how people write a
 * shopping list anyway. Blank lines and stray spaces go, and an empty box
 * clears the field rather than storing an empty array.
 */
const parseIngredients = (text: string): string[] | undefined => {
  const lines = text
    .split('\n')
    .map((line) => line.replace(/^[-•*\s]+/, '').trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : undefined;
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
  const [ingredients, setIngredients] = useState('');

  const menuIdeas = trip.menuIdeas ?? [];
  const eaters = trip.members.filter((m) => m.status === 'confirmed').length;
  const mostVotes = menuIdeas.reduce((max, m) => Math.max(max, m.votes.length), 0);

  // A dish is "in" once half the confirmed crowd wants it — enough of a signal
  // to go shopping on, without waiting for everyone to tap. Someone can also
  // just say so: plans get made in the group chat, and a dish that is already
  // decided should not have to wait for taps it will never get.
  const threshold = Math.max(1, Math.ceil(eaters / 2));
  const isGoing = (m: MenuIdea) => m.approved === true || m.votes.length >= threshold;
  const shortlisted = menuIdeas.filter(isGoing);
  const approvedCount = shortlisted.filter((m) => m.approved === true).length;
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
    setIngredients('');
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
    setIngredients((item.ingredients ?? []).join('\n'));
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
      // One thing per line, blank lines dropped. Cleared box means no list,
      // same rule as the price.
      ingredients: parseIngredients(ingredients),
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

  /** Undefined rather than false, so an un-approved dish keeps no trace. */
  const handleApprove = (item: MenuIdea) => {
    if (item.approved && !window.confirm(`ยกเลิกอนุมัติ ${item.title}? เมนูจะกลับไปนับตามโหวต`)) {
      return;
    }
    onSaveItem('menuIdeas', { ...item, approved: item.approved ? undefined : true });
  };

  const handleDelete = (menuId: string) => {
    const item = menuIdeas.find((m) => m.id === menuId);
    if (!window.confirm(`ลบ ${item?.title ?? 'เมนูนี้'} ออกจากรายการโหวต?`)) return;

    onRemoveItem('menuIdeas', menuId);
  };

  /**
   * Turning a dish into shopping.
   *
   * The packing list is the one place the group actually reads before leaving,
   * so a dish that won the vote has to end up there rather than staying a
   * name on this page. Each item remembers the dish it came from, which is
   * what keeps a second press from writing everything twice.
   */
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
        const packed: PackingItem = {
          // Date.now() alone repeats inside one loop, and two items sharing an
          // id would overwrite each other on the way to the cloud.
          id: `p-${Date.now()}-${n}`,
          title: name,
          category: 'shared',
          isPacked: false,
          fromMenuId: item.id,
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
        ? `เอาของจาก ${item.title} ออกจากรายการเตรียมของ? มี ${packed} อย่างที่เตรียมไว้แล้ว จะถูกเอาออกด้วย`
        : `เอาของ ${mine.length} อย่างจาก ${item.title} ออกจากรายการเตรียมของ?`;
    if (!window.confirm(message)) return;
    mine.forEach((p) => onRemoveItem('packingList', p.id));
  };

  const shortlistPending = shortlisted.reduce((n, m) => n + pendingFor(m).length, 0);

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
        note="เสนอเมนูที่อยากกิน แล้วโหวตกัน เกินครึ่งถือว่าจะทำ หรือกดอนุมัติเองก็ได้ไม่ต้องรอโหวต แล้วแตกเป็นของที่ต้องเตรียมต่อ"
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
            <p className="text-fine text-stone">จะทำแน่</p>
            <p className="mt-2 font-display text-title text-ink leading-none">
              {shortlisted.length}
              <span className="ml-2 font-sans text-fine text-stone">
                ถึงเกณฑ์ {threshold} โหวต
                {approvedCount > 0 && ` · อนุมัติมือ ${approvedCount}`}
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

        {shortlisted.length > 0 && (
          <div className="mt-8 pt-6 border-t border-mist-deep flex flex-wrap items-center justify-between gap-4">
            <p className="text-fine text-stone max-w-md">
              {shortlistPending > 0
                ? `เมนูที่จะทำมีของที่ยังไม่ได้เข้ารายการเตรียมของอีก ${shortlistPending} อย่าง`
                : 'ของจากเมนูที่จะทำเข้ารายการเตรียมของครบแล้ว'}
            </p>
            <button
              onClick={() => sendToPacking(shortlisted)}
              disabled={shortlistPending === 0}
              className={`${btnSolid} shrink-0`}
            >
              แตกเป็นของที่ต้องเตรียม {shortlistPending > 0 ? shortlistPending : ''}
            </button>
          </div>
        )}
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
                const isShortlisted = isGoing(item);

                return (
                  <li key={item.id} className="py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-body text-ink">
                          {item.title}
                          {isShortlisted && (
                            <span className="ml-3 text-fine text-brass">
                              {item.approved ? 'อนุมัติแล้ว' : 'ผ่านโหวต'}
                            </span>
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

                      <button
                        onClick={() => handleApprove(item)}
                        aria-pressed={!!item.approved}
                        title={
                          item.approved
                            ? 'เมนูนี้ถูกอนุมัติไว้ ไม่ต้องรอโหวต'
                            : 'ข้ามการโหวต ให้เมนูนี้เข้ารายการของที่ต้องเตรียมเลย'
                        }
                        className={`shrink-0 text-fine transition-colors ${
                          item.approved
                            ? 'text-stone hover:text-ink'
                            : 'text-ink border-b border-brass pb-0.5 hover:text-brass'
                        }`}
                      >
                        {item.approved ? 'ยกเลิกอนุมัติ' : 'อนุมัติเลย'}
                      </button>
                    </div>

                    {/* What this dish turns into once it is decided. */}
                    {(() => {
                      const list = item.ingredients ?? [];
                      const inPacking = packingFromMenu(item.id);
                      const pending = pendingFor(item);

                      if (list.length === 0) {
                        return isShortlisted ? (
                          <p className="mt-4 text-fine text-stone">
                            เมนูนี้จะทำแล้ว แต่ยังไม่ได้ใส่ว่าต้องซื้ออะไรบ้าง{' '}
                            <button
                              onClick={() => openEditModal(item)}
                              className="text-ink border-b border-brass pb-0.5 hover:text-brass transition-colors"
                            >
                              ใส่ของที่ต้องเตรียม
                            </button>
                          </p>
                        ) : null;
                      }

                      return (
                        <div className="mt-4 pt-4 border-t border-mist-deep">
                          <p className="text-fine text-stone">
                            ต้องเตรียม {list.length} อย่าง · {list.join(', ')}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                            {pending.length > 0 ? (
                              <button onClick={() => sendToPacking([item])} className={btnLink}>
                                <Plus className="w-3.5 h-3.5" />
                                แตกเป็นของที่ต้องเตรียม {pending.length} อย่าง
                              </button>
                            ) : (
                              <span className="text-fine text-stone">
                                อยู่ในรายการเตรียมของแล้ว {inPacking.length} อย่าง
                              </span>
                            )}
                            {inPacking.length > 0 && (
                              <button
                                onClick={() => takeBackFromPacking(item)}
                                className="text-fine text-stone hover:text-ink transition-colors"
                              >
                                เอาออกจากรายการ
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
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

            <Field
              label="ของที่ต้องเตรียม"
              htmlFor="menu-ingredients"
              hint="บรรทัดละอย่าง พอเมนูนี้ผ่านโหวตแล้วกดแตกเป็นรายการเตรียมของได้เลย"
            >
              <textarea
                id="menu-ingredients"
                rows={4}
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder={'คอหมู 2 กิโล\nน้ำจิ้มแจ่ว\nถ่าน 1 ถุง'}
                className={input}
              />
            </Field>

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
