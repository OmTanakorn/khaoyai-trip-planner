import React, { useState } from 'react';
import { Plus, Trash2, ExternalLink, X } from 'lucide-react';
import { TripData, AccommodationOption, Room, Member, TripListEditor } from '../types/trip';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Modal, Field, Empty, Tag, Meter } from './ui';
import { input, btnSolid, btnQuiet, btnBrass, btnLink, baht, voterLabel } from './ui-kit';

interface AccommodationTabProps extends TripListEditor {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
  me: Member | null;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80';

export const AccommodationTab: React.FC<AccommodationTabProps> = ({
  trip,
  onUpdateTrip,
  onSaveItem,
  onRemoveItem,
  me,
}) => {
  const [isNewOptionModalOpen, setIsNewOptionModalOpen] = useState(false);
  const [bookingOption, setBookingOption] = useState<AccommodationOption | null>(null);
  const [checkIn, setCheckIn] = useState('14:00 น.');
  const [checkOut, setCheckOut] = useState('11:00 น.');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [assigningRoomId, setAssigningRoomId] = useState<string | null>(null);

  const [optionName, setOptionName] = useState('');
  const [optionLocation, setOptionLocation] = useState('');
  const [optionPrice, setOptionPrice] = useState<number | ''>('');
  const [optionBedrooms, setOptionBedrooms] = useState(4);
  const [optionBathrooms, setOptionBathrooms] = useState(4);
  const [optionCapacity, setOptionCapacity] = useState(12);
  const [optionLinkUrl, setOptionLinkUrl] = useState('');
  const [optionImageUrl, setOptionImageUrl] = useState('');
  const [optionHighlights, setOptionHighlights] = useState('');
  const [optionSuggestedBy, setOptionSuggestedBy] = useState('');

  const confirmedCount = trip.members.filter((m) => m.status === 'confirmed').length || 10;
  const mostVotes = Math.max(0, ...trip.accommodationOptions.map((o) => o.votes.length));

  const handleVote = (optionId: string) => {
    if (!me) return;
    const voter = me.id;
    // Decided here, from what this person sees, so a retry cannot flip the
    // vote back and forth.
    const isAdding = !trip.accommodationOptions
      .find((o) => o.id === optionId)
      ?.votes.includes(voter);

    const option = trip.accommodationOptions.find((o) => o.id === optionId);
    if (!option) return;
    const votes = option.votes.filter((v) => v !== voter);
    onSaveItem('accommodationOptions', {
      ...option,
      votes: isAdding ? [...votes, voter] : votes,
    });
  };

  const handleCreateOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionName.trim() || !optionPrice) return;

