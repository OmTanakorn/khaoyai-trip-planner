import React, { useState } from 'react';
import { Plus, Trash2, Pencil, ExternalLink } from 'lucide-react';
import { TripData, Activity, PlaceIdea } from '../types/trip';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Modal, Field, Empty } from './ui';
import { input, btnSolid, btnQuiet, btnLink } from './ui-kit';

interface ItineraryTabProps {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
}

const CATEGORY_LABEL: Record<Activity['category'] | PlaceIdea['category'], string> = {
  travel: 'เดินทาง',
  food: 'ร้านอาหาร',
  cafe: 'คาเฟ่',
  nature: 'ธรรมชาติ',
  relax: 'พักผ่อน',
  activity: 'กิจกรรม',
  party: 'กิจกรรม',
  other: 'อื่น ๆ',
};

export const ItineraryTab: React.FC<ItineraryTabProps> = ({ trip, onUpdateTrip }) => {
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<Activity['category']>('travel');
  const [mapUrl, setMapUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaCategory, setIdeaCategory] = useState<PlaceIdea['category']>('cafe');
  const [ideaLocation, setIdeaLocation] = useState('');
  const [ideaMapUrl, setIdeaMapUrl] = useState('');
  const [ideaSuggestedBy, setIdeaSuggestedBy] = useState('');
  const [ideaNotes, setIdeaNotes] = useState('');

  const currentDay =
    trip.itinerary.find((d) => d.dayNumber === selectedDayNumber) || trip.itinerary[0];

  const handleOpenNewActivityModal = () => {
    setEditingActivity(null);
    setTime('10:00 – 11:30');
    setTitle('');
    setLocation('');
    setCategory('cafe');
    setMapUrl('');
    setNotes('');
    setIsActivityModalOpen(true);
  };

  const handleOpenEditActivityModal = (act: Activity) => {
    setEditingActivity(act);
    setTime(act.time);
    setTitle(act.title);
    setLocation(act.location);
    setCategory(act.category);
    setMapUrl(act.mapUrl || '');
    setNotes(act.notes || '');
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !time.trim()) return;

    // The id is minted once, out here — the updater below can run again.
    const newAct: Activity = {
      id: `act-${Date.now()}`,
      time,
      title,
      location,
      category,
      mapUrl,
      notes,
    };

    onUpdateTrip((t) => ({
      ...t,
      itinerary: t.itinerary.map((day) => {
        if (day.dayNumber !== selectedDayNumber) return day;

        if (editingActivity) {
          return {
            ...day,
            activities: day.activities.map((a) =>
              a.id === editingActivity.id
                ? { ...a, time, title, location, category, mapUrl, notes }
                : a
            ),
          };
        }

        return { ...day, activities: [...day.activities, newAct] };
      }),
    }));
    setIsActivityModalOpen(false);
  };

  const handleDeleteActivity = (activityId: string) => {
    const act = currentDay?.activities.find((a) => a.id === activityId);
    if (!window.confirm(`ลบ ${act?.title ?? 'กิจกรรมนี้'} ออกจากตาราง?`)) return;

    onUpdateTrip((t) => ({
      ...t,
      itinerary: t.itinerary.map((day) =>
        day.dayNumber === selectedDayNumber
          ? { ...day, activities: day.activities.filter((a) => a.id !== activityId) }
          : day
      ),
    }));
  };

  const handleSavePlaceIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTitle.trim()) return;

    const newIdea: PlaceIdea = {
      id: `idea-${Date.now()}`,
      title: ideaTitle.trim(),
      category: ideaCategory,
      location: ideaLocation.trim(),
      mapUrl: ideaMapUrl.trim(),
      suggestedBy: ideaSuggestedBy.trim() || 'เพื่อนร่วมทริป',
      votes: [],
      notes: ideaNotes.trim(),
    };

    onUpdateTrip((t) => ({ ...t, placeIdeas: [...t.placeIdeas, newIdea] }));

    setIdeaTitle('');
    setIdeaLocation('');
    setIdeaMapUrl('');
    setIdeaNotes('');
    setIsWishlistModalOpen(false);
  };

  const handleVotePlaceIdea = (ideaId: string) => {
    const voter = 'ฉัน';
    const isAdding = !trip.placeIdeas
      .find((i) => i.id === ideaId)
      ?.votes.includes(voter);

    onUpdateTrip((t) => ({
      ...t,
      placeIdeas: t.placeIdeas.map((idea) => {
        if (idea.id !== ideaId) return idea;
        const votes = idea.votes.filter((v) => v !== voter);
        return { ...idea, votes: isAdding ? [...votes, voter] : votes };
      }),
    }));
  };

  const handleDeletePlaceIdea = (ideaId: string) => {
    onUpdateTrip((t) => ({
      ...t,
      placeIdeas: t.placeIdeas.filter((i) => i.id !== ideaId),
    }));
  };

  const handleMoveIdeaToItinerary = (idea: PlaceIdea, dayNum: number) => {
    const newAct: Activity = {
      id: `act-${Date.now()}`,
      time: dayNum === 1 ? '13:00 – 14:30' : '11:00 – 12:30',
      title: idea.title,
      location: idea.location,
      category: idea.category === 'party' ? 'activity' : idea.category,
      mapUrl: idea.mapUrl,
      notes: idea.notes,
    };

    onUpdateTrip((t) => ({
      ...t,
      itinerary: t.itinerary.map((day) =>
        day.dayNumber === dayNum ? { ...day, activities: [...day.activities, newAct] } : day
      ),
    }));
    // Jump to the day it landed on, so the change is visible rather than announced.
    setSelectedDayNumber(dayNum);
  };

  return (
    <div className="pb-16">
      <PageHead
        title="ตารางเที่ยว"
        note="สองวันหนึ่งคืน เสนอที่ที่อยากไปไว้ก่อน แล้วค่อยดึงลงตารางเมื่อตกลงกันได้"
        action={
          <div className="flex gap-3">
            <button onClick={() => setIsWishlistModalOpen(true)} className={btnQuiet}>
              เสนอที่เที่ยว
            </button>
            <button onClick={handleOpenNewActivityModal} className={btnSolid}>
              เพิ่มลงตาราง
            </button>
          </div>
        }
      />

      {/* Wishlist — candidates, not yet a schedule */}
      <Panel className="mb-px">
        <div className="flex items-baseline justify-between gap-4 border-b border-mist-deep pb-5">
          <h2 className="font-display text-lead text-ink">ที่ที่เพื่อนเสนอมา</h2>
          <span className="text-fine text-stone">{trip.placeIdeas.length} แห่ง</span>
        </div>

        {trip.placeIdeas.length === 0 ? (
          <Empty
            title="ยังไม่มีใครเสนอที่เที่ยว"
            note="ไร่องุ่น PB Valley, อุทยานแห่งชาติเขาใหญ่, คาเฟ่แถวถนนธนะรัชต์ หรือที่ไหนก็ได้ที่อยากแวะ"
            action={
              <button onClick={() => setIsWishlistModalOpen(true)} className={btnLink}>
                <Plus className="w-3.5 h-3.5" />
                เสนอที่แรก
              </button>
            }
          />
        ) : (
          <ul className="divide-y divide-mist-deep">
            {trip.placeIdeas.map((idea) => (
              <li key={idea.id} className="py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-body text-ink">{idea.title}</p>
                    <p className="mt-1 text-fine text-stone">
                      {CATEGORY_LABEL[idea.category]}
                      {idea.location && ` · ${idea.location}`} · เสนอโดย {idea.suggestedBy}
                    </p>
                    {idea.notes && <p className="mt-2 text-fine text-stone">{idea.notes}</p>}
                  </div>
                  <button
                    onClick={() => handleDeletePlaceIdea(idea.id)}
                    className="text-stone hover:text-ink transition-colors shrink-0"
                    aria-label={`ลบ ${idea.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <button
                    onClick={() => handleVotePlaceIdea(idea.id)}
                    aria-pressed={idea.votes.includes('ฉัน')}
                    className={btnLink}
                  >
                    {idea.votes.includes('ฉัน') ? 'โหวตแล้ว' : 'อยากไปที่นี่'} {idea.votes.length}
                  </button>
                  {trip.itinerary.map((day) => (
                    <button
                      key={day.dayNumber}
                      onClick={() => handleMoveIdeaToItinerary(idea, day.dayNumber)}
                      className="text-fine text-stone hover:text-ink transition-colors"
                    >
                      ใส่ในวันที่ {day.dayNumber}
                    </button>
                  ))}
                  {idea.mapUrl && (
                    <a
                      href={idea.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-fine text-stone hover:text-ink transition-colors"
                    >
                      แผนที่
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Day switch */}
      <div className="bg-paper flex gap-8 px-6 sm:px-8 border-b border-mist-deep overflow-x-auto no-scrollbar">
        {trip.itinerary.map((day) => {
          const isActive = day.dayNumber === selectedDayNumber;
          return (
            <button
              key={day.dayNumber}
              onClick={() => setSelectedDayNumber(day.dayNumber)}
              aria-current={isActive ? 'true' : undefined}
              className={`py-5 text-left shrink-0 border-b-2 -mb-px transition-colors ${
                isActive ? 'border-brass' : 'border-transparent'
              }`}
            >
              <span className={`block text-body ${isActive ? 'text-ink' : 'text-stone'}`}>
                {day.dayLabel}
              </span>
              <span className="block mt-1 text-fine text-stone">
                {day.date} · {day.activities.length} กิจกรรม
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline — a real sequence, so it gets a rail */}
      {currentDay && (
        <div className="bg-paper px-6 sm:px-8 py-8">
          {currentDay.activities.length === 0 ? (
            <Empty
              title={`ยังไม่มีอะไรใน${currentDay.dayLabel}`}
              note="ดึงจากรายการที่เพื่อนเสนอไว้ด้านบน หรือเพิ่มเองก็ได้"
              action={
                <button onClick={handleOpenNewActivityModal} className={btnLink}>
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มกิจกรรมแรก
                </button>
              }
            />
          ) : (
            <ol className="relative border-l border-mist-deep">
              {currentDay.activities.map((act) => (
                <li key={act.id} className="relative pl-6 sm:pl-8 pb-8 last:pb-0">
                  <span
                    className="absolute -left-[3px] top-2 w-1.5 h-1.5 bg-brass"
                    aria-hidden="true"
                  />

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-fine text-stone">
                        {act.time} · {CATEGORY_LABEL[act.category]}
                      </p>
                      <h3 className="mt-1 font-display text-lead text-ink">{act.title}</h3>
                      {act.location && (
                        <p className="mt-1 text-fine text-stone">{act.location}</p>
                      )}
                      {act.notes && <p className="mt-3 text-body text-stone">{act.notes}</p>}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {act.mapUrl && (
                        <a
                          href={act.mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-stone hover:text-ink transition-colors"
                          aria-label={`เปิดแผนที่ของ ${act.title}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenEditActivityModal(act)}
                        className="text-stone hover:text-ink transition-colors"
                        aria-label={`แก้ไข ${act.title}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(act.id)}
                        className="text-stone hover:text-ink transition-colors"
                        aria-label={`ลบ ${act.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {isWishlistModalOpen && (
        <Modal
          title="เสนอที่เที่ยว"
          note="คาเฟ่ ร้านอาหาร หรือจุดแวะระหว่างทาง"
          onClose={() => setIsWishlistModalOpen(false)}
          wide
        >
          <form onSubmit={handleSavePlaceIdea} className="space-y-5">
            <Field label="ชื่อสถานที่" htmlFor="idea-title">
              <input
                id="idea-title"
                type="text"
                required
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
                placeholder="Trot Cafe, ร้านเป็นลาว, อุทยานแห่งชาติเขาใหญ่"
                className={input}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="ประเภท" htmlFor="idea-cat">
                <select
                  id="idea-cat"
                  value={ideaCategory}
                  onChange={(e) => setIdeaCategory(e.target.value as PlaceIdea['category'])}
                  className={input}
                >
                  <option value="cafe">คาเฟ่</option>
                  <option value="food">ร้านอาหาร</option>
                  <option value="nature">ธรรมชาติ</option>
                  <option value="party">กิจกรรม</option>
                  <option value="other">อื่น ๆ</option>
                </select>
              </Field>
              <Field label="เสนอโดย" htmlFor="idea-by">
                <input
                  id="idea-by"
                  type="text"
                  required
                  value={ideaSuggestedBy}
                  onChange={(e) => setIdeaSuggestedBy(e.target.value)}
                  placeholder="ชื่อเล่นของคุณ"
                  className={input}
                />
              </Field>
            </div>

            <Field label="ทำเล" htmlFor="idea-loc">
              <input
                id="idea-loc"
                type="text"
                value={ideaLocation}
                onChange={(e) => setIdeaLocation(e.target.value)}
                placeholder="ถนนธนะรัชต์ กม. 12"
                className={input}
              />
            </Field>

            <Field label="ลิงก์แผนที่หรือเพจ" htmlFor="idea-map">
              <input
                id="idea-map"
                type="url"
                value={ideaMapUrl}
                onChange={(e) => setIdeaMapUrl(e.target.value)}
                placeholder="https://maps.google.com/"
                className={input}
              />
            </Field>

            <Field label="ทำไมถึงน่าไป" htmlFor="idea-notes">
              <textarea
                id="idea-notes"
                rows={2}
                value={ideaNotes}
                onChange={(e) => setIdeaNotes(e.target.value)}
                placeholder="มีม้าแคระให้ถ่ายรูป ไก่ย่างเด็ดมาก"
                className={input}
              />
            </Field>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsWishlistModalOpen(false)}
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

      {isActivityModalOpen && (
        <Modal
          title={editingActivity ? 'แก้ไขกิจกรรม' : 'เพิ่มลงตาราง'}
          note={currentDay?.dayLabel}
          onClose={() => setIsActivityModalOpen(false)}
          wide
        >
          <form onSubmit={handleSaveActivity} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="เวลา" htmlFor="act-time">
                <input
                  id="act-time"
                  type="text"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="11:30 – 13:00"
                  className={input}
                />
              </Field>
              <Field label="ประเภท" htmlFor="act-cat">
                <select
                  id="act-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Activity['category'])}
                  className={input}
                >
                  <option value="travel">เดินทาง</option>
                  <option value="food">ร้านอาหาร</option>
                  <option value="cafe">คาเฟ่</option>
                  <option value="nature">ธรรมชาติ</option>
                  <option value="relax">พักผ่อน</option>
                  <option value="activity">กิจกรรม</option>
                </select>
              </Field>
            </div>

            <Field label="ทำอะไร" htmlFor="act-title">
              <input
                id="act-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช็คอินที่พัก แวะคาเฟ่"
                className={input}
              />
            </Field>

            <Field label="สถานที่" htmlFor="act-loc">
              <input
                id="act-loc"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="ปากช่อง เขาใหญ่"
                className={input}
              />
            </Field>

            <Field label="ลิงก์แผนที่" htmlFor="act-map">
              <input
                id="act-map"
                type="url"
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
                placeholder="https://maps.google.com/"
                className={input}
              />
            </Field>

            <Field label="โน้ต" htmlFor="act-notes">
              <textarea
                id="act-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ต้องจองคิวก่อน เตรียมเงินสดค่าเข้า"
                className={input}
              />
            </Field>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
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
