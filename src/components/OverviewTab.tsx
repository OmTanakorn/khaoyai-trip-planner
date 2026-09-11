import React, { useState } from 'react';
import { Plus, Send, ArrowRight, Trash2 } from 'lucide-react';
import { TripData, Member, TripListEditor } from '../types/trip';
import { TripUpdate } from '../services/storage';

interface OverviewTabProps extends TripListEditor {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
  setActiveTab: (tab: string) => void;
  me: Member | null;
  onChooseMe: (who: string | Member | null) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  trip,
  onSaveItem,
  onRemoveItem,
  setActiveTab,
  me,
  onChooseMe,
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

  const totalCarSeats = trip.cars.reduce((sum, car) => sum + car.maxSeats, 0);

  // Countdown to the departure date
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

    // Built out here, not inside the updater: the updater may run several
    // times and the id and date must stay the same each time.
    const announcement = {
      id: `an-${Date.now()}`,
      text: newAnnouncement.trim(),
      date: new Date().toISOString().split('T')[0],
      author: announcementAuthor.trim() || 'เพื่อนร่วมทริป',
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

    const colorPalette = [
      '#2f4a3c', '#a88d4f', '#6e7a72', '#1b2e27', '#c7ac72',
      '#4a6b57', '#8c7340', '#3d5a4a', '#b09a6a', '#55665c'
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

  const milestones = [
    {
      tab: 'members',
      step: 'หนึ่ง',
      title: 'รวมพลเพื่อน',
      value: `${confirmedMembers.length}`,
      unit: 'จาก 10–12 คน',
      note:
        confirmedMembers.length >= 10
          ? 'ครบแก๊งแล้ว'
          : `ยังขาดอีกอย่างน้อย ${Math.max(0, 10 - confirmedMembers.length)} คน`,
    },
    {
      tab: 'cars',
      step: 'สอง',
      title: 'สำรวจรถ',
      value: `${trip.cars.length}`,
      unit: 'คัน',
      note:
        trip.cars.length === 0
          ? 'ยังไม่มีใครอาสาขับ'
          : `นั่งได้รวม ${totalCarSeats} คน`,
    },
    {
      tab: 'stay',
      step: 'สาม',
      title: 'โหวตที่พัก',
      value: `${trip.accommodationOptions.length}`,
      unit: 'ตัวเลือก',
      note: trip.confirmedAccommodation ? 'จองแล้ว' : 'ยังเปิดรับข้อเสนอ',
    },
    {
      tab: 'itinerary',
      step: 'สี่',
      title: 'ปักหมุดที่เที่ยว',
      value: `${trip.placeIdeas.length}`,
      unit: 'จุดแวะ',
      note: 'คาเฟ่และร้านอาหาร',
    },
  ];

  const nextSteps = [
    {
      tab: 'stay',
      title: 'เสนอตัวเลือกที่พัก',
      detail: 'พูลวิลล่าสี่ถึงห้าห้องนอน รองรับ 10–12 คน',
    },
    {
      tab: 'cars',
      title: 'รวบรวมรถเดินทาง',
      detail: 'ต้องการสองถึงสามคันจึงจะพอกับทั้งกลุ่ม',
    },
    {
      tab: 'itinerary',
      title: 'ปักหมุดคาเฟ่และร้านอาหาร',
      detail: 'เสนอจุดแวะระหว่างทาง แล้วโหวตกัน',
    },
    {
      tab: 'food',
      title: 'โหวตเมนูอาหาร',
      detail: 'เสนอเมนูมื้อเย็นและมื้อเช้า แล้วโหวตก่อนไปซื้อของ',
    },
  ];

  return (
    <div className="pb-16">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink">
        <img
          src={trip.coverImage}
          alt="ช้างป่าเดินข้ามถนนในเขาใหญ่ รถจอดรอให้ผ่าน"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        {/* Dark at the type, clear through the middle so the elephant reads. */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/25 to-ink" />

        <div className="relative px-6 sm:px-10 pt-14 sm:pt-24 pb-8 sm:pb-10 min-h-[30rem] sm:min-h-[34rem] flex flex-col">
          <p className="text-fine text-brass-lit">{trip.destination}</p>

          <h1 className="mt-4 font-display text-title sm:text-display font-normal text-paper max-w-2xl">
            {trip.title}
          </h1>

          <p className="mt-5 text-body text-mist/80 max-w-lg">{trip.tagline}</p>

          <div className="mt-auto pt-6 flex flex-wrap items-end gap-x-10 gap-y-6 border-t border-paper/15">
            <div>
              <span className="font-display text-display sm:text-[4rem] leading-none text-brass-lit">
                {daysLeft > 0 ? daysLeft : 0}
              </span>
              <span className="ml-2 text-body text-mist/70">
                {daysLeft > 0 ? 'วันก่อนออกเดินทาง' : 'ถึงวันเดินทางแล้ว'}
              </span>
            </div>

            <p className="text-fine text-mist/70 leading-relaxed">
              คอนเฟิร์มแล้ว {confirmedMembers.length} คน
              <br />
              ปลายฝนต้นหนาว ช่วงเย็นขับช้า ๆ ช้างข้ามถนนบ่อย
            </p>

            <button
              onClick={() => setShowQuickRsvp(true)}
              className="ml-auto px-6 py-3 bg-brass hover:bg-brass-lit text-ink text-body rounded-ctl transition-colors"
            >
              ลงชื่อร่วมทริป
            </button>
          </div>
        </div>

        {/* Milestones read as one band attached to the hero, not four cards */}
        <div className="relative grid grid-cols-2 lg:grid-cols-4 border-t border-paper/15">
          {milestones.map((m, i) => (
            <button
              key={m.tab}
              onClick={() => setActiveTab(m.tab)}
              className={`text-left px-6 sm:px-8 py-6 hover:bg-paper/5 transition-colors border-paper/15 ${
                i % 2 === 0 ? 'border-r' : ''
              } lg:border-r lg:last:border-r-0 ${i < 2 ? 'border-b lg:border-b-0' : ''}`}
            >
              <p className="text-fine text-brass-lit">ขั้นที่{m.step}</p>
              <p className="mt-1 text-body text-mist/80">{m.title}</p>
              <p className="mt-3 font-display text-title text-paper leading-none">
                {m.value}
                <span className="ml-2 font-sans text-fine text-mist/60">{m.unit}</span>
              </p>
              <p className="mt-2 text-fine text-mist/55">{m.note}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Board & next steps ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-mist-deep mt-px">
        <section className="lg:col-span-2 bg-paper px-6 sm:px-8 py-8">
          <div className="flex items-start justify-between gap-4 border-b border-mist-deep pb-5">
            <div>
              <h2 className="font-display text-lead text-ink">บอร์ดพูดคุย</h2>
              <p className="mt-1 text-fine text-stone">
                แจ้งข่าว นัดหมาย หรือความคืบหน้าของทริป
              </p>
            </div>
            <button
              onClick={() => setShowAnnounceForm(!showAnnounceForm)}
              className="flex items-center gap-1.5 shrink-0 text-fine text-ink border-b border-brass pb-0.5 hover:text-brass transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              โพสต์ข้อความ
            </button>
          </div>

          {showAnnounceForm && (
            <form onSubmit={handleAddAnnouncement} className="mt-5 space-y-3">
              <textarea
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                placeholder="พิมพ์ข้อความถึงเพื่อน ๆ เช่น ใครมีพูลวิลล่าแนะนำ แปะไว้ในแถบที่พักได้เลย"
                rows={3}
                className="w-full text-body p-3 rounded-ctl border border-mist-deep bg-mist/40 focus:outline-none focus:border-brass"
              />
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={announcementAuthor}
                  onChange={(e) => setAnnouncementAuthor(e.target.value)}
                  placeholder="ชื่อผู้โพสต์"
                  className="text-fine py-2 px-3 bg-mist/40 border border-mist-deep rounded-ctl w-40 focus:outline-none focus:border-brass"
                />
                <button
                  type="submit"
                  disabled={!newAnnouncement.trim()}
                  className="flex items-center gap-2 px-5 py-2 text-fine text-paper bg-ink hover:bg-moss disabled:opacity-40 rounded-ctl transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  โพสต์
                </button>
              </div>
            </form>
          )}

          {trip.announcements.length === 0 ? (
            <p className="mt-8 text-body text-stone">
              ยังไม่มีใครโพสต์ เริ่มจากบอกเพื่อน ๆ ว่าอยากไปไหนก่อนก็ได้
            </p>
          ) : (
            <ul className="mt-6 divide-y divide-mist-deep">
              {trip.announcements.map((item) => (
                <li key={item.id} className="py-5 first:pt-0 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-ink">{item.text}</p>
                    <p className="mt-2 text-fine text-stone">
                      {item.author} · {item.date}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAnnouncement(item.id)}
                    className="text-stone hover:text-ink transition-colors shrink-0"
                    aria-label={`ลบข้อความของ ${item.author}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-paper px-6 sm:px-8 py-8">
          <h2 className="font-display text-lead text-ink border-b border-mist-deep pb-5">
            สิ่งที่ต้องทำต่อไป
          </h2>

          <ol className="divide-y divide-mist-deep">
            {nextSteps.map((step, i) => (
              <li key={step.tab}>
                <button
                  onClick={() => setActiveTab(step.tab)}
                  className="group w-full text-left py-5 flex items-start gap-4"
                >
                  <span className="font-display text-lead text-brass leading-none pt-0.5">
                    {i + 1}
                  </span>
                  <span className="flex-1">
                    <span className="block text-body text-ink group-hover:text-brass transition-colors">
                      {step.title}
                    </span>
                    <span className="block mt-1 text-fine text-stone">{step.detail}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 mt-1 text-mist-deep group-hover:text-brass transition-colors" />
                </button>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* ── Quick RSVP ───────────────────────────────────────── */}
      {showQuickRsvp && (
        <div className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4">
          <div className="bg-paper rounded-ctl max-w-md w-full px-6 sm:px-8 py-8 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lead text-ink">ลงชื่อร่วมทริป</h2>
            <p className="mt-1 text-fine text-stone">
              31 ต.ค. — 1 พ.ย. 2569 เสาร์ถึงอาทิตย์ สองวันหนึ่งคืน
            </p>

            <form onSubmit={handleQuickRsvp} className="mt-6 space-y-5 text-body">
              <div>
                <label htmlFor="rsvp-nickname" className="block text-fine text-stone mb-1.5">
                  ชื่อเล่น
                </label>
                <input
                  id="rsvp-nickname"
                  type="text"
                  required
                  value={quickNickname}
                  onChange={(e) => setQuickNickname(e.target.value)}
                  placeholder="นัท แบงค์ โอม"
                  className="w-full p-2.5 rounded-ctl border border-mist-deep bg-mist/40 focus:outline-none focus:border-brass"
                />
              </div>

              <div>
                <label htmlFor="rsvp-name" className="block text-fine text-stone mb-1.5">
                  ชื่อจริง ถ้าอยากใส่
                </label>
                <input
                  id="rsvp-name"
                  type="text"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  placeholder="ณัฐชา"
                  className="w-full p-2.5 rounded-ctl border border-mist-deep bg-mist/40 focus:outline-none focus:border-brass"
                />
              </div>

              <div>
                <label htmlFor="rsvp-status" className="block text-fine text-stone mb-1.5">
                  ไปไหม
                </label>
                <select
                  id="rsvp-status"
                  value={quickStatus}
                  onChange={(e) => setQuickStatus(e.target.value as Member['status'])}
                  className="w-full p-2.5 rounded-ctl border border-mist-deep bg-mist/40 focus:outline-none focus:border-brass"
                >
                  <option value="confirmed">ไปแน่นอน</option>
                  <option value="maybe">ขอดูก่อน</option>
                  <option value="declined">ติดธุระ ไปไม่ได้</option>
                </select>
              </div>

              <div className="border-t border-mist-deep pt-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="hasCar"
                    checked={quickHasCar}
                    onChange={(e) => setQuickHasCar(e.target.checked)}
                    className="w-4 h-4 accent-brass"
                  />
                  <label htmlFor="hasCar" className="text-body text-ink cursor-pointer">
                    เอารถไปได้ อาสาเป็นคนขับ
                  </label>
                </div>

                {quickHasCar && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="rsvp-car" className="block text-fine text-stone mb-1.5">
                        รุ่นรถ
                      </label>
                      <input
                        id="rsvp-car"
                        type="text"
                        required={quickHasCar}
                        value={quickCarModel}
                        onChange={(e) => setQuickCarModel(e.target.value)}
                        placeholder="CR-V, Civic, Yaris"
                        className="w-full p-2.5 text-fine rounded-ctl border border-mist-deep bg-mist/40 focus:outline-none focus:border-brass"
                      />
                    </div>
                    <div>
                      <label htmlFor="rsvp-seats" className="block text-fine text-stone mb-1.5">
                        นั่งได้กี่คน
                      </label>
                      <input
                        id="rsvp-seats"
                        type="number"
                        min={1}
                        max={10}
                        value={quickCarSeats}
                        onChange={(e) => setQuickCarSeats(Number(e.target.value))}
                        className="w-full p-2.5 text-fine rounded-ctl border border-mist-deep bg-mist/40 focus:outline-none focus:border-brass"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowQuickRsvp(false)}
                  className="flex-1 py-2.5 text-body text-stone border border-mist-deep hover:text-ink rounded-ctl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-body text-paper bg-ink hover:bg-moss rounded-ctl transition-colors"
                >
                  ลงชื่อ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
