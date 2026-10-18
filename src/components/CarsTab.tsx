import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Car as CarIcon,
  Users,
  Clock,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Luggage,
  UserPlus,
  UserCheck,
} from 'lucide-react';
import { TripData, Car, Member, TripListEditor } from '../types/trip';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Modal, Field, Empty } from './ui';
import { input, btnSolid, btnQuiet, btnLink, btnBrass, initialOf } from './ui-kit';

interface CarsTabProps extends TripListEditor {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
  me: Member | null;
}

const JAPANESE_CAR_LABELS = [
  '1号車 · Ichigousha',
  '2号車 · Nigousha',
  '3号車 · Sangousha',
  '4号車 · Yongousha',
  '5号車 · Gogousha',
  '6号車 · Rokugousha',
];

/** Clean raw driver name by stripping parenthetical car models if any */
export const cleanDriverName = (rawName: string): string => {
  return rawName.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
};

/** Steering wheel SVG icon for Thai right-hand-drive vehicles */
const SteeringWheelIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 15v6" />
    <path d="M9.5 10.5 4 8" />
    <path d="M14.5 10.5 20 8" />
  </svg>
);

interface SeatSlot {
  index: number;
  label: string;
  isDriver: boolean;
  memberId?: string;
  member?: Member;
  customName?: string;
}

