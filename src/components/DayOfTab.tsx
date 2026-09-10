import React from 'react';
import { Phone, ExternalLink } from 'lucide-react';
import { TripData, Member } from '../types/trip';
import { PageHead, Panel, Empty } from './ui';

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

/**
 * Everything needed while standing in a petrol station car park at 07:20:
 * which car, who is driving, their number, where to meet, which room, and
 * what happens next. Read-only on purpose — nobody edits a plan one-handed
 * with a bag in the other.
 */
export const DayOfTab: React.FC<DayOfTabProps> = ({ trip, me, setActiveTab }) => {
  const myCar = me ? trip.cars.find((c) => c.passengerIds.includes(me.id)) : undefined;
  const myRoom = me
    ? trip.confirmedAccommodation?.rooms.find((r) => r.guestIds.includes(me.id))
    : undefined;

  const driverOf = (driverName: string) =>
    trip.members.find(
      (m) => driverName.includes(m.nickname) || driverName.includes(m.name)
    );

  const stay = trip.confirmedAccommodation;

  return (
    <div className="pb-16">
      <PageHead
        title="วันเดินทาง"
        note="ทุกอย่างที่ต้องใช้หน้างาน รวมไว้หน้าเดียว เปิดได้แม้เน็ตไม่มี"
      />

      {!me ? (
        <Panel>
          <Empty
            title="เลือกชื่อคุณก่อน"
            note="กดชื่อที่มุมขวาบนแล้วเลือกว่าคุณคือใคร หน้านี้จะบอกรถและห้องของคุณ"
          />
        </Panel>
      ) : (
        <Panel className="mb-px">
          <h2 className="font-display text-lead text-ink border-b border-mist-deep pb-5">
            ของคุณ {me.nickname}
          </h2>

          <dl className="mt-5 space-y-5">
            <div>
              <dt className="text-fine text-stone">รถ</dt>
              <dd className="mt-1 text-body text-ink">
                {myCar ? (
                  <>
                    {myCar.carModel}
                    {myCar.licensePlate && ` · ${myCar.licensePlate}`}
                    <span className="block mt-1 text-fine text-stone">
                      ออก {myCar.departureTime} · เจอกันที่ {myCar.meetingPoint}
                    </span>
                  </>
                ) : (
                  <button
                    onClick={() => setActiveTab('cars')}
                    className="text-stone hover:text-ink transition-colors"
                  >
                    ยังไม่ได้เลือกรถ — ไปเลือกเลย
                  </button>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-fine text-stone">ห้องนอน</dt>
              <dd className="mt-1 text-body text-ink">
                {myRoom ? (
                  <>
                    {myRoom.roomName}
                    <span className="block mt-1 text-fine text-stone">
                      นอนกับ{' '}
                      {myRoom.guestIds
                        .filter((id) => id !== me.id)
                        .map((id) => trip.members.find((m) => m.id === id)?.nickname)
                        .filter(Boolean)
                        .join(' · ') || 'คนเดียว'}
                    </span>
                  </>
                ) : (
                  <button
                    onClick={() => setActiveTab('stay')}
                    className="text-stone hover:text-ink transition-colors"
                  >
                    ยังไม่มีห้อง — ไปจับคู่ห้อง
                  </button>
                )}
              </dd>
            </div>
          </dl>
        </Panel>
      )}

      {/* Drivers — the numbers you actually dial when someone is late */}
      <Panel className="mb-px">
        <h2 className="font-display text-lead text-ink border-b border-mist-deep pb-5">
          รถและคนขับ
        </h2>

        {trip.cars.length === 0 ? (
          <p className="mt-6 text-body text-stone">ยังไม่มีใครอาสาขับรถ</p>
        ) : (
          <ul className="divide-y divide-mist-deep">
            {trip.cars.map((car) => {
              const driver = driverOf(car.driverName);
              return (
                <li key={car.id} className="py-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-body text-ink">{car.driverName}</p>
                    <p className="mt-1 text-fine text-stone">
                      ออก {car.departureTime} · {car.meetingPoint}
                    </p>
                    <p className="mt-1 text-fine text-stone">
                      {car.passengerIds
                        .map((id) => trip.members.find((m) => m.id === id)?.nickname)
                        .filter(Boolean)
                        .join(' · ') || 'ยังไม่มีผู้โดยสาร'}
                    </p>
                  </div>
                  {driver?.phone && (
                    <a
                      href={`tel:${driver.phone}`}
                      className="inline-flex items-center gap-2 shrink-0 text-fine text-ink border-b border-brass pb-0.5 hover:text-brass transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      โทร
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {stay && (
        <Panel className="mb-px">
          <h2 className="font-display text-lead text-ink border-b border-mist-deep pb-5">
            ที่พัก
          </h2>
          <p className="mt-5 text-body text-ink">{stay.name}</p>
          <p className="mt-1 text-fine text-stone">{stay.address}</p>
          <p className="mt-1 text-fine text-stone">
            เข้าพัก {stay.checkIn} · คืนห้อง {stay.checkOut}
          </p>
          {stay.wifiSsid && (
            <p className="mt-1 text-fine text-stone">
              ไวไฟ {stay.wifiSsid}
              {stay.wifiPassword && ` · รหัส ${stay.wifiPassword}`}
            </p>
          )}
          {stay.mapUrl && (
            <a
              href={stay.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-fine text-ink border-b border-brass pb-0.5 hover:text-brass transition-colors"
            >
              นำทางไปที่พัก
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </Panel>
      )}

      {/* The plan, both days at once — no tab switching mid-journey */}
      {trip.itinerary.map((day) => {
        const activities = [...day.activities].sort(
          (a, b) => startMinutes(a.time) - startMinutes(b.time)
        );
        return (
          <Panel key={day.dayNumber} className="mb-px">
            <h2 className="font-display text-lead text-ink border-b border-mist-deep pb-5">
              {day.dayLabel}
              <span className="ml-3 text-fine font-sans text-stone">{day.date}</span>
            </h2>

            {activities.length === 0 ? (
              <p className="mt-6 text-body text-stone">ยังไม่มีอะไรในวันนี้</p>
            ) : (
              <ol className="mt-2 divide-y divide-mist-deep">
                {activities.map((act) => (
                  <li key={act.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-fine text-stone">{act.time}</p>
                      <p className="mt-0.5 text-body text-ink">{act.title}</p>
                      {act.location && (
                        <p className="mt-0.5 text-fine text-stone">{act.location}</p>
                      )}
                      {act.notes && <p className="mt-1 text-fine text-stone">{act.notes}</p>}
                    </div>
                    {act.mapUrl && (
                      <a
                        href={act.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-stone hover:text-ink transition-colors shrink-0"
                        aria-label={`นำทางไป ${act.title}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        );
      })}
    </div>
  );
};
