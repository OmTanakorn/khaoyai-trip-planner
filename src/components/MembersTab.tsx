import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Pencil,
  Phone,
  Car,
  Home,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Search,
  UserCheck,
  Crown,
  ExternalLink,
} from 'lucide-react';
import { TripData, Member, TripListEditor } from '../types/trip';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Modal, Field, Empty, Meter } from './ui';
import { input, btnSolid, btnQuiet, btnBrass, btnLink, initialOf } from './ui-kit';

interface MembersTabProps extends TripListEditor {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
  me: Member | null;
  onChooseMe: (who: string | Member | null) => void;
}

const AVATAR_COLORS = [
  '#1b3b2b', '#a8782f', '#4a6b57', '#8c7340', '#3d5a4a',
  '#2f5a45', '#7d6b3f', '#55665c', '#b09a6a', '#42574b',
];

export const MembersTab: React.FC<MembersTabProps> = ({
  trip,
  onUpdateTrip,
  onSaveItem,
  onRemoveItem,
  me,
  onChooseMe,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'confirmed' | 'drivers' | 'organizer' | 'unassigned'>(
    'all'
  );

  // Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [promptPayId, setPromptPayId] = useState('');
  const [status, setStatus] = useState<Member['status']>('confirmed');
  const [role, setRole] = useState<Member['role']>('member');
  const [paidDeposit, setPaidDeposit] = useState(true);
  const [hasCarVolunteer, setHasCarVolunteer] = useState(false);
  const [carSeatsOffered, setCarSeatsOffered] = useState(4);
  const [isMe, setIsMe] = useState(false);

  // Toast / Copy Feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const members = useMemo(() => trip.members ?? [], [trip.members]);
  const confirmedMembers = useMemo(
    () => members.filter((m) => m.status === 'confirmed'),
    [members]
  );
  const driverMembers = useMemo(
    () =>
      members.filter((m) =>
        trip.cars.some(
          (c) =>
            c.driverName.includes(m.nickname) ||
            c.driverName.includes(m.name) ||
            m.hasCarVolunteer
        )
      ),
    [members, trip.cars]
  );
  const depositCount = useMemo(
    () => members.filter((m) => m.paidDeposit).length,
    [members]
  );
  const totalCarSeats = useMemo(
    () => trip.cars.reduce((sum, car) => sum + car.maxSeats, 0),
    [trip.cars]
  );
  const villaCapacity = trip.confirmedAccommodation?.maxGuests || 14;

  const handleOpenNewModal = () => {
    setEditingMember(null);
    setName('');
    setNickname('');
    setPhone('');
    setPromptPayId('');
    setStatus('confirmed');
    setRole('member');
    setPaidDeposit(true);
    setHasCarVolunteer(false);
    setCarSeatsOffered(4);
    setIsMe(!me);
    setIsMemberModalOpen(true);
  };

  const handleOpenEditModal = (m: Member) => {
    setEditingMember(m);
    setName(m.name);
    setNickname(m.nickname);
    setPhone(m.phone || '');
    setPromptPayId(m.promptPayId || '');
    setStatus(m.status);
    setRole(m.role);
    setPaidDeposit(!!m.paidDeposit);
    setHasCarVolunteer(Boolean(m.hasCarVolunteer));
    setCarSeatsOffered(m.carSeatsOffered || 4);
    setIsMe(me?.id === m.id);
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nickname.trim()) return;

    if (editingMember) {
      const updated: Member = {
        ...editingMember,
        name: name.trim(),
        nickname: nickname.trim(),
        phone: phone.trim() || undefined,
        promptPayId: promptPayId.trim() || undefined,
        status,
        role,
        paidDeposit,
        hasCarVolunteer,
        carSeatsOffered: hasCarVolunteer ? Number(carSeatsOffered) : undefined,
      };

      onSaveItem('members', updated);

      if (isMe) {
        onChooseMe({ ...updated, nickname });
      } else if (me?.id === editingMember.id) {
        onChooseMe(null);
      }
    } else {
      const newMem: Member = {
        id: `m-${Date.now()}`,
        name: name.trim(),
        nickname: nickname.trim(),
        phone: phone.trim() || undefined,
        promptPayId: promptPayId.trim() || undefined,
        avatarColor: AVATAR_COLORS[members.length % AVATAR_COLORS.length],
        status,
        role,
        paidDeposit,
        hasCarVolunteer,
        carSeatsOffered: hasCarVolunteer ? Number(carSeatsOffered) : undefined,
      };

      onSaveItem('members', newMem);
      if (isMe) onChooseMe(newMem);
    }

    setIsMemberModalOpen(false);
  };

  const handleDeleteMember = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (
      !window.confirm(
        `นำ "${member?.nickname ?? 'คนนี้'}" ออกจากทริป? รายชื่อจะถูกนำออกจากผังรถและห้องนอนด้วย`
      )
    ) {
      return;
    }

    if (me?.id === memberId) onChooseMe(null);
    onRemoveItem('members', memberId);

    // Remove from cars
    for (const car of trip.cars) {
      if (!car.passengerIds.includes(memberId)) continue;
      onSaveItem('cars', {
        ...car,
        passengerIds: car.passengerIds.filter((id) => id !== memberId),
      });
    }

    // Remove from villa rooms
    const villa = trip.confirmedAccommodation;
    if (villa?.rooms.some((r) => r.guestIds.includes(memberId))) {
      onUpdateTrip((t) => ({
        ...t,
        confirmedAccommodation: t.confirmedAccommodation && {
          ...t.confirmedAccommodation,
          rooms: t.confirmedAccommodation.rooms.map((r) => ({
            ...r,
            guestIds: r.guestIds.filter((id) => id !== memberId),
          })),
        },
      }));
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Filter tab
      let matchTab = true;
      if (activeFilter === 'confirmed') matchTab = m.status === 'confirmed';
      else if (activeFilter === 'drivers')
        matchTab = trip.cars.some(
          (c) =>
            c.driverName.includes(m.nickname) ||
            c.driverName.includes(m.name) ||
            m.hasCarVolunteer
        );
      else if (activeFilter === 'organizer') matchTab = m.role === 'organizer';
      else if (activeFilter === 'unassigned') {
        const hasCar = trip.cars.some((c) => c.passengerIds.includes(m.id));
        const hasRoom = trip.confirmedAccommodation?.rooms.some((r) =>
          r.guestIds.includes(m.id)
        );
        matchTab = !hasCar || !hasRoom;
      }

      // Search query
      const matchSearch =
        !searchQuery.trim() ||
        m.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.phone && m.phone.includes(searchQuery)) ||
        (m.promptPayId && m.promptPayId.includes(searchQuery));

      return matchTab && matchSearch;
    });
  }, [members, activeFilter, searchQuery, trip.cars, trip.confirmedAccommodation]);

  return (
    <div className="pb-20 max-w-5xl mx-auto space-y-6">
      {/* Editorial Page Head */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface text-[11px] font-medium text-ink tracking-wide uppercase mb-2">
            <Users className="w-3.5 h-3.5 text-brass" />
            <span>メンバーリスト · GANG ROSTER & DIRECTORY</span>
          </div>
          <h1 className="font-display text-display text-ink leading-tight">
            เพื่อนร่วมทริป ({members.length} คน)
          </h1>
          <p className="mt-1 text-body text-stone">
            ทำเนียบเพื่อนร่วมทริป ติดตามความพร้อม จัดสรรที่นั่งรถ ห้องนอน และช่องทางติดต่อ
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2.5">
          <button
            onClick={handleOpenNewModal}
            className={`${btnSolid} flex items-center gap-2 shadow-sm`}
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มเพื่อนร่วมทริป</span>
          </button>
        </div>
      </div>

      {/* Gang Roster Bento (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: Confirmed Members */}
        <div className="bg-paper rounded-panel p-5 border border-mist-deep shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-fine font-medium text-stone flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-moss" />
              สมาชิกยืนยันไปแน่นอน
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-display sm:text-[2.5rem] leading-none font-semibold text-ink tabular-nums">
                {confirmedMembers.length}
              </span>
              <span className="text-fine text-stone">/ 10–12 คน</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-stone">
            ครบตามเป้าหมายขนาดวิลล่า
          </p>
        </div>

        {/* Card 2: Car Seats Capacity */}
        <div className="bg-paper rounded-panel p-5 border border-mist-deep shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-fine font-medium text-stone flex items-center gap-1.5">
              <Car className="w-4 h-4 text-brass" />
              ที่นั่งรถทั้งหมด
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-display sm:text-[2.5rem] leading-none font-semibold text-ink tabular-nums">
                {totalCarSeats}
              </span>
              <span className="text-fine text-stone">ที่นั่ง ({trip.cars.length} คัน)</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-[#244b36] font-medium">
            เพียงพอสำหรับทุกคน (สำรอง {Math.max(0, totalCarSeats - confirmedMembers.length)} ที่)
          </p>
        </div>

        {/* Card 3: Villa Beds Capacity */}
        <div className="bg-paper rounded-panel p-5 border border-mist-deep shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-fine font-medium text-stone flex items-center gap-1.5">
              <Home className="w-4 h-4 text-brass" />
              เตียงนอนพูลวิลล่า
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-display sm:text-[2.5rem] leading-none font-semibold text-ink tabular-nums">
                {confirmedMembers.length}
              </span>
              <span className="text-fine text-stone">/ {villaCapacity} คน</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-stone">
            Harper Villa 4 ห้องนอน 4 ห้องน้ำ
          </p>
        </div>

        {/* Card 4: Deposit Status */}
        <div className="bg-paper rounded-panel p-5 border border-mist-deep shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-fine font-medium text-stone flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-moss" />
              สถานะโอนมัดจำ
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-display sm:text-[2.5rem] leading-none font-semibold text-ink tabular-nums">
                {depositCount}
              </span>
              <span className="text-fine text-stone">/ {members.length} คน</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-[#244b36] font-medium">
            {depositCount === members.length ? 'โอนครบทุกคนแล้ว 100%' : `รอโอนอีก ${members.length - depositCount} คน`}
          </p>
        </div>
      </div>

      {/* Search & Filter Pills */}
      <div className="bg-paper rounded-panel p-4 sm:p-5 border border-mist-deep shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone/70 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อเล่น, ชื่อจริง, หรือเบอร์โทร…"
              className="w-full pl-9 pr-3.5 py-2 text-fine rounded-ctl bg-surface/80 border border-transparent focus:outline-none focus:border-ink/40 focus:bg-paper transition-colors"
            />
          </div>

          {/* Identity Quick Status */}
          {me ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-ctl bg-surface text-fine text-ink">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: me.avatarColor }}
              />
              <span>เครื่องนี้จำคุณเป็น: <strong className="font-semibold">{me.nickname}</strong></span>
              <button
                onClick={() => onChooseMe(null)}
                className="text-[11px] text-stone hover:text-ink ml-1 underline cursor-pointer"
              >
                สลับชื่อ
              </button>
            </div>
          ) : (
            <span className="text-fine text-stone">
              กด "นี่คือฉัน" ที่การ์ดของคุณ เพื่อจำอุปกรณ์นี้
            </span>
          )}
        </div>

        {/* Filter Pills */}
        <div className="mt-4 pt-3 border-t border-mist-deep flex flex-wrap items-center gap-2">
          {[
            { id: 'all' as const, label: 'ทั้งหมด', count: members.length },
            { id: 'confirmed' as const, label: 'ไปแน่นอน', count: confirmedMembers.length },
            { id: 'drivers' as const, label: 'คนขับอาสา', count: driverMembers.length },
            {
              id: 'organizer' as const,
              label: 'ผู้จัดทริป',
              count: members.filter((m) => m.role === 'organizer').length,
            },
            {
              id: 'unassigned' as const,
              label: 'ยังไม่ระบุรถ/ห้อง',
              count: members.filter(
                (m) =>
                  !trip.cars.some((c) => c.passengerIds.includes(m.id)) ||
                  !trip.confirmedAccommodation?.rooms.some((r) => r.guestIds.includes(m.id))
              ).length,
            },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-fine font-medium transition-colors cursor-pointer ${
                activeFilter === pill.id
                  ? 'bg-ink text-paper'
                  : 'bg-surface text-stone hover:text-ink'
              }`}
            >
              <span>{pill.label}</span>
              <span className="font-mono tabular-nums opacity-80">({pill.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Gang Roster Cards Grid */}
      {filteredMembers.length === 0 ? (
        <Panel>
          <Empty
            title="ไม่พบรายชื่อเพื่อนที่ค้นหา"
            note="ลองพิมพ์ด้วยคำอื่น หรือกดล้างการค้นหา"
          />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredMembers.map((member) => {
            const memberCar = trip.cars.find((c) => c.passengerIds.includes(member.id));
            const isDriver = trip.cars.some(
              (c) =>
                c.driverName.includes(member.nickname) ||
                c.driverName.includes(member.name)
            );
            const memberRoom = trip.confirmedAccommodation?.rooms.find((r) =>
              r.guestIds.includes(member.id)
            );
            const isMeMember = me?.id === member.id;

            return (
              <div
                key={member.id}
                className={`bg-paper rounded-panel p-5 border shadow-xs transition-all flex flex-col justify-between ${
                  isMeMember
                    ? 'border-brass bg-[#fffdfa]'
                    : 'border-mist-deep hover:border-ink/20'
                }`}
              >
                <div>
                  {/* Top Bar: Avatar, Names, Role */}
                  <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-mist-deep">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-paper font-semibold text-body shrink-0 shadow-xs"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {initialOf(member.nickname)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display text-lead font-semibold text-ink truncate">
                            {member.nickname}
                          </h3>
                          {member.role === 'organizer' && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.2 rounded-full bg-brass/20 text-brass font-medium">
                              <Crown className="w-3 h-3" />
                              ผู้จัดทริป
                            </span>
                          )}
                          {isDriver && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.2 rounded-full bg-[#eaf1ec] text-[#244b36] font-medium">
                              <Car className="w-3 h-3" />
                              คนขับรถ
                            </span>
                          )}
                        </div>
                        <p className="text-fine text-stone truncate mt-0.5">
                          {member.name}
                        </p>
                      </div>
                    </div>

                    {/* Claim identity button */}
                    {isMeMember ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-brass text-paper font-medium shrink-0">
                        นี่คือคุณ
                      </span>
                    ) : (
                      <button
                        onClick={() => onChooseMe(member)}
                        className="text-[11px] text-stone hover:text-brass transition-colors shrink-0 underline cursor-pointer"
                        title="คลิกเพื่อจำว่าเครื่องนี้คือคุณ"
                      >
                        นี่คือฉัน
                      </button>
                    )}
                  </div>

                  {/* Logistics Connectivity Tags */}
                  <div className="mt-3.5 space-y-2 text-fine">
                    {/* Car */}
                    <div className="flex items-center justify-between text-stone">
                      <span className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-brass" />
                        <span>รถที่นั่ง:</span>
                      </span>
                      <span className="font-medium text-ink truncate max-w-[13rem]">
                        {memberCar ? (
                          memberCar.carModel
                        ) : isDriver ? (
                          'คนขับประจำรถ'
                        ) : (
                          <span className="text-[#934426] font-normal">ยังไม่ได้เลือกรถ</span>
                        )}
                      </span>
                    </div>

                    {/* Bedroom */}
                    <div className="flex items-center justify-between text-stone">
                      <span className="flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-brass" />
                        <span>ห้องนอน:</span>
                      </span>
                      <span className="font-medium text-ink truncate max-w-[13rem]">
                        {memberRoom ? (
                          memberRoom.roomName.split(':')[0]
                        ) : (
                          <span className="text-[#934426] font-normal">ยังไม่มีห้องนอน</span>
                        )}
                      </span>
                    </div>

                    {/* Deposit & PromptPay */}
                    <div className="flex items-center justify-between text-stone">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-moss" />
                        <span>มัดจำ & พร้อมเพย์:</span>
                      </span>
                      <span className="text-fine">
                        {member.paidDeposit ? (
                          <span className="text-[#244b36] font-medium">โอนมัดจำแล้ว</span>
                        ) : (
                          <span className="text-[#934426]">ยังไม่โอนมัดจำ</span>
                        )}
                        {member.promptPayId || member.phone ? (
                          <span className="text-stone"> · มีพร้อมเพย์</span>
                        ) : (
                          <span className="text-stone/60"> · ไม่มีพร้อมเพย์</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className="mt-4 pt-3 border-t border-mist-deep flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="inline-flex items-center gap-1 text-[11px] text-ink hover:text-brass transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{member.phone}</span>
                      </a>
                    )}

                    {(member.promptPayId || member.phone) && (
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            member.promptPayId || member.phone || '',
                            member.id
                          )
                        }
                        className="inline-flex items-center gap-1 text-[11px] text-stone hover:text-ink transition-colors cursor-pointer"
                        title="คัดลอกเลขพร้อมเพย์"
                      >
                        {copiedId === member.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-moss" />
                            <span className="text-moss">คัดลอกแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>คัดลอกพร้อมเพย์</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(member)}
                      className="p-1.5 text-stone hover:text-ink hover:bg-surface rounded transition-colors"
                      title="แก้ไขข้อมูลเพื่อน"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMember(member.id)}
                      className="p-1.5 text-stone hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="ลบออกจากทริป"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MEMBER MODAL */}
      {isMemberModalOpen && (
        <Modal
          title={editingMember ? 'แก้ไขข้อมูลเพื่อนร่วมทริป' : 'เพิ่มเพื่อนร่วมทริป'}
          note="กรอกชื่อ เบอร์โทร และระบุว่าอาสาขับรถหรือไม่"
          onClose={() => setIsMemberModalOpen(false)}
        >
          <form onSubmit={handleSaveMember} className="space-y-4">
            <Field label="ชื่อเล่น" htmlFor="mem-nickname">
              <input
                id="mem-nickname"
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="เช่น โอม, แปม, กวาง"
                className={input}
              />
            </Field>

            <Field label="ชื่อจริง (หรือนามสกุล)" htmlFor="mem-name">
              <input
                id="mem-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ธนกร หรือ โอม มิตรสหาย"
                className={input}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field label="เบอร์โทรศัพท์" htmlFor="mem-phone">
                <input
                  id="mem-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812345678"
                  className={input}
                />
              </Field>

              <Field
                label="เลขพร้อมเพย์"
                htmlFor="mem-promptpay"
                hint="เบอร์โทรหรือเลขบัตร ปชช. สำหรับรับเงินโอนคืน"
              >
                <input
                  id="mem-promptpay"
                  type="text"
                  value={promptPayId}
                  onChange={(e) => setPromptPayId(e.target.value)}
                  placeholder="0812345678"
                  className={input}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field label="สถานะการเข้าร่วม" htmlFor="mem-status">
                <select
                  id="mem-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Member['status'])}
                  className={input}
                >
                  <option value="confirmed">ไปแน่นอน</option>
                  <option value="maybe">ขอดูก่อน</option>
                  <option value="declined">ไปไม่ได้</option>
                </select>
              </Field>

              <Field label="บทบาทในทริป" htmlFor="mem-role">
                <select
                  id="mem-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Member['role'])}
                  className={input}
                >
                  <option value="member">สมาชิกทั่วไป</option>
                  <option value="organizer">ผู้จัดทริป</option>
                </select>
              </Field>
            </div>

            {/* Checkboxes */}
            <div className="pt-3 border-t border-mist-deep space-y-2.5">
              <label className="flex items-center gap-2.5 text-fine text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={paidDeposit}
                  onChange={(e) => setPaidDeposit(e.target.checked)}
                  className="w-4 h-4 accent-brass"
                />
                <span>โอนเงินมัดจำที่พักเรียบร้อยแล้ว</span>
              </label>

              <label className="flex items-center gap-2.5 text-fine text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCarVolunteer}
                  onChange={(e) => setHasCarVolunteer(e.target.checked)}
                  className="w-4 h-4 accent-brass"
                />
                <span>อาสาขับรถนำเที่ยว (มีรถส่วนตัวร่วมเดินทาง)</span>
              </label>

              <label className="flex items-center gap-2.5 text-fine text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMe}
                  onChange={(e) => setIsMe(e.target.checked)}
                  className="w-4 h-4 accent-brass"
                />
                <span>นี่คือฉัน (บันทึกจำเบราว์เซอร์นี้)</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsMemberModalOpen(false)}
                className={`flex-1 ${btnQuiet}`}
              >
                ยกเลิก
              </button>
              <button type="submit" className={`flex-1 ${btnSolid}`}>
                {editingMember ? 'บันทึกการแก้ไข' : 'เพิ่มเพื่อน'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MembersTab;
