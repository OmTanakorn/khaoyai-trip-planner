import { TripData, Accommodation, AccommodationOption } from '../types/trip';
import coverImage from '../assets/khaoyai-cover.jpg';
import roadtripImg from '../assets/itinerary/roadtrip.jpg';
import speedkartImg from '../assets/itinerary/speedkart.jpg';
import lunchImg from '../assets/itinerary/lunch.jpg';
import groceryImg from '../assets/itinerary/grocery.jpg';
import villaRelaxImg from '../assets/itinerary/villa-relax.jpg';
import partyImg from '../assets/itinerary/party.jpg';

export const HARPER_POOL_VILLA: Accommodation = {
  name: 'ฮาร์เปอร์ พูลวิลล่า เขาใหญ่ (Harper Pool Villa Khaoyai)',
  villaType: 'พูลวิลล่าส่วนตัวสไตล์ญี่ปุ่น 200 ตร.ม. · 4 ห้องนอน 4 ห้องน้ำ 7 เตียงนอน (รองรับสูงสุด 14 คน)',
  address: 'ตำบลหนองสาหร่าย อำเภอปากช่อง นครราชสีมา 30130',
  mapUrl: 'https://maps.google.com/?q=Harper+Pool+Villa+Khaoyai+Tambon+Nong+Sarai+Pak+Chong',
  airbnbUrl: 'https://th.airbnb.com/rooms/1346972548976188677?adults=10&check_in=2026-10-31&check_out=2026-11-01&guests=10',
  checkIn: '14:00 น.',
  checkOut: '11:00 น.',
  totalBedrooms: 4,
  totalBathrooms: 4,
  wifiSsid: 'Harper_PoolVilla_5G',
  wifiPassword: 'harperkhaoyai',
  japaneseSubtitle: '森と水の隠れ家 · Private Saltwater Pool & Modern Japanese Villa',
  areaSize: '200 ตร.ม.',
  maxGuests: 14,
  heroImage: 'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/de2a8385-7dff-401b-a610-1759869991a7.jpeg',
  galleryImages: [
    'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/de2a8385-7dff-401b-a610-1759869991a7.jpeg',
    'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/ca312ed0-5ba3-4b8d-936e-5ca4b889a177.jpeg',
    'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/370fef62-60e2-4e06-8dc3-73b934b2f82a.jpeg',
    'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/d359e0f9-91e0-4239-b7df-1dfe18d5bda7.jpeg',
    'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/2ba4ecfb-cb6f-4f8c-b557-42b076782b68.jpeg',
    'https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTM0Njk3MjU0ODk3NjE4ODY3Nw%3D%3D/original/27c2763a-4a01-42e1-aefa-d5214f04a20e.jpeg',
    'https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTM0Njk3MjU0ODk3NjE4ODY3Nw%3D%3D/original/edcc5e10-9cf2-480e-a6a5-3e9efcc997ab.jpeg',
    'https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTM0Njk3MjU0ODk3NjE4ODY3Nw%3D%3D/original/3af17076-48ad-4558-9d0e-60e6acb1a9c9.jpeg',
    'https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTM0Njk3MjU0ODk3NjE4ODY3Nw%3D%3D/original/7d28a811-0ca3-4252-a276-718052fcd122.jpeg',
    'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/4ed96772-7f96-4f92-9699-07b473b39727.jpeg',
    'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/a5c08c15-cb20-4b3c-bef1-e09aa4cdfc6d.jpeg',
    'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/f911bc9b-fb82-488f-b015-d6fdfc7ff1ba.jpeg',
    'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/e12b8e7f-a6d9-4d59-8b0a-5eb3d77e758b.jpeg',
    'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/8fd992d6-9b94-4868-99d3-c4a0acda5e41.jpeg',
  ],
  freePerks: [
    'น้ำแข็งฟรี 1 กระสอบใหญ่ พร้อมถังแช่',
    'ถ่านปิ้งย่างบาร์บีคิวฟรี 1 ถุง',
    'น้ำดื่มบรรจุขวดฟรี 1 แพ็ก',
    'กาแฟ & โอวัลตินสำเร็จรูปฟรี',
    'โต๊ะพูลมาตรฐาน & เครื่องเสียง JBL Bluetooth',
    'ไม่มีช่วงเวลางดใช้เสียงภายในบ้าน ร้องคาราโอเกะได้ตลอดคืน',
  ],
  houseRules: [
    'เวลาเช็คอิน 14:00 น. เป็นต้นไป และเช็คเอาท์ก่อน 11:00 น.',
    'สามารถเปิดเพลง ร้องคาราโอเกะภายในตัวบ้านพักได้ตลอด 24 ชม. (พื้นที่กลางแจ้งกรุณาลดเสียงหลัง 22:00 น.)',
    'ห้ามสูบบุหรี่ภายในห้องนอนและตัวบ้านพัก (มีพื้นที่สูบบุหรี่จัดไว้บริเวณภายนอก)',
    'ช่วยดูแลรักษาความสะอาดและล้างอุปกรณ์ครัวหลังประกอบอาหารเสร็จ',
  ],
  nearbyPlaces: [
    { name: 'Buun Khaoyai', category: 'ร้านอาหารโฮมมี่', distance: '550 ม.', driveTime: '1 นาที' },
    { name: 'MAA KHAOYAI', category: 'คาเฟ่มินิมอลสไตล์ญี่ปุ่น', distance: '600 ม.', driveTime: '1 นาที' },
    { name: 'Khaam Khaoyai', category: 'คาเฟ่มัทฉะญี่ปุ่นอันดับ 1', distance: '650 ม.', driveTime: '1 นาที' },
    { name: 'Blanco Coffee and Bread', category: 'เบเกอรี่ & กาแฟ Specialty', distance: '1.9 กม.', driveTime: '2 นาที' },
    { name: 'ภูผาหิน คาเฟ่เขาใหญ่', category: 'ร้านอาหาร & จุดชมวิวผาหิน', distance: '3.2 กม.', driveTime: '5 นาที' },
    { name: 'ไร่มณีศร ทุ่งทานตะวัน', category: 'สถานที่ท่องเที่ยว & ถ่ายรูป', distance: '17.8 กม.', driveTime: '23 นาที' },
    { name: 'อุทยานแห่งชาติเขาใหญ่', category: 'ทางขึ้นอุทยานธรรมชาติ', distance: '32.2 กม.', driveTime: '40 นาที' },
  ],
  rooms: [
    {
      id: 'r-1',
      roomName: 'ห้องนอน 1 · Japanese Zen Master Suite',
      subName: 'ห้องมาสเตอร์วิวสระว่ายน้ำ',
      bedType: 'เตียงควีนไซส์ 5 ฟุต x 2 เตียง (นอนได้ 4 คน)',
      capacity: 4,
      guestIds: [],
      hasBathroom: true,
      notes: 'ห้องใหญ่ กว้างขวาง โทนไม้อบอุ่นแบบเรียวกัง แอร์ + ม่านทึบแสง + ห้องน้ำในตัว',
      photoUrl: 'https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTM0Njk3MjU0ODk3NjE4ODY3Nw%3D%3D/original/27c2763a-4a01-42e1-aefa-d5214f04a20e.jpeg',
      highlights: ['เตียง 5 ฟุต 2 เตียง', 'ห้องน้ำในตัว', 'แอร์เย็นฉ่ำ', 'วิวสระว่ายน้ำ'],
    },
    {
      id: 'r-2',
      roomName: 'ห้องนอน 2 · Mountain Vista Room',
      subName: 'ห้องวิวทิวเขาและแมกไม้',
      bedType: 'เตียงควีนไซส์ 5 ฟุต x 2 เตียง (นอนได้ 4 คน)',
      capacity: 4,
      guestIds: [],
      hasBathroom: true,
      notes: 'วิวทิวเขาธรรมชาติ บรรยากาศเงียบสงบ แอร์ + ม่านทึบแสง + ห้องน้ำในตัว',
      photoUrl: 'https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTM0Njk3MjU0ODk3NjE4ODY3Nw%3D%3D/original/edcc5e10-9cf2-480e-a6a5-3e9efcc997ab.jpeg',
      highlights: ['เตียง 5 ฟุต 2 เตียง', 'ห้องน้ำในตัว', 'แอร์เย็นฉ่ำ', 'วิวภูเขา'],
    },
    {
      id: 'r-3',
      roomName: 'ห้องนอน 3 · Garden Breeze Room',
      subName: 'ห้องสวนหินสไตล์เซน',
      bedType: 'เตียงควีนไซส์ 5 ฟุต x 2 เตียง (นอนได้ 4 คน)',
      capacity: 4,
      guestIds: [],
      hasBathroom: true,
      notes: 'หน้าต่างรับแสงธรรมชาติ เชื่อมต่อทางเดินสระน้ำ แอร์ + ห้องน้ำในตัว',
      photoUrl: 'https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTM0Njk3MjU0ODk3NjE4ODY3Nw%3D%3D/original/3af17076-48ad-4558-9d0e-60e6acb1a9c9.jpeg',
      highlights: ['เตียง 5 ฟุต 2 เตียง', 'ห้องน้ำในตัว', 'แอร์เย็นฉ่ำ', 'วิวสวน'],
    },
    {
      id: 'r-4',
      roomName: 'ห้องนอน 4 · Cozy Minimalist Room',
      subName: 'ห้องสงบ ส่วนตัว',
      bedType: 'เตียงควีนไซส์ 5 ฟุต x 1 เตียง (นอนได้ 2 คน)',
      capacity: 2,
      guestIds: [],
      hasBathroom: true,
      notes: 'ห้องส่วนตัวสงบเงียบ แอร์ + ม่านทึบแสง + ห้องน้ำในตัว เหมาะสำหรับคนที่ต้องการความเป็นส่วนตัวสูง',
      photoUrl: 'https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTM0Njk3MjU0ODk3NjE4ODY3Nw%3D%3D/original/7d28a811-0ca3-4252-a276-718052fcd122.jpeg',
      highlights: ['เตียง 5 ฟุต 1 เตียง', 'ห้องน้ำในตัว', 'แอร์เย็นฉ่ำ', 'เงียบสงบส่วนตัว'],
    },
  ],
};

