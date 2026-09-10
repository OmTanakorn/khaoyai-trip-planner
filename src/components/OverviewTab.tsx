import React, { useState } from 'react';
import { 
  Users, 
  Car, 
  Home, 
  MapPin, 
  Calendar, 
  Megaphone, 
  Plus, 
  Send, 
  Wind,
  CheckCircle2,
  Clock,
  ThumbsUp,
  Sparkles,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { TripData, Member } from '../types/trip';

interface OverviewTabProps {
  trip: TripData;
  onUpdateTrip: (trip: TripData) => void;
  setActiveTab: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  trip,
  onUpdateTrip,
  setActiveTab,
}) => {
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [announcementAuthor, setAnnouncementAuthor] = useState('');
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);

  // Quick RSVP form states
  const [quickNickname, setQuickNickname] = useState('');
  const [quickName, setQuickName] = useState('');
  const [quickStatus, setQuickStatus] = useState<Member['status']>('confirmed');
  const [quickHasCar, setQuickHasCar] = useState(false);
  const [quickCarSeats, setQuickCarSeats] = useState(4);
  const [quickCarModel, setQuickCarModel] = useState('');
  const [showQuickRsvp, setShowQuickRsvp] = useState(false);

  // Statistics
  const confirmedMembers = trip.members.filter((m) => m.status === 'confirmed');
  const maybeMembers = trip.members.filter((m) => m.status === 'maybe');

  const totalCarSeats = trip.cars.reduce((sum, car) => sum + car.maxSeats, 0);
  const totalAssignedCarSeats = trip.cars.reduce((sum, car) => sum + car.passengerIds.length, 0);

  // Countdown to Oct 31, 2026
  const calculateDaysLeft = () => {
    const today = new Date();
    const tripDate = new Date(trip.startDate);
    const diffTime = tripDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = calculateDaysLeft();

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;

    const updatedAnnouncements = [
      {
        id: `an-${Date.now()}`,
        text: newAnnouncement.trim(),
        date: new Date().toISOString().split('T')[0],
        author: announcementAuthor.trim() || 'เพื่อนร่วมทริป',
      },
      ...trip.announcements,
    ];

    onUpdateTrip({
      ...trip,
      announcements: updatedAnnouncements,
    });
    setNewAnnouncement('');
    setShowAnnounceForm(false);
  };

  const handleQuickRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNickname.trim()) return;

    const colorPalette = [
      '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', 
      '#06b6d4', '#ef4444', '#84cc16', '#f43f5e', '#6366f1'
    ];
    const randomColor = colorPalette[trip.members.length % colorPalette.length];

    const newMember: Member = {
      id: `m-${Date.now()}`,
      name: quickName.trim() || quickNickname.trim(),
      nickname: quickNickname.trim(),
      avatarColor: randomColor,
      status: quickStatus,
      role: trip.members.length === 0 ? 'organizer' : 'member',
      hasCarVolunteer: quickHasCar,
      carSeatsOffered: quickHasCar ? quickCarSeats : undefined,
    };

    let updatedCars = [...trip.cars];
    if (quickHasCar && quickCarModel.trim()) {
      updatedCars.push({
        id: `c-${Date.now()}`,
        driverName: `${quickNickname.trim()} (${quickCarModel.trim()})`,
        carModel: quickCarModel.trim(),
        maxSeats: Number(quickCarSeats),
        meetingPoint: 'รอกำหนดจุดนัดพบ',
        departureTime: '07:30 น.',
        passengerIds: [newMember.id],
      });
    }

    onUpdateTrip({
      ...trip,
      members: [...trip.members, newMember],
      cars: updatedCars,
    });

    setQuickNickname('');
    setQuickName('');
    setQuickCarModel('');
    setQuickHasCar(false);
    setShowQuickRsvp(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-emerald-900/10">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${trip.coverImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-900/70 to-black/35" />
        </div>

        <div className="relative p-6 sm:p-10 text-white flex flex-col justify-between min-h-[340px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/30 backdrop-blur-md border border-emerald-300/40 text-emerald-200">
                <MapPin className="w-3.5 h-3.5" />
                {trip.destination}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/30 backdrop-blur-md border border-amber-300/40 text-amber-200">
                📌 กำลังเปิดโหวต & วางแผน
              </span>
            </div>

            {/* Countdown Badge */}
            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-4 py-2 text-center shadow-lg">
              <div className="text-xl sm:text-2xl font-black text-amber-300">
                {daysLeft > 0 ? `อีก ${daysLeft} วัน` : 'ถึงวันเดินทางแล้ว! 🎉'}
              </div>
              <div className="text-[11px] text-emerald-100 font-medium">
                31 ต.ค. - 1 พ.ย. 2569 (2 วัน 1 คืน)
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md text-white">
              {trip.title}
            </h2>
            <p className="mt-2 text-emerald-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
              {trip.tagline}
            </p>
          </div>

          {/* Quick status info */}
          <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs text-emerald-100">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-teal-300" />
              <span>ช่วงปลายฝนต้นหนาว ลมเย็น สูดโอโซน & ตี้หมูกระทะพูลวิลล่า</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>เป้าหมายกลุ่ม: 10 - 12 คน (คอนเฟิร์มแล้ว {confirmedMembers.length} คน)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Planning Checklist Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h3 className="text-base sm:text-lg font-bold">ขั้นตอนวางแผนทริป (Trip Checklist)</h3>
            </div>
            <p className="text-xs text-emerald-100/80">
              สถานะตอนนี้: กำลังเริ่มทริป เช็คจำนวนเพื่อน อาสาสมัครคนขับรถ และหาตัวเลือกที่พักพูลวิลล่า
            </p>
          </div>

          <button
            onClick={() => setShowQuickRsvp(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ ลงชื่อร่วมทริปด่วน (RSVP)</span>
          </button>
        </div>

        {/* 4 Planning Milestones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          {/* Step 1: Members */}
          <div 
            onClick={() => setActiveTab('members')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-emerald-200">1. รวมพลเพื่อน</span>
              <Users className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-lg font-bold">
              {confirmedMembers.length} <span className="text-xs font-normal text-emerald-200">/ 10-12 คน</span>
            </div>
            <span className="text-[11px] text-emerald-200/80 block mt-1">
              {confirmedMembers.length >= 10 ? 'ครบแก๊งแล้ว ✓' : `ขาดอีกอย่างน้อย ${Math.max(0, 10 - confirmedMembers.length)} คน`}
            </span>
          </div>

          {/* Step 2: Cars */}
          <div 
            onClick={() => setActiveTab('cars')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-emerald-200">2. สำรวจรถเดินทาง</span>
              <Car className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-lg font-bold">
              {trip.cars.length} คัน <span className="text-xs font-normal text-emerald-200">({totalCarSeats} ที่นั่ง)</span>
            </div>
            <span className="text-[11px] text-amber-300 block mt-1">
              {trip.cars.length === 0 ? 'ยังไม่มีรถ (เปิดรับอาสา)' : `รองรับได้ ${totalCarSeats} คน`}
            </span>
          </div>

          {/* Step 3: Stay */}
          <div 
            onClick={() => setActiveTab('stay')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-emerald-200">3. โหวตที่พัก</span>
              <Home className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-lg font-bold">
              {trip.accommodationOptions.length} ตัวเลือก
            </div>
            <span className="text-[11px] text-amber-300 block mt-1">
              {trip.confirmedAccommodation ? 'จองที่พักแล้ว ✓' : 'กำลังเปิดรับตัวเลือก'}
            </span>
          </div>

          {/* Step 4: Spots Wishlist */}
          <div 
            onClick={() => setActiveTab('itinerary')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-emerald-200">4. ปักหมุดที่เที่ยว</span>
              <Calendar className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-lg font-bold">
              {trip.placeIdeas.length} จุดแวะ
            </div>
            <span className="text-[11px] text-emerald-200/80 block mt-1">
              เสนอคาเฟ่ & ร้านอาหาร
            </span>
          </div>
        </div>
      </div>

      {/* Quick RSVP Modal */}
      {showQuickRsvp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">ลงชื่อร่วมทริปเขาใหญ่ 🌿</h3>
            <p className="text-xs text-slate-500">
              วันที่ 31 ต.ค. - 1 พ.ย. 2569 (เสาร์-อาทิตย์ 2 วัน 1 คืน)
            </p>

            <form onSubmit={handleQuickRsvp} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อเล่น *</label>
                <input
                  type="text"
                  required
                  value={quickNickname}
                  onChange={(e) => setQuickNickname(e.target.value)}
                  placeholder="เช่น นัท, แบงค์, โอม"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อจริง (ถ้ามี)</label>
                <input
                  type="text"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  placeholder="เช่น ณัฐชา"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">สถานะการไป *</label>
                <select
                  value={quickStatus}
                  onChange={(e) => setQuickStatus(e.target.value as Member['status'])}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="confirmed">ไปแน่นอน (Confirmed) ✓</option>
                  <option value="maybe">รอดูก่อน (Maybe)</option>
                  <option value="declined">ติดธุระ (Declined)</option>
                </select>
              </div>

              {/* Car Volunteer checkbox */}
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasCar"
                    checked={quickHasCar}
                    onChange={(e) => setQuickHasCar(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="hasCar" className="font-bold text-blue-900 cursor-pointer">
                    🚗 ฉันสามารถเอารถไปได้ (อาสาเป็นคนขับ)
                  </label>
                </div>

                {quickHasCar && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-800 mb-1">รุ่นรถ</label>
                      <input
                        type="text"
                        required={quickHasCar}
                        value={quickCarModel}
                        onChange={(e) => setQuickCarModel(e.target.value)}
                        placeholder="เช่น CR-V, Civic, Yaris"
                        className="w-full p-2 text-xs rounded-lg border border-blue-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-blue-800 mb-1">จำนวนที่นั่งรวม</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={quickCarSeats}
                        onChange={(e) => setQuickCarSeats(Number(e.target.value))}
                        className="w-full p-2 text-xs rounded-lg border border-blue-200 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickRsvp(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition-colors"
                >
                  ยืนยันลงชื่อ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid: Announcements & Quick Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Announcements */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">บอร์ดพูดคุย & ประชาสัมพันธ์</h3>
                  <p className="text-xs text-slate-500">แจ้งข่าวสาร นัดหมาย หรือความคืบหน้าของทริป</p>
                </div>
              </div>

              <button
                onClick={() => setShowAnnounceForm(!showAnnounceForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>โพสต์ข้อความ</span>
              </button>
            </div>

            {showAnnounceForm && (
              <form onSubmit={handleAddAnnouncement} className="mb-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <textarea
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  placeholder="พิมพ์ข้อความแจ้งเพื่อนๆ เช่น 'ใครมีพูลวิลล่าแนะนำ แปะในแถบที่พักได้เลยนะ'..."
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={announcementAuthor}
                    onChange={(e) => setAnnouncementAuthor(e.target.value)}
                    placeholder="ชื่อผู้โพสต์"
                    className="text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-slate-700 w-36"
                  />
                  <button
                    type="submit"
                    disabled={!newAnnouncement.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl"
                  >
                    <Send className="w-3.5 h-3.5" />
                    โพสต์
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {trip.announcements.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">{item.text}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span className="font-semibold text-emerald-700">{item.author}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Quick Next Steps */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800">📌 สิ่งที่ต้องทำต่อไป</h3>
            
            <div className="space-y-3 text-xs">
              <div 
                onClick={() => setActiveTab('stay')}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-emerald-800">ช่วยกันเสนอตัวเลือกที่พัก</h4>
                    <p className="text-[11px] text-slate-500">พูลวิลล่า 4-5 ห้องนอน รองรับ 10-12 คน</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
              </div>

              <div 
                onClick={() => setActiveTab('cars')}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-800">รวบรวมรถเดินทาง</h4>
                    <p className="text-[11px] text-slate-500">ต้องการประมาณ 2-3 คัน เพื่อให้พอกับ 10-12 คน</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
              </div>

              <div 
                onClick={() => setActiveTab('itinerary')}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-purple-50/60 border border-slate-100 hover:border-purple-200 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-purple-800">ปักหมุดคาเฟ่ / ร้านอาหาร</h4>
                    <p className="text-[11px] text-slate-500">เสนอจุดแวะและโหวตจุดที่อยากไป</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
