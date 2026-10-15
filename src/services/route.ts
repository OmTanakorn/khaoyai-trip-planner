import { Activity, ItineraryDay } from '../types/trip';

/* ---------------------------------------------------------------
   Khao Yai is not one place. The cafés of Thanarat Road, the park
   itself, Mu Si, Muak Lek and Wang Nam Khiao sit far enough apart
   that the order of a day decides how much of it is spent driving.

   Nothing here calls a routing service. Each zone has one point, and
   drive time is estimated from the straight line between two points,
   stretched for winding roads. Good enough to spot a day that
   zig-zags; not a promise of arrival time.
   --------------------------------------------------------------- */

export type ZoneId = 'bkk' | 'muaklek' | 'pakchong' | 'musi' | 'thanarat' | 'park' | 'wangnamkhiao';

export interface Zone {
  id: ZoneId;
  name: string;
  /** What this end of Khao Yai is known for, in a few words. */
  note: string;
  lat: number;
  lng: number;
  /** Matched against free-text locations and titles, lower-cased. */
  keywords: string[];
}

export const ZONES: Zone[] = [
  {
    id: 'bkk',
    name: 'กรุงเทพฯ',
    note: 'จุดออกเดินทาง',
    lat: 13.7563,
    lng: 100.5018,
    keywords: ['กรุงเทพ', 'bangkok', 'bkk', 'อนุสาวรีย์', 'บางนา', 'รังสิต', 'ดอนเมือง', 'สุวรรณภูมิ', 'ลาดพร้าว', 'สาทร', 'อโศก'],
  },
  {
    id: 'muaklek',
    name: 'มวกเหล็ก',
    note: 'ฟาร์มโคนม น้ำตก',
    lat: 14.656,
    lng: 101.2,
    keywords: ['มวกเหล็ก', 'muak lek', 'muaklek', 'โชคชัยฟาร์ม', 'chokchai', 'จิม ทอมป์สัน', 'jim thompson', 'ลำตะคอง', 'ซับกระดาน'],
  },
  {
    id: 'pakchong',
    name: 'ตัวเมืองปากช่อง',
    note: 'ตลาด ร้านอาหารท้องถิ่น',
    lat: 14.708,
    lng: 101.416,
    keywords: ['ปากช่อง', 'pak chong', 'pakchong', 'ตลาดนัด', 'ถนนมิตรภาพ', 'มิตรภาพ', 'ตลาดเขาใหญ่'],
  },
  {
    id: 'musi',
    name: 'หมูสี',
    note: 'ไร่องุ่น ทุ่งดอกไม้ วิวเขา',
    lat: 14.585,
    lng: 101.47,
    keywords: ['หมูสี', 'mu si', 'musi', 'pb valley', 'พีบี', 'ไร่องุ่น', 'granmonte', 'กรานมอนเต้', 'ทุ่งตะวัน', 'ผาเขาแผงม้า', 'เขาแผงม้า'],
  },
  {
    id: 'thanarat',
    name: 'ถนนธนะรัชต์',
    note: 'คาเฟ่ ที่พัก พูลวิลล่า',
    lat: 14.6,
    lng: 101.385,
    keywords: ['ธนะรัชต์', 'ธนรัชต์', 'thanarat', 'primo', 'พรีโม', 'palio', 'ปาลิโอ', 'toscana', 'ทอสคาน่า', 'scenical', 'chocolate factory', 'ช็อกโกแลต แฟคทอรี่', 'the bloom', 'kirimaya', 'คีรีมายา'],
  },
  {
    id: 'park',
    name: 'อุทยานฯ เขาใหญ่',
    note: 'ส่องสัตว์ น้ำตก จุดชมวิว',
    lat: 14.44,
    lng: 101.372,
    keywords: ['อุทยาน', 'national park', 'อช.', 'น้ำตกเหวสุวัต', 'เหวสุวัต', 'เหวนรก', 'ผากล้วยไม้', 'ผาเดียวดาย', 'เขาเขียว', 'ศูนย์บริการนักท่องเที่ยว', 'ด่านเนินหอม', 'หนองผักชี', 'ลานกางเต็นท์'],
  },
  {
    id: 'wangnamkhiao',
    name: 'วังน้ำเขียว',
    note: 'อากาศเย็น ไร่ ฟาร์มเห็ด',
    lat: 14.405,
    lng: 101.84,
    keywords: ['วังน้ำเขียว', 'wang nam khiao', 'wangnamkhiao', 'ไทรทอง', 'ผาเก็บตะวัน', 'ฟาร์มเห็ด'],
  },
];

