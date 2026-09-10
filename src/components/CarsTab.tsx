import React, { useState } from 'react';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import { TripData, Car } from '../types/trip';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Modal, Field, Empty, Tag, Meter } from './ui';
import { input, btnSolid, btnQuiet, btnLink } from './ui-kit';

interface CarsTabProps {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
}

export const CarsTab: React.FC<CarsTabProps> = ({ trip, onUpdateTrip }) => {
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [isNewCarModalOpen, setIsNewCarModalOpen] = useState(false);
  const [assignPassengerModalCarId, setAssignPassengerModalCarId] = useState<string | null>(null);

  const [driverName, setDriverName] = useState('');
  const [carModel, setCarModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [maxSeats, setMaxSeats] = useState(5);
  const [meetingPoint, setMeetingPoint] = useState('');
  const [departureTime, setDepartureTime] = useState('07:30 น.');
  const [notes, setNotes] = useState('');

  const allAssignedPassengerIds = new Set(trip.cars.flatMap((c) => c.passengerIds));

  const unassignedMembers = trip.members.filter(
    (m) => m.status === 'confirmed' && !allAssignedPassengerIds.has(m.id)
  );

  const confirmedCount = trip.members.filter((m) => m.status === 'confirmed').length || 10;
  const totalOfferedSeats = trip.cars.reduce((sum, car) => sum + car.maxSeats, 0);
  const seatDeficit = confirmedCount - totalOfferedSeats;

  const handleOpenNewModal = () => {
    setEditingCar(null);
    setDriverName('');
    setCarModel('');
    setLicensePlate('');
    setMaxSeats(5);
    setMeetingPoint('');
    setDepartureTime('07:30 น.');
    setNotes('');
    setIsNewCarModalOpen(true);
  };

  const handleOpenEditModal = (car: Car) => {
    setEditingCar(car);
    setDriverName(car.driverName);
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
      onUpdateTrip((t) => ({
        ...t,
        cars: t.cars.map((c) =>
          c.id === editingCar.id
            ? {
                ...c,
                driverName,
                carModel,
                licensePlate,
                maxSeats: Number(maxSeats),
                meetingPoint,
                departureTime,
                notes,
              }
            : c
        ),
      }));
    } else {
      const newCar: Car = {
        id: `c-${Date.now()}`,
        driverName,
        carModel,
        licensePlate,
        maxSeats: Number(maxSeats),
        meetingPoint: meetingPoint || 'รอกำหนดจุดนัดพบ',
        departureTime: departureTime || '07:30 น.',
        passengerIds: [],
        notes,
      };
      onUpdateTrip((t) => ({ ...t, cars: [...t.cars, newCar] }));
    }
    setIsNewCarModalOpen(false);
  };

  const handleDeleteCar = (carId: string) => {
    const car = trip.cars.find((c) => c.id === carId);
    if (!window.confirm(`ลบรถของ ${car?.driverName ?? 'คันนี้'} ออกจากทริป?`)) return;
    onUpdateTrip((t) => ({ ...t, cars: t.cars.filter((c) => c.id !== carId) }));
  };

  const handleRemovePassenger = (carId: string, memberId: string) => {
    onUpdateTrip((t) => ({
      ...t,
      cars: t.cars.map((c) =>
        c.id === carId
          ? { ...c, passengerIds: c.passengerIds.filter((id) => id !== memberId) }
          : c
      ),
    }));
  };

  const handleAddPassengerToCar = (carId: string, memberId: string) => {
    // Seat count is re-checked against the newest data, so two people claiming
    // the last seat at once cannot both get it.
    onUpdateTrip((t) => ({
      ...t,
      cars: t.cars.map((c) => {
        let currentPassengers = c.passengerIds.filter((id) => id !== memberId);
        if (c.id === carId) {
          if (!currentPassengers.includes(memberId) && currentPassengers.length < c.maxSeats) {
            currentPassengers = [...currentPassengers, memberId];
          }
        }
        return { ...c, passengerIds: currentPassengers };
      }),
    }));
    setAssignPassengerModalCarId(null);
  };

  const seatSummary =
    trip.cars.length === 0
      ? 'ยังไม่มีใครเสนอรถ'
      : seatDeficit <= 0
        ? `ที่นั่งพอสำหรับทุกคนแล้ว รวม ${totalOfferedSeats} ที่`
        : `ยังขาดอีกราว ${seatDeficit} ที่นั่ง`;

  return (
    <div className="pb-16">
      <PageHead
        title="รถและที่นั่ง"
        note="กลุ่ม 10–12 คนต้องการรถราวสองถึงสามคัน ใครขับไปได้ลงชื่อไว้พร้อมจุดนัดรับ"
        aside={
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Tag tone={trip.cars.length > 0 ? 'accent' : 'off'}>{trip.cars.length} คัน</Tag>
            <Tag tone={seatDeficit <= 0 && trip.cars.length > 0 ? 'go' : 'wait'}>
              {seatSummary}
            </Tag>
            {unassignedMembers.length > 0 && trip.cars.length > 0 && (
              <Tag tone="wait">
                ยังไม่ได้เลือกรถ {unassignedMembers.map((m) => m.nickname).join(' ')}
              </Tag>
            )}
          </div>
        }
        action={
          <button onClick={handleOpenNewModal} className={btnSolid}>
            อาสาเอารถไป
          </button>
        }
      />

      {trip.cars.length === 0 ? (
        <Panel>
          <Empty
            title="ยังไม่มีรถสักคัน"
            note="ใครสะดวกขับไปเขาใหญ่ ลงชื่อไว้พร้อมรุ่นรถและจำนวนที่นั่ง"
            action={
              <button onClick={handleOpenNewModal} className={btnLink}>
                <Plus className="w-3.5 h-3.5" />
                ลงชื่อคันแรก
              </button>
            }
          />
        </Panel>
      ) : (
        <div className="bg-paper divide-y divide-mist-deep">
          {trip.cars.map((car, index) => {
            const isFull = car.passengerIds.length >= car.maxSeats;
            const availableCount = car.maxSeats - car.passengerIds.length;

            return (
              <article key={car.id} className="px-6 sm:px-8 py-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-baseline gap-4 min-w-0">
                    <span className="font-display text-lead text-brass leading-none shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-body text-ink">
                        {car.driverName}
                        <span className="ml-2 text-fine text-stone">{car.carModel}</span>
                      </h2>
                      <p className="mt-1 text-fine text-stone">
                        ออก {car.departureTime || '07:30 น.'} · รับที่{' '}
                        {car.meetingPoint || 'รอกำหนดจุดนัดพบ'}
                        {car.licensePlate && ` · ${car.licensePlate}`}
                      </p>
                      {car.notes && <p className="mt-1 text-fine text-stone">{car.notes}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(car)}
                      className="text-stone hover:text-ink transition-colors"
                      aria-label={`แก้ไขรถของ ${car.driverName}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCar(car.id)}
                      className="text-stone hover:text-ink transition-colors"
                      aria-label={`ลบรถของ ${car.driverName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <p className="text-fine text-stone">
                    นั่งแล้ว {car.passengerIds.length} จาก {car.maxSeats} ที่
                  </p>
                  <p className="text-fine text-stone">
                    {isFull ? 'เต็มแล้ว' : `ว่างอีก ${availableCount} ที่`}
                  </p>
                </div>
                <div className="mt-2">
                  <Meter
                    value={car.passengerIds.length}
                    max={car.maxSeats}
                    tone={isFull ? 'brass' : 'ink'}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {car.passengerIds.length === 0 && (
                    <p className="text-fine text-stone">ยังไม่มีใครเลือกนั่งคันนี้</p>
                  )}
                  {car.passengerIds.map((pId) => {
                    const member = trip.members.find((m) => m.id === pId);
                    return (
                      <span key={pId} className="inline-flex items-center gap-1.5 text-fine text-ink">
                        <span
                          className="w-1.5 h-1.5"
                          style={{ backgroundColor: member?.avatarColor || '#2f4a3c' }}
                          aria-hidden="true"
                        />
                        {member?.nickname || 'เพื่อน'}
                        <button
                          onClick={() => handleRemovePassenger(car.id, pId)}
                          className="text-stone hover:text-ink transition-colors"
                          aria-label={`นำ ${member?.nickname ?? 'คนนี้'} ออกจากคันนี้`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}

                  {!isFull && (
                    <button
                      disabled={trip.members.filter((m) => m.status === 'confirmed').length === 0}
                      onClick={() => setAssignPassengerModalCarId(car.id)}
                      className={`${btnLink} disabled:opacity-40 disabled:pointer-events-none`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      เลือกเพื่อนขึ้นคันนี้
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {assignPassengerModalCarId && (
        <Modal
          title="เลือกเพื่อนขึ้นรถคันนี้"
          note="กดชื่อเพื่อย้ายเข้ามา คนที่อยู่คันอื่นจะถูกย้ายให้อัตโนมัติ"
          onClose={() => setAssignPassengerModalCarId(null)}
        >
          <ul className="divide-y divide-mist-deep max-h-72 overflow-y-auto">
            {trip.members
              .filter((m) => m.status === 'confirmed')
              .map((member) => {
                const currentCar = trip.cars.find((c) => c.passengerIds.includes(member.id));
                const isCurrent = currentCar?.id === assignPassengerModalCarId;

                return (
                  <li key={member.id}>
                    <button
                      onClick={() =>
                        handleAddPassengerToCar(assignPassengerModalCarId, member.id)
                      }
                      disabled={isCurrent}
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
                        {isCurrent
                          ? 'อยู่คันนี้แล้ว'
                          : currentCar
                            ? `ย้ายจากคันของ ${currentCar.driverName}`
                            : 'ยังไม่มีรถ'}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </Modal>
      )}

      {isNewCarModalOpen && (
        <Modal
          title={editingCar ? 'แก้ไขข้อมูลรถ' : 'อาสาเอารถไป'}
          onClose={() => setIsNewCarModalOpen(false)}
          wide
        >
          <form onSubmit={handleSaveCar} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="คนขับ" htmlFor="car-driver">
                <input
                  id="car-driver"
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="โอม แบงค์"
                  className={input}
                />
              </Field>
              <Field label="รุ่นรถและสี" htmlFor="car-model">
                <input
                  id="car-model"
                  type="text"
                  required
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  placeholder="Honda CR-V สีเทา"
                  className={input}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="ทะเบียนรถ ถ้าทราบ" htmlFor="car-plate">
                <input
                  id="car-plate"
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  placeholder="7กข 3821 กทม."
                  className={input}
                />
              </Field>
              <Field label="ที่นั่งทั้งหมด" htmlFor="car-seats" hint="นับรวมคนขับด้วย">
                <input
                  id="car-seats"
                  type="number"
                  min={1}
                  max={15}
                  required
                  value={maxSeats}
                  onChange={(e) => setMaxSeats(Number(e.target.value))}
                  className={input}
                />
              </Field>
            </div>

            <Field label="จุดนัดรับเพื่อน" htmlFor="car-meet">
              <input
                id="car-meet"
                type="text"
                value={meetingPoint}
                onChange={(e) => setMeetingPoint(e.target.value)}
                placeholder="ปั๊ม ปตท. วิภาวดี, ฟิวเจอร์รังสิต"
                className={input}
              />
            </Field>

            <Field label="เวลาออกเดินทาง" htmlFor="car-time">
              <input
                id="car-time"
                type="text"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                placeholder="07:30 น."
                className={input}
              />
            </Field>

            <Field label="หมายเหตุ" htmlFor="car-notes">
              <input
                id="car-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ท้ายรถใส่กระเป๋าใบใหญ่ได้ 3–4 ใบ"
                className={input}
              />
            </Field>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsNewCarModalOpen(false)}
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
