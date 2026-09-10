import React, { useState } from 'react';
import { 
  Home, 
  MapPin, 
  Clock, 
  Wifi, 
  Copy, 
  Check, 
  Plus, 
  Edit3, 
  Trash2, 
  UserPlus, 
  X, 
  BedDouble, 
  Bath, 
  Navigation,
  ThumbsUp,
  ExternalLink,
  DollarSign,
  Sparkles,
  CheckCircle2,
  Users
} from 'lucide-react';
import { TripData, AccommodationOption, Room } from '../types/trip';

interface AccommodationTabProps {
  trip: TripData;
  onUpdateTrip: (trip: TripData) => void;
}

export const AccommodationTab: React.FC<AccommodationTabProps> = ({ trip, onUpdateTrip }) => {
  const [isNewOptionModalOpen, setIsNewOptionModalOpen] = useState(false);
  const [voterName, setVoterName] = useState('');
  const [copiedWifi, setCopiedWifi] = useState(false);

  // New option form states
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

  // Handle voting for an accommodation option
  const handleVote = (optionId: string) => {
    const voter = voterName.trim() || 'ฉัน';
    const updatedOptions = trip.accommodationOptions.map((opt) => {
      if (opt.id === optionId) {
        const hasVoted = opt.votes.includes(voter);
        return {
          ...opt,
          votes: hasVoted
            ? opt.votes.filter((v) => v !== voter)
            : [...opt.votes, voter],
        };
      }
      return opt;
    });

    onUpdateTrip({
      ...trip,
      accommodationOptions: updatedOptions,
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
      location: optionLocation.trim() || 'เขาใหญ่ / ปากช่อง',
      pricePerNight: Number(optionPrice),
      bedrooms: Number(optionBedrooms),
      bathrooms: Number(optionBathrooms),
      capacity: Number(optionCapacity),
      linkUrl: optionLinkUrl.trim(),
      imageUrl: optionImageUrl.trim() || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80',
      highlights: highlightsArray.length > 0 ? highlightsArray : ['สระว่ายน้ำส่วนตัว', 'เตาปิ้งย่างบาร์บีคิว', 'โต๊ะพูล'],
      suggestedBy: optionSuggestedBy.trim() || 'เพื่อนร่วมทริป',
      votes: [],
    };

    onUpdateTrip({
      ...trip,
      accommodationOptions: [...trip.accommodationOptions, newOption],
    });

    // Reset form
    setOptionName('');
    setOptionLocation('');
    setOptionPrice('');
    setOptionLinkUrl('');
    setOptionImageUrl('');
    setOptionHighlights('');
    setIsNewOptionModalOpen(false);
  };

  const handleDeleteOption = (optionId: string) => {
    if (window.confirm('คุณต้องการลบตัวเลือกที่พักนี้ใช่หรือไม่?')) {
      const updatedOptions = trip.accommodationOptions.filter((opt) => opt.id !== optionId);
      onUpdateTrip({
        ...trip,
        accommodationOptions: updatedOptions,
      });
    }
  };

  const handleFinalizeAccommodation = (option: AccommodationOption) => {
    if (window.confirm(`ยืนยันการเลือก "${option.name}" เป็นที่พักทางการของทริปนี้ใช่หรือไม่?`)) {
      // Create empty rooms based on bedroom count
      const rooms: Room[] = Array.from({ length: option.bedrooms }, (_, i) => ({
        id: `r-${i + 1}`,
        roomName: `ห้องนอนที่ ${i + 1}`,
        bedType: i === 0 ? 'เตียง King Size 6 ฟุต (นอนได้ 2-3 คน)' : 'เตียง 5 ฟุต หรือ เตียงคู่ (นอนได้ 2-3 คน)',
        capacity: Math.ceil(option.capacity / option.bedrooms),
        guestIds: [],
        hasBathroom: i < option.bathrooms,
      }));

      onUpdateTrip({
        ...trip,
        confirmedAccommodation: {
          name: option.name,
          villaType: `พูลวิลล่าส่วนตัว ${option.bedrooms} ห้องนอน ${option.bathrooms} ห้องน้ำ (รองรับได้สูงสุด ${option.capacity} คน)`,
          address: option.location,
          mapUrl: option.linkUrl || 'https://maps.google.com/?q=Khao+Yai',
          checkIn: '14:00 น.',
          checkOut: '11:30 น.',
          totalBedrooms: option.bedrooms,
          totalBathrooms: option.bathrooms,
          wifiSsid: 'Villa_Wifi',
          wifiPassword: 'khaoyaitrip2026',
          rooms,
        },
      });
    }
  };

  const handleResetToPoll = () => {
    if (window.confirm('ต้องการเปลี่ยนสถานะกลับเป็นโหวตเลือกที่พักใหม่หรือไม่?')) {
      onUpdateTrip({
        ...trip,
        confirmedAccommodation: undefined,
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* If accommodation is already finalized */}
      {trip.confirmedAccommodation ? (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    จองที่พักเรียบร้อยแล้ว
                  </span>
                  <span className="text-xs text-slate-400">
                    {trip.confirmedAccommodation.totalBedrooms} ห้องนอน • รองรับได้ {trip.confirmedAccommodation.rooms.reduce((s, r) => s + r.capacity, 0)} คน
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mt-2">
                  {trip.confirmedAccommodation.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {trip.confirmedAccommodation.villaType}
                </p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {trip.confirmedAccommodation.address}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleResetToPoll}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  กลับไปหน้าโหวต
                </button>
              </div>
            </div>

            {/* Room Allocation */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
              <h3 className="text-base font-bold text-slate-800">การจัดห้องนอน</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trip.confirmedAccommodation.rooms.map((room) => (
                  <div key={room.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{room.roomName}</h4>
                        <p className="text-xs text-slate-500">{room.bedType}</p>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200">
                        {room.guestIds.length}/{room.capacity} คน
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Accommodation Survey & Voting Phase */
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                  โหวต & เสนอตัวเลือกที่พัก (Accommodation Poll)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  ยังไม่ได้ที่พัก
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed max-w-2xl">
                ทริป 10-12 คน วันที่ 31 ต.ค. - 1 พ.ย. (2 วัน 1 คืน) • แนะนำหาพูลวิลล่าส่วนตัว 4-5 ห้องนอน มีสระว่ายน้ำ ปิ้งย่างหมูกระทะได้ ช่วยกันแปะลิงก์และกดโหวตด้านล่างได้เลย!
              </p>
            </div>

            <button
              onClick={() => setIsNewOptionModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ เสนอตัวเลือกที่พัก</span>
            </button>
          </div>

          {/* Voter Name Input Bar */}
          <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-xs font-bold text-emerald-900">
                คุณกำลังโหวตในชื่อ:
              </span>
              <input
                type="text"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="พิมพ์ชื่อเล่นของคุณเพื่อกดโหวต"
                className="text-xs py-1 px-3 bg-white border border-emerald-300 rounded-lg text-emerald-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
              />
            </div>

            <span className="text-[11px] text-emerald-700">
              💡 คลิกปุ่ม "👍 โหวตที่นี่" เพื่อแสดงความคิดเห็นว่าอยากพักที่ไหน
            </span>
          </div>

          {/* Accommodation Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trip.accommodationOptions.map((option) => {
              const estPerPerson = Math.round(option.pricePerNight / confirmedCount);
              const isVoted = option.votes.includes(voterName.trim() || 'ฉัน');

              return (
                <div
                  key={option.id}
                  className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Image Cover */}
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                      <img
                        src={option.imageUrl}
                        alt={option.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                        ฿{option.pricePerNight.toLocaleString()} / คืน
                      </div>
                      <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                        ~฿{estPerPerson.toLocaleString()} / คน
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-slate-800 leading-tight">
                            {option.name}
                          </h3>
                          <button
                            onClick={() => handleDeleteOption(option.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="ลบตัวเลือกนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{option.location}</span>
                        </p>
                      </div>

                      {/* Specs */}
                      <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                        <span className="font-semibold">{option.bedrooms} ห้องนอน</span>
                        <span>•</span>
                        <span className="font-semibold">{option.bathrooms} ห้องน้ำ</span>
                        <span>•</span>
                        <span>พักได้ {option.capacity} คน</span>
                      </div>

                      {/* Highlights */}
                      <div className="flex flex-wrap gap-1.5">
                        {option.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200"
                          >
                            ✓ {h}
                          </span>
                        ))}
                      </div>

                      {/* Suggested by */}
                      <p className="text-[11px] text-slate-400">
                        เสนอโดย: <strong className="text-slate-600">{option.suggestedBy}</strong>
                      </p>

                      {/* Link to Agoda/Airbnb */}
                      {option.linkUrl && (
                        <a
                          href={option.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                        >
                          <span>เปิดดูรายละเอียด / รูปภาพ</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Voting & Decision Footer */}
                  <div className="p-5 pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleVote(option.id)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          isVoted
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>โหวตที่นี่ ({option.votes.length})</span>
                      </button>

                      <button
                        onClick={() => handleFinalizeAccommodation(option)}
                        className="ml-2 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-semibold"
                        title="สรุปเลือกที่พักนี้"
                      >
                        เลือกที่นี่
                      </button>
                    </div>

                    {option.votes.length > 0 && (
                      <p className="text-[10px] text-slate-400 text-center truncate">
                        ผู้โหวต: {option.votes.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {trip.accommodationOptions.length === 0 && (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">ยังไม่มีตัวเลือกที่พัก</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                เพื่อนๆ ที่เจอพูลวิลล่าสวยๆ ในเขาใหญ่ เหมาะสำหรับ 10-12 คน ช่วยกันกดปุ่ม <strong>"+ เสนอตัวเลือกที่พัก"</strong> ด้านบนเพื่อแปะลิงก์และราคาให้เพื่อนๆ ช่วยกันโหวตได้เลยครับ
              </p>
              <button
                onClick={() => setIsNewOptionModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มตัวเลือกที่พักแรก</span>
              </button>
            </div>
          )}

          {/* Modal: Add Accommodation Option */}
          {isNewOptionModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800">เสนอตัวเลือกพูลวิลล่า / ที่พัก</h3>
                  <button
                    onClick={() => setIsNewOptionModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateOption} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ชื่อที่พัก / พูลวิลล่า *</label>
                    <input
                      type="text"
                      required
                      value={optionName}
                      onChange={(e) => setOptionName(e.target.value)}
                      placeholder="เช่น Mountain Pool Villa Khaoyai"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ราคาต่อคืน (บาท) *</label>
                      <input
                        type="number"
                        min={1000}
                        required
                        value={optionPrice}
                        onChange={(e) => setOptionPrice(Number(e.target.value))}
                        placeholder="เช่น 12000"
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">ทำเล / โซน</label>
                      <input
                        type="text"
                        value={optionLocation}
                        onChange={(e) => setOptionLocation(e.target.value)}
                        placeholder="เช่น ถ.ธนะรัชต์, หมูสี"
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">จำนวนห้องนอน</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={optionBedrooms}
                        onChange={(e) => setOptionBedrooms(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">จำนวนห้องน้ำ</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={optionBathrooms}
                        onChange={(e) => setOptionBathrooms(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">รองรับได้กี่คน</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={optionCapacity}
                        onChange={(e) => setOptionCapacity(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ลิงก์ Agoda / Airbnb / Facebook / เพจ</label>
                    <input
                      type="url"
                      value={optionLinkUrl}
                      onChange={(e) => setOptionLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ลิงก์รูปภาพตัวอย่าง (URL)</label>
                    <input
                      type="url"
                      value={optionImageUrl}
                      onChange={(e) => setOptionImageUrl(e.target.value)}
                      placeholder="เว้นว่างได้ ระบบจะใช้รูปมาตรฐานให้"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">จุดเด่น (คั่นด้วยจุลภาค ,)</label>
                    <input
                      type="text"
                      value={optionHighlights}
                      onChange={(e) => setOptionHighlights(e.target.value)}
                      placeholder="สระว่ายน้ำส่วนตัว, คาราโอเกะ, โต๊ะพูล, เตาปิ้งย่าง"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ชื่อผู้เสนอ *</label>
                    <input
                      type="text"
                      required
                      value={optionSuggestedBy}
                      onChange={(e) => setOptionSuggestedBy(e.target.value)}
                      placeholder="เช่น แบงค์, โอม"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNewOptionModalOpen(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition-colors"
                    >
                      เพิ่มตัวเลือก
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