const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z])) as Record<ZoneId, Zone>;

export const zoneById = (id: ZoneId): Zone => ZONE_BY_ID[id];

/**
 * Which end of Khao Yai a free-text place sits in, or null when the text
 * gives nothing away. The longest matching keyword wins: the more specific
 * a name, the more it should count.
 */
export const zoneOf = (...texts: (string | undefined)[]): ZoneId | null => {
  const haystack = texts.filter(Boolean).join(' ').toLowerCase();
  if (!haystack.trim()) return null;
  let best: { id: ZoneId; len: number } | null = null;
  for (const zone of ZONES) {
    for (const keyword of zone.keywords) {
      if (haystack.includes(keyword) && (!best || keyword.length > best.len)) {
        best = { id: zone.id, len: keyword.length };
      }
    }
  }
  return best?.id ?? null;
};

const haversineKm = (a: Zone, b: Zone): number => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/**
 * Rough driving minutes between two zones. Roads wind (×1.4); short hops
 * are hill roads, middle ones mostly highway 2, the run up from Bangkok
 * motorway.
 * Same zone: places are within a short hop of each other.
 */
export const driveMinutes = (from: ZoneId, to: ZoneId): number => {
  if (from === to) return 10;
  const km = haversineKm(zoneById(from), zoneById(to)) * 1.4;
  const kmh = km > 80 ? 80 : km > 25 ? 55 : 40;
  return Math.max(10, Math.round(((km / kmh) * 60) / 5) * 5);
};

export const formatMinutes = (minutes: number): string => {
  if (minutes < 60) return `${minutes} นาที`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} ชม.` : `${h} ชม. ${m} นาที`;
};

/** Times are free text ("08:00 – 09:30"); read the first HH:MM. */
export const startMinutes = (time: string): number => {
  const match = time.match(/(\d{1,2})[:.](\d{2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2]);
};

export const sortByClock = (activities: Activity[]): Activity[] =>
  [...activities].sort((a, b) => startMinutes(a.time) - startMinutes(b.time));

export interface Stop {
  activity: Activity;
  zone: ZoneId | null;
  /** Estimated drive from the previous stop that has a zone. */
  legMinutes: number | null;
}

export interface DayRoute {
  day: ItineraryDay;
  stops: Stop[];
  /** Zones in visiting order, repeats collapsed. */
  zonePath: ZoneId[];
  driveMinutes: number;
  /** A zone left and then come back to later the same day. */
  backtracks: ZoneId[];
  /** Stops whose place could not be placed in any zone. */
  unplaced: number;
}

export const routeOfDay = (day: ItineraryDay): DayRoute => {
  let previous: ZoneId | null = null;
  let total = 0;
  const zonePath: ZoneId[] = [];

  const stops = sortByClock(day.activities).map((activity) => {
    const zone = zoneOf(activity.location, activity.title);
    let legMinutes: number | null = null;
    if (zone) {
      if (previous) {
        legMinutes = driveMinutes(previous, zone);
        total += legMinutes;
      }
      if (zonePath[zonePath.length - 1] !== zone) zonePath.push(zone);
      previous = zone;
    }
    return { activity, zone, legMinutes };
  });

  const seen = new Set<ZoneId>();
  const backtracks: ZoneId[] = [];
  for (const zone of zonePath) {
    if (seen.has(zone) && !backtracks.includes(zone)) backtracks.push(zone);
    seen.add(zone);
  }

  return {
    day,
    stops,
    zonePath,
    driveMinutes: total,
    backtracks,
    unplaced: stops.filter((s) => !s.zone).length,
  };
};

/**
 * A Google Maps driving route through the day's places, in order. Uses the
 * typed place names, which Maps searches for itself. Maps takes at most nine
 * stops between the two ends, so a longer day is cut to fit.
 */
export const googleMapsRouteUrl = (activities: Activity[]): string | null => {
  const places = sortByClock(activities)
    .map((a) => (a.location || a.title).trim())
    .filter(Boolean)
    .filter((place, i, all) => place !== all[i - 1]);
  if (places.length === 0) return null;

  const params = new URLSearchParams({ api: '1', travelmode: 'driving' });
  params.set('destination', places[places.length - 1]);
  if (places.length > 1) params.set('origin', places[0]);
  const between = places.slice(1, -1).slice(0, 9);
  if (between.length) params.set('waypoints', between.join('|'));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};