export const CarsTab: React.FC<CarsTabProps> = ({ trip, onSaveItem, onRemoveItem, me }) => {
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [isNewCarModalOpen, setIsNewCarModalOpen] = useState(false);
  const [assignPassengerModalCarId, setAssignPassengerModalCarId] = useState<string | null>(null);

  // Form states
  const [driverName, setDriverName] = useState('');
  const [carModel, setCarModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [maxSeats, setMaxSeats] = useState(5);
  const [meetingPoint, setMeetingPoint] = useState('');
  const [departureTime, setDepartureTime] = useState('07:30 น.');
  const [notes, setNotes] = useState('');

  // Collect all assigned member IDs across all cars (including drivers)
  const allAssignedPassengerIds = new Set<string>();
  trip.cars.forEach((car) => {
    car.passengerIds.forEach((id) => allAssignedPassengerIds.add(id));
    const driverClean = cleanDriverName(car.driverName).toLowerCase();
    const driverMember = trip.members.find(
      (m) =>
        m.id === car.driverName ||
        m.nickname.toLowerCase() === driverClean ||
        m.name.toLowerCase() === driverClean
    );
    if (driverMember) allAssignedPassengerIds.add(driverMember.id);
  });

  const confirmedMembers = trip.members.filter((m) => m.status === 'confirmed');
  const confirmedCount = confirmedMembers.length || 10;
  const totalOfferedSeats = trip.cars.reduce((sum, car) => sum + car.maxSeats, 0);
  const seatDeficit = confirmedCount - totalOfferedSeats;

  // Unassigned confirmed members
  const unassignedMembers = confirmedMembers.filter((m) => !allAssignedPassengerIds.has(m.id));

  // Determine current user's car
  const myCar = me
    ? trip.cars.find(
        (c) =>
          c.passengerIds.includes(me.id) ||
          cleanDriverName(c.driverName).toLowerCase() === me.nickname.toLowerCase() ||
          c.driverName === me.id
      )
    : null;

  const handleOpenNewModal = () => {
    setEditingCar(null);
    setDriverName(me ? me.nickname : '');
    setCarModel('');
    setLicensePlate('');
    setMaxSeats(5);
    setMeetingPoint('ปั๊ม ปตท. ถ.มิตรภาพ / จุดพักรถ');
    setDepartureTime('07:30 น.');
    setNotes('');
    setIsNewCarModalOpen(true);
  };

  const handleOpenEditModal = (car: Car) => {
    setEditingCar(car);
    setDriverName(cleanDriverName(car.driverName));
    setCarModel(car.carModel);
    setLicensePlate(car.licensePlate || '');
    setMaxSeats(car.maxSeats);
    setMeetingPoint(car.meetingPoint);
    setDepartureTime(car.departureTime);
    setNotes(car.notes || '');
    setIsNewCarModalOpen(true);
  };

  const handleSaveCar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim() || !carModel.trim()) return;

    if (editingCar) {
      onSaveItem('cars', {
        ...editingCar,
        driverName: driverName.trim(),
        carModel: carModel.trim(),
        licensePlate: licensePlate.trim() || undefined,
        maxSeats: Number(maxSeats),
        meetingPoint: meetingPoint.trim() || 'รอกำหนดจุดนัดพบ',
        departureTime: departureTime.trim() || '07:30 น.',
        notes: notes.trim() || undefined,
      });
    } else {
      const driverMember = trip.members.find(
        (m) =>
          m.nickname.toLowerCase() === driverName.trim().toLowerCase() ||
          m.name.toLowerCase() === driverName.trim().toLowerCase()
      );

      const newCar: Car = {
        id: `car-${Date.now()}`,
        driverName: driverName.trim(),
        carModel: carModel.trim(),
        licensePlate: licensePlate.trim() || undefined,
        maxSeats: Number(maxSeats),
        meetingPoint: meetingPoint.trim() || 'รอกำหนดจุดนัดพบ',
        departureTime: departureTime.trim() || '07:30 น.',
        passengerIds: driverMember ? [driverMember.id] : [],
        notes: notes.trim() || undefined,
      };
      onSaveItem('cars', newCar);
    }
    setIsNewCarModalOpen(false);
  };

  const handleDeleteCar = (carId: string) => {
    const car = trip.cars.find((c) => c.id === carId);
    if (!window.confirm(`ลบรถของ "${cleanDriverName(car?.driverName ?? 'คันนี้')}" ออกจากทริป?`)) return;
    onRemoveItem('cars', carId);
  };

  const handleRemovePassenger = (carId: string, memberIdOrName: string) => {
    const car = trip.cars.find((c) => c.id === carId);
    if (!car) return;
    onSaveItem('cars', {
      ...car,
      passengerIds: car.passengerIds.filter(
        (id) => id !== memberIdOrName && cleanDriverName(id) !== memberIdOrName
      ),
    });
  };

  const handleAddPassengerToCar = (carId: string, memberId: string) => {
    for (const c of trip.cars) {
      const without = c.passengerIds.filter((id) => id !== memberId);
      const seated =
        c.id === carId && without.length < c.maxSeats ? [...without, memberId] : without;
      if (seated.length !== c.passengerIds.length) {
        onSaveItem('cars', { ...c, passengerIds: seated });
      }
    }
    setAssignPassengerModalCarId(null);
  };

  /** Build structured seat layout for a car */
  const buildCarSeats = (car: Car): SeatSlot[] => {
    const driverClean = cleanDriverName(car.driverName);
    const driverMember = trip.members.find(
      (m) =>
        m.id === car.driverName ||
        m.nickname.toLowerCase() === driverClean.toLowerCase() ||
        m.name.toLowerCase() === driverClean.toLowerCase()
    );

    const nonDriverPassengerIds = car.passengerIds.filter((pId) => {
      if (driverMember && pId === driverMember.id) return false;
      if (pId === car.driverName) return false;
      if (cleanDriverName(pId).toLowerCase() === driverClean.toLowerCase()) return false;
      return true;
    });

    const slots: SeatSlot[] = [];

    // Slot 0: Driver Seat (Always Front-Right for Thai RHD)
    slots.push({
      index: 0,
      label: 'คนขับ (Driver)',
      isDriver: true,
      memberId: driverMember?.id,
      member: driverMember,
      customName: driverMember ? driverMember.nickname : driverClean,
    });

    // Remaining slots up to car.maxSeats
    for (let i = 1; i < car.maxSeats; i++) {
      const pId = nonDriverPassengerIds[i - 1];
      let pMember: Member | undefined;
      let pName: string | undefined;

      if (pId) {
        pMember = trip.members.find(
          (m) => m.id === pId || m.nickname.toLowerCase() === cleanDriverName(pId).toLowerCase()
        );
        pName = pMember ? pMember.nickname : cleanDriverName(pId);
      }

      let seatLabel = 'เบาะหลัง';
      if (i === 1) seatLabel = 'เบาะข้างคนขับ (Front)';
      else if (i === 2) seatLabel = 'เบาะหลัง (ซ้าย)';
      else if (i === 3) seatLabel = car.maxSeats >= 5 ? 'เบาะหลัง (ขวา)' : 'เบาะหลัง (กลาง)';
      else if (i === 4) seatLabel = 'เบาะหลัง (กลาง)';
      else seatLabel = `แถว 3 (${i - 3})`;

      slots.push({
        index: i,
        label: seatLabel,
        isDriver: false,
        memberId: pMember?.id || (pId ? pId : undefined),
        member: pMember,
        customName: pName,
      });
    }

    return slots;
  };

  return (
    <div className="pb-16 max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <PageHead
        title="รถและที่นั่ง (Car Pooling)"
        note="จัดสรรรถและที่นั่งสำหรับการเดินทางไป-กลับเขาใหญ่ พร้อมจุดนัดพบและเวลานัดหมายแบบเป็นสัดส่วน"
        action={
          <button onClick={handleOpenNewModal} className={btnSolid}>
            <Plus className="w-4 h-4 mr-1.5 inline" />
            อาสาเอารถไป
          </button>
        }
      />

      {/* Top Logistics Dashboard */}
      <section className="bg-paper rounded-panel border border-mist-deep p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-mist-deep">
          <div className="p-2">
            <span className="text-fine text-stone block">รถร่วมทริปทั้งหมด</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold text-ink">
                {trip.cars.length}
              </span>
              <span className="text-fine text-stone">คัน</span>
            </div>
            <span className="text-fine text-stone/80 mt-1 block">
              {trip.cars.length > 0
                ? `เฉลี่ย ${Math.round(confirmedCount / trip.cars.length)} คน/คัน`
                : 'รอเพื่อนอาสา'}
            </span>
          </div>

          <div className="p-2 pt-4 md:pt-2 md:pl-6">
            <span className="text-fine text-stone block">ความจุที่นั่งรวม</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold text-ink">
                {totalOfferedSeats}
              </span>
              <span className="text-fine text-stone">ที่นั่ง</span>
            </div>
            <span className="text-fine text-stone/80 mt-1 block">
              {seatDeficit <= 0 ? 'เพียงพอกับทุกคน' : `ยังขาดอีก ${seatDeficit} ที่`}
            </span>
          </div>

          <div className="p-2 pt-4 md:pt-2 md:pl-6">
            <span className="text-fine text-stone block">จัดที่นั่งแล้ว</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold text-brass">
                {allAssignedPassengerIds.size}
              </span>
              <span className="text-fine text-stone">/ {confirmedCount} คน</span>
            </div>
            <div className="mt-2 w-full bg-mist-deep h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-brass h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((allAssignedPassengerIds.size / confirmedCount) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="p-2 pt-4 md:pt-2 md:pl-6">
            <span className="text-fine text-stone block">ที่นั่งว่างคงเหลือ</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold text-moss">
                {Math.max(0, totalOfferedSeats - allAssignedPassengerIds.size)}
              </span>
              <span className="text-fine text-stone">ที่ว่าง</span>
            </div>
            <span className="inline-flex items-center gap-1 text-fine text-moss mt-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              พร้อมออกเดินทาง
            </span>
          </div>
        </div>

        {/* Personal Assigned Car Notification */}
        {me && myCar && (
          <div className="mt-6 pt-5 border-t border-mist-deep flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface/60 -mx-6 -mb-6 p-5 rounded-b-panel">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-ink text-paper flex items-center justify-center text-xs font-bold shrink-0">
                {initialOf(me.nickname)}
              </span>
              <div>
                <p className="text-body font-medium text-ink">
                  คุณ <span className="text-brass">{me.nickname}</span> จัดที่นั่งเรียบร้อยแล้ว
                </p>
                <p className="text-fine text-stone">
                  เดินทางกับรถของ <span className="font-semibold text-ink">{cleanDriverName(myCar.driverName)}</span> ({myCar.carModel}) · เวลานัด {myCar.departureTime}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper border border-mist-deep text-fine text-stone">
                <MapPin className="w-3.5 h-3.5 text-brass" />
                {myCar.meetingPoint}
              </span>
            </div>
          </div>
        )}

        {/* Unassigned Members Alert */}
        {unassignedMembers.length > 0 && (
          <div className="mt-6 pt-5 border-t border-mist-deep flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-brass-lit/20 -mx-6 -mb-6 p-5 rounded-b-panel border-b border-mist-deep">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-brass shrink-0" />
              <div>
                <p className="text-body font-medium text-ink">
                  มีเพื่อน {unassignedMembers.length} คน ที่ยังไม่ได้เลือกรถ
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {unassignedMembers.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-paper text-fine text-ink border border-mist-deep"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: m.avatarColor }}
                      />
                      {m.nickname}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-fine text-stone">
              กดที่นั่งว่างในรถคันที่ต้องการเพื่อจัดให้เพื่อนได้เลย
            </p>
          </div>
        )}
      </section>

      {/* Cars List */}
      {trip.cars.length === 0 ? (
        <Panel>
          <Empty
            title="ยังไม่มีรถในทริป"
            note="ใครสะดวกขับรถไปเขาใหญ่ อาสาลงชื่อพร้อมระบุรุ่นรถและจำนวนที่นั่งได้เลยครับ"
            action={
              <button onClick={handleOpenNewModal} className={btnLink}>
                <Plus className="w-3.5 h-3.5" />
                อาสาเอารถคันแรก
              </button>
            }
          />
        </Panel>
      ) : (
        <div className="space-y-6">
          {trip.cars.map((car, index) => {
            const seats = buildCarSeats(car);
            const seatedCount = seats.filter((s) => s.memberId || s.customName).length;
            const isFull = seatedCount >= car.maxSeats;
            const availableSeats = Math.max(0, car.maxSeats - seatedCount);
            const cleanDriver = cleanDriverName(car.driverName);
            const isMyCar = me && seats.some((s) => s.memberId === me.id || s.customName === me.nickname);
            const isDriverMe = me && cleanDriver.toLowerCase() === me.nickname.toLowerCase();

            // Separate seats into front row and rear rows (Thai RHD: Driver is Front-Right, Passenger is Front-Left)
            const frontPassenger = seats[1]; // Left
            const driverSeat = seats[0];     // Right
            const rearSeats = seats.slice(2);

            return (
              <article
                key={car.id}
                className={`bg-paper rounded-panel border transition-all duration-200 overflow-hidden shadow-xs ${
                  isMyCar ? 'border-brass/70 ring-1 ring-brass/20' : 'border-mist-deep hover:border-ink/20'
                }`}
              >
                {/* Car Card Header */}
                <div className="p-6 sm:p-7 border-b border-mist-deep/70 bg-surface/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Car Title & Metadata */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-ctl bg-ink text-paper flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-paper/70">Car</span>
                        <span className="font-display text-lg font-bold leading-none">0{index + 1}</span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-lead text-ink font-semibold">
                            รถของ {cleanDriver}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-surface text-fine font-medium text-stone border border-mist-deep">
                            {car.carModel}
                          </span>
                          {car.licensePlate && (
                            <span className="px-2 py-0.5 rounded-md bg-paper text-[11px] text-stone font-mono border border-mist-deep">
                              {car.licensePlate}
                            </span>
                          )}
                          <span className="text-[11px] text-brass font-medium">
                            {JAPANESE_CAR_LABELS[index] || `${index + 1}号車`}
                          </span>
                        </div>

                        {/* Sub-meta: Departure & Meeting point */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-fine text-stone">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-brass" />
                            ออกเดินทาง {car.departureTime || '07:30 น.'}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-brass" />
                            จุดนัดพบ: {car.meetingPoint || 'รอกำหนดจุดนัดพบ'}
                          </span>
                          {car.notes && (
                            <span className="inline-flex items-center gap-1.5 text-stone/90">
                              <Luggage className="w-3.5 h-3.5 text-stone" />
                              {car.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Seat Stats & Actions */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-fine font-medium ${
                            isFull
                              ? 'bg-brass-lit/40 text-ink'
                              : 'bg-moss/10 text-moss border border-moss/20'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          {isFull ? 'ที่นั่งเต็มแล้ว' : `ว่างอีก ${availableSeats} ที่`}
                        </span>
                        <span className="text-fine text-stone block mt-0.5">
                          นั่งแล้ว {seatedCount} จาก {car.maxSeats} ที่
                        </span>
                      </div>

                      <div className="flex items-center gap-1 pl-2 border-l border-mist-deep">
                        <button
                          onClick={() => handleOpenEditModal(car)}
                          className="p-1.5 text-stone hover:text-ink hover:bg-surface rounded-ctl transition-colors"
                          title="แก้ไขข้อมูลรถ"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCar(car.id)}
                          className="p-1.5 text-stone hover:text-red-600 hover:bg-red-50 rounded-ctl transition-colors"
                          title="ลบรถคันนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Car Cabin Interactive Seat Visualizer */}
                <div className="p-6 sm:p-7">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-fine font-semibold text-ink uppercase tracking-wider flex items-center gap-1.5">
                      <CarIcon className="w-4 h-4 text-brass" />
                      ผังที่นั่งในรถ (Cabin Layout)
                    </span>
                    <span className="text-[11px] text-stone">
                      ระบบพวงมาลัยขวา (Thailand RHD) · คลิกที่นั่งว่างเพื่อเลือก
                    </span>
                  </div>

                  {/* Vehicle Cabin Container */}
                  <div className="max-w-2xl mx-auto bg-surface/40 rounded-2xl border border-mist-deep p-5 relative overflow-hidden">
                    {/* Front Windshield Indicator */}
                    <div className="flex items-center justify-center mb-5 pb-3 border-b border-dashed border-stone/20">
                      <span className="text-[11px] font-medium text-stone/70 tracking-widest uppercase">
                        หน้ารถ (Front Windshield)
                      </span>
                    </div>

                    {/* Row 1: Front Row (Passenger Left, Driver Right) */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                      {/* Front Passenger Seat (Left) */}
                      {frontPassenger ? (
                        <div
                          className={`relative rounded-xl border p-3.5 transition-all ${
                            frontPassenger.memberId || frontPassenger.customName
                              ? 'bg-paper border-mist-deep shadow-2xs'
                              : 'border-dashed border-stone/30 bg-paper/50 hover:bg-paper hover:border-brass/50 cursor-pointer'
                          }`}
                          onClick={() => {
                            if (!frontPassenger.memberId && !frontPassenger.customName) {
                              if (me && !myCar) handleAddPassengerToCar(car.id, me.id);
                              else setAssignPassengerModalCarId(car.id);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-medium text-stone">
                              {frontPassenger.label}
                            </span>
                            {frontPassenger.memberId === me?.id && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-ink text-paper">
                                คุณ
                              </span>
                            )}
                          </div>

                          {frontPassenger.memberId || frontPassenger.customName ? (
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className="w-7 h-7 rounded-full text-xs font-bold text-paper flex items-center justify-center shrink-0 shadow-2xs"
                                  style={{
                                    backgroundColor: frontPassenger.member?.avatarColor || '#2f4a3c',
                                  }}
                                >
                                  {initialOf(frontPassenger.customName || 'พ')}
                                </span>
                                <span className="text-body font-medium text-ink truncate">
                                  {frontPassenger.customName}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemovePassenger(
                                    car.id,
                                    frontPassenger.memberId || frontPassenger.customName!
                                  );
                                }}
                                className="text-stone hover:text-red-600 p-1 transition-colors"
                                title="สละที่นั่ง"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-1.5 text-stone hover:text-brass gap-1.5">
                              <Plus className="w-4 h-4" />
                              <span className="text-fine font-medium">
                                {me && !myCar ? 'กดเลือกนั่งที่นี่' : 'ว่าง (เพิ่มเพื่อน)'}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div />
                      )}

                      {/* Driver Seat (Right) */}
                      <div className="relative rounded-xl border border-brass/40 bg-brass-lit/15 p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold text-brass flex items-center gap-1">
                            <SteeringWheelIcon className="w-3.5 h-3.5" />
                            {driverSeat.label}
                          </span>
                          {isDriverMe && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brass text-ink">
                              คุณขับ
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-7 h-7 rounded-full text-xs font-bold text-paper flex items-center justify-center shrink-0 shadow-2xs"
                              style={{
                                backgroundColor: driverSeat.member?.avatarColor || '#a8782f',
                              }}
                            >
                              {initialOf(driverSeat.customName || 'ค')}
                            </span>
                            <div className="min-w-0">
                              <span className="text-body font-semibold text-ink truncate block">
                                {driverSeat.customName}
                              </span>
                              <span className="text-[10px] text-stone block">เจ้าของรถ</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Rear Seats Grid */}
                    <div className="mb-2">
                      <div
                        className={`grid gap-3 sm:gap-4 ${
                          rearSeats.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'
                        }`}
                      >
                        {rearSeats.map((seat) => {
                          const isOccupied = seat.memberId || seat.customName;
                          const isMeSeated = me && seat.memberId === me.id;

                          return (
                            <div
                              key={seat.index}
                              className={`relative rounded-xl border p-3.5 transition-all ${
                                isOccupied
                                  ? 'bg-paper border-mist-deep shadow-2xs'
                                  : 'border-dashed border-stone/30 bg-paper/50 hover:bg-paper hover:border-brass/50 cursor-pointer'
                              }`}
                              onClick={() => {
                                if (!isOccupied) {
                                  if (me && !myCar) handleAddPassengerToCar(car.id, me.id);
                                  else setAssignPassengerModalCarId(car.id);
                                }
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-medium text-stone">
                                  {seat.label}
                                </span>
                                {isMeSeated && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-ink text-paper">
                                    คุณ
                                  </span>
                                )}
                              </div>

                              {isOccupied ? (
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className="w-6 h-6 rounded-full text-[11px] font-bold text-paper flex items-center justify-center shrink-0"
                                      style={{
                                        backgroundColor: seat.member?.avatarColor || '#2f4a3c',
                                      }}
                                    >
                                      {initialOf(seat.customName || 'พ')}
                                    </span>
                                    <span className="text-fine font-medium text-ink truncate">
                                      {seat.customName}
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemovePassenger(
                                        car.id,
                                        seat.memberId || seat.customName!
                                      );
                                    }}
                                    className="text-stone hover:text-red-600 p-0.5 transition-colors"
                                    title="สละที่นั่ง"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center py-1.5 text-stone hover:text-brass gap-1">
                                  <Plus className="w-3.5 h-3.5" />
                                  <span className="text-[11px] font-medium">
                                    {me && !myCar ? 'กดเลือกนั่ง' : 'ว่าง'}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Trunk / Luggage Space Indicator */}
                    <div className="mt-4 pt-3 border-t border-dashed border-stone/20 flex items-center justify-center gap-2 text-stone/70">
                      <Luggage className="w-3.5 h-3.5 text-stone/50" />
                      <span className="text-[10px] uppercase tracking-wider">
                        พื้นที่เก็บสัมภาระท้ายรถ (Luggage Space)
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Footer for this Car */}
                  <div className="mt-6 pt-4 border-t border-mist-deep flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {me && (
                        <>
                          {isMyCar ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 text-fine font-medium text-moss">
                                <CheckCircle2 className="w-4 h-4" />
                                คุณอยู่ในรถคันนี้
                              </span>
                              {!isDriverMe && (
                                <button
                                  onClick={() => handleRemovePassenger(car.id, me.id)}
                                  className="text-fine text-stone hover:text-red-600 underline ml-2 cursor-pointer"
                                >
                                  สละที่นั่ง
                                </button>
                              )}
                            </div>
                          ) : !isFull ? (
                            <button
                              onClick={() => handleAddPassengerToCar(car.id, me.id)}
                              className={btnBrass}
                            >
                              <UserCheck className="w-4 h-4 mr-1.5 inline" />
                              เลือกนั่งคันนี้
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>

                    {!isFull && (
                      <button
                        onClick={() => setAssignPassengerModalCarId(car.id)}
                        className={`${btnQuiet} inline-flex items-center gap-1.5 text-fine`}
                      >
                        <UserPlus className="w-3.5 h-3.5 text-brass" />
                        เลือกเพื่อนขึ้นคันนี้
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Car Add / Edit Modal */}
      {isNewCarModalOpen && (
        <Modal
          title={editingCar ? 'แก้ไขข้อมูลรถ' : 'อาสาเอารถไป (ลงทะเบียนรถ)'}
          note="ระบุคนขับ รุ่นรถ และจำนวนที่นั่งเพื่อให้เพื่อนๆ เลือกรถได้สะดวก"
          onClose={() => setIsNewCarModalOpen(false)}
          wide
        >
          <form onSubmit={handleSaveCar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="ชื่อคนขับ / เจ้าของรถ" htmlFor="car-driver">
                <input
                  id="car-driver"
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="เช่น ตั้ม, แปม, ที"
                  className={input}
                />
              </Field>

              <Field label="รุ่นรถยนต์" htmlFor="car-model" hint="เช่น Toyota Corolla Cross, Civic, Swift">
                <input
                  id="car-model"
                  type="text"
                  required
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  placeholder="เช่น Toyota Corolla Cross"
                  className={input}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="ป้ายทะเบียน (ทางเลือก)" htmlFor="car-plate">
                <input
                  id="car-plate"
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  placeholder="เช่น 7กข 3821 กทม."
                  className={input}
                />
              </Field>

              <Field label="จำนวนที่นั่งทั้งหมด (รวมคนขับ)" htmlFor="car-seats">
                <select
                  id="car-seats"
                  value={maxSeats}
                  onChange={(e) => setMaxSeats(Number(e.target.value))}
                  className={input}
                >
                  <option value={4}>4 ที่นั่ง (รถ Compact / Hatchback)</option>
                  <option value={5}>5 ที่นั่ง (รถ Sedan / Crossover ทั่วไป)</option>
                  <option value={6}>6 ที่นั่ง (รถ SUV 6 ที่นั่ง)</option>
                  <option value={7}>7 ที่นั่ง (รถ SUV 7 ที่นั่ง / PPV)</option>
                  <option value={8}>8 ที่นั่ง (รถตู้ / Van)</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="เวลานัดออกเดินทาง" htmlFor="car-time">
                <input
                  id="car-time"
                  type="text"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  placeholder="07:30 น."
                  className={input}
                />
              </Field>

              <Field label="จุดนัดรับเพื่อน" htmlFor="car-meet">
                <input
                  id="car-meet"
                  type="text"
                  value={meetingPoint}
                  onChange={(e) => setMeetingPoint(e.target.value)}
                  placeholder="เช่น ปั๊ม ปตท. มิตรภาพ หรือ ฟิวเจอร์รังสิต"
                  className={input}
                />
              </Field>
            </div>

            <Field label="หมายเหตุ / สัมภาระ" htmlFor="car-notes">
              <textarea
                id="car-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น ท้ายรถกว้าง ใส่กระเป๋าเดินทางได้ 3-4 ใบ, แวะรับตามแนวรถไฟฟ้าได้"
                className={input}
              />
            </Field>

            <div className="pt-3 flex justify-end gap-3 border-t border-mist-deep">
              <button
                type="button"
                onClick={() => setIsNewCarModalOpen(false)}
                className={btnQuiet}
              >
                ยกเลิก
              </button>
              <button type="submit" className={btnSolid}>
                {editingCar ? 'บันทึกการแก้ไข' : 'ลงทะเบียนรถ'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Passenger to Car Modal */}
      {assignPassengerModalCarId && (
        <Modal
          title="เลือกเพื่อนขึ้นรถคันนี้"
          note="กดเลือกเพื่อนเพื่อจัดที่นั่ง คนที่อยู่คันอื่นจะถูกสลับมาคันนี้โดยอัตโนมัติ"
          onClose={() => setAssignPassengerModalCarId(null)}
        >
          <div className="space-y-4">
            {/* Priority Section: Unassigned Friends */}
            {unassignedMembers.length > 0 && (
              <div>
                <span className="text-fine font-semibold text-brass block mb-2">
                  เพื่อนที่ยังไม่มีที่นั่ง (แนะนำ)
                </span>
                <ul className="divide-y divide-mist-deep bg-brass-lit/10 rounded-ctl border border-brass/30 overflow-hidden">
                  {unassignedMembers.map((member) => (
                    <li key={member.id}>
                      <button
                        onClick={() => handleAddPassengerToCar(assignPassengerModalCarId, member.id)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-brass-lit/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-6 h-6 rounded-full text-xs font-bold text-paper flex items-center justify-center shadow-2xs"
                            style={{ backgroundColor: member.avatarColor }}
                          >
                            {initialOf(member.nickname)}
                          </span>
                          <span className="text-body font-medium text-ink">
                            {member.nickname}
                          </span>
                        </div>
                        <span className="text-fine font-semibold text-brass">
                          + จัดนั่งคันนี้
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Other Members */}
            <div>
              <span className="text-fine font-semibold text-stone block mb-2">
                สมาชิกยืนยันทั้งหมด ({confirmedMembers.length} คน)
              </span>
              <ul className="divide-y divide-mist-deep max-h-60 overflow-y-auto rounded-ctl border border-mist-deep">
                {confirmedMembers.map((member) => {
                  const currentCar = trip.cars.find(
                    (c) =>
                      c.passengerIds.includes(member.id) ||
                      cleanDriverName(c.driverName).toLowerCase() === member.nickname.toLowerCase()
                  );
                  const isCurrent = currentCar?.id === assignPassengerModalCarId;
                  const isMe = me && member.id === me.id;

                  return (
                    <li key={member.id}>
                      <button
                        onClick={() => handleAddPassengerToCar(assignPassengerModalCarId, member.id)}
                        disabled={isCurrent}
                        className={`w-full flex items-center justify-between p-3 text-left transition-colors ${
                          isCurrent
                            ? 'opacity-40 bg-surface/50 cursor-not-allowed'
                            : 'hover:bg-surface cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-6 h-6 rounded-full text-xs font-bold text-paper flex items-center justify-center shadow-2xs"
                            style={{ backgroundColor: member.avatarColor }}
                          >
                            {initialOf(member.nickname)}
                          </span>
                          <span className="text-body font-medium text-ink">
                            {member.nickname}
                            {isMe && (
                              <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded bg-ink text-paper font-medium">
                                คุณ
                              </span>
                            )}
                          </span>
                        </div>

                        <div>
                          {isCurrent ? (
                            <span className="text-fine text-stone">อยู่ในคันนี้แล้ว</span>
                          ) : currentCar ? (
                            <span className="text-fine text-stone/80">
                              ย้ายจาก {cleanDriverName(currentCar.driverName)}
                            </span>
                          ) : (
                            <span className="text-fine font-medium text-brass">
                              + เลือก
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
