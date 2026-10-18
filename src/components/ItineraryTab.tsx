import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  Car,
  MapPin,
  MapPinned,
  UtensilsCrossed,
  Coffee,
  Sparkles,
  BedDouble,
  PartyPopper,
  Compass,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Users,
  Maximize2,
  X,
  Trees,
} from 'lucide-react';
import { TripData, Activity, PlaceIdea, Member, TripListEditor, ActivityChoice } from '../types/trip';
import { initialTripData } from '../data/initialData';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Modal, Field, Empty } from './ui';
import { input, btnSolid, btnQuiet, btnLink, btnBrass, initialOf, voterLabel } from './ui-kit';
import { routeOfDay, zoneById, formatMinutes, googleMapsRouteUrl } from '../services/route';

interface ItineraryTabProps extends TripListEditor {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
  me: Member | null;
}

const startMinutes = (time: string): number => {
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2]);
};

const CATEGORY_CONFIG: Record<
  Activity['category'] | PlaceIdea['category'],
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  travel: { label: 'เดินทาง', icon: Car },
  food: { label: 'ร้านอาหาร', icon: UtensilsCrossed },
  cafe: { label: 'คาเฟ่', icon: Coffee },
  nature: { label: 'ธรรมชาติ', icon: Trees },
  relax: { label: 'พักผ่อน', icon: BedDouble },
  activity: { label: 'กิจกรรม', icon: Compass },
  party: { label: 'ปาร์ตี้', icon: PartyPopper },
  other: { label: 'อื่น ๆ', icon: Sparkles },
};