    const highlightsArray = optionHighlights
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);

    const newOption: AccommodationOption = {
      id: `opt-${Date.now()}`,
      name: optionName.trim(),
      location: optionLocation.trim() || 'เขาใหญ่ ปากช่อง',
      pricePerNight: Number(optionPrice),
      bedrooms: Number(optionBedrooms),
      bathrooms: Number(optionBathrooms),
      capacity: Number(optionCapacity),
      linkUrl: optionLinkUrl.trim(),
      imageUrl: optionImageUrl.trim() || FALLBACK_IMAGE,
      highlights:
        highlightsArray.length > 0
          ? highlightsArray
          : ['สระว่ายน้ำส่วนตัว', 'เตาปิ้งย่าง', 'โต๊ะพูล'],
      suggestedBy: optionSuggestedBy.trim() || 'เพื่อนร่วมทริป',
      votes: [],
    };

    onSaveItem('accommodationOptions', newOption);

    setOptionName('');
    setOptionLocation('');
    setOptionPrice('');
    setOptionLinkUrl('');
    setOptionImageUrl('');
    setOptionHighlights('');
    setIsNewOptionModalOpen(false);
  };

  const handleDeleteOption = (optionId: string) => {
    const opt = trip.accommodationOptions.find((o) => o.id === optionId);
    if (!window.confirm(`ลบ ${opt?.name ?? 'ตัวเลือกนี้'} ออกจากการโหวต?`)) return;
    onRemoveItem('accommodationOptions', optionId);
  };

  const handleFinalizeAccommodation = (e: React.FormEvent) => {
    e.preventDefault();
    const option = bookingOption;
    if (!option) return;

    const rooms: Room[] = Array.from({ length: option.bedrooms }, (_, i) => ({
      id: `r-${i + 1}`,
      roomName: `ห้องนอนที่ ${i + 1}`,
      bedType:
        i === 0
          ? 'เตียงคิงไซส์ 6 ฟุต นอนได้ 2–3 คน'
          : 'เตียง 5 ฟุต หรือเตียงคู่ นอนได้ 2–3 คน',
      capacity: Math.ceil(option.capacity / option.bedrooms),
      guestIds: [],
      hasBathroom: i < option.bathrooms,
    }));

    onUpdateTrip((t) => ({
      ...t,
      confirmedAccommodation: {
        name: option.name,
        villaType: `พูลวิลล่าส่วนตัว ${option.bedrooms} ห้องนอน ${option.bathrooms} ห้องน้ำ รองรับได้ ${option.capacity} คน`,
        address: option.location,
        mapUrl: option.linkUrl || 'https://maps.google.com/?q=Khao+Yai',
        checkIn: checkIn.trim(),
        checkOut: checkOut.trim(),
        totalBedrooms: option.bedrooms,
        totalBathrooms: option.bathrooms,
        // Left blank until someone has the real thing from the host.
        wifiSsid: wifiSsid.trim() || undefined,
        wifiPassword: wifiPassword.trim() || undefined,
        rooms,
      },
    }));
    setBookingOption(null);
  };

  /** Move someone into a room, taking them out of whichever room they were in. */
  const handleAssignGuest = (roomId: string, memberId: string) => {
    onUpdateTrip((t) => {
      if (!t.confirmedAccommodation) return t;
      return {
        ...t,
        confirmedAccommodation: {
          ...t.confirmedAccommodation,
          rooms: t.confirmedAccommodation.rooms.map((room) => {
            const without = room.guestIds.filter((id) => id !== memberId);
            if (room.id !== roomId) return { ...room, guestIds: without };
            // Capacity is re-checked here against the newest data.
            const isFull = without.length >= room.capacity;
            return { ...room, guestIds: isFull ? without : [...without, memberId] };
          }),
        },
      };
    });
    setAssigningRoomId(null);
  };

  const handleRemoveGuest = (roomId: string, memberId: string) => {
    onUpdateTrip((t) => {
      if (!t.confirmedAccommodation) return t;
      return {
        ...t,
        confirmedAccommodation: {
          ...t.confirmedAccommodation,
          rooms: t.confirmedAccommodation.rooms.map((room) =>
            room.id === roomId
              ? { ...room, guestIds: room.guestIds.filter((id) => id !== memberId) }
              : room
          ),
        },
      };
    });
  };

  const handleResetToPoll = () => {
    if (!window.confirm('กลับไปเปิดโหวตที่พักใหม่? การจัดห้องนอนที่ทำไว้จะหายไป')) return;
    onUpdateTrip((t) => ({ ...t, confirmedAccommodation: undefined }));
  };

  /* ── Booked ─────────────────────────────────────────────── */
  if (trip.confirmedAccommodation) {
    const stay = trip.confirmedAccommodation;
    const totalCapacity = stay.rooms.reduce((s, r) => s + r.capacity, 0);
    const roomed = new Set(stay.rooms.flatMap((r) => r.guestIds));
    const unroomedMembers = trip.members.filter(
      (m) => m.status !== 'declined' && !roomed.has(m.id)
    );

    return (
      <div className="pb-16">
        <PageHead
          title="ที่พัก"
          note={stay.villaType}
          aside={
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              <Tag tone="go">จองแล้ว</Tag>
              <Tag tone="off">{stay.address}</Tag>
              <Tag tone="off">
                เข้าพัก {stay.checkIn} · คืนห้อง {stay.checkOut}
              </Tag>
            </div>
          }
          action={
            <button onClick={handleResetToPoll} className={btnQuiet}>
              เปิดโหวตใหม่
            </button>
          }
        />

        <div className="bg-ink px-6 sm:px-8 py-10 mb-px">
          <p className="text-fine text-brass-lit">ที่พักของทริปนี้</p>
          <h2 className="mt-3 font-display text-title sm:text-display leading-tight text-paper max-w-2xl">
            {stay.name}
          </h2>
          <p className="mt-4 text-body text-mist/70">
            {stay.totalBedrooms} ห้องนอน · {stay.totalBathrooms} ห้องน้ำ · นอนได้ {totalCapacity} คน
          </p>
          <p className="mt-2 text-fine text-mist/60">
            {stay.wifiSsid
              ? `ไวไฟ ${stay.wifiSsid}${stay.wifiPassword ? ` · รหัส ${stay.wifiPassword}` : ''}`
              : 'ยังไม่มีใครใส่ชื่อไวไฟ ถึงที่พักแล้วมาเติมได้'}
          </p>
          {stay.mapUrl && (
            <a
              href={stay.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 text-fine text-paper border-b border-brass pb-0.5 hover:text-brass-lit transition-colors"
            >
              เปิดแผนที่
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <Panel>
          <h2 className="font-display text-lead text-ink">การจัดห้องนอน</h2>
          <p className="mt-2 text-fine text-stone border-b border-mist-deep pb-5">
            ห้องว่างตามจำนวนห้องนอนของวิลล่า จับคู่กันเองได้เลยตอนถึงที่พัก
          </p>

          <ul className="divide-y divide-mist-deep">
            {stay.rooms.map((room) => (
              <li key={room.id} className="py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <p className="text-body text-ink">{room.roomName}</p>
                    <p className="mt-1 text-fine text-stone">
                      {room.bedType}
                      {room.hasBathroom && ' · มีห้องน้ำในตัว'}
                    </p>
                  </div>
                  <span className="text-fine text-stone shrink-0">
                    {room.guestIds.length} จาก {room.capacity} คน
                  </span>
                </div>
                <div className="mt-3">
                  <Meter value={room.guestIds.length} max={room.capacity} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {room.guestIds.length === 0 && (
                    <p className="text-fine text-stone">ยังไม่มีใครนอนห้องนี้</p>
                  )}
                  {room.guestIds.map((id) => {
                    const guest = trip.members.find((m) => m.id === id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1.5 text-fine text-ink">
                        <span
                          className="w-1.5 h-1.5"
                          style={{ backgroundColor: guest?.avatarColor || '#2f4a3c' }}
                          aria-hidden="true"
                        />
                        {guest?.nickname ?? 'เพื่อน'}
                        <button
                          onClick={() => handleRemoveGuest(room.id, id)}
                          className="text-stone hover:text-ink transition-colors"
                          aria-label={`ย้าย ${guest?.nickname ?? 'คนนี้'} ออกจาก ${room.roomName}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}

                  {room.guestIds.length < room.capacity && (
                    <button
                      onClick={() => setAssigningRoomId(room.id)}
                      disabled={trip.members.length === 0}
                      className={`${btnLink} disabled:opacity-40 disabled:pointer-events-none`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      ใส่คนในห้องนี้
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {unroomedMembers.length > 0 && (
            <p className="mt-6 pt-5 border-t border-mist-deep text-fine text-stone">
              ยังไม่มีห้องนอน {unroomedMembers.map((m) => m.nickname).join(' · ')}
            </p>
          )}
        </Panel>

        {assigningRoomId && (
          <Modal
            title="ใครนอนห้องนี้"
            note="กดชื่อเพื่อย้ายเข้ามา คนที่อยู่ห้องอื่นจะถูกย้ายให้อัตโนมัติ"
            onClose={() => setAssigningRoomId(null)}
          >
            <ul className="divide-y divide-mist-deep max-h-72 overflow-y-auto">
              {trip.members
                .filter((m) => m.status !== 'declined')
                .map((member) => {
                  const currentRoom = stay.rooms.find((r) => r.guestIds.includes(member.id));
                  const isHere = currentRoom?.id === assigningRoomId;
                  return (
                    <li key={member.id}>
                      <button
                        onClick={() => handleAssignGuest(assigningRoomId, member.id)}
                        disabled={isHere}
                        className="w-full flex items-center justify-between gap-4 py-3 text-left disabled:opacity-50 group"
                      >
                        <span className="inline-flex items-center gap-2.5 text-body text-ink group-hover:text-brass transition-colors">
                          <span
                            className="w-1.5 h-1.5"
                            style={{ backgroundColor: member.avatarColor }}
                            aria-hidden="true"
                          />
                          {member.nickname}
                        </span>
                        <span className="text-fine text-stone">
                          {isHere
                            ? 'อยู่ห้องนี้แล้ว'
                            : currentRoom
                              ? `ย้ายจาก${currentRoom.roomName}`
                              : 'ยังไม่มีห้อง'}
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </Modal>
        )}
      </div>
    );
  }

  /* ── Still voting ───────────────────────────────────────── */
  return (
    <div className="pb-16">
      <PageHead
        title="ที่พัก"
        note="มองหาพูลวิลล่าสี่ถึงห้าห้องนอนสำหรับคืนวันที่ 31 ต.ค. แปะลิงก์ที่เจอไว้ให้เพื่อนโหวต"
        aside={
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Tag tone="wait">ยังไม่ได้ที่พัก</Tag>
            <Tag tone="off">{trip.accommodationOptions.length} ตัวเลือก</Tag>
          </div>
        }
        action={
          <button onClick={() => setIsNewOptionModalOpen(true)} className={btnSolid}>
            เสนอที่พัก
          </button>
        }
      />

      {!me && (
        <Panel className="mb-px">
          <p className="text-body text-stone">
            เลือกชื่อคุณที่มุมขวาบนก่อน แล้วจึงจะโหวตได้ เพื่อนจะได้รู้ว่าใครเลือกอะไร
          </p>
        </Panel>
      )}

      {trip.accommodationOptions.length === 0 ? (
        <Panel>
          <Empty
            title="ยังไม่มีที่พักให้เลือก"
            note="เจอวิลล่าที่น่าสนใจใน Agoda, Airbnb หรือเพจไหน แปะลิงก์กับราคาไว้ตรงนี้"
            action={
              <button onClick={() => setIsNewOptionModalOpen(true)} className={btnLink}>
                <Plus className="w-3.5 h-3.5" />
                เสนอที่พักแรก
              </button>
            }
          />
        </Panel>
      ) : (
        <div className="bg-paper divide-y divide-mist-deep">
          {trip.accommodationOptions.map((option) => {
            const estPerPerson = Math.round(option.pricePerNight / confirmedCount);
            const isVoted = !!me && option.votes.includes(me.id);
            const isLeading = mostVotes > 0 && option.votes.length === mostVotes;

            return (
              <article
                key={option.id}
                className="px-6 sm:px-8 py-7 grid grid-cols-1 sm:grid-cols-[13rem_1fr] gap-6"
              >
                <img
                  src={option.imageUrl}
                  alt={option.name}
                  className="w-full h-40 sm:h-full object-cover rounded-ctl bg-mist"
                />

                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-display text-lead text-ink">{option.name}</h2>
                      <p className="mt-1 text-fine text-stone">
                        {option.location} · {option.bedrooms} ห้องนอน · {option.bathrooms} ห้องน้ำ ·
                        นอนได้ {option.capacity} คน
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteOption(option.id)}
                      className="text-stone hover:text-ink transition-colors shrink-0"
                      aria-label={`ลบ ${option.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="mt-4 text-body text-ink">
                    {baht(option.pricePerNight)} ต่อคืน
                    <span className="ml-2 text-fine text-stone">
                      หาร {confirmedCount} คน ตกคนละ {baht(estPerPerson)}
                    </span>
                  </p>

                  <p className="mt-3 text-fine text-stone">
                    {option.highlights.join(' · ')}
                  </p>

                  <p className="mt-2 text-fine text-stone">เสนอโดย {option.suggestedBy}</p>

                  {option.linkUrl && (
                    <a
                      href={option.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`mt-4 ${btnLink}`}
                    >
                      ดูรูปและรายละเอียด
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <div className="mt-6 pt-5 border-t border-mist-deep flex flex-wrap items-center gap-x-4 gap-y-3">
                    <button
                      onClick={() => handleVote(option.id)}
                      disabled={!me}
                      aria-pressed={isVoted}
                      title={me ? undefined : 'เลือกชื่อคุณที่มุมขวาบนก่อน'}
                      className={`${isVoted ? btnBrass : btnQuiet} disabled:opacity-40 disabled:pointer-events-none`}
                    >
                      {isVoted ? `โหวตแล้ว ${option.votes.length}` : `โหวตที่นี่ ${option.votes.length}`}
                    </button>

                    <button onClick={() => setBookingOption(option)} className={btnLink}>
                      เลือกที่นี่เลย
                    </button>

                    {isLeading && <Tag tone="wait">คะแนนนำอยู่</Tag>}

                    {option.votes.length > 0 && (
                      <p className="text-fine text-stone w-full">
                        โหวตโดย{' '}
                        {option.votes.map((v) => voterLabel(trip.members, v)).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {bookingOption && (
        <Modal
          title={`เลือก ${bookingOption.name}`}
          note="กรอกเท่าที่รู้ตอนนี้ ที่เหลือมาเติมทีหลังได้"
          onClose={() => setBookingOption(null)}
        >
          <form onSubmit={handleFinalizeAccommodation} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="เข้าพักได้ตั้งแต่" htmlFor="stay-in">
                <input
                  id="stay-in"
                  type="text"
                  required
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  placeholder="14:00 น."
                  className={input}
                />
              </Field>
              <Field label="ต้องคืนห้องก่อน" htmlFor="stay-out">
                <input
                  id="stay-out"
                  type="text"
                  required
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  placeholder="11:00 น."
                  className={input}
                />
              </Field>
            </div>

            <Field
              label="ชื่อไวไฟ"
              htmlFor="stay-wifi"
              hint="ยังไม่รู้ก็เว้นว่างไว้ ค่อยมาใส่ตอนถึงที่พัก"
            >
              <input
                id="stay-wifi"
                type="text"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                className={input}
              />
            </Field>

            <Field label="รหัสไวไฟ" htmlFor="stay-wifi-pass">
              <input
                id="stay-wifi-pass"
                type="text"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                className={input}
              />
            </Field>

            <p className="text-fine text-stone">
              จะสร้างห้องนอนว่างไว้ {bookingOption.bedrooms} ห้อง ให้ไปจับคู่กันในหน้าถัดไป
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setBookingOption(null)}
                className={`flex-1 ${btnQuiet}`}
              >
                ยกเลิก
              </button>
              <button type="submit" className={`flex-1 ${btnSolid}`}>
                ยืนยันที่พักนี้
              </button>
            </div>
          </form>
        </Modal>
      )}

      {isNewOptionModalOpen && (
        <Modal
          title="เสนอที่พัก"
          note="กรอกเท่าที่รู้ก่อนก็ได้ แก้ทีหลังได้เสมอ"
          onClose={() => setIsNewOptionModalOpen(false)}
          wide
        >
          <form onSubmit={handleCreateOption} className="space-y-5">
            <Field label="ชื่อที่พัก" htmlFor="opt-name">
              <input
                id="opt-name"
                type="text"
                required
                value={optionName}
                onChange={(e) => setOptionName(e.target.value)}
                placeholder="Mountain Pool Villa Khao Yai"
                className={input}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="ราคาต่อคืน บาท" htmlFor="opt-price">
                <input
                  id="opt-price"
                  type="number"
                  min={1000}
                  required
                  value={optionPrice}
                  onChange={(e) => setOptionPrice(Number(e.target.value))}
                  placeholder="12000"
                  className={input}
                />
              </Field>
              <Field label="ทำเล" htmlFor="opt-loc">
                <input
                  id="opt-loc"
                  type="text"
                  value={optionLocation}
                  onChange={(e) => setOptionLocation(e.target.value)}
                  placeholder="ถนนธนะรัชต์ หมูสี"
                  className={input}
                />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="ห้องนอน" htmlFor="opt-bed">
                <input
                  id="opt-bed"
                  type="number"
                  min={1}
                  max={10}
                  value={optionBedrooms}
                  onChange={(e) => setOptionBedrooms(Number(e.target.value))}
                  className={input}
                />
              </Field>
              <Field label="ห้องน้ำ" htmlFor="opt-bath">
                <input
                  id="opt-bath"
                  type="number"
                  min={1}
                  max={10}
                  value={optionBathrooms}
                  onChange={(e) => setOptionBathrooms(Number(e.target.value))}
                  className={input}
                />
              </Field>
              <Field label="นอนได้กี่คน" htmlFor="opt-cap">
                <input
                  id="opt-cap"
                  type="number"
                  min={1}
                  max={30}
                  value={optionCapacity}
                  onChange={(e) => setOptionCapacity(Number(e.target.value))}
                  className={input}
                />
              </Field>
            </div>

            <Field label="ลิงก์ที่พัก" htmlFor="opt-link">
              <input
                id="opt-link"
                type="url"
                value={optionLinkUrl}
                onChange={(e) => setOptionLinkUrl(e.target.value)}
                placeholder="https://"
                className={input}
              />
            </Field>

            <Field
              label="ลิงก์รูป"
              htmlFor="opt-img"
              hint="เว้นว่างได้ จะใช้รูปมาตรฐานแทน"
            >
              <input
                id="opt-img"
                type="url"
                value={optionImageUrl}
                onChange={(e) => setOptionImageUrl(e.target.value)}
                placeholder="https://"
                className={input}
              />
            </Field>

            <Field label="จุดเด่น" htmlFor="opt-high" hint="คั่นแต่ละอย่างด้วยจุลภาค">
              <input
                id="opt-high"
                type="text"
                value={optionHighlights}
                onChange={(e) => setOptionHighlights(e.target.value)}
                placeholder="สระว่ายน้ำส่วนตัว, คาราโอเกะ, โต๊ะพูล, เตาปิ้งย่าง"
                className={input}
              />
            </Field>

            <Field label="ชื่อผู้เสนอ" htmlFor="opt-by">
              <input
                id="opt-by"
                type="text"
                required
                value={optionSuggestedBy}
                onChange={(e) => setOptionSuggestedBy(e.target.value)}
                placeholder="แบงค์ โอม"
                className={input}
              />
            </Field>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsNewOptionModalOpen(false)}
                className={`flex-1 ${btnQuiet}`}
              >
                ยกเลิก
              </button>
              <button type="submit" className={`flex-1 ${btnSolid}`}>
                เพิ่มตัวเลือก
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
