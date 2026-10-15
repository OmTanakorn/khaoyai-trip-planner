import React, { useState } from 'react';
import { Send, Trash2, Car, MapPinned, Link2, FileDown, MessageCircle } from 'lucide-react';
import { TripData, Member, TripListEditor } from '../types/trip';
import { TripUpdate } from '../services/storage';
import { calculateBalances } from '../services/settlement';
import {
  routeOfDay,
  zoneOf,
  zoneById,
  driveMinutes,
  formatMinutes,
  googleMapsRouteUrl,
  ZoneId,
} from '../services/route';
import { Modal, Field, Tag } from './ui';
import { input, btnSolid, btnQuiet, btnLink, baht, initialOf } from './ui-kit';
import { RouteMap } from './RouteMap';

interface OverviewTabProps extends TripListEditor {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
  setActiveTab: (tab: string) => void;
  me: Member | null;
  onChooseMe: (who: string | Member | null) => void;
  onShare: () => void;
  onOpenSync: () => void;
  isFirebase: boolean;
}

const AVATAR_COLORS = [
  '#1b3b2b', '#a8782f', '#6f6a60', '#4c6a56', '#d4a85e',
  '#2f5a45', '#8a6326', '#3e5c4c', '#b99561', '#5d6b60',
];

const DAY_MS = 1000 * 60 * 60 * 24;

const thaiDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });

/** "Day 1: ออกเดินทาง & เช็คอิน" → "ออกเดินทาง & เช็คอิน" */
const dayTitle = (label: string) => label.replace(/^Day\s*\d+\s*:\s*/i, '');

const clockOf = (time: string) => time.split(/[–-]/)[0].trim();

