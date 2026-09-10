import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Phone, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Trash2, 
  Edit3, 
  X, 
  Crown,
  Car,
  Home
} from 'lucide-react';
import { TripData, Member } from '../types/trip';

interface MembersTabProps {
  trip: TripData;
  onUpdateTrip: (trip: TripData) => void;
}

export const MembersTab: React.FC<MembersTabProps> = ({ trip, onUpdateTrip }) => {
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Member['status']>('confirmed');
  const [role, setRole] = useState<Member['role']>('member');
  const [paidDeposit, setPaidDeposit] = useState(true);

  const confirmedCount = trip.members.filter((m) => m.status === 'confirmed').length;
  const maybeCount = trip.members.filter((m) => m.status === 'maybe').length;

  const colorPalette = [
    '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', 
    '#06b6d4', '#ef4444', '#84cc16', '#f43f5e', '#6366f1',
    '#14b8a6', '#d946ef'
  ];

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
      const updatedMembers = trip.members.map((m) =>
        m.id === editingMember.id
          ? {
              ...m,
              name,
              nickname,
              phone,
              status,
              role,
              paidDeposit,
            }
          : m
      );
      onUpdateTrip({ ...trip, members: updatedMembers });
    } else {
      const randomColor = colorPalette[trip.members.length % colorPalette.length];
      const newMem: Member = {
        id: `m-${Date.now()}`,
        name,
        nickname,
        phone,
        avatarColor: randomColor,
        status,
        role,
        paidDeposit,
      };
      onUpdateTrip({ ...trip, members: [...trip.members, newMem] });
    }
    setIsMemberModalOpen(false);
  };

  const handleDeleteMember = (memberId: string) => {
    if (window.confirm('คุณต้องการลบเพื่อนคนนี้ออกจากทริปใช่หรือไม่? (จะนำชื่อออกจากรถและห้องพักด้วย)')) {
      // Remove from cars
      const updatedCars = trip.cars.map((c) => ({
        ...c,
        passengerIds: c.passengerIds.filter((id) => id !== memberId),
      }));

      // Remove from rooms if confirmedAccommodation exists
      const updatedAccommodation = trip.confirmedAccommodation
        ? {
            ...trip.confirmedAccommodation,
            rooms: trip.confirmedAccommodation.rooms.map((r) => ({
              ...r,
              guestIds: r.guestIds.filter((id) => id !== memberId),
            })),
          }
        : undefined;

      const updatedMembers = trip.members.filter((m) => m.id !== memberId);

      onUpdateTrip({
        ...trip,
        members: updatedMembers,
        cars: updatedCars,
        confirmedAccommodation: updatedAccommodation,
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">สมาชิกในทริป (Group Members)</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              คอนเฟิร์มแล้ว {confirmedCount} / 12 คน
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            เช็คสถานะการเข้าร่วม มัดจำที่พัก รถที่นั่ง และห้องนอนของแต่ละคน
          </p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ เพิ่มเพื่อนร่วมทริป</span>
        </button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trip.members.map((member) => {
          // Find member's car and room
          const memberCar = trip.cars.find((c) => c.passengerIds.includes(member.id));
          const memberRoom = trip.confirmedAccommodation?.rooms.find((r) => r.guestIds.includes(member.id));

          return (
            <div
              key={member.id}
              className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Member Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xs"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.nickname.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-800">{member.nickname}</h3>
                        {member.role === 'organizer' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-semibold">
                            <Crown className="w-2.5 h-2.5" /> ผู้จัด
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{member.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(member)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-[11px]">
                  {member.status === 'confirmed' && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle className="w-3 h-3" /> ไปแน่นอน
                    </span>
                  )}
                  {member.status === 'maybe' && (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Clock className="w-3 h-3" /> รอดูก่อน
                    </span>
                  )}
                  {member.status === 'declined' && (
                    <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      <XCircle className="w-3 h-3" /> ติดธุระ
                    </span>
                  )}

                  {member.paidDeposit ? (
                    <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium border border-teal-200">
                      มัดจำแล้ว ✓
                    </span>
                  ) : (
                    <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                      ยังไม่มัดจำ
                    </span>
                  )}
                </div>

                {/* Car & Room Assignment status */}
                <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Car className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">
                      {memberCar ? memberCar.driverName : <span className="text-slate-400 italic">ยังไม่ได้เลือกรถ</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Home className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">
                      {memberRoom ? memberRoom.roomName.split(':')[0] : <span className="text-slate-400 italic">ยังไม่มีห้องนอน</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Phone contact */}
              {member.phone && (
                <div className="mt-4 pt-2">
                  <a
                    href={`tel:${member.phone}`}
                    className="flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{member.phone}</span>
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {trip.members.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">ยังไม่มีรายชื่อเพื่อนในทริป</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            เริ่มต้นทริปโดยการกดปุ่ม <strong>"+ เพิ่มเพื่อนร่วมทริป"</strong> ด้านบน หรือส่งลิงก์เว็บให้เพื่อนเปิดเข้ามากรอกชื่อตัวเองได้เลยครับ
          </p>
          <button
            onClick={handleOpenNewModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
          >
            <UserPlus className="w-4 h-4" />
            <span>ลงชื่อคนแรก</span>
          </button>
        </div>
      )}

      {/* Modal: Add or Edit Member */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {editingMember ? 'แก้ไขข้อมูลเพื่อน' : 'เพิ่มเพื่อนร่วมทริปใหม่'}
              </h3>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อเล่น *</label>
                  <input
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="เช่น นัท, โอม"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อจริง-นามสกุล *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น ณัฐชา วิเศษ"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">สถานะ</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Member['status'])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="confirmed">ไปแน่นอน (Confirmed)</option>
                    <option value="maybe">รอดูก่อน (Maybe)</option>
                    <option value="declined">ติดธุระ (Declined)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">บทบาท</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Member['role'])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="member">สมาชิกทั่วไป</option>
                    <option value="organizer">ผู้จัดทริป (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="paidDeposit"
                  checked={paidDeposit}
                  onChange={(e) => setPaidDeposit(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="paidDeposit" className="text-slate-700 font-semibold cursor-pointer">
                  โอนจ่ายค่ามัดจำที่พักแล้ว
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition-colors"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
