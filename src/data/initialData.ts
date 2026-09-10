import { TripData } from '../types/trip';

export const initialTripData: TripData = {
  id: 'khaoyai-trip-2026',
  title: 'ทริปเขาใหญ่ (31 ต.ค. - 1 พ.ย.) 🌿⛺',
  tagline: 'ทริป 2 วัน 1 คืน แก๊งเพื่อน 10-12 คน • กำลังเปิดโหวตที่พักและรวบรวมรถเดินทาง',
  destination: 'เขาใหญ่, ปากช่อง, นครราชสีมา',
  startDate: '2026-10-31',
  endDate: '2026-11-01',
  statusPhase: 'planning',
  coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
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
  packingList: [],
  announcements: [
    {
      id: 'welcome-an',
      text: '🎉 เริ่มเปิดวางแผนทริปเขาใหญ่ (31 ต.ค. - 1 พ.ย. 2569)! ตอนนี้กำลังสำรวจจำนวนคน ใครเอารถไปได้บ้าง และช่วยกันเสนอตัวเลือกที่พักพูลวิลล่าได้เลยครับ',
      date: '2026-09-10',
      author: 'ผู้จัดทริป'
    }
  ]
};