export const HARPER_VILLA_OPTION: AccommodationOption = {
  id: 'opt-harper-pool-villa',
  name: 'ฮาร์เปอร์ พูลวิลล่า เขาใหญ่ (Harper Pool Villa Khaoyai)',
  location: 'ตำบลหนองสาหร่าย อำเภอปากช่อง (ใกล้คาเฟ่ MAA & KHAAM)',
  pricePerNight: 12900,
  bedrooms: 4,
  bathrooms: 4,
  capacity: 14,
  linkUrl: 'https://th.airbnb.com/rooms/1346972548976188677?adults=10&check_in=2026-10-31&check_out=2026-11-01&guests=10',
  imageUrl: 'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/de2a8385-7dff-401b-a610-1759869991a7.jpeg',
  highlights: [
    'สไตล์ญี่ปุ่น 200 ตร.ม.',
    'สระว่ายน้ำส่วนตัวระบบน้ำเกลือ',
    'โต๊ะพูล & คาราโอเกะ ไม่จำกัดเวลา',
    'ลาน BBQ ฟรีน้ำแข็ง & ถ่าน',
    'ที่จอดรถ 7 คัน',
    'ใกล้คาเฟ่ดัง 1 นาที'
  ],
  suggestedBy: 'Airbnb Verified',
  votes: [],
};