export const ItineraryTab: React.FC<ItineraryTabProps> = ({
  trip,
  onSaveItem,
  onRemoveItem,
  me,
}) => {
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Form states for Activity
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [japaneseTitle, setJapaneseTitle] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<Activity['category']>('travel');
  const [badge, setBadge] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Form states for Place Idea (Wishlist)
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaCategory, setIdeaCategory] = useState<PlaceIdea['category']>('cafe');
  const [ideaLocation, setIdeaLocation] = useState('');
  const [ideaMapUrl, setIdeaMapUrl] = useState('');
  const [ideaSuggestedBy, setIdeaSuggestedBy] = useState(me?.nickname || '');
  const [ideaNotes, setIdeaNotes] = useState('');

  const rawDay =
    trip.itinerary.find((d) => d.dayNumber === selectedDayNumber) || trip.itinerary[0];

  const defaultDay = initialTripData.itinerary.find((d) => d.dayNumber === selectedDayNumber);
  const rawActivities = (rawDay?.activities && rawDay.activities.length > 0)
    ? rawDay.activities
    : (defaultDay?.activities || []);

  const currentDay = rawDay && {
    ...rawDay,
    activities: [...rawActivities].sort(
      (a, b) => startMinutes(a.time) - startMinutes(b.time)
    ),
  };

  const route = currentDay ? routeOfDay(currentDay) : null;
  const mapsUrl = currentDay ? googleMapsRouteUrl(currentDay.activities) : null;

  const handleOpenNewActivityModal = () => {
    setEditingActivity(null);
    setTime('10:00 – 11:30');
    setTitle('');
    setJapaneseTitle('');
    setLocation('');
    setCategory('cafe');
    setBadge('');
    setMapUrl('');
    setNotes('');
    setIsActivityModalOpen(true);
  };

  const handleOpenEditActivityModal = (act: Activity) => {
    setEditingActivity(act);
    setTime(act.time);
    setTitle(act.title);
    setJapaneseTitle(act.japaneseTitle || '');
    setLocation(act.location);
    setCategory(act.category);
    setBadge(act.badge || '');
    setMapUrl(act.mapUrl || '');
    setNotes(act.notes || '');
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !time.trim()) return;

    const newAct: Activity = {
      id: editingActivity ? editingActivity.id : `act-${Date.now()}`,
      time,
      title,
      japaneseTitle: japaneseTitle.trim() || undefined,
      location,
      category,
      badge: badge.trim() || undefined,
      mapUrl: mapUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      imageUrl: editingActivity?.imageUrl,
      choices: editingActivity?.choices,
    };

    const day = trip.itinerary.find((d) => d.dayNumber === selectedDayNumber);
    if (day) {
      onSaveItem('itinerary', {
        ...day,
        activities: editingActivity
          ? day.activities.map((a) => (a.id === editingActivity.id ? newAct : a))
          : [...day.activities, newAct],
      });
    }
    setIsActivityModalOpen(false);
  };

  const handleDeleteActivity = (activityId: string) => {
    const act = currentDay?.activities.find((a) => a.id === activityId);
    if (!window.confirm(`ลบ "${act?.title ?? 'กิจกรรมนี้'}" ออกจากตาราง?`)) return;

    const day = trip.itinerary.find((d) => d.dayNumber === selectedDayNumber);
    if (day) {
      onSaveItem('itinerary', {
        ...day,
        activities: day.activities.filter((a) => a.id !== activityId),
      });
    }
  };

  const handleVoteChoice = (activityId: string, choiceId: string) => {
    if (!me) {
      alert('กรุณาเลือกชื่อผู้ใช้งานของคุณที่แถบ "สมาชิก" เพื่อร่วมโหวต');
      return;
    }
    const voter = me.id;
    const day = trip.itinerary.find((d) => d.dayNumber === selectedDayNumber);
    if (!day) return;

    const updatedActivities = day.activities.map((act) => {
      if (act.id !== activityId || !act.choices) return act;
      const updatedChoices = act.choices.map((c) => {
        if (c.id === choiceId) {
          const hasVoted = c.votes?.includes(voter);
          const newVotes = hasVoted
            ? (c.votes || []).filter((v) => v !== voter)
            : [...(c.votes || []), voter];
          return { ...c, votes: newVotes };
        } else {
          // Single-choice voting per activity: unselect other option
          return { ...c, votes: (c.votes || []).filter((v) => v !== voter) };
        }
      });
      return { ...act, choices: updatedChoices };
    });

    onSaveItem('itinerary', { ...day, activities: updatedActivities });
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

    onSaveItem('placeIdeas', newIdea);

    setIdeaTitle('');
    setIdeaLocation('');
    setIdeaMapUrl('');
    setIdeaNotes('');
    setIsWishlistModalOpen(false);
  };

  const handleVotePlaceIdea = (ideaId: string) => {
    if (!me) {
      alert('กรุณาเลือกชื่อผู้ใช้งานของคุณที่แถบ "สมาชิก" เพื่อร่วมโหวต');
      return;
    }
    const voter = me.id;
    const idea = trip.placeIdeas.find((i) => i.id === ideaId);
    if (!idea) return;

    const isAdding = !idea.votes.includes(voter);
    const votes = idea.votes.filter((v) => v !== voter);
    onSaveItem('placeIdeas', { ...idea, votes: isAdding ? [...votes, voter] : votes });
  };

  const handleDeletePlaceIdea = (ideaId: string) => {
    onRemoveItem('placeIdeas', ideaId);
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

    const day = trip.itinerary.find((d) => d.dayNumber === dayNum);
    if (day) onSaveItem('itinerary', { ...day, activities: [...day.activities, newAct] });
    setSelectedDayNumber(dayNum);
  };

  const getMember = (idOrNick: string) =>
    trip.members.find((m) => m.id === idOrNick || m.nickname === idOrNick);

  return (
    <div className="pb-16 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <PageHead
        title="แผนการเดินทาง (Itinerary)"
        note="ตารางกิจกรรมทริปเขาใหญ่ 2 วัน 1 คืน ออกแบบตามแผนจริง พร้อมภาพวาดประกอบสไตล์สตอรี่บุ๊คมินิมอลญี่ปุ่น"
        action={
          <div className="flex items-center gap-3">
            <button onClick={() => setIsWishlistModalOpen(true)} className={btnQuiet}>
              เสนอที่เที่ยว
            </button>
            <button onClick={handleOpenNewActivityModal} className={btnSolid}>
              <Plus className="w-4 h-4 mr-1.5 inline" />
              เพิ่มกิจกรรม
            </button>
          </div>
        }
      />

      {/* Day Selector Tabs */}
      <div className="bg-paper rounded-panel border border-mist-deep p-1.5 flex gap-2">
        {trip.itinerary.map((day) => {
          const isActive = day.dayNumber === selectedDayNumber;
          return (
            <button
              key={day.dayNumber}
              onClick={() => setSelectedDayNumber(day.dayNumber)}
              className={`flex-1 py-3 px-4 rounded-ctl text-left transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-surface shadow-xs border border-mist-deep'
                  : 'hover:bg-surface/50 text-stone'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-display text-body font-medium ${
                    isActive ? 'text-ink font-semibold' : 'text-stone'
                  }`}
                >
                  {day.dayLabel}
                </span>
                <span
                  className={`text-fine px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-ink text-paper font-medium' : 'bg-mist-deep text-stone'
                  }`}
                >
                  {day.activities.length || (initialTripData.itinerary.find(d => d.dayNumber === day.dayNumber)?.activities.length || 0)} กิจกรรม
                </span>
              </div>
              <p className="mt-0.5 text-fine text-stone/80">{day.date}</p>
            </button>
          );
        })}
      </div>

      {/* Day Header Info Banner */}
      {selectedDayNumber === 1 && (
        <div className="bg-surface/80 rounded-panel border border-mist-deep/70 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-fine text-brass font-medium uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Day 1 Signature Schedule
            </div>
            <h2 className="font-display text-lead text-ink">
              กรุงเทพฯ — เขาใหญ่ · ซิ่งโกคาร์ท & ปาร์ตี้พูลวิลล่าส่วนตัว
            </h2>
            <p className="text-fine text-stone">
              ออกเดินทาง 07:00 น. · พักผ่อนวิลล่าส่วนตัว 4 ห้องนอน · ปาร์ตี้บาร์บีคิวโต๊ะพูลริมสระยันดึก (ไม่จำกัดเวลาใช้เสียง)
            </p>
          </div>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className={`${btnQuiet} inline-flex items-center gap-2 self-start md:self-center shrink-0 border border-mist-deep`}
            >
              <MapPinned className="w-4 h-4 text-brass" />
              <span>เปิดเส้นทาง Day 1 ใน Maps</span>
              <ExternalLink className="w-3.5 h-3.5 text-stone" />
            </a>
          )}
        </div>
      )}

      {/* Timeline Activities List */}
      {currentDay && (
        <div className="space-y-6">
          {currentDay.activities.length === 0 ? (
            <Panel>
              <Empty
                title={`ยังไม่มีรายการใน ${currentDay.dayLabel}`}
                note="ดึงจากที่เพื่อนเสนอไว้ใน Wishlist ด้านล่าง หรือกดปุ่มเพิ่มกิจกรรมเพื่อเริ่มบันทึก"
                action={
                  <button onClick={handleOpenNewActivityModal} className={btnLink}>
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มกิจกรรมแรก
                  </button>
                }
              />
            </Panel>
          ) : (
            <div className="space-y-6">
              {currentDay.activities.map((act, index) => {
                const categoryInfo = CATEGORY_CONFIG[act.category] || CATEGORY_CONFIG.other;
                const CategoryIcon = categoryInfo.icon;
                const stop = route?.stops[index];
                const previousZone = route?.stops
                  .slice(0, index)
                  .reverse()
                  .find((s) => s.zone)?.zone;
                const showLeg =
                  stop?.legMinutes != null && previousZone && previousZone !== stop.zone;

                return (
                  <React.Fragment key={act.id}>
                    {/* Inter-stop Driving Leg Banner */}
                    {showLeg && (
                      <div className="relative flex items-center justify-center my-3">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-dashed border-stone/30" />
                        </div>
                        <div className="relative bg-paper px-4 py-1.5 rounded-full border border-mist-deep text-fine text-stone flex items-center gap-2 shadow-xs">
                          <Car className="w-3.5 h-3.5 text-brass" />
                          <span>
                            ขับรถประมาณ {formatMinutes(stop.legMinutes!)} ไปยังโซน {zoneById(stop.zone!).name}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Activity Card */}
                    <article className="bg-paper rounded-panel border border-mist-deep overflow-hidden transition-all duration-200 hover:border-ink/20 hover:shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                        {/* Artwork Illustration Column */}
                        {act.imageUrl && (
                          <div className="md:col-span-4 bg-surface/40 relative group overflow-hidden border-b md:border-b-0 md:border-r border-mist-deep min-h-[200px] md:min-h-full">
                            <img
                              src={act.imageUrl}
                              alt={act.title}
                              className="w-full h-full object-cover object-center aspect-[4/3] md:aspect-auto transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                            {/* Artwork Fullscreen Button */}
                            <button
                              onClick={() =>
                                setPreviewImage({
                                  url: act.imageUrl!,
                                  title: act.title,
                                  subtitle: act.japaneseTitle,
                                })
                              }
                              aria-label={`ขยายภาพ ${act.title}`}
                              className="absolute bottom-3 right-3 bg-ink/75 hover:bg-ink text-paper p-2 rounded-full backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer shadow-sm"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            {/* Japanese Subtitle Badge on Artwork */}
                            {act.japaneseTitle && (
                              <div className="absolute top-3 left-3 bg-paper/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-sans text-ink border border-mist-deep tracking-wider">
                                {act.japaneseTitle}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Content Column */}
                        <div
                          className={`${
                            act.imageUrl ? 'md:col-span-8' : 'md:col-span-12'
                          } p-6 sm:p-7 flex flex-col justify-between`}
                        >
                          <div>
                            {/* Card Top Meta */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-mist-deep/70 pb-3 mb-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface text-ink text-fine font-medium border border-mist-deep">
                                  <Clock className="w-3.5 h-3.5 text-brass" />
                                  {act.time}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface text-stone text-fine">
                                  <CategoryIcon className="w-3.5 h-3.5 text-stone" />
                                  {categoryInfo.label}
                                </span>
                                {act.badge && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-brass-lit/40 text-ink text-fine font-medium">
                                    {act.badge}
                                  </span>
                                )}
                              </div>

                              {/* Card Actions */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditActivityModal(act)}
                                  className="p-1.5 text-stone hover:text-ink hover:bg-surface rounded-ctl transition-colors"
                                  title="แก้ไขกิจกรรม"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteActivity(act.id)}
                                  className="p-1.5 text-stone hover:text-red-600 hover:bg-red-50 rounded-ctl transition-colors"
                                  title="ลบกิจกรรม"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Title & Location */}
                            <h3 className="font-display text-lead text-ink tracking-tight font-semibold">
                              {act.title}
                            </h3>

                            {act.location && (
                              <div className="mt-1.5 flex items-center gap-1.5 text-fine text-stone">
                                <MapPin className="w-3.5 h-3.5 text-brass shrink-0" />
                                <span>{act.location}</span>
                              </div>
                            )}

                            {/* Description Notes */}
                            {act.notes && (
                              <p className="mt-3 text-body text-stone leading-relaxed">
                                {act.notes}
                              </p>
                            )}

                            {/* Interactive Choices / Poll Section */}
                            {act.choices && act.choices.length > 0 && (
                              <div className="mt-5 pt-4 border-t border-mist-deep/70">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-fine font-semibold text-ink flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-brass" />
                                    โหวตแผนที่เพื่อนชอบ (Option Poll)
                                  </span>
                                  <span className="text-fine text-stone">
                                    {act.choices.reduce((acc, c) => acc + (c.votes?.length || 0), 0)} โหวตทั้งหมด
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {act.choices.map((choice, cIndex) => {
                                    const hasVoted = me ? choice.votes?.includes(me.id) : false;
                                    const voteCount = choice.votes?.length || 0;
                                    const totalVotes = act.choices!.reduce(
                                      (acc, c) => acc + (c.votes?.length || 0),
                                      0
                                    );
                                    const percent =
                                      totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

                                    return (
                                      <div
                                        key={choice.id}
                                        className={`p-3.5 rounded-ctl border transition-all ${
                                          hasVoted
                                            ? 'bg-brass-lit/20 border-brass/50'
                                            : 'bg-surface/50 border-mist-deep hover:border-ink/20'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div>
                                            <span className="text-fine font-semibold text-brass block">
                                              ตัวเลือกที่ {cIndex + 1}
                                            </span>
                                            <p className="text-body text-ink font-medium mt-0.5">
                                              {choice.label}
                                            </p>
                                          </div>
                                          <button
                                            onClick={() => handleVoteChoice(act.id, choice.id)}
                                            className={`px-3 py-1 text-fine rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
                                              hasVoted
                                                ? 'bg-ink text-paper'
                                                : 'bg-mist-deep hover:bg-mist-deep/80 text-stone hover:text-ink'
                                            }`}
                                          >
                                            {hasVoted ? 'เลือกแล้ว' : 'โหวต'}
                                          </button>
                                        </div>

                                        {choice.sublabel && (
                                          <p className="text-fine text-stone mt-1.5 leading-snug">
                                            {choice.sublabel}
                                          </p>
                                        )}

                                        {/* Vote Tally & Avatars */}
                                        <div className="mt-3 pt-2.5 border-t border-mist-deep/60 flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-1.5">
                                            <div className="flex -space-x-1.5 overflow-hidden">
                                              {choice.votes && choice.votes.length > 0 ? (
                                                choice.votes.map((voterId) => {
                                                  const voter = getMember(voterId);
                                                  return (
                                                    <span
                                                      key={voterId}
                                                      title={voter?.nickname || voterId}
                                                      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-paper border border-paper shadow-2xs"
                                                      style={{
                                                        backgroundColor: voter?.avatarColor || '#1b3b2b',
                                                      }}
                                                    >
                                                      {initialOf(voter?.nickname || voterId)}
                                                    </span>
                                                  );
                                                })
                                              ) : (
                                                <span className="text-fine text-stone/60">
                                                  ยังไม่มีผู้โหวต
                                                </span>
                                              )}
                                            </div>
                                            {voteCount > 0 && (
                                              <span className="text-fine text-stone ml-1">
                                                {voteCount} เสียง
                                              </span>
                                            )}
                                          </div>

                                          <span className="text-fine font-semibold text-ink">
                                            {percent}%
                                          </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mt-1.5 w-full bg-mist-deep h-1 rounded-full overflow-hidden">
                                          <div
                                            className="bg-brass h-full rounded-full transition-all duration-300"
                                            style={{ width: `${percent}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Card Footer Actions */}
                          {act.mapUrl && (
                            <div className="mt-5 pt-3 border-t border-mist-deep/60 flex items-center justify-end">
                              <a
                                href={act.mapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-fine text-ink hover:text-brass transition-colors font-medium"
                              >
                                <span>เปิดนำทางใน Google Maps</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Drive Summary Footer */}
          {route && route.stops.length > 0 && (
            <div className="bg-surface/60 rounded-panel border border-mist-deep p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-body text-ink">
                  ประเมินเวลาขับรถตลอดทั้งวัน รวมประมาณ{' '}
                  <span className="font-semibold text-brass">{formatMinutes(route.driveMinutes)}</span>
                </p>
                <p className="text-fine text-stone">
                  เส้นทางคำนวณตามระยะห่างระหว่างโซนในเขาใหญ่ แนะนำให้เดินทางพร้อมกันหรือประสานงานผ่านวิทยุสื่อสาร/กลุ่มแชท
                </p>
              </div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${btnSolid} inline-flex items-center gap-2 self-start shrink-0`}
                >
                  <MapPinned className="w-4 h-4" />
                  เปิดแผนที่รวมทั้งหมด
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Wishlist Panel (ที่ที่เพื่อนเสนอมา) */}
      <Panel className="border border-mist-deep mt-10">
        <div className="flex items-baseline justify-between gap-4 border-b border-mist-deep pb-5">
          <div>
            <h2 className="font-display text-lead text-ink">สถานที่ที่เพื่อนเสนอมา (Wishlist)</h2>
            <p className="text-fine text-stone mt-0.5">
              เสนอคาเฟ่ ร้านอาหาร หรือจุดแวะถ่ายรูประหว่างทาง โหวตสถานที่ที่อยากไป แล้วสามารถดึงลงตารางเที่ยวได้ทันที
            </p>
          </div>
          <span className="text-fine text-stone shrink-0">{trip.placeIdeas.length} แห่ง</span>
        </div>

        {trip.placeIdeas.length === 0 ? (
          <Empty
            title="ยังไม่มีสถานที่ในรายการเสนอ"
            note="เสนอร้านกาแฟ PB Valley, ชิมมัทฉะ Khaam, หรือคาเฟ่ถ่ายรูปสวยๆ บนเส้นทางธนะรัชต์"
            action={
              <button onClick={() => setIsWishlistModalOpen(true)} className={btnLink}>
                <Plus className="w-3.5 h-3.5" />
                เสนอสถานที่แรก
              </button>
            }
          />
        ) : (
          <ul className="divide-y divide-mist-deep">
            {trip.placeIdeas.map((idea) => {
              const catConfig = CATEGORY_CONFIG[idea.category] || CATEGORY_CONFIG.other;
              const CatIcon = catConfig.icon;
              const hasVoted = me ? idea.votes.includes(me.id) : false;

              return (
                <li key={idea.id} className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-fine text-stone bg-surface px-2 py-0.5 rounded-full">
                          <CatIcon className="w-3 h-3 text-brass" />
                          {catConfig.label}
                        </span>
                        <h4 className="text-body font-medium text-ink">{idea.title}</h4>
                      </div>
                      {idea.location && (
                        <p className="mt-1 text-fine text-stone flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone" />
                          {idea.location} · เสนอโดย {idea.suggestedBy}
                        </p>
                      )}
                      {idea.notes && <p className="mt-1 text-fine text-stone/90">{idea.notes}</p>}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleVotePlaceIdea(idea.id)}
                        className={`px-3 py-1.5 rounded-full text-fine font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                          hasVoted
                            ? 'bg-ink text-paper'
                            : 'bg-surface hover:bg-mist-deep text-stone hover:text-ink'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{idea.votes.length} โหวต</span>
                      </button>

                      {/* Dropdown to add to Day 1 or Day 2 */}
                      <div className="flex items-center gap-1 bg-surface rounded-full p-0.5 border border-mist-deep">
                        <button
                          onClick={() => handleMoveIdeaToItinerary(idea, 1)}
                          className="px-2.5 py-1 text-fine text-stone hover:text-ink hover:bg-paper rounded-full transition-colors"
                          title="เพิ่มลง Day 1"
                        >
                          ลง Day 1
                        </button>
                        <button
                          onClick={() => handleMoveIdeaToItinerary(idea, 2)}
                          className="px-2.5 py-1 text-fine text-stone hover:text-ink hover:bg-paper rounded-full transition-colors"
                          title="เพิ่มลง Day 2"
                        >
                          ลง Day 2
                        </button>
                      </div>

                      {idea.mapUrl && (
                        <a
                          href={idea.mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-stone hover:text-ink transition-colors"
                          title="เปิดแผนที่"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        onClick={() => handleDeletePlaceIdea(idea.id)}
                        className="p-1.5 text-stone hover:text-red-600 transition-colors"
                        title="ลบสถานที่"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {/* Activity Add/Edit Modal */}
      {isActivityModalOpen && (
        <Modal
          title={editingActivity ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมในตาราง'}
          note={`กำหนดช่วงเวลา สถานที่ และรายละเอียดสำหรับ ${currentDay?.dayLabel}`}
          onClose={() => setIsActivityModalOpen(false)}
          wide
        >
          <form onSubmit={handleSaveActivity} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="ช่วงเวลา" htmlFor="act-time" hint="เช่น 07:00 – 10:00 หรือ 17:00 – Drunk">
                <input
                  id="act-time"
                  type="text"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="07:00 – 10:00"
                  className={input}
                />
              </Field>

              <Field label="หมวดหมู่" htmlFor="act-category">
                <select
                  id="act-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Activity['category'])}
                  className={input}
                >
                  <option value="travel">เดินทาง (Travel)</option>
                  <option value="activity">กิจกรรม (Activity)</option>
                  <option value="food">ร้านอาหาร (Food)</option>
                  <option value="cafe">คาเฟ่ (Cafe)</option>
                  <option value="relax">พักผ่อน (Relax)</option>
                  <option value="party">ปาร์ตี้ (Party)</option>
                  <option value="nature">ธรรมชาติ (Nature)</option>
                  <option value="other">อื่น ๆ (Other)</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="ชื่อกิจกรรม" htmlFor="act-title">
                <input
                  id="act-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น Go to Khaoyai"
                  className={input}
                />
              </Field>

              <Field label="ชื่อภาษาญี่ปุ่น (ทางเลือก)" htmlFor="act-ja-title" hint="เพื่อคุมธีมสตอรี่บุ๊คญี่ปุ่น">
                <input
                  id="act-ja-title"
                  type="text"
                  value={japaneseTitle}
                  onChange={(e) => setJapaneseTitle(e.target.value)}
                  placeholder="เช่น カオヤイへの旅"
                  className={input}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="สถานที่" htmlFor="act-location">
                <input
                  id="act-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="เช่น Khaoyai Speedkart หรือ Harper Pool Villa"
                  className={input}
                />
              </Field>

              <Field label="ป้ายแท็กไฮไลท์" htmlFor="act-badge">
                <input
                  id="act-badge"
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="เช่น ออกเดินทาง, กิจกรรมสุดมันส์, ไฮไลท์ประจำทริป"
                  className={input}
                />
              </Field>
            </div>

            <Field label="ลิงก์ Google Maps" htmlFor="act-map">
              <input
                id="act-map"
                type="url"
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                className={input}
              />
            </Field>

            <Field label="บันทึกรายละเอียด / กำหนดการ" htmlFor="act-notes">
              <textarea
                id="act-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="รายละเอียดเพิ่มเติม สิ่งที่ต้องเตรียม หรือข้อตกลงร่วมกัน"
                className={input}
              />
            </Field>

            <div className="pt-3 flex justify-end gap-3 border-t border-mist-deep">
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className={btnQuiet}
              >
                ยกเลิก
              </button>
              <button type="submit" className={btnSolid}>
                {editingActivity ? 'บันทึกการแก้ไข' : 'เพิ่มในตาราง'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Wishlist Add Modal */}
      {isWishlistModalOpen && (
        <Modal
          title="เสนอสถานที่ท่องเที่ยว / คาเฟ่"
          note="เพิ่มที่ที่อยากไปเพื่อให้เพื่อนร่วมทริปช่วยกันโหวต"
          onClose={() => setIsWishlistModalOpen(false)}
          wide
        >
          <form onSubmit={handleSavePlaceIdea} className="space-y-4">
            <Field label="ชื่อสถานที่" htmlFor="idea-title">
              <input
                id="idea-title"
                type="text"
                required
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
                placeholder="เช่น MAA Khaoyai, Buun Khaoyai, น้ำตกเหวนรก"
                className={input}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="หมวดหมู่" htmlFor="idea-category">
                <select
                  id="idea-category"
                  value={ideaCategory}
                  onChange={(e) => setIdeaCategory(e.target.value as PlaceIdea['category'])}
                  className={input}
                >
                  <option value="cafe">คาเฟ่</option>
                  <option value="food">ร้านอาหาร</option>
                  <option value="nature">ธรรมชาติ</option>
                  <option value="party">กิจกรรม / อื่น ๆ</option>
                </select>
              </Field>

              <Field label="ที่ตั้ง / โซน" htmlFor="idea-location">
                <input
                  id="idea-location"
                  type="text"
                  value={ideaLocation}
                  onChange={(e) => setIdeaLocation(e.target.value)}
                  placeholder="เช่น ปากช่อง, ถนนธนะรัชต์, มิตรภาพ"
                  className={input}
                />
              </Field>
            </div>

            <Field label="ลิงก์ Google Maps" htmlFor="idea-map">
              <input
                id="idea-map"
                type="url"
                value={ideaMapUrl}
                onChange={(e) => setIdeaMapUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                className={input}
              />
            </Field>

            <Field label="ทำไมถึงอยากไป / เมนูแนะนำ" htmlFor="idea-notes">
              <textarea
                id="idea-notes"
                rows={2}
                value={ideaNotes}
                onChange={(e) => setIdeaNotes(e.target.value)}
                placeholder="กาแฟดี มัทฉะพรีเมียม ถ่ายรูปมุมสวยมาก เป็นต้น"
                className={input}
              />
            </Field>

            <div className="pt-3 flex justify-end gap-3 border-t border-mist-deep">
              <button
                type="button"
                onClick={() => setIsWishlistModalOpen(false)}
                className={btnQuiet}
              >
                ยกเลิก
              </button>
              <button type="submit" className={btnSolid}>
                เสนอที่เที่ยว
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-paper rounded-panel overflow-hidden max-w-3xl w-full border border-mist-deep shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-mist-deep flex items-center justify-between">
              <div>
                <h3 className="font-display text-lead text-ink">{previewImage.title}</h3>
                {previewImage.subtitle && (
                  <p className="text-fine text-stone">{previewImage.subtitle}</p>
                )}
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 text-stone hover:text-ink transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 bg-surface/30">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="w-full h-auto max-h-[75vh] object-contain rounded-ctl mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