export const OverviewTab: React.FC<OverviewTabProps> = ({
  trip,
  onSaveItem,
  onRemoveItem,
  setActiveTab,
  me,
  onChooseMe,
  onShare,
  onOpenSync,
  isFirebase,
}) => {
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Quick RSVP form states
  const [quickNickname, setQuickNickname] = useState('');
  const [quickName, setQuickName] = useState('');
  const [quickStatus, setQuickStatus] = useState<Member['status']>('confirmed');
  const [quickHasCar, setQuickHasCar] = useState(false);
  const [quickCarSeats, setQuickCarSeats] = useState(4);
  const [quickCarModel, setQuickCarModel] = useState('');
  const [showQuickRsvp, setShowQuickRsvp] = useState(false);

  // ── Where the trip stands ─────────────────────────────────────
  const confirmedMembers = trip.members.filter((m) => m.status === 'confirmed');
  const maybeCount = trip.members.filter((m) => m.status === 'maybe').length;
  const totalCarSeats = trip.cars.reduce((sum, car) => sum + car.maxSeats, 0);
  const plannedStops = trip.itinerary.reduce((sum, d) => sum + d.activities.length, 0);

  const today = new Date();
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const daysLeft = Math.ceil((start.getTime() - today.getTime()) / DAY_MS);
  const isOver = today.getTime() > end.getTime() + DAY_MS;
  const countdown = isOver
    ? 'ทริปจบแล้ว'
    : daysLeft > 1
    ? `อีก ${daysLeft} วันออกเดินทาง`
    : daysLeft === 1
    ? 'พรุ่งนี้ออกเดินทาง'
    : daysLeft === 0
    ? 'วันนี้ออกเดินทาง'
    : 'อยู่ระหว่างทริป';
  const yearBE = start.getFullYear() + 543;

  // ── What it means for whoever is holding the phone ────────────
  const myCar = me
    ? trip.cars.find(
        (c) =>
          c.passengerIds.includes(me.id) ||
          c.driverName.includes(me.nickname) ||
          c.driverName.includes(me.name)
      )
    : undefined;
  const myRoom = me
    ? trip.confirmedAccommodation?.rooms.find((r) => r.guestIds.includes(me.id))
    : undefined;
  const myBalance = me
    ? calculateBalances(trip.expenses, trip.members, trip.payments ?? []).find(
        (b) => b.memberId === me.id
      )
    : undefined;
  const myNet = Math.round(myBalance?.net ?? 0);

  // ── Route ─────────────────────────────────────────────────────
  // During the trip, open on the day it is; before it, on the first day.
  const dayIndexToday = Math.floor((today.getTime() - start.getTime()) / DAY_MS);
  const initialDay =
    trip.itinerary.find((d) => d.dayNumber === dayIndexToday + 1)?.dayNumber ??
    trip.itinerary[0]?.dayNumber ??
    1;
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const day = trip.itinerary.find((d) => d.dayNumber === selectedDay) ?? trip.itinerary[0];
  const route = day ? routeOfDay(day) : null;
  const stayZone = trip.confirmedAccommodation
    ? zoneOf(trip.confirmedAccommodation.address, trip.confirmedAccommodation.name)
    : null;
  const stopCounts: Partial<Record<ZoneId, number>> = {};
  route?.stops.forEach((s) => {
    if (s.zone) stopCounts[s.zone] = (stopCounts[s.zone] ?? 0) + 1;
  });
  const mapsUrl = day ? googleMapsRouteUrl(day.activities) : null;

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;

    // Built out here, not inside the updater: the updater may run several
    // times and the id and date must stay the same each time.
    const announcement = {
      id: `an-${Date.now()}`,
      text: newAnnouncement.trim(),
      date: new Date().toISOString().split('T')[0],
      author: me?.nickname || 'เพื่อนร่วมทริป',
    };

    onSaveItem('announcements', announcement);
    setNewAnnouncement('');
    setShowAnnounceForm(false);
  };

  const handleDeleteAnnouncement = (id: string) => {
    const item = trip.announcements.find((a) => a.id === id);
    if (!window.confirm(`ลบข้อความของ ${item?.author ?? 'คนนี้'} ออกจากบอร์ด?`)) return;
    onRemoveItem('announcements', id);
  };

  const handleQuickRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNickname.trim()) return;

    const newMember: Member = {
      id: `m-${Date.now()}`,
      name: quickName.trim() || quickNickname.trim(),
      nickname: quickNickname.trim(),
      avatarColor: AVATAR_COLORS[trip.members.length % AVATAR_COLORS.length],
      status: quickStatus,
      role: trip.members.length === 0 ? 'organizer' : 'member',
      hasCarVolunteer: quickHasCar,
      carSeatsOffered: quickHasCar ? quickCarSeats : undefined,
    };

    const newCar =
      quickHasCar && quickCarModel.trim()
        ? {
            id: `c-${Date.now()}`,
            driverName: `${quickNickname.trim()} (${quickCarModel.trim()})`,
            carModel: quickCarModel.trim(),
            maxSeats: Number(quickCarSeats),
            meetingPoint: 'รอกำหนดจุดนัดพบ',
            departureTime: '07:30 น.',
            passengerIds: [newMember.id],
          }
        : null;

    onSaveItem('members', newMember);
    if (newCar) onSaveItem('cars', newCar);

    // This form is someone signing themselves up, so this browser is now them
    // — no second trip through the "who are you" picker. Someone filling it in
    // for a friend keeps whoever the device already belongs to.
    if (!me) onChooseMe(newMember);

    setQuickNickname('');
    setQuickName('');
    setQuickCarModel('');
    setQuickHasCar(false);
    setShowQuickRsvp(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const readiness = [
    {
      tab: 'members',
      label: 'เพื่อนที่ไปแน่',
      value: `${confirmedMembers.length} คน`,
      done: confirmedMembers.length >= 10,
      state:
        confirmedMembers.length >= 10
          ? 'ครบแก๊งแล้ว'
          : `ยังขาดอีก ${10 - confirmedMembers.length} คน`,
    },
    {
      tab: 'cars',
      label: 'รถ',
      value: `${trip.cars.length} คัน`,
      done: trip.cars.length > 0 && totalCarSeats >= confirmedMembers.length,
      state:
        trip.cars.length === 0
          ? 'ยังไม่มีใครอาสาขับ'
          : totalCarSeats >= confirmedMembers.length
          ? `นั่งได้ ${totalCarSeats} คน พอแล้ว`
          : `ที่นั่งขาดอีก ${confirmedMembers.length - totalCarSeats} ที่`,
    },
    {
      tab: 'stay',
      label: 'ที่พัก',
      value: trip.confirmedAccommodation
        ? 'จองแล้ว'
        : `${trip.accommodationOptions.length} ตัวเลือก`,
      done: Boolean(trip.confirmedAccommodation),
      state: trip.confirmedAccommodation
        ? trip.confirmedAccommodation.name
        : trip.accommodationOptions.length > 0
        ? 'กำลังโหวตกันอยู่'
        : 'ยังไม่มีใครเสนอ',
    },
    {
      tab: 'itinerary',
      label: 'จุดแวะในตาราง',
      value: `${plannedStops} จุด`,
      done: trip.itinerary.every((d) => d.activities.length >= 2),
      state:
        trip.placeIdeas.length > 0
          ? `เพื่อนเสนอไว้อีก ${trip.placeIdeas.length} ที่`
          : plannedStops === 0
          ? 'ยังว่างทั้งทริป'
          : 'เสนอที่เที่ยวเพิ่มได้',
    },
  ];

  return (
    <div className="pb-20 space-y-3">
      {/* ── Hero: the trip, and where you stand in it ─────────── */}
      <section className="relative overflow-hidden rounded-panel bg-ink text-paper">
        <img
          src={trip.coverImage}
          alt="ช้างป่าเดินข้ามถนนในเขาใหญ่ รถจอดรอให้ผ่าน"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/20"
          aria-hidden="true"
        />

        <div className="relative grid md:grid-cols-[1fr_20rem] lg:grid-cols-[1fr_22rem] gap-8 px-5 sm:px-10 py-8 sm:py-12 min-h-[24rem]">
          <div className="flex flex-col">
            <p className="text-fine text-brass-lit">{trip.destination}</p>
            <h1 className="mt-3 font-display text-title sm:text-display text-paper max-w-xl">
              {trip.title}
            </h1>
            <p className="mt-3 text-lead text-mist/90">
              {thaiDate(trip.startDate)} – {thaiDate(trip.endDate)} {yearBE}
              <span className="text-brass-lit whitespace-nowrap"> {countdown}</span>
            </p>

            <div className="mt-auto pt-10">
              {confirmedMembers.length > 0 ? (
                <button
                  onClick={() => setActiveTab('members')}
                  className="group flex items-center gap-3 text-left"
                >
                  <span className="flex -space-x-1.5" aria-hidden="true">
                    {confirmedMembers.slice(0, 12).map((m) => (
                      <span
                        key={m.id}
                        className="w-7 h-7 rounded-full grid place-items-center text-[11px] font-medium text-paper ring-2 ring-ink"
                        style={{ backgroundColor: m.avatarColor }}
                      >
                        {initialOf(m.nickname)}
                      </span>
                    ))}
                  </span>
                  <span className="text-fine text-mist/80 group-hover:text-paper transition-colors">
                    ไปแน่ {confirmedMembers.length} คน
                    {maybeCount > 0 && ` ขอดูก่อนอีก ${maybeCount}`}
                  </span>
                </button>
              ) : (
                <p className="text-fine text-mist/70">ยังไม่มีใครลงชื่อ เป็นคนแรกได้เลย</p>
              )}
            </div>
          </div>

          {/* Personal plan — the three things a friend opens the link to check */}
          <div className="self-end bg-paper text-ink rounded-panel p-5">
            {me ? (
              <>
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-7 h-7 rounded-full grid place-items-center text-fine font-medium text-paper"
                    style={{ backgroundColor: me.avatarColor }}
                    aria-hidden="true"
                  >
                    {initialOf(me.nickname)}
                  </span>
                  <p className="text-body font-semibold">แผนของ{me.nickname}</p>
                </div>

                <dl className="mt-4 divide-y divide-mist-deep/70">
                  <div className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <dt className="text-fine text-stone">รถ</dt>
                      <dd className="text-body truncate">
                        {myCar ? myCar.driverName : 'ยังไม่มีที่นั่ง'}
                      </dd>
                      {myCar && (
                        <dd className="text-fine text-stone truncate">
                          {myCar.departureTime} {myCar.meetingPoint}
                        </dd>
                      )}
                    </div>
                    <button
                      onClick={() => setActiveTab('cars')}
                      className={`${btnLink} shrink-0 mt-4`}
                    >
                      {myCar ? 'ดูรถ' : 'เลือกรถ'}
                    </button>
                  </div>

                  <div className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <dt className="text-fine text-stone">ห้องนอน</dt>
                      <dd className="text-body truncate">
                        {myRoom
                          ? myRoom.roomName
                          : trip.confirmedAccommodation
                          ? 'ยังไม่ได้เลือกห้อง'
                          : 'รอสรุปที่พัก'}
                      </dd>
                    </div>
                    <button
                      onClick={() => setActiveTab('stay')}
                      className={`${btnLink} shrink-0 mt-4`}
                    >
                      {myRoom ? 'ดูห้อง' : trip.confirmedAccommodation ? 'เลือกห้อง' : 'ไปโหวต'}
                    </button>
                  </div>

                  <div className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <dt className="text-fine text-stone">ค่าใช้จ่าย</dt>
                      <dd className={`text-body ${myNet < 0 ? 'text-brass font-medium' : ''}`}>
                        {myNet < 0
                          ? `ต้องโอนอีก ${baht(-myNet)}`
                          : myNet > 0
                          ? `เพื่อนต้องคืนคุณ ${baht(myNet)}`
                          : 'ไม่มียอดค้าง'}
                      </dd>
                    </div>
                    <button
                      onClick={() => setActiveTab('expenses')}
                      className={`${btnLink} shrink-0 mt-4`}
                    >
                      {myNet < 0 ? 'จ่ายเลย' : 'ดูยอด'}
                    </button>
                  </div>
                </dl>
              </>
            ) : (
              <>
                <p className="text-body font-semibold">ไปด้วยกันไหม</p>
                <p className="mt-1.5 text-fine text-stone">
                  ลงชื่อแล้วตรงนี้จะบอกว่าคุณนั่งรถคันไหน นอนห้องไหน และต้องโอนเท่าไร
                </p>
                <button
                  onClick={() => setShowQuickRsvp(true)}
                  className={`${btnSolid} w-full mt-5`}
                >
                  ลงชื่อร่วมทริป
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Readiness: four things that decide whether the trip happens ── */}
      <section className="bg-surface rounded-panel grid grid-cols-2 md:grid-cols-4">
        {readiness.map((item) => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className="text-left px-5 sm:px-6 py-5 rounded-panel hover:bg-mist-deep/40 transition-colors min-w-0"
          >
            <p className="text-fine text-stone">{item.label}</p>
            <p className="mt-1 text-lead font-semibold text-ink">{item.value}</p>
            <p className="mt-1.5 truncate">
              <Tag tone={item.done ? 'go' : 'wait'}>{item.state}</Tag>
            </p>
          </button>
        ))}
      </section>

      {/* ── Route: Khao Yai is wide; the order of a day is the plan ── */}
      {route && day && (
        <section className="bg-paper rounded-panel px-5 sm:px-8 py-7">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-title text-ink">เส้นทาง</h2>
              <p className="mt-1.5 text-fine text-stone max-w-lg">
                คาเฟ่ถนนธนะรัชต์กับวังน้ำเขียวห่างกันราว{' '}
                {formatMinutes(driveMinutes('thanarat', 'wangnamkhiao'))} เรียงจุดแวะที่อยู่โซนเดียวกันไว้ติดกัน
                จะได้อยู่บนรถน้อยลง
              </p>
            </div>

            <div className="flex p-0.5 bg-surface rounded-ctl self-start sm:self-auto" role="tablist">
              {trip.itinerary.map((d) => {
                const isActive = d.dayNumber === selectedDay;
                return (
                  <button
                    key={d.dayNumber}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedDay(d.dayNumber)}
                    className={`px-4 py-1.5 rounded-[6px] text-fine transition-colors ${
                      isActive ? 'bg-paper text-ink font-medium' : 'text-stone hover:text-ink'
                    }`}
                  >
                    วันที่ {d.dayNumber}
                    <span className="ml-1.5 text-stone font-normal">{d.date.replace(/\s*\d{4}$/, '')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-[1.35fr_1fr] gap-8 lg:gap-10">
            <div className="bg-mist rounded-panel p-3 sm:p-5 md:self-start md:sticky md:top-32">
              <RouteMap
                path={route.zonePath}
                stopCounts={stopCounts}
                stayZone={stayZone}
                pathKey={`day-${day.dayNumber}-${route.zonePath.join('-')}`}
              />
            </div>

            <div className="flex flex-col min-w-0">
              <h3 className="text-body font-semibold text-ink">{dayTitle(day.dayLabel)}</h3>

              {route.stops.length === 0 ? (
                <div className="mt-4 flex-1">
                  <p className="text-body text-stone">
                    วันนี้ยังว่าง ดึงที่เที่ยวที่เพื่อนเสนอไว้ลงตาราง แล้วเส้นทางจะขึ้นบนแผนผังนี้
                  </p>
                  <button onClick={() => setActiveTab('itinerary')} className={`${btnLink} mt-4`}>
                    ไปจัดตารางเที่ยว
                  </button>
                </div>
              ) : (
                <>
                  <ol className="mt-4 flex-1">
                    {route.stops.map((stop, i) => {
                      const previousZone = route.stops
                        .slice(0, i)
                        .reverse()
                        .find((s) => s.zone)?.zone;
                      const showLeg =
                        stop.legMinutes !== null && previousZone && previousZone !== stop.zone;
                      return (
                        <li key={stop.activity.id}>
                          {showLeg && (
                            <p className="flex items-center gap-2 py-1.5 pl-[3.75rem] text-fine text-stone">
                              <Car className="w-3.5 h-3.5 text-brass" aria-hidden="true" />
                              ขับ ≈ {formatMinutes(stop.legMinutes!)}
                            </p>
                          )}
                          <div className="grid grid-cols-[3rem_1fr] gap-3 py-2">
                            <span className="text-fine text-stone pt-0.5 tabular-nums">
                              {clockOf(stop.activity.time)}
                            </span>
                            <div className="min-w-0">
                              <p className="text-body font-medium text-ink truncate">
                                {stop.activity.title}
                              </p>
                              <p className="text-fine text-stone truncate">
                                {stop.zone
                                  ? zoneById(stop.zone).name
                                  : stop.activity.location || 'ยังไม่ได้ใส่สถานที่'}
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  <div className="mt-5 pt-4 border-t border-mist-deep/70 space-y-2">
                    <p className="text-body text-ink">
                      ขับรวมราว <span className="font-semibold">{formatMinutes(route.driveMinutes)}</span>
                    </p>
                    {route.backtracks.length > 0 && (
                      <p className="text-fine text-brass">
                        วนกลับไป{route.backtracks.map((z) => zoneById(z).name).join(' และ ')}อีกรอบ
                        ลองย้ายจุดแวะในโซนเดียวกันมาไว้ติดกัน
                      </p>
                    )}
                    {route.unplaced > 0 && (
                      <p className="text-fine text-stone">
                        {route.unplaced} จุดยังไม่รู้ว่าอยู่โซนไหน ใส่ชื่อถนนหรืออำเภอในช่องสถานที่จะคำนวณได้
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noreferrer" className={`${btnSolid} inline-flex items-center gap-2`}>
                    <MapPinned className="w-4 h-4" aria-hidden="true" />
                    เปิดใน Google Maps
                  </a>
                )}
                <button onClick={() => setActiveTab('itinerary')} className={btnQuiet}>
                  แก้ตาราง
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Board and hand-off ─────────────────────────────────── */}
      <div className="grid md:grid-cols-[1.35fr_1fr] gap-3">
        <section className="bg-paper rounded-panel px-5 sm:px-8 py-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lead text-ink">ประกาศ</h2>
            <button
              onClick={() => setShowAnnounceForm(!showAnnounceForm)}
              className={btnLink}
              aria-expanded={showAnnounceForm}
            >
              {showAnnounceForm ? 'ปิด' : 'เขียนประกาศ'}
            </button>
          </div>

          {showAnnounceForm && (
            <form onSubmit={handleAddAnnouncement} className="mt-4 space-y-3">
              <label htmlFor="announce-text" className="sr-only">
                ข้อความประกาศ
              </label>
              <textarea
                id="announce-text"
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                placeholder="นัดเจอปั๊ม ปตท. วังน้อย 07:30 ใครมาช้าโทรบอกด้วย"
                rows={3}
                autoFocus
                className={input}
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-fine text-stone">
                  โพสต์ในชื่อ {me?.nickname ?? 'เพื่อนร่วมทริป'}
                </span>
                <button
                  type="submit"
                  disabled={!newAnnouncement.trim()}
                  className={`${btnSolid} inline-flex items-center gap-2`}
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  โพสต์
                </button>
              </div>
            </form>
          )}

          {trip.announcements.length === 0 ? (
            <p className="mt-6 text-body text-stone">
              ยังไม่มีประกาศ เขียนเรื่องที่ทุกคนต้องรู้ เช่น เวลานัดหรือของที่ต้องเอาไป
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-mist-deep/70">
              {[...trip.announcements].sort((a, b) => b.date.localeCompare(a.date)).map((item) => (
                <li key={item.id} className="py-4 flex items-start gap-4 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-ink">{item.text}</p>
                    <p className="mt-1 text-fine text-stone">
                      {item.author}, {new Date(item.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAnnouncement(item.id)}
                    className="text-stone/60 hover:text-ink transition-colors shrink-0 p-1"
                    aria-label={`ลบข้อความของ ${item.author}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-surface rounded-panel px-5 sm:px-8 py-7" data-print="hide">
          <h2 className="font-display text-lead text-ink">ส่งแผนให้เพื่อน</h2>

          <ul className="mt-4 -mx-2">
            {[
              {
                icon: MessageCircle,
                label: 'ส่งสรุปเข้า LINE',
                note: 'ข้อความสรุปรถ ที่พัก ตาราง พร้อมวาง',
                onClick: onShare,
              },
              {
                icon: Link2,
                label: copiedLink ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์ทริป',
                note: 'เพื่อนเปิดได้ทันที ไม่ต้องสมัครอะไร',
                onClick: handleCopyLink,
              },
              {
                icon: FileDown,
                label: 'บันทึกเป็น PDF',
                note: 'เก็บหน้านี้ไว้ดูตอนไม่มีเน็ต',
                onClick: () => window.print(),
              },
            ].map(({ icon: Icon, label, note, onClick }) => (
              <li key={note}>
                <button
                  onClick={onClick}
                  className="w-full flex items-start gap-3 px-2 py-3 rounded-ctl text-left hover:bg-mist-deep/40 transition-colors"
                >
                  <Icon className="w-4 h-4 mt-0.5 text-ink shrink-0" aria-hidden="true" />
                  <span>
                    <span className="block text-body text-ink">{label}</span>
                    <span className="block text-fine text-stone">{note}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-4 border-t border-mist-deep">
            <p className="flex items-center gap-2 text-fine text-ink">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isFirebase ? 'bg-moss' : 'bg-brass'}`}
                aria-hidden="true"
              />
              {isFirebase ? 'ซิงก์กับคลาวด์อยู่ เพื่อนเห็นการแก้ไขทันที' : 'บันทึกไว้ในเครื่องนี้'}
            </p>
            <p className="mt-1 text-fine text-stone">
              {isFirebase
                ? 'แก้จากเครื่องไหนก็ได้ ทุกคนเห็นแผนเดียวกัน'
                : 'ใช้ได้เลยโดยไม่ต้องสมัคร เปิดซิงก์เมื่ออยากให้เพื่อนแก้แผนเดียวกัน'}
            </p>
            <button onClick={onOpenSync} className={`${btnLink} mt-3`}>
              {isFirebase ? 'ตั้งค่าการซิงก์' : 'เปิดการซิงก์'}
            </button>
          </div>
        </section>
      </div>

      {/* ── Quick RSVP ───────────────────────────────────────── */}
      {showQuickRsvp && (
        <Modal
          title="ลงชื่อร่วมทริป"
          note={`${thaiDate(trip.startDate)} – ${thaiDate(trip.endDate)} ${yearBE}`}
          onClose={() => setShowQuickRsvp(false)}
        >
          <form onSubmit={handleQuickRsvp} className="space-y-5">
            <Field label="ชื่อเล่น" htmlFor="rsvp-nickname">
              <input
                id="rsvp-nickname"
                type="text"
                required
                autoFocus
                value={quickNickname}
                onChange={(e) => setQuickNickname(e.target.value)}
                placeholder="นัท แบงค์ โอม"
                className={input}
              />
            </Field>

            <Field label="ชื่อจริง ถ้าอยากใส่" htmlFor="rsvp-name">
              <input
                id="rsvp-name"
                type="text"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="ณัฐชา"
                className={input}
              />
            </Field>

            <Field label="ไปไหม" htmlFor="rsvp-status">
              <select
                id="rsvp-status"
                value={quickStatus}
                onChange={(e) => setQuickStatus(e.target.value as Member['status'])}
                className={input}
              >
                <option value="confirmed">ไปแน่นอน</option>
                <option value="maybe">ขอดูก่อน</option>
                <option value="declined">ติดธุระ ไปไม่ได้</option>
              </select>
            </Field>

            <div className="space-y-3">
              <label htmlFor="hasCar" className="flex items-center gap-2.5 text-body text-ink cursor-pointer">
                <input
                  type="checkbox"
                  id="hasCar"
                  checked={quickHasCar}
                  onChange={(e) => setQuickHasCar(e.target.checked)}
                  className="w-4 h-4 accent-ink"
                />
                เอารถไปได้ อาสาเป็นคนขับ
              </label>

              {quickHasCar && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="รุ่นรถ" htmlFor="rsvp-car">
                    <input
                      id="rsvp-car"
                      type="text"
                      required={quickHasCar}
                      value={quickCarModel}
                      onChange={(e) => setQuickCarModel(e.target.value)}
                      placeholder="CR-V, Civic, Yaris"
                      className={input}
                    />
                  </Field>
                  <Field label="นั่งได้กี่คน" htmlFor="rsvp-seats">
                    <input
                      id="rsvp-seats"
                      type="number"
                      min={1}
                      max={10}
                      value={quickCarSeats}
                      onChange={(e) => setQuickCarSeats(Number(e.target.value))}
                      className={input}
                    />
                  </Field>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowQuickRsvp(false)} className={`flex-1 ${btnQuiet}`}>
                ยกเลิก
              </button>
              <button type="submit" className={`flex-1 ${btnSolid}`}>
                ลงชื่อ
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
