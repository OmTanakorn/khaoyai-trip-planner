import React, { useState } from 'react';
import {
  Phone,
  ExternalLink,
  Car,
  Home,
  Wifi,
  Copy,
  Check,
  Clock,
  MapPin,
  Compass,
  Sparkles,
  CloudSun,
  ShieldAlert,
  ArrowRight,
  User,
  Users,
  Key,
} from 'lucide-react';
import { TripData, Member } from '../types/trip';
import { PageHead, Panel, Empty } from './ui';
import { btnSolid, btnQuiet, btnBrass, btnLink, initialOf, baht } from './ui-kit';

interface DayOfTabProps {
  trip: TripData;
  me: Member | null;
  setActiveTab: (tab: string) => void;
}

const startMinutes = (time: string): number => {
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2]);
};

export const DayOfTab: React.FC<DayOfTabProps> = ({ trip, me, setActiveTab }) => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [copiedWifi, setCopiedWifi] = useState(false);

  const stay = trip.confirmedAccommodation;

  const myCar = me
    ? trip.cars.find(
        (c) =>
          c.passengerIds.includes(me.id) ||
          c.driverName.includes(me.nickname) ||
          c.driverName.includes(me.name)
      )
    : undefined;

  const myRoom = me
    ? stay?.rooms.find((r) => r.guestIds.includes(me.id))
    : undefined;

  const driverOf = (driverName: string) =>
    trip.members.find(
      (m) => driverName.includes(m.nickname) || driverName.includes(m.name)
    );

  const nameOf = (id: string) =>
    trip.members.find((m) => m.id === id)?.nickname ?? 'ไม่ระบุ';

  const memberOf = (id: string) => trip.members.find((m) => m.id === id);

  const handleCopyWifi = () => {
    const password = stay?.wifiPassword || 'harper2026';
    navigator.clipboard.writeText(password);
    setCopiedWifi(true);
    setTimeout(() => setCopiedWifi(false), 2000);
  };

  const dayActivities =
    trip.itinerary.find((d) => d.dayNumber === selectedDay)?.activities ?? [];
  const sortedActivities = [...dayActivities].sort(
    (a, b) => startMinutes(a.time) - startMinutes(b.time)
  );

  return (
    <div className="pb-20 max-w-5xl mx-auto space-y-6">
      {/* Editorial Page Head with Weather Widget */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface text-[11px] font-medium text-ink tracking-wide uppercase mb-2">
            <Compass className="w-3.5 h-3.5 text-brass" />
            <span>旅の当日 · TRAVEL DAY COCKPIT</span>
          </div>
          <h1 className="font-display text-display text-ink leading-tight">
            วันเดินทาง (31 ต.ค. — 1 พ.ย.)
          </h1>
          <p className="mt-1 text-body text-stone">
            ศูนย์ข้อมูลหน้างาน รวมรถ คนขับ บ้านพัก ตารางเวลา และสายด่วน ใช้งานสะดวกมือเดียว
          </p>
        </div>

        {/* Live Weather Forecast Pill */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-panel bg-paper border border-mist-deep shadow-xs self-start sm:self-auto shrink-0">
          <CloudSun className="w-5 h-5 text-brass" />
          <div className="text-fine">
            <p className="font-medium text-ink leading-none">เขาใหญ่ ปากช่อง</p>
            <p className="text-[11px] text-stone mt-0.5">19°C – 28°C · ลมหนาวแรก ฟ้าโปร่ง</p>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: Personal Boarding Pass Card ─────────────────── */}
      <div className="bg-paper rounded-panel border border-mist-deep shadow-sm overflow-hidden">
        <div className="bg-surface/60 px-5 sm:px-7 py-3 border-b border-mist-deep flex items-center justify-between">
          <div className="flex items-center gap-2 text-fine font-medium text-ink">
            <Key className="w-4 h-4 text-brass" />
            <span>บัตรประจำตัวการเดินทาง (Personal Boarding Pass)</span>
          </div>
          {me && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-paper text-ink border border-mist-deep font-medium">
              {me.nickname}
            </span>
          )}
        </div>

        {!me ? (
          <div className="p-6 text-center">
            <User className="w-8 h-8 text-stone/60 mx-auto mb-2" />
            <p className="text-body font-medium text-ink">ยังไม่ได้ระบุชื่อของคุณ</p>
            <p className="mt-1 text-fine text-stone max-w-sm mx-auto">
              เลือกชื่อของคุณที่มุมขวาบน เพื่อให้ระบบแสดงรถที่คุณนั่งและห้องนอนของคุณอัตโนมัติ
            </p>
          </div>
        ) : (
          <div className="p-5 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-mist-deep">
            {/* Vehicle Assignment */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-fine font-medium text-stone flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-brass" />
                  รถประจำตัวที่คุณนั่ง
                </span>
                <button
                  onClick={() => setActiveTab('cars')}
                  className="text-[11px] text-brass hover:underline cursor-pointer"
                >
                  ผังที่นั่งทั้งหมด →
                </button>
              </div>

              {myCar ? (
                <div className="p-4 rounded-ctl bg-surface/50 border border-mist-deep space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lead font-semibold text-ink">
                        {myCar.carModel}
                      </p>
                      {myCar.licensePlate && (
                        <p className="text-fine text-stone font-mono">
                          ทะเบียน {myCar.licensePlate}
                        </p>
                      )}
                    </div>
                    {driverOf(myCar.driverName)?.phone && (
                      <a
                        href={`tel:${driverOf(myCar.driverName)?.phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ctl bg-ink text-paper text-fine font-medium hover:bg-ink-soft transition-colors shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>โทรหาคนขับ</span>
                      </a>
                    )}
                  </div>

                  <div className="pt-2 border-t border-mist-deep/60 text-fine space-y-1">
                    <p className="text-stone">
                      <span className="font-medium text-ink">เวลานัด:</span>{' '}
                      {myCar.departureTime}
                    </p>
                    <p className="text-stone">
                      <span className="font-medium text-ink">จุดนัดพบ:</span>{' '}
                      {myCar.meetingPoint}
                    </p>
                    <p className="text-stone">
                      <span className="font-medium text-ink">เพื่อนร่วมคัน ({myCar.passengerIds.length} คน):</span>{' '}
                      {myCar.passengerIds.map(nameOf).join(', ')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-ctl bg-[#fffbf2] border border-brass/40">
                  <p className="text-fine font-medium text-brass">ยังไม่ได้เลือกที่นั่งรถ</p>
                  <p className="text-[11px] text-stone mt-0.5">
                    คุณยังไม่ได้จองที่นั่งในรถคันใดคันหนึ่ง
                  </p>
                  <button
                    onClick={() => setActiveTab('cars')}
                    className="mt-2.5 inline-flex items-center gap-1 text-fine text-ink font-medium underline"
                  >
                    ไปเลือกรถและที่นั่ง <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Bedroom Assignment */}
            <div className="space-y-3 pt-5 md:pt-0 md:pl-6">
              <div className="flex items-center justify-between">
                <span className="text-fine font-medium text-stone flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-brass" />
                  ห้องนอนของคุณที่พูลวิลล่า
                </span>
                <button
                  onClick={() => setActiveTab('stay')}
                  className="text-[11px] text-brass hover:underline cursor-pointer"
                >
                  ผังห้องนอนทั้งหมด →
                </button>
              </div>

              {myRoom ? (
                <div className="p-4 rounded-ctl bg-surface/50 border border-mist-deep space-y-2">
                  <div>
                    <p className="text-lead font-semibold text-ink">
                      {myRoom.roomName}
                    </p>
                    {myRoom.subName && (
                      <p className="text-fine text-stone">{myRoom.subName}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-mist-deep/60 text-fine space-y-1">
                    <p className="text-stone">
                      <span className="font-medium text-ink">รูปแบบเตียง:</span>{' '}
                      {myRoom.bedType}
                    </p>
                    <p className="text-stone">
                      <span className="font-medium text-ink">ห้องน้ำ:</span>{' '}
                      {myRoom.hasBathroom ? 'ห้องน้ำในตัว' : 'ใช้ห้องน้ำรวม'}
                    </p>
                    <p className="text-stone">
                      <span className="font-medium text-ink">รูมเมท ({myRoom.guestIds.length} คน):</span>{' '}
                      {myRoom.guestIds.map(nameOf).join(', ')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-ctl bg-[#fffbf2] border border-brass/40">
                  <p className="text-fine font-medium text-brass">ยังไม่มีห้องนอน</p>
                  <p className="text-[11px] text-stone mt-0.5">
                    คุณยังไม่ได้ระบุห้องนอนที่ Harper Pool Villa
                  </p>
                  <button
                    onClick={() => setActiveTab('stay')}
                    className="mt-2.5 inline-flex items-center gap-1 text-fine text-ink font-medium underline"
                  >
                    ไปเลือกห้องนอน <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 2: Villa Fast-Access Card ──────────────────────── */}
      {stay && (
        <div className="bg-paper rounded-panel border border-mist-deep shadow-sm p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-mist-deep">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brass">
                {stay.villaType || 'บ้านพักพูลวิลล่าส่วนตัวสไตล์ญี่ปุ่น'}
              </span>
              <h2 className="font-display text-lead sm:text-title text-ink font-semibold mt-0.5">
                {stay.name}
              </h2>
              <p className="text-fine text-stone mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone shrink-0" />
                <span>{stay.address}</span>
              </p>
            </div>

            {stay.mapUrl && (
              <a
                href={stay.mapUrl}
                target="_blank"
                rel="noreferrer"
                className={`${btnSolid} inline-flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-xs`}
              >
                <Compass className="w-4 h-4 text-brass" />
                <span>เปิดแผนที่นำทาง GPS</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* WiFi Card */}
            <div className="p-4 rounded-ctl bg-surface/60 border border-mist-deep flex flex-col justify-between">
              <div>
                <span className="text-fine font-medium text-stone flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-brass" />
                  ไวไฟประจำบ้านพัก
                </span>
                <p className="mt-2 text-body font-semibold text-ink font-mono">
                  {stay.wifiSsid || 'Harper_Villa_5G'}
                </p>
                <p className="text-fine text-stone font-mono mt-0.5">
                  รหัส: {stay.wifiPassword || 'harper2026'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyWifi}
                className="mt-3 inline-flex items-center gap-1.5 text-fine text-brass font-medium hover:underline cursor-pointer"
              >
                {copiedWifi ? (
                  <Check className="w-3.5 h-3.5 text-moss" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedWifi ? 'คัดลอกรหัสผ่านแล้ว' : 'คัดลอกรหัสผ่าน'}</span>
              </button>
            </div>

            {/* Check-in / Out Time */}
            <div className="p-4 rounded-ctl bg-surface/60 border border-mist-deep flex flex-col justify-between">
              <div>
                <span className="text-fine font-medium text-stone flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brass" />
                  เวลาเช็คอิน / เช็คเอาท์
                </span>
                <div className="mt-2 space-y-1 text-fine">
                  <p className="text-ink">
                    <span className="text-stone">เช็คอิน:</span>{' '}
                    <span className="font-semibold">{stay.checkIn || '14:00 น.'}</span>
                  </p>
                  <p className="text-ink">
                    <span className="text-stone">เช็คเอาท์:</span>{' '}
                    <span className="font-semibold">{stay.checkOut || '11:00 น.'}</span>
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-stone">
                31 ต.ค. — 1 พ.ย. (2 วัน 1 คืน)
              </p>
            </div>

            {/* Villa Highlights */}
            <div className="p-4 rounded-ctl bg-surface/60 border border-mist-deep flex flex-col justify-between">
              <div>
                <span className="text-fine font-medium text-stone flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brass" />
                  ไฮไลท์ & สิทธิพิเศษ
                </span>
                <ul className="mt-2 text-[11px] text-stone space-y-1">
                  <li>• สระว่ายน้ำส่วนตัวระบบน้ำเกลือ</li>
                  <li>• โต๊ะพูล & คาราโอเกะ ไม่จำกัดเวลาใช้เสียง</li>
                  <li>• ฟรีน้ำแข็ง 2 กระสอบ & ถ่าน BBQ 2 ถุง</li>
                </ul>
              </div>
              <p className="mt-3 text-[11px] text-[#244b36] font-medium">
                รองรับที่จอดรถ 7 คันในบริเวณบ้าน
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 3: Drivers & Speed Dial ────────────────────────── */}
      <div className="bg-paper rounded-panel border border-mist-deep shadow-sm p-5 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-mist-deep">
          <div>
            <h2 className="font-display text-lead font-semibold text-ink flex items-center gap-2">
              <Car className="w-5 h-5 text-brass" />
              <span>สายด่วนรถและคนขับ ({trip.cars.length} คัน)</span>
            </h2>
            <p className="text-fine text-stone mt-0.5">
              เบอร์โทรฉุกเฉินและจุดนัดพบของแต่ละคันในเช้าวันเดินทาง
            </p>
          </div>
        </div>

        {trip.cars.length === 0 ? (
          <div className="py-8 text-center text-stone text-fine">
            ยังไม่มีรถที่ลงทะเบียน ไปเพิ่มได้ที่แท็บ "รถ และที่นั่ง"
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {trip.cars.map((car, index) => {
              const driver = driverOf(car.driverName);
              const isMyVehicle = me && car.passengerIds.includes(me.id);

              return (
                <div
                  key={car.id}
                  className={`p-4 rounded-ctl border transition-all ${
                    isMyVehicle
                      ? 'border-brass bg-[#fffdfa]'
                      : 'border-mist-deep bg-surface/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-ink text-paper font-mono">
                          {index + 1}号車
                        </span>
                        <h3 className="font-display text-body font-semibold text-ink truncate">
                          {car.carModel}
                        </h3>
                        {isMyVehicle && (
                          <span className="text-[11px] px-1.5 py-0.2 rounded bg-brass/20 text-brass font-medium">
                            รถของคุณ
                          </span>
                        )}
                      </div>
                      <p className="text-fine text-stone mt-1">
                        คนขับ: <span className="font-medium text-ink">{car.driverName}</span>
                      </p>
                    </div>

                    {driver?.phone ? (
                      <a
                        href={`tel:${driver.phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ctl bg-ink text-paper text-fine font-medium hover:bg-ink-soft transition-colors shrink-0 shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>โทร</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-stone">ไม่มีเบอร์</span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-mist-deep/60 text-fine space-y-1 text-stone">
                    <p>
                      <span className="font-medium text-ink">เวลานัด:</span>{' '}
                      {car.departureTime}
                    </p>
                    <p>
                      <span className="font-medium text-ink">จุดนัดพบ:</span>{' '}
                      {car.meetingPoint}
                    </p>
                    <p className="truncate">
                      <span className="font-medium text-ink">ผู้โดยสาร ({car.passengerIds.length} คน):</span>{' '}
                      {car.passengerIds.map(nameOf).join(', ')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SECTION 4: Live Timeline Companion ──────────────────────── */}
      <div className="bg-paper rounded-panel border border-mist-deep shadow-sm p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-mist-deep">
          <div>
            <h2 className="font-display text-lead font-semibold text-ink flex items-center gap-2">
              <Clock className="w-5 h-5 text-brass" />
              <span>ตารางเวลาหน้างาน (Live Itinerary Timeline)</span>
            </h2>
            <p className="text-fine text-stone mt-0.5">
              เปิดดูตามลำดับเวลา กดนำทางเข้า Google Maps ได้ทันที
            </p>
          </div>

          {/* Day Switcher */}
          <div className="flex p-0.5 bg-surface rounded-ctl self-start sm:self-auto">
            {trip.itinerary.map((d) => (
              <button
                key={d.dayNumber}
                onClick={() => setSelectedDay(d.dayNumber)}
                className={`px-4 py-1.5 rounded-[6px] text-fine transition-colors cursor-pointer ${
                  selectedDay === d.dayNumber
                    ? 'bg-paper text-ink font-semibold shadow-xs'
                    : 'text-stone hover:text-ink'
                }`}
              >
                วันที่ {d.dayNumber} ({d.date.replace(/\s*\d{4}$/, '')})
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Activities */}
        <div className="mt-6 space-y-4">
          {sortedActivities.length === 0 ? (
            <p className="text-stone text-fine text-center py-8">
              ยังไม่มีกิจกรรมที่ระบุในวันนี้
            </p>
          ) : (
            sortedActivities.map((act, idx) => (
              <div
                key={act.id}
                className="p-4 sm:p-5 rounded-ctl bg-surface/40 border border-mist-deep hover:border-ink/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-ctl bg-paper border border-mist-deep flex flex-col items-center justify-center shrink-0 text-center">
                    <span className="text-[10px] uppercase font-bold text-brass">
                      ลำดับ
                    </span>
                    <span className="font-display text-lead font-bold text-ink leading-none">
                      {idx + 1}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-fine font-mono font-semibold text-brass">
                        {act.time}
                      </span>
                      {act.badge && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-paper text-stone border border-mist-deep">
                          {act.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="font-display text-body font-semibold text-ink mt-0.5">
                      {act.title}
                    </h3>

                    {act.location && (
                      <p className="text-fine text-stone flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{act.location}</span>
                      </p>
                    )}

                    {act.notes && (
                      <p className="text-[11px] text-stone/80 mt-1 max-w-xl">
                        {act.notes}
                      </p>
                    )}
                  </div>
                </div>

                {act.mapUrl && (
                  <a
                    href={act.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-ctl bg-paper border border-mist-deep hover:border-brass text-fine font-medium text-ink transition-colors shrink-0 self-start sm:self-center cursor-pointer shadow-xs"
                  >
                    <Compass className="w-3.5 h-3.5 text-brass" />
                    <span>นำทาง</span>
                    <ExternalLink className="w-3 h-3 text-stone" />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DayOfTab;
