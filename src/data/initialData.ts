import { TripData } from '../types/trip';
import coverImage from '../assets/khaoyai-cover.jpg';

export const initialTripData: TripData = {
  id: 'khaoyai-trip-2026',
  title: 'สองวันหนึ่งคืนที่เขาใหญ่',
  tagline: 'แก๊งเพื่อน 10–12 คน กำลังโหวตที่พักและรวบรวมรถเดินทาง',
  destination: 'เขาใหญ่, ปากช่อง, นครราชสีมา',
  startDate: '2026-10-31',
  endDate: '2026-11-01',
  statusPhase: 'planning',
  coverImage,
  members: [],
  cars: [],
  accommodationOptions: [],
  placeIdeas: [],
  itinerary: [
    {
      dayNumber: 1,
      dayLabel: 'Day 1: ออกเดินทาง & เช็คอินพูลวิลล่า',
      date: '31 ต.ค. 2026',
      activities: []
    },
    {
      dayNumber: 2,
      dayLabel: 'Day 2: คาเฟ่ & เดินทางกลับ',
      date: '1 พ.ย. 2026',
      activities: []
    }
  ],
  expenses: [],
  payments: [],
  packingList: [],
  announcements: [
    {
      id: 'welcome-an',
      text: 'เปิดวางแผนทริปเขาใหญ่ 31 ต.ค. — 1 พ.ย. 2569 แล้ว ตอนนี้กำลังนับหัวว่าไปกี่คน ใครขับรถไปได้บ้าง และช่วยกันหาพูลวิลล่ากันอยู่',
      date: '2026-09-10',
      author: 'ผู้จัดทริป'
    }
  ]
};
