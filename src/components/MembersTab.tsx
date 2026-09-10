import React, { useState } from 'react';
import { Phone, Trash2, Pencil, Plus } from 'lucide-react';
import { TripData, Member } from '../types/trip';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Modal, Field, Empty, Tag } from './ui';
import { input, btnSolid, btnQuiet, btnLink } from './ui-kit';

interface MembersTabProps {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
}

const AVATAR_COLORS = [
  '#2f4a3c', '#a88d4f', '#6e7a72', '#1b2e27', '#c7ac72', '#4a6b57',
  '#8c7340', '#3d5a4a', '#b09a6a', '#55665c', '#7d6b3f', '#42574b',
];

export const MembersTab: React.FC<MembersTabProps> = ({ trip, onUpdateTrip }) => {
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Member['status']>('confirmed');
  const [role, setRole] = useState<Member['role']>('member');
  const [paidDeposit, setPaidDeposit] = useState(true);

  const confirmedCount = trip.members.filter((m) => m.status === 'confirmed').length;
  const maybeCount = trip.members.filter((m) => m.status === 'maybe').length;
  const depositCount = trip.members.filter((m) => m.paidDeposit).length;

  const handleOpenNewModal = () => {
    setEditingMember(null);
    setName('');
    setNickname('');
    setPhone('');
    setStatus('confirmed');
    setRole('member');
    setPaidDeposit(true);
    setIsMemberModalOpen(true);
  };

  const handleOpenEditModal = (m: Member) => {
    setEditingMember(m);
    setName(m.name);
    setNickname(m.nickname);
    setPhone(m.phone || '');
    setStatus(m.status);
    setRole(m.role);
    setPaidDeposit(!!m.paidDeposit);
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nickname.trim()) return;

    if (editingMember) {
      onUpdateTrip((t) => ({
        ...t,
        members: t.members.map((m) =>
          m.id === editingMember.id
            ? { ...m, name, nickname, phone, status, role, paidDeposit }
            : m
        ),
      }));
    } else {
      const newMem: Member = {
        id: `m-${Date.now()}`,
        name,
        nickname,
        phone,
        avatarColor: AVATAR_COLORS[trip.members.length % AVATAR_COLORS.length],
        status,
        role,
        paidDeposit,
      };
      onUpdateTrip((t) => ({ ...t, members: [...t.members, newMem] }));
    }
    setIsMemberModalOpen(false);
  };

  const handleDeleteMember = (memberId: string) => {
    const member = trip.members.find((m) => m.id === memberId);
    if (
      !window.confirm(
        `นำ ${member?.nickname ?? 'คนนี้'} ออกจากทริป? ชื่อจะหายจากรถและห้องนอนด้วย`
      )
    ) {
      return;
    }

    onUpdateTrip((t) => ({
      ...t,
      members: t.members.filter((m) => m.id !== memberId),
      cars: t.cars.map((c) => ({
        ...c,
        passengerIds: c.passengerIds.filter((id) => id !== memberId),
      })),
      confirmedAccommodation: t.confirmedAccommodation
        ? {
            ...t.confirmedAccommodation,
            rooms: t.confirmedAccommodation.rooms.map((r) => ({
              ...r,
              guestIds: r.guestIds.filter((id) => id !== memberId),
            })),
          }
        : undefined,
    }));
  };

  const statusLabel: Record<Member['status'], string> = {
    confirmed: 'ไปแน่นอน',
    maybe: 'ขอดูก่อน',
    declined: 'ไปไม่ได้',
  };
  const statusTone: Record<Member['status'], 'go' | 'wait' | 'off'> = {
    confirmed: 'go',
    maybe: 'wait',
    declined: 'off',
  };

  return (
    <div className="pb-16">
      <PageHead
        title="เพื่อนร่วมทริป"
        note="ใครไปแน่ ใครขอดูก่อน ใครโอนมัดจำแล้ว รวมถึงรถและห้องนอนที่แต่ละคนได้"
        aside={
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Tag tone="go">ไปแน่ {confirmedCount} คน</Tag>
            <Tag tone="wait">ขอดูก่อน {maybeCount} คน</Tag>
            <Tag tone="off">โอนมัดจำแล้ว {depositCount} คน</Tag>
          </div>
        }
        action={
          <button onClick={handleOpenNewModal} className={btnSolid}>
            เพิ่มเพื่อน
          </button>
        }
      />

      {trip.members.length === 0 ? (
        <Panel>
          <Empty
            title="ยังไม่มีใครลงชื่อ"
            note="เพิ่มชื่อคนแรกเอง หรือส่งลิงก์เว็บนี้ให้เพื่อนกรอกกันเข้ามา"
            action={
              <button onClick={handleOpenNewModal} className={btnLink}>
                <Plus className="w-3.5 h-3.5" />
                ลงชื่อคนแรก
              </button>
            }
          />
        </Panel>
      ) : (
        <ul className="bg-paper divide-y divide-mist-deep">
          {trip.members.map((member) => {
            const memberCar = trip.cars.find((c) => c.passengerIds.includes(member.id));
            const memberRoom = trip.confirmedAccommodation?.rooms.find((r) =>
              r.guestIds.includes(member.id)
            );

            return (
              <li
                key={member.id}
                className="px-6 sm:px-8 py-5 flex items-start gap-4 sm:gap-6"
              >
                <span
                  className="w-10 h-10 shrink-0 rounded-ctl flex items-center justify-center text-paper text-fine"
                  style={{ backgroundColor: member.avatarColor }}
                  aria-hidden="true"
                >
                  {member.nickname.slice(0, 2)}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-body text-ink">
                    {member.nickname}
                    <span className="ml-2 text-fine text-stone">{member.name}</span>
                    {member.role === 'organizer' && (
                      <span className="ml-2 text-fine text-brass">ผู้จัด</span>
                    )}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
                    <Tag tone={statusTone[member.status]}>{statusLabel[member.status]}</Tag>
                    <Tag tone={member.paidDeposit ? 'go' : 'off'}>
                      {member.paidDeposit ? 'โอนมัดจำแล้ว' : 'ยังไม่โอนมัดจำ'}
                    </Tag>
                  </div>

                  <p className="mt-2 text-fine text-stone">
                    {memberCar ? memberCar.driverName : 'ยังไม่ได้เลือกรถ'}
                    {' · '}
                    {memberRoom ? memberRoom.roomName.split(':')[0] : 'ยังไม่มีห้องนอน'}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="text-stone hover:text-ink transition-colors"
                      title={`โทรหา ${member.nickname} ${member.phone}`}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleOpenEditModal(member)}
                    className="text-stone hover:text-ink transition-colors"
                    aria-label={`แก้ไขข้อมูล ${member.nickname}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="text-stone hover:text-ink transition-colors"
                    aria-label={`นำ ${member.nickname} ออกจากทริป`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isMemberModalOpen && (
        <Modal
          title={editingMember ? 'แก้ไขข้อมูลเพื่อน' : 'เพิ่มเพื่อนร่วมทริป'}
          onClose={() => setIsMemberModalOpen(false)}
        >
          <form onSubmit={handleSaveMember} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="ชื่อเล่น" htmlFor="mem-nick">
                <input
                  id="mem-nick"
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="นัท โอม"
                  className={input}
                />
              </Field>
              <Field label="ชื่อจริง" htmlFor="mem-name">
                <input
                  id="mem-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ณัฐชา วิเศษ"
                  className={input}
                />
              </Field>
            </div>

            <Field label="เบอร์โทร" htmlFor="mem-phone">
              <input
                id="mem-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081-234-5678"
                className={input}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="ไปไหม" htmlFor="mem-status">
                <select
                  id="mem-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Member['status'])}
                  className={input}
                >
                  <option value="confirmed">ไปแน่นอน</option>
                  <option value="maybe">ขอดูก่อน</option>
                  <option value="declined">ติดธุระ ไปไม่ได้</option>
                </select>
              </Field>
              <Field label="บทบาท" htmlFor="mem-role">
                <select
                  id="mem-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Member['role'])}
                  className={input}
                >
                  <option value="member">สมาชิก</option>
                  <option value="organizer">ผู้จัดทริป</option>
                </select>
              </Field>
            </div>

            <div className="flex items-center gap-2.5 border-t border-mist-deep pt-5">
              <input
                type="checkbox"
                id="paidDeposit"
                checked={paidDeposit}
                onChange={(e) => setPaidDeposit(e.target.checked)}
                className="w-4 h-4 accent-brass"
              />
              <label htmlFor="paidDeposit" className="text-body text-ink cursor-pointer">
                โอนค่ามัดจำที่พักแล้ว
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsMemberModalOpen(false)}
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