export const initialTripData: TripData = {
  id: 'khaoyai-trip-2026',
  title: 'สองวันหนึ่งคืนที่เขาใหญ่',
  tagline: 'แก๊งเพื่อน 10–12 คน พักผ่อนที่ ฮาร์เปอร์ พูลวิลล่า เขาใหญ่ (สไตล์ญี่ปุ่น 4 ห้องนอน)',
  destination: 'เขาใหญ่, ปากช่อง, นครราชสีมา',
  startDate: '2026-10-31',
  endDate: '2026-11-01',
  statusPhase: 'planning',
  coverImage,
  members: [],
  cars: [],
  accommodationOptions: [HARPER_VILLA_OPTION],
  confirmedAccommodation: HARPER_POOL_VILLA,
  placeIdeas: [],
  menuIdeas: [],
  itinerary: [
    {
      dayNumber: 1,
      dayLabel: 'Day 1: ออกเดินทาง & เช็คอินพูลวิลล่า',
      date: '31 ต.ค. 2026',
      activities: [
        {
          id: 'act-day1-1',
          time: '07:00 – 10:00',
          title: 'Go to Khaoyai (ออกเดินทางมุ่งหน้าสู่เขาใหญ่)',
          japaneseTitle: 'カオヤイへの旅',
          location: 'จุดนัดพบแต่ละคัน / มุ่งหน้าสู่เขาใหญ่',
          category: 'travel',
          badge: 'ออกเดินทาง',
          notes: 'ออกเดินทางจากจุดนัดพบของแต่ละคัน ขับตามเส้นทางมิตรภาพ สัมผัสลมหนาวแรกปลายตุลาคม',
          imageUrl: roadtripImg,
          choices: [
            {
              id: 'choice-1-1',
              label: 'นัดพบกลางทางเพื่อกินข้าวเช้า',
              sublabel: 'จุดพักรถปั๊ม ปตท. หรือร้านเค้กบ้านสวน สระบุรี',
              votes: ['user-1', 'user-2', 'user-3']
            },
            {
              id: 'choice-1-2',
              label: 'หาอะไรกินกันเองตามสะดวก',
              sublabel: 'แล้วไปเจอกันที่ Khaoyai Speedkart 10:00 น.',
              votes: ['user-4']
            }
          ]
        },
        {
          id: 'act-day1-2',
          time: '10:00 – 12:00',
          title: 'Khaoyai Speedkart (ประลองความเร็วโกคาร์ท)',
          japaneseTitle: 'ゴーカート・サーキット',
          location: 'Khaoyai Speedkart, ถ.ธนะรัชต์ กม. 12',
          category: 'activity',
          badge: 'กิจกรรมสุดมันส์',
          notes: 'รวมพลครบทุกคัน ประลองความเร็วขับโกคาร์ท ท้าดริฟต์บนแทร็กกลางธรรมชาติ หรือลุยสนาม ATV',
          mapUrl: 'https://maps.google.com/?q=Khaoyai+Speedkart',
          imageUrl: speedkartImg
        },
        {
          id: 'act-day1-3',
          time: '12:00 – 13:00',
          title: 'Lunch (แวะเติมพลังมื้อกลางวัน)',
          japaneseTitle: '昼食タイム',
          location: 'ร้านอาหารท้องถิ่น / คาเฟ่ ปากช่อง-เขาใหญ่',
          category: 'food',
          badge: 'มื้ออร่อยเติมพลัง',
          notes: 'กินข้าวกลางวันร่วมกัน เติมพลังหลังซิ่งโกคาร์ท เลือกระหว่างอาหารอีสานรสเด็ด หรือร้านบรรยากาศโฮมมี่',
          imageUrl: lunchImg,
          choices: [
            {
              id: 'choice-3-1',
              label: 'ร้าน Local ไก่ย่างเขาสวนกวาง',
              sublabel: 'ส้มตำแซ่บๆ ไก่ย่างหนังกรอบ ลาบ คอหมูย่าง ข้าวเหนียวร้อนๆ',
              votes: ['user-1', 'user-2', 'user-4']
            },
            {
              id: 'choice-3-2',
              label: 'ร้านสไตล์โฮมมี่ / คาเฟ่สบายๆ',
              sublabel: 'บรรยากาศชิลๆ เช่น Buun Khaoyai หรือคาเฟ่ใกล้เคียง',
              votes: ['user-3']
            }
          ]
        },
        {
          id: 'act-day1-4',
          time: '13:00 – 15:00',
          title: 'Grocery Run (จ่ายตลาดซื้อเสบียงปาร์ตี้)',
          japaneseTitle: '買い出し・食材調達',
          location: 'แม็คโคร / โลตัส ปากช่อง',
          category: 'travel',
          badge: 'เตรียมเสบียง',
          notes: 'แวะซื้อวัตถุดิบสดสำหรับปาร์ตี้บาร์บีคิวเย็นนี้ ทั้งเนื้อริบอาย หมูหมัก ซีฟู้ด ผักสด ขนม และเครื่องดื่มเย็นฉ่ำ',
          mapUrl: 'https://maps.google.com/?q=Makro+Pak+Chong',
          imageUrl: groceryImg
        },
        {
          id: 'act-day1-5',
          time: '15:00 – 17:00',
          title: 'Rest & Party Prepping (เช็คอิน & พักผ่อนวิลล่า)',
          japaneseTitle: 'チェックイン・リラックス',
          location: 'Harper Pool Villa Khaoyai',
          category: 'relax',
          badge: 'เช็คอินพูลวิลล่า',
          notes: 'เช็คอินบ้านพัก Harper Pool Villa Khaoyai สไตล์มินิมอลญี่ปุ่น แยกย้ายจัดกระเป๋าเข้าห้องพัก เล่นสระน้ำเกลือ แช่น้ำคลายร้อน และช่วยกันเตรียมวัตถุดิบหมักบาร์บีคิว',
          mapUrl: 'https://maps.google.com/?q=Harper+Pool+Villa+Khaoyai+Tambon+Nong+Sarai+Pak+Chong',
          imageUrl: villaRelaxImg
        },
        {
          id: 'act-day1-6',
          time: '17:00 – Drunk',
          title: 'Party Time! (ปาร์ตี้บาร์บีคิว & สังสรรค์ยาวๆ)',
          japaneseTitle: 'プールサイド・パーティー',
          location: 'สระว่ายน้ำ & ลานบาร์บีคิว Harper Pool Villa',
          category: 'party',
          badge: 'ไฮไลท์ประจำทริป',
          notes: 'ปาร์ตี้บาร์บีคิวริมสระ ปิ้งย่างหอมกรุ่น คาราโอเกะ JBL สุดกระหึ่ม ดวลโต๊ะพูล และสังสรรค์ชนแก้วยาวๆ ยันดึก (บ้านพักไม่จำกัดเวลาใช้เสียง!)',
          imageUrl: partyImg
        }
      ]
    },
    {
      dayNumber: 2,
      dayLabel: 'Day 2: คาเฟ่ & เดินทางกลับ',
      date: '1 พ.ย. 2026',
      activities: [
        {
          id: 'act-day2-1',
          time: '09:00 – 11:00',
          title: 'Slow Morning & Check-out (อาหารเช้า & เก็บสัมภาระ)',
          japaneseTitle: '朝食とチェックアウト',
          location: 'Harper Pool Villa Khaoyai',
          category: 'relax',
          badge: 'เช้าวันใหม่',
          notes: 'จิบกาแฟยามเช้ารับลมเย็นริมสระ ทานอาหารเช้าเบาๆ เล่นน้ำอีกรอบก่อนเก็บของเช็คเอาท์เวลา 11:00 น.'
        },
        {
          id: 'act-day2-2',
          time: '11:30 – 14:00',
          title: 'Cafe Hopping (เช็คอินคาเฟ่สุดชิค)',
          japaneseTitle: 'カフェ巡り',
          location: 'MAA Khaoyai / Khaam Khaoyai',
          category: 'cafe',
          badge: 'คาเฟ่ฮอปปิ้ง',
          notes: 'แวะคาเฟ่สไตล์มินิมอลญี่ปุ่น ถ่ายรูปมุมสวย ดื่มมัทฉะพรีเมียม และชิมขนมอร่อยๆ'
        },
        {
          id: 'act-day2-3',
          time: '14:30 – 17:30',
          title: 'Safe Trip Back to BKK (เดินทางกลับกรุงเทพฯ)',
          japaneseTitle: '帰路',
          location: 'เส้นทางมิตรภาพ มุ่งหน้า กทม.',
          category: 'travel',
          badge: 'เดินทางกลับ',
          notes: 'แวะซื้อของฝากข้างทาง (กะหรี่ปั๊บมวกเหล็ก / ข้าวโพดหวานสุวรรณ) และเดินทางกลับถึงกรุงเทพฯ โดยสวัสดิภาพ'
        }
      ]
    }
  ],
  expenses: [],
  payments: [],
  packingList: [],
  announcements: [
    {
      id: 'welcome-an',
      text: 'ยินดีต้อนรับสู่ทริปเขาใหญ่ 31 ต.ค. — 1 พ.ย. 2569 ปักหมุดที่พักพูลวิลล่าส่วนตัวสไตล์ญี่ปุ่น "Harper Pool Villa Khaoyai" 4 ห้องนอน 4 ห้องน้ำ พร้อมโต๊ะพูลและสระน้ำเกลือ!',
      date: '2026-10-18',
      author: 'ผู้จัดทริป'
    }
  ]
};
