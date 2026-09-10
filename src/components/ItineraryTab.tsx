import React, { useState } from 'react';
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  Plus, 
  Navigation, 
  Trash2, 
  Edit3, 
  Utensils, 
  Coffee, 
  Trees, 
  Palmtree, 
  Car, 
  PartyPopper,
  X,
  ThumbsUp,
  Lightbulb,
  ArrowDown
} from 'lucide-react';
import { TripData, ItineraryDay, Activity, PlaceIdea } from '../types/trip';

interface ItineraryTabProps {
  trip: TripData;
  onUpdateTrip: (trip: TripData) => void;
}

export const ItineraryTab: React.FC<ItineraryTabProps> = ({ trip, onUpdateTrip }) => {
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Activity form states
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<Activity['category']>('travel');
  const [mapUrl, setMapUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Wishlist idea form states
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaCategory, setIdeaCategory] = useState<PlaceIdea['category']>('cafe');
  const [ideaLocation, setIdeaLocation] = useState('');
  const [ideaMapUrl, setIdeaMapUrl] = useState('');
  const [ideaSuggestedBy, setIdeaSuggestedBy] = useState('');
  const [ideaNotes, setIdeaNotes] = useState('');

  const currentDay = trip.itinerary.find((d) => d.dayNumber === selectedDayNumber) || trip.itinerary[0];

  const getCategoryBadge = (cat: Activity['category'] | PlaceIdea['category']) => {
    switch (cat) {
      case 'food':
        return { label: 'อาหาร', icon: Utensils, bg: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'cafe':
        return { label: 'คาเฟ่', icon: Coffee, bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'nature':
        return { label: 'ธรรมชาติ/อุทยาน', icon: Trees, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'relax':
        return { label: 'พักผ่อน/ที่พัก', icon: Palmtree, bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'party':
      case 'activity':
        return { label: 'กิจกรรม/ปาร์ตี้', icon: PartyPopper, bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: 'การเดินทาง', icon: Car, bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  const handleOpenNewActivityModal = () => {
    setEditingActivity(null);
    setTime('10:00 - 11:30');
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

    const updatedItinerary = trip.itinerary.map((day) => {
      if (day.dayNumber === selectedDayNumber) {
        if (editingActivity) {
          return {
            ...day,
            activities: day.activities.map((a) =>
              a.id === editingActivity.id
                ? { ...a, time, title, location, category, mapUrl, notes }
                : a
            ),
          };
        } else {
          const newAct: Activity = {
            id: `act-${Date.now()}`,
            time,
            title,
            location,
            category,
            mapUrl,
            notes,
          };
          return {
            ...day,
            activities: [...day.activities, newAct],
          };
        }
      }
      return day;
    });

    onUpdateTrip({ ...trip, itinerary: updatedItinerary });
    setIsActivityModalOpen(false);
  };

  const handleDeleteActivity = (activityId: string) => {
    if (window.confirm('คุณต้องการลบกิจกรรมนี้ใช่หรือไม่?')) {
      const updatedItinerary = trip.itinerary.map((day) => {
        if (day.dayNumber === selectedDayNumber) {
          return {
            ...day,
            activities: day.activities.filter((a) => a.id !== activityId),
          };
        }
        return day;
      });
      onUpdateTrip({ ...trip, itinerary: updatedItinerary });
    }
  };

  // Wishlist actions
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

    onUpdateTrip({
      ...trip,
      placeIdeas: [...trip.placeIdeas, newIdea],
    });

    setIdeaTitle('');
    setIdeaLocation('');
    setIdeaMapUrl('');
    setIdeaNotes('');
    setIsWishlistModalOpen(false);
  };

  const handleVotePlaceIdea = (ideaId: string) => {
    const voter = 'ฉัน';
    const updatedIdeas = trip.placeIdeas.map((idea) => {
      if (idea.id === ideaId) {
        const hasVoted = idea.votes.includes(voter);
        return {
          ...idea,
          votes: hasVoted ? idea.votes.filter((v) => v !== voter) : [...idea.votes, voter],
        };
      }
      return idea;
    });
    onUpdateTrip({ ...trip, placeIdeas: updatedIdeas });
  };

  const handleDeletePlaceIdea = (ideaId: string) => {
    const updatedIdeas = trip.placeIdeas.filter((idea) => idea.id !== ideaId);
    onUpdateTrip({ ...trip, placeIdeas: updatedIdeas });
  };

  const handleMoveIdeaToItinerary = (idea: PlaceIdea, dayNum: number) => {
    const newAct: Activity = {
      id: `act-${Date.now()}`,
      time: dayNum === 1 ? '13:00 - 14:30' : '11:00 - 12:30',
      title: idea.title,
      location: idea.location,
      category: idea.category === 'party' ? 'activity' : idea.category,
      mapUrl: idea.mapUrl,
      notes: idea.notes,
    };

    const updatedItinerary = trip.itinerary.map((day) => {
      if (day.dayNumber === dayNum) {
        return {
          ...day,
          activities: [...day.activities, newAct],
        };
      }
      return day;
    });

    onUpdateTrip({ ...trip, itinerary: updatedItinerary });
    alert(`เพิ่ม "${idea.title}" เข้าสู่ตาราง Day ${dayNum} เรียบร้อย!`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            แผนการเดินทาง & Wishlist เสนอที่เที่ยว
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ทริป 2 วัน 1 คืน (31 ต.ค. - 1 พ.ย. 2569) • ช่วยกันแปะไอเดียคาเฟ่ ร้านอาหาร และจุดแวะที่อยากไป
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsWishlistModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm shadow-xs transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            <span>+ เสนอที่เที่ยว (Wishlist)</span>
          </button>
          <button
            onClick={handleOpenNewActivityModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มจุดแวะในตาราง</span>
          </button>
        </div>
      </div>

      {/* Ideas & Wishlist Board */}
      <div className="bg-amber-50/50 border border-amber-200/80 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-amber-950">
              💡 Wishlist จุดแวะที่เพื่อนๆ เสนอ ({trip.placeIdeas.length} แห่ง)
            </h3>
          </div>
          <span className="text-xs text-amber-800">กดโหวตสิ่งที่อยากไป หรือดึงเข้าสู่ตารางเที่ยวได้เลย</span>
        </div>

        {trip.placeIdeas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trip.placeIdeas.map((idea) => {
              const badge = getCategoryBadge(idea.category);
              const Icon = badge.icon;

              return (
                <div
                  key={idea.id}
                  className="p-4 rounded-2xl bg-white border border-amber-200/70 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badge.bg}`}>
                        <Icon className="w-3 h-3" />
                        {badge.label}
                      </span>
                      <button
                        onClick={() => handleDeletePlaceIdea(idea.id)}
                        className="text-slate-300 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800">{idea.title}</h4>
                    {idea.location && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{idea.location}</span>
                      </p>
                    )}
                    {idea.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                        "{idea.notes}"
                      </p>
                    )}
                    <span className="text-[10px] text-slate-400 block">
                      เสนอโดย: {idea.suggestedBy}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleVotePlaceIdea(idea.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-amber-100 text-slate-700"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>โหวต ({idea.votes.length})</span>
                    </button>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleMoveIdeaToItinerary(idea, 1)}
                        className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                        title="นำไปใส่ใน Day 1"
                      >
                        + Day 1
                      </button>
                      <button
                        onClick={() => handleMoveIdeaToItinerary(idea, 2)}
                        className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                        title="นำไปใส่ใน Day 2"
                      >
                        + Day 2
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-amber-800/80 italic py-2">
            ยังไม่มีใครเสนอที่เที่ยว แนะนำเช่น: Trot Cafe, Floryday ทุ่งดอกไม้, ไร่องุ่น PB Valley, อุทยานแห่งชาติเขาใหญ่ หรือร้านอาหารเป็นลาว
          </p>
        )}
      </div>

      {/* Day Selector Pills */}
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 no-scrollbar">
        {trip.itinerary.map((day) => {
          const isActive = day.dayNumber === selectedDayNumber;
          return (
            <button
              key={day.dayNumber}
              onClick={() => setSelectedDayNumber(day.dayNumber)}
              className={`px-5 py-3 rounded-2xl text-left border transition-all shrink-0 ${
                isActive
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <span className={`block text-xs font-bold ${isActive ? 'text-emerald-200' : 'text-emerald-700'}`}>
                {day.dayLabel.split(':')[0]}
              </span>
              <span className="text-sm font-extrabold block">{day.dayLabel.split(':')[1] || day.dayLabel}</span>
              <span className={`text-[11px] block mt-0.5 ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                {day.date} • {day.activities.length} กิจกรรม
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline Activities List */}
      {currentDay && (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
          {currentDay.activities.map((act) => {
            const badge = getCategoryBadge(act.category);
            const Icon = badge.icon;

            return (
              <div key={act.id} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border-2 border-emerald-600 flex items-center justify-center text-emerald-700 shadow-sm z-10">
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>

                {/* Activity Card */}
                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {act.time}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badge.bg}`}>
                          <Icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-800 pt-1">
                        {act.title}
                      </h3>

                      {act.location && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{act.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-start">
                      {act.mapUrl && (
                        <a
                          href={act.mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="เปิดแผนที่"
                        >
                          <Navigation className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenEditActivityModal(act)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="แก้ไข"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(act.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {act.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl leading-relaxed">
                      💡 {act.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {currentDay.activities.length === 0 && (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs sm:text-sm space-y-2">
              <p>ยังไม่มีกิจกรรมในตาราง {currentDay.dayLabel}</p>
              <p className="text-xs text-slate-400">
                คลิก "+ เพิ่มจุดแวะในตาราง" หรือเลือกจาก Wishlist ด้านบน
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal: Propose Wishlist Place */}
      {isWishlistModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">💡 เสนอที่เที่ยว / คาเฟ่ / ร้านอาหาร</h3>
              <button
                onClick={() => setIsWishlistModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlaceIdea} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อสถานที่ / ร้าน *</label>
                <input
                  type="text"
                  required
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  placeholder="เช่น Trot Cafe Khaoyai, ร้านเป็นลาว, อุทยานฯ"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">หมวดหมู่</label>
                  <select
                    value={ideaCategory}
                    onChange={(e) => setIdeaCategory(e.target.value as PlaceIdea['category'])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="cafe">☕ คาเฟ่</option>
                    <option value="food">🍲 ร้านอาหาร</option>
                    <option value="nature">🌳 ธรรมชาติ/อุทยาน</option>
                    <option value="party">🎉 กิจกรรม/ปาร์ตี้</option>
                    <option value="other">📦 อื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เสนอโดย *</label>
                  <input
                    type="text"
                    required
                    value={ideaSuggestedBy}
                    onChange={(e) => setIdeaSuggestedBy(e.target.value)}
                    placeholder="ชื่อเล่นของคุณ"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ทำเล / ตำแหน่ง</label>
                <input
                  type="text"
                  value={ideaLocation}
                  onChange={(e) => setIdeaLocation(e.target.value)}
                  placeholder="เช่น ถ.ธนะรัชต์ กม. 12"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ลิงก์ Google Maps / เพจ</label>
                <input
                  type="url"
                  value={ideaMapUrl}
                  onChange={(e) => setIdeaMapUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">โน้ต / ไฮไลต์ที่น่าสนใจ</label>
                <textarea
                  rows={2}
                  value={ideaNotes}
                  onChange={(e) => setIdeaNotes(e.target.value)}
                  placeholder="เช่น มีม้าแคระให้ถ่ายรูป, เมนูไก่ย่างเด็ดมาก..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsWishlistModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-xs transition-colors"
                >
                  บันทึกไอเดีย
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Activity in Itinerary */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {editingActivity ? 'แก้ไขกิจกรรม' : `เพิ่มกิจกรรม (${currentDay?.dayLabel})`}
              </h3>
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เวลา *</label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="เช่น 11:30 - 13:00"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">หมวดหมู่</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Activity['category'])}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="travel">🚗 การเดินทาง</option>
                    <option value="food">🍲 อาหาร / เครื่องดื่ม</option>
                    <option value="cafe">☕ คาเฟ่</option>
                    <option value="nature">🌳 ธรรมชาติ / อุทยาน</option>
                    <option value="relax">🏡 พักผ่อน / ที่พัก</option>
                    <option value="activity">🎉 กิจกรรม / ช้อปปิ้ง</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อกิจกรรม / จุดแวะ *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น เช็คอินพูลวิลล่า หรือ แวะคาเฟ่"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">สถานที่</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="เช่น อ.ปากช่อง เขาใหญ่"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ลิงก์ Google Maps (ถ้ามี)</label>
                <input
                  type="url"
                  value={mapUrl}
                  onChange={(e) => setMapUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">โน้ตเพิ่มเติม</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น ต้องจองคิวก่อน, เตรียมเงินสดค่าเข้า..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
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
