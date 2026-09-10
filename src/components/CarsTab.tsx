import React, { useState } from 'react';
import { 
  Car as CarIcon, 
  Plus, 
  MapPin, 
  Clock, 
  UserCheck, 
  UserPlus, 
  Users, 
  Trash2, 
  Edit3, 
  ShieldAlert,
  HelpCircle,
  X,
  Sparkles
} from 'lucide-react';
import { TripData, Car, Member } from '../types/trip';

interface CarsTabProps {
  trip: TripData;
  onUpdateTrip: (trip: TripData) => void;
}

export const CarsTab: React.FC<CarsTabProps> = ({ trip, onUpdateTrip }) => {
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [isNewCarModalOpen, setIsNewCarModalOpen] = useState(false);
  const [assignPassengerModalCarId, setAssignPassengerModalCarId] = useState<string | null>(null);

  // Form states for new/edit car
  const [driverName, setDriverName] = useState('');
  const [carModel, setCarModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [maxSeats, setMaxSeats] = useState(5);
  const [meetingPoint, setMeetingPoint] = useState('');
  const [departureTime, setDepartureTime] = useState('07:30 น.');
  const [notes, setNotes] = useState('');

  // Find all assigned passenger IDs across all cars
  const allAssignedPassengerIds = new Set(trip.cars.flatMap((c) => c.passengerIds));

  // Confirmed members who are not yet in any car
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
      const updatedCars = trip.cars.map((c) =>
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
      );
      onUpdateTrip({ ...trip, cars: updatedCars });
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
      onUpdateTrip({ ...trip, cars: [...trip.cars, newCar] });
    }
    setIsNewCarModalOpen(false);
  };

  const handleDeleteCar = (carId: string) => {
    if (window.confirm('คุณต้องการลบรถคันนี้ใช่หรือไม่?')) {
      const updatedCars = trip.cars.filter((c) => c.id !== carId);
      onUpdateTrip({ ...trip, cars: updatedCars });
    }
  };

  const handleRemovePassenger = (carId: string, memberId: string) => {
    const updatedCars = trip.cars.map((c) => {
      if (c.id === carId) {
        return {
          ...c,
          passengerIds: c.passengerIds.filter((id) => id !== memberId),
        };
      }
      return c;
    });
    onUpdateTrip({ ...trip, cars: updatedCars });
  };

  const handleAddPassengerToCar = (carId: string, memberId: string) => {
    const updatedCars = trip.cars.map((c) => {
      let currentPassengers = c.passengerIds.filter((id) => id !== memberId);
      if (c.id === carId) {
        if (!currentPassengers.includes(memberId) && currentPassengers.length < c.maxSeats) {
          currentPassengers = [...currentPassengers, memberId];
        }
      }
      return { ...c, passengerIds: currentPassengers };
    });
    onUpdateTrip({ ...trip, cars: updatedCars });
    setAssignPassengerModalCarId(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
              สำรวจรถ & อาสาสมัครคนขับ (Car Survey)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {trip.cars.length > 0 ? `${trip.cars.length} คัน` : 'ยังไม่ได้รถ'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed max-w-2xl">
            ทริปเป้าหมาย 10-12 คน ต้องการรถประมาณ 2-3 คัน • ใครสามารถนำรถไปได้ ช่วยลงชื่ออาสา รุ่นรถ และจุดนัดรับเพื่อนๆ ด้านล่างได้เลยครับ
          </p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ อาสาเอารถไป / เพิ่มรถ</span>
        </button>
      </div>

      {/* Seat Capacity Tracker Banner */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            seatDeficit <= 0 && trip.cars.length > 0
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-amber-100 text-amber-800'
          }`}>
            <CarIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
              {trip.cars.length === 0 
                ? 'ยังไม่มีเพื่อนเสนอรถเดินทาง' 
                : seatDeficit <= 0 
                  ? 'ที่นั่งเพียงพอสำหรับเพื่อนทุกคนแล้ว! 🎉' 
                  : `ที่นั่งยังไม่พอ ต้องการเพิ่มอีกอย่างน้อย ~${seatDeficit} ที่นั่ง`}
            </h4>
            <p className="text-xs text-slate-500">
              เพื่อนในทริป ~{confirmedCount} คน • ตอนนี้มีรถเสนอแล้ว {totalOfferedSeats} ที่นั่ง
            </p>
          </div>
        </div>

        {trip.cars.length === 0 && (
          <button
            onClick={handleOpenNewModal}
            className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            ลงชื่อเอารถไปคันแรก
          </button>
        )}
      </div>

      {/* Unassigned Warning Banner (if any) */}
      {unassignedMembers.length > 0 && trip.cars.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-amber-900">
              เพื่อนที่ยังไม่ได้เลือกรถ ({unassignedMembers.length} คน)
            </h4>
            <p className="text-xs text-amber-700">
              {unassignedMembers.map((m) => m.nickname).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Cars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trip.cars.map((car, index) => {
          const isFull = car.passengerIds.length >= car.maxSeats;
          const availableCount = car.maxSeats - car.passengerIds.length;
          const occupancyPercent = Math.min(100, Math.round((car.passengerIds.length / car.maxSeats) * 100));

          return (
            <div
              key={car.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Car Card Header */}
                <div className="p-5 pb-3 border-b border-slate-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                        คันที่ {index + 1}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">{car.driverName}</h3>
                        <p className="text-xs text-slate-500">{car.carModel}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(car)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="แก้ไขข้อมูลรถ"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCar(car.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="ลบรถคันนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {car.licensePlate && (
                    <div className="mt-3">
                      <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-700">
                        {car.licensePlate}
                      </span>
                    </div>
                  )}
                </div>

                {/* Logistics Info: Meeting Point & Departure */}
                <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-500">จุดนัดรับ: </span>
                      <span>{car.meetingPoint || 'รอกำหนดจุดนัดพบ'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-500">เวลาออกเดินทาง: </span>
                      <span>{car.departureTime || '07:30 น.'}</span>
                    </div>
                  </div>
                  {car.notes && (
                    <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/60">
                      💡 {car.notes}
                    </p>
                  )}
                </div>

                {/* Passenger Slots */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      ผู้โดยสาร ({car.passengerIds.length}/{car.maxSeats})
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isFull
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isFull ? 'รถเต็มแล้ว' : `ว่าง ${availableCount} ที่`}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isFull ? 'bg-rose-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${occupancyPercent}%` }}
                    />
                  </div>

                  {/* Passenger List Chips */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {car.passengerIds.map((pId) => {
                      const member = trip.members.find((m) => m.id === pId);
                      return (
                        <div
                          key={pId}
                          className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-xl text-xs font-medium bg-white border border-slate-200 shadow-xs text-slate-700"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: member?.avatarColor || '#3b82f6' }}
                          />
                          <span>{member?.nickname || 'เพื่อน'}</span>
                          <button
                            onClick={() => handleRemovePassenger(car.id, pId)}
                            className="text-slate-400 hover:text-rose-500 rounded p-0.5"
                            title="นำออกจากคันนี้"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    {car.passengerIds.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-1">ยังไม่มีเพื่อนเลือกนั่งคันนี้</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Card Action */}
              <div className="p-4 pt-0">
                <button
                  disabled={isFull || trip.members.filter(m => m.status === 'confirmed').length === 0}
                  onClick={() => setAssignPassengerModalCarId(car.id)}
                  className="w-full py-2.5 px-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isFull ? 'คันนี้เต็มแล้ว' : '+ เลือกเพื่อนขึ้นคันนี้'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {trip.cars.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <CarIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">ยังไม่มีรถในการเดินทาง</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            ใครสะดวกขับรถไปเขาใหญ่บ้าง? ช่วยกันกดปุ่ม <strong>"+ อาสาเอารถไป / เพิ่มรถ"</strong> ด้านบนเพื่อกรอกรุ่นรถและจำนวนที่นั่งได้เลยครับ
          </p>
          <button
            onClick={handleOpenNewModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>อาสาเอารถไปคันแรก</span>
          </button>
        </div>
      )}

      {/* Modal: Assign Passenger to Car */}
      {assignPassengerModalCarId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">เลือกเพื่อนขึ้นรถคันนี้</h3>
              <button
                onClick={() => setAssignPassengerModalCarId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {trip.members
                .filter((m) => m.status === 'confirmed')
                .map((member) => {
                  const currentCar = trip.cars.find((c) => c.passengerIds.includes(member.id));
                  const isCurrent = currentCar?.id === assignPassengerModalCarId;

                  return (
                    <button
                      key={member.id}
                      onClick={() => handleAddPassengerToCar(assignPassengerModalCarId, member.id)}
                      disabled={isCurrent}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border transition-all text-xs ${
                        isCurrent
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: member.avatarColor }}
                        />
                        <span className="font-bold">{member.nickname}</span>
                      </div>

                      <span className="text-[11px] text-slate-400">
                        {isCurrent ? 'อยู่ในคันนี้แล้ว' : currentCar ? `ย้ายจาก ${currentCar.driverName}` : 'ยังไม่มีรถ'}
                      </span>
                    </button>
                  );
                })}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setAssignPassengerModalCarId(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Car */}
      {isNewCarModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {editingCar ? 'แก้ไขข้อมูลรถ' : 'อาสาเอารถไป / เพิ่มรถเดินทาง'}
              </h3>
              <button
                onClick={() => setIsNewCarModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCar} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">คนขับ / ชื่อคัน *</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="เช่น โอม, แบงค์"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รุ่นรถ & สี *</label>
                  <input
                    type="text"
                    required
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    placeholder="เช่น Honda CR-V (สีเทา)"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ทะเบียนรถ (ถ้าทราบ)</label>
                  <input
                    type="text"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    placeholder="เช่น 7กข 3821 กทม."
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">จำนวนที่นั่งรวม (รวมคนขับ) *</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    required
                    value={maxSeats}
                    onChange={(e) => setMaxSeats(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">จุดนัดรับเพื่อนที่สะดวก</label>
                <input
                  type="text"
                  value={meetingPoint}
                  onChange={(e) => setMeetingPoint(e.target.value)}
                  placeholder="เช่น ปั๊ม ปตท. วิภาวดี, ทางด่วนรามอินทรา, ฟิวเจอร์ฯ"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">เวลาออกเดินทางโดยประมาณ</label>
                <input
                  type="text"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  placeholder="เช่น 07:30 น."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมายเหตุเพิ่มเติม</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น บรรทุกกระเป๋าใบใหญ่ได้ 3-4 ใบ"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCarModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs transition-colors"
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
