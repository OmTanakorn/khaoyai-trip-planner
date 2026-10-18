import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ExternalLink,
  X,
  MapPin,
  Wifi,
  Clock,
  Users,
  Bed,
  Bath,
  Car,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Utensils,
  Music,
  Flame,
  Coffee,
  Camera,
  ShieldCheck,
  Edit3,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import { TripData, AccommodationOption, Room, Member, TripListEditor } from '../types/trip';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Modal, Field, Tag, Meter } from './ui';
import { input, btnSolid, btnQuiet, btnBrass, btnLink, baht, voterLabel } from './ui-kit';
import { HARPER_POOL_VILLA } from '../data/initialData';

interface AccommodationTabProps extends TripListEditor {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
  me: Member | null;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80';

const VILLA_GALLERY = [
  {
    url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/de2a8385-7dff-401b-a610-1759869991a7.jpeg',
    title: 'พูลวิลล่าสไตล์ญี่ปุ่น & สระน้ำเกลือ',
    caption: 'สระว่ายน้ำระบบน้ำเกลือส่วนตัวกลางแจ้ง โอบล้อมด้วยธรรมชาติเขาใหญ่และทิวเขา',
    category: 'pool',
  },
  {
    url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/ca312ed0-5ba3-4b8d-936e-5ca4b889a177.jpeg',
    title: 'เดย์เบด & ลานสระว่ายน้ำ',
    caption: 'มุมพักผ่อนริมสระน้ำเกลือ พร้อมสระเด็ก ห่วงยางแฟนซี และเตียงอาบแดด',
    category: 'pool',
  },
  {
    url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/370fef62-60e2-4e06-8dc3-73b934b2f82a.jpeg',
    title: 'ห้องนั่งเล่นส่วนกลาง & โต๊ะพูล',
    caption: 'ห้องนั่งเล่นกว้างขวาง โต๊ะพูลมาตรฐาน โซฟาชุดใหญ่ และแอร์เย็นฉ่ำ',
    category: 'living',
  },
  {
    url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/d359e0f9-91e0-4239-b7df-1dfe18d5bda7.jpeg',
    title: 'โต๊ะพูล & สมาร์ททีวี คาราโอเกะ',
    caption: 'Smart TV พร้อมลำโพง JBL Bluetooth และระบบคาราโอเกะ ร้องเพลงได้ตลอด 24 ชม. ไม่จำกัดเวลา',
    category: 'living',
  },
  {
    url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/2ba4ecfb-cb6f-4f8c-b557-42b076782b68.jpeg',
    title: 'โต๊ะรับประทานอาหาร & วิวสวน',
    caption: 'โต๊ะทานอาหารขนาดใหญ่ มองเห็นวิวธรรมชาติและพระอาทิตย์ตกดิน',
    category: 'living',
  },
  {
    url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTM0Njk3MjU0ODk3NjE4ODY3Nw%3D%3D/original/27c2763a-4a01-42e1-aefa-d5214f04a20e.jpeg',
    title: 'ห้องนอน 1: Japanese Zen Suite',
    caption: 'เตียงควีนไซส์ 5 ฟุต x 2 เตียง (นอนได้ 4 คน) โทนไม้อบอุ่น แอร์ ม่านทึบแสง ห้องน้ำในตัว',
    category: 'bedroom',
  },
  {
    url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTM0Njk3MjU0ODk3NjE4ODY3Nw%3D%3D/original/edcc5e10-9cf2-480e-a6a5-3e9efcc997ab.jpeg',
    title: 'ห้องนอน 2: Mountain Vista Room',
    caption: 'เตียงควีนไซส์ 5 ฟุต x 2 เตียง (นอนได้ 4 คน) บรรยากาศเงียบสงบ วิวเขา แอร์ ห้องน้ำในตัว',
    category: 'bedroom',
  },
  {
    url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTM0Njk3MjU0ODk3NjE4ODY3Nw%3D%3D/original/3af17076-48ad-4558-9d0e-60e6acb1a9c9.jpeg',
    title: 'ห้องนอน 3: Garden Breeze Room',
    caption: 'เตียงควีนไซส์ 5 ฟุต x 2 เตียง (นอนได้ 4 คน) รับแสงธรรมชาติ วิวสวนญี่ปุ่น แอร์ ห้องน้ำในตัว',
    category: 'bedroom',
  },
  {
    url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTM0Njk3MjU0ODk3NjE4ODY3Nw%3D%3D/original/7d28a811-0ca3-4252-a276-718052fcd122.jpeg',
    title: 'ห้องนอน 4: Cozy Minimalist Room',
    caption: 'เตียงควีนไซส์ 5 ฟุต x 1 เตียง (นอนได้ 2 คน) เงียบสงบ ส่วนตัว แอร์ ห้องน้ำในตัว',
    category: 'bedroom',
  },
  {
    url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/4ed96772-7f96-4f92-9699-07b473b39727.jpeg',
    title: 'ครัวสไตล์ญี่ปุ่นอุปกรณ์ครบชุด',
    caption: 'ตู้เย็น ไมโครเวฟ เตาไฟฟ้า หม้อหุงข้าว กาต้มน้ำ เครื่องปิ้งขนมปัง จานชามช้อนส้อม และฟรีชา/กาแฟ',
    category: 'kitchen',
  },
  {
    url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/a5c08c15-cb20-4b3c-bef1-e09aa4cdfc6d.jpeg',
    title: 'ลานสนามหญ้า & สวนญี่ปุ่น',
    caption: 'สนามหญ้าสีเขียวชอุ่มหน้าบ้าน พร้อมไฟส่องสว่างยามค่ำคืน สำหรับปิคนิคและปิ้งย่างบาร์บีคิว',
    category: 'exterior',
  },
  {
    url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/f911bc9b-fb82-488f-b015-d6fdfc7ff1ba.jpeg',
    title: 'สระว่ายน้ำส่วนตัวมุมกว้าง',
    caption: 'ระบบน้ำเกลือถนอมผิว มองเห็นวิวธรรมชาติโปร่งสบาย',
    category: 'pool',
  },
  {
    url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/e12b8e7f-a6d9-4d59-8b0a-5eb3d77e758b.jpeg',
    title: 'ห้องน้ำในตัวส่วนตัวทุกห้อง',
    caption: 'ห้องน้ำโมเดิร์นสะอาดสะอ้าน พร้อมเครื่องทำน้ำอุ่น ผ้าเช็ดตัว สบู่ และแชมพู',
    category: 'bedroom',
  },
  {
    url: 'https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/8fd992d6-9b94-4868-99d3-c4a0acda5e41.jpeg',
    title: 'บรรยากาศแสงสียามค่ำคืน',
    caption: 'ไฟใต้น้ำในสระว่ายน้ำ และไฟประดับสนามหญ้า โรแมนติกและเหมาะกับปาร์ตี้ของแก๊งเพื่อน',
    category: 'pool',
  },
];

export const AccommodationTab: React.FC<AccommodationTabProps> = ({
  trip,
  onUpdateTrip,
  onSaveItem,
  onRemoveItem,
  me,
}) => {
  const [isNewOptionModalOpen, setIsNewOptionModalOpen] = useState(false);
  const [bookingOption, setBookingOption] = useState<AccommodationOption | null>(null);
  const [isEditStayModalOpen, setIsEditStayModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [galleryCategory, setGalleryCategory] = useState<string>('all');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [assigningRoomId, setAssigningRoomId] = useState<string | null>(null);

  // Edit stay form state
  const stay = trip.confirmedAccommodation;
  const [editCheckIn, setEditCheckIn] = useState(stay?.checkIn || '14:00 น.');
  const [editCheckOut, setEditCheckOut] = useState(stay?.checkOut || '11:00 น.');
  const [editWifiSsid, setEditWifiSsid] = useState(stay?.wifiSsid || 'Harper_PoolVilla_5G');
  const [editWifiPassword, setEditWifiPassword] = useState(stay?.wifiPassword || 'harperkhaoyai');
  const [editAddress, setEditAddress] = useState(stay?.address || 'ตำบลหนองสาหร่าย อำเภอปากช่อง นครราชสีมา');

  // Voting option form state
  const [optionName, setOptionName] = useState('');
  const [optionLocation, setOptionLocation] = useState('');
  const [optionPrice, setOptionPrice] = useState<number | ''>('');
  const [optionBedrooms, setOptionBedrooms] = useState(4);
  const [optionBathrooms, setOptionBathrooms] = useState(4);
  const [optionCapacity, setOptionCapacity] = useState(14);
  const [optionLinkUrl, setOptionLinkUrl] = useState('');
  const [optionImageUrl, setOptionImageUrl] = useState('');
  const [optionHighlights, setOptionHighlights] = useState('');
  const [optionSuggestedBy, setOptionSuggestedBy] = useState(me?.nickname || '');

  const confirmedCount = trip.members.filter((m) => m.status === 'confirmed').length || 10;
  const mostVotes = Math.max(0, ...trip.accommodationOptions.map((o) => o.votes.length));

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleVote = (optionId: string) => {
    if (!me) return;
    const voter = me.id;
    const option = trip.accommodationOptions.find((o) => o.id === optionId);
    if (!option) return;
    const isAdding = !option.votes.includes(voter);
    const votes = option.votes.filter((v) => v !== voter);
    onSaveItem('accommodationOptions', {
      ...option,
      votes: isAdding ? [...votes, voter] : votes,
    });
  };

  const handleCreateOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionName.trim() || !optionPrice) return;

    const highlightsArray = optionHighlights
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);

    const newOption: AccommodationOption = {
      id: `opt-${Date.now()}`,
      name: optionName.trim(),
      location: optionLocation.trim() || 'เขาใหญ่ ปากช่อง',
      pricePerNight: Number(optionPrice),
      bedrooms: Number(optionBedrooms),
      bathrooms: Number(optionBathrooms),
      capacity: Number(optionCapacity),
      linkUrl: optionLinkUrl.trim(),
      imageUrl: optionImageUrl.trim() || FALLBACK_IMAGE,
      highlights:
        highlightsArray.length > 0
          ? highlightsArray
          : ['สระว่ายน้ำส่วนตัว', 'เตาปิ้งย่าง', 'โต๊ะพูล'],
      suggestedBy: optionSuggestedBy.trim() || 'เพื่อนร่วมทริป',
      votes: [],
    };

    onSaveItem('accommodationOptions', newOption);
    setOptionName('');
    setOptionLocation('');
    setOptionPrice('');
    setOptionLinkUrl('');
    setOptionImageUrl('');
    setOptionHighlights('');
    setIsNewOptionModalOpen(false);
  };

  const handleDeleteOption = (optionId: string) => {
    const opt = trip.accommodationOptions.find((o) => o.id === optionId);
    if (!window.confirm(`ลบ ${opt?.name ?? 'ตัวเลือกนี้'} ออกจากการโหวต?`)) return;
    onRemoveItem('accommodationOptions', optionId);
  };

  const handleQuickConfirmHarper = () => {
    onUpdateTrip((t) => ({
      ...t,
      confirmedAccommodation: HARPER_POOL_VILLA,
    }));
  };

  const handleFinalizeAccommodation = (e: React.FormEvent) => {
    e.preventDefault();
    const option = bookingOption;
    if (!option) return;

    // Check if it's Harper Pool Villa
    if (option.id === 'opt-harper-pool-villa' || option.name.includes('ฮาร์เปอร์')) {
      onUpdateTrip((t) => ({
        ...t,
        confirmedAccommodation: {
          ...HARPER_POOL_VILLA,
          checkIn: editCheckIn.trim() || '14:00 น.',
          checkOut: editCheckOut.trim() || '11:00 น.',
          wifiSsid: editWifiSsid.trim() || 'Harper_PoolVilla_5G',
          wifiPassword: editWifiPassword.trim() || 'harperkhaoyai',
        },
      }));
      setBookingOption(null);
      return;
    }

    const rooms: Room[] = Array.from({ length: option.bedrooms }, (_, i) => ({
      id: `r-${i + 1}`,
      roomName: `ห้องนอนที่ ${i + 1}`,
      bedType:
        i === 0
          ? 'เตียงคิงไซส์ 6 ฟุต นอนได้ 2–3 คน'
          : 'เตียง 5 ฟุต หรือเตียงคู่ นอนได้ 2–3 คน',
      capacity: Math.ceil(option.capacity / option.bedrooms),
      guestIds: [],
      hasBathroom: i < option.bathrooms,
    }));

    onUpdateTrip((t) => ({
      ...t,
      confirmedAccommodation: {
        name: option.name,
        villaType: `พูลวิลล่าส่วนตัว ${option.bedrooms} ห้องนอน ${option.bathrooms} ห้องน้ำ รองรับได้ ${option.capacity} คน`,
        address: option.location,
        mapUrl: option.linkUrl || 'https://maps.google.com/?q=Khao+Yai',
        checkIn: editCheckIn.trim() || '14:00 น.',
        checkOut: editCheckOut.trim() || '11:00 น.',
        totalBedrooms: option.bedrooms,
        totalBathrooms: option.bathrooms,
        wifiSsid: editWifiSsid.trim() || undefined,
        wifiPassword: editWifiPassword.trim() || undefined,
        rooms,
      },
    }));
    setBookingOption(null);
  };

  const handleSaveStayEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stay) return;
    onUpdateTrip((t) => {
      if (!t.confirmedAccommodation) return t;
      return {
        ...t,
        confirmedAccommodation: {
          ...t.confirmedAccommodation,
          checkIn: editCheckIn.trim(),
          checkOut: editCheckOut.trim(),
          wifiSsid: editWifiSsid.trim() || undefined,
          wifiPassword: editWifiPassword.trim() || undefined,
          address: editAddress.trim() || t.confirmedAccommodation.address,
        },
      };
    });
    setIsEditStayModalOpen(false);
  };

  const handleAssignGuest = (roomId: string, memberId: string) => {
    onUpdateTrip((t) => {
      if (!t.confirmedAccommodation) return t;
      return {
        ...t,
        confirmedAccommodation: {
          ...t.confirmedAccommodation,
          rooms: t.confirmedAccommodation.rooms.map((room) => {
            const without = room.guestIds.filter((id) => id !== memberId);
            if (room.id !== roomId) return { ...room, guestIds: without };
            const isFull = without.length >= room.capacity;
            return { ...room, guestIds: isFull ? without : [...without, memberId] };
          }),
        },
      };
    });
    setAssigningRoomId(null);
  };

  const handleRemoveGuest = (roomId: string, memberId: string) => {
    onUpdateTrip((t) => {
      if (!t.confirmedAccommodation) return t;
      return {
        ...t,
        confirmedAccommodation: {
          ...t.confirmedAccommodation,
          rooms: t.confirmedAccommodation.rooms.map((room) =>
            room.id === roomId
              ? { ...room, guestIds: room.guestIds.filter((id) => id !== memberId) }
              : room
          ),
        },
      };
    });
  };

  const handleResetToPoll = () => {
    if (!window.confirm('กลับไปเปิดโหวตที่พักใหม่? การจัดห้องนอนที่ทำไว้จะหายไป')) return;
    onUpdateTrip((t) => ({ ...t, confirmedAccommodation: undefined }));
  };

  const filteredGallery =
    galleryCategory === 'all'
      ? VILLA_GALLERY
      : VILLA_GALLERY.filter((p) => p.category === galleryCategory);

  /* ─────────────────────────────────────────────────────────────
     VIEW 1: Confirmed Accommodation (Harper Pool Villa Aesthetic)
     ───────────────────────────────────────────────────────────── */
  if (stay) {
    const totalCapacity = stay.rooms.reduce((s, r) => s + r.capacity, 0);
    const roomed = new Set(stay.rooms.flatMap((r) => r.guestIds));
    const unroomedMembers = trip.members.filter(
      (m) => m.status !== 'declined' && !roomed.has(m.id)
    );

    const isHarperVilla =
      stay.name.includes('ฮาร์เปอร์') || stay.name.includes('Harper');

    const airbnbUrl = stay.airbnbUrl || (isHarperVilla ? HARPER_POOL_VILLA.airbnbUrl : undefined);
    const displayAddress =
      stay.address && stay.address !== 'เขาใหญ่ ปากช่อง'
        ? stay.address
        : HARPER_POOL_VILLA.address;
    const displayVillaType = isHarperVilla ? HARPER_POOL_VILLA.villaType : stay.villaType;
    const displayName = isHarperVilla ? HARPER_POOL_VILLA.name : stay.name;
    const mapUrl =
      stay.mapUrl && !stay.mapUrl.includes('?q=Khao+Yai')
        ? stay.mapUrl
        : HARPER_POOL_VILLA.mapUrl;

    return (
      <div className="pb-20">
        {/* Copy Feedback Toast */}
        {copyFeedback && (
          <div className="fixed bottom-6 right-6 z-50 bg-ink text-paper px-4 py-2.5 rounded-ctl shadow-lg text-fine flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-brass-lit" />
            <span>{copyFeedback}</span>
          </div>
        )}

        {/* ── Editorial Header ──────────────────────────── */}
        <header className="pt-2 pb-6 border-b border-mist-deep/70">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-moss animate-pulse" />
              <span className="text-fine font-medium tracking-wide uppercase text-moss">
                {isHarperVilla
                  ? '森と水の隠れ家 · Private Pool Villa 200 sq.m.'
                  : 'ยืนยันที่พักแล้ว · Confirmed Booking'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditCheckIn(stay.checkIn);
                  setEditCheckOut(stay.checkOut);
                  setEditWifiSsid(stay.wifiSsid || 'Harper_PoolVilla_5G');
                  setEditWifiPassword(stay.wifiPassword || 'harperkhaoyai');
                  setEditAddress(displayAddress);
                  setIsEditStayModalOpen(true);
                }}
                className="px-3 py-1.5 text-fine text-stone hover:text-ink bg-paper hover:bg-surface rounded-ctl border border-mist-deep/60 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                แก้ไขข้อมูล
              </button>
              <button
                onClick={handleResetToPoll}
                className="px-3 py-1.5 text-fine text-stone hover:text-ink bg-transparent hover:bg-surface rounded-ctl transition-colors cursor-pointer"
              >
                เปิดโหวตใหม่
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div>
              <h1 className="font-display text-title sm:text-display text-ink tracking-tight leading-tight">
                {displayName}
              </h1>
              <p className="mt-2 text-fine sm:text-body text-stone max-w-2xl leading-relaxed">
                {displayVillaType}
              </p>
            </div>

            {/* Quick Action Pills */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {airbnbUrl && (
                <a
                  href={airbnbUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-[#FF385C] hover:bg-[#E00B41] text-white text-fine font-medium rounded-ctl transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  เปิดดูบน Airbnb
                </a>
              )}
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-ink text-paper hover:bg-ink-soft text-fine font-medium rounded-ctl transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5 text-brass-lit" />
                  เปิด Google Maps
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              )}
              {stay.wifiPassword && (
                <button
                  onClick={() =>
                    copyToClipboard(stay.wifiPassword || '', 'คัดลอกรหัส Wi-Fi สำเร็จ')
                  }
                  className="px-3 py-2 bg-surface hover:bg-mist-deep/70 text-ink text-fine rounded-ctl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  title="คลิกเพื่อคัดลอกรหัส Wi-Fi"
                >
                  <Wifi className="w-3.5 h-3.5 text-moss" />
                  รหัส Wi-Fi: <strong className="font-mono">{stay.wifiPassword}</strong>
                  <Copy className="w-3 h-3 text-stone" />
                </button>
              )}
            </div>
          </div>

          {/* Quick info metadata pills */}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-fine text-stone pt-3 border-t border-mist-deep/40">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brass" />
              {stay.address}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-moss" />
              เช็คอิน <strong>{stay.checkIn}</strong> · เช็คเอาท์{' '}
              <strong>{stay.checkOut}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-ink" />
              รองรับได้ {totalCapacity} คน (สมาชิกยืนยันแล้ว {confirmedCount} คน)
            </span>
          </div>
        </header>

        {/* ── Art Gallery 5-Photo Mosaic ────────────────── */}
        <section className="mt-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-2.5 rounded-panel overflow-hidden bg-mist-deep/20 p-2 border border-mist-deep/50 shadow-sm">
            {/* Main Featured Photo (2 cols, 2 rows) */}
            <div
              onClick={() => setLightboxIndex(0)}
              className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-ctl cursor-pointer min-h-[280px] md:min-h-[420px]"
            >
              <img
                src={VILLA_GALLERY[0].url}
                alt={VILLA_GALLERY[0].title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              <div className="absolute bottom-4 left-4 right-4 text-paper">
                <span className="text-[11px] uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-brass/90 text-paper font-semibold">
                  สระน้ำเกลือ & สวนสไตล์ญี่ปุ่น
                </span>
                <h3 className="font-display text-lead sm:text-title mt-1.5 drop-shadow-sm text-paper">
                  {VILLA_GALLERY[0].title}
                </h3>
                <p className="text-fine opacity-90 line-clamp-1 mt-0.5">
                  {VILLA_GALLERY[0].caption}
                </p>
              </div>
            </div>

            {/* 4 Supporting Photos */}
            {[1, 2, 5, 9].map((photoIdx) => {
              const photo = VILLA_GALLERY[photoIdx];
              return (
                <div
                  key={photoIdx}
                  onClick={() => setLightboxIndex(photoIdx)}
                  className="relative group overflow-hidden rounded-ctl cursor-pointer h-[160px] md:h-[205px]"
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-ink/20 group-hover:bg-ink/40 transition-colors" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-paper">
                    <p className="text-fine font-medium line-clamp-1 drop-shadow-sm">
                      {photo.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2.5 flex items-center justify-between text-fine text-stone px-1">
            <span className="italic">
              * Harper Pool Villa Khaoyai — พูลวิลล่าสไตล์ญี่ปุ่น 200 ตร.ม. พร้อมโต๊ะพูลและคาราโอเกะ
            </span>
            <button
              onClick={() => {
                setGalleryCategory('all');
                setLightboxIndex(0);
              }}
              className="px-3.5 py-1.5 bg-paper hover:bg-surface text-ink font-medium rounded-ctl border border-mist-deep/70 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5 text-brass" />
              ดูรูปถ่ายทั้งหมด ({VILLA_GALLERY.length} รูป)
            </button>
          </div>
        </section>

        {/* ── Key Architectural Specifications ───────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <div className="bg-paper p-4 rounded-ctl border border-mist-deep/60">
            <div className="flex items-center gap-2 text-stone text-fine">
              <Sparkles className="w-4 h-4 text-brass" />
              <span>พื้นที่ใช้สอย</span>
            </div>
            <p className="mt-2 font-display text-lead text-ink">200 ตร.ม.</p>
            <p className="text-[11px] text-stone">วิลล่าส่วนตัวเดี่ยว</p>
          </div>

          <div className="bg-paper p-4 rounded-ctl border border-mist-deep/60">
            <div className="flex items-center gap-2 text-stone text-fine">
              <Bed className="w-4 h-4 text-brass" />
              <span>ห้องนอน</span>
            </div>
            <p className="mt-2 font-display text-lead text-ink">{stay.totalBedrooms} ห้อง</p>
            <p className="text-[11px] text-stone">7 เตียงควีนไซส์ 5 ฟุต</p>
          </div>

          <div className="bg-paper p-4 rounded-ctl border border-mist-deep/60">
            <div className="flex items-center gap-2 text-stone text-fine">
              <Bath className="w-4 h-4 text-brass" />
              <span>ห้องน้ำ</span>
            </div>
            <p className="mt-2 font-display text-lead text-ink">{stay.totalBathrooms} ห้อง</p>
            <p className="text-[11px] text-stone">ห้องน้ำในตัวครบทุกห้อง</p>
          </div>

          <div className="bg-paper p-4 rounded-ctl border border-mist-deep/60">
            <div className="flex items-center gap-2 text-stone text-fine">
              <Users className="w-4 h-4 text-brass" />
              <span>ความจุผู้เข้าพัก</span>
            </div>
            <p className="mt-2 font-display text-lead text-ink">10–14 คน</p>
            <p className="text-[11px] text-stone">พักสบายไม่อึดอัด</p>
          </div>

          <div className="bg-paper p-4 rounded-ctl border border-mist-deep/60">
            <div className="flex items-center gap-2 text-stone text-fine">
              <Car className="w-4 h-4 text-brass" />
              <span>ที่จอดรถ</span>
            </div>
            <p className="mt-2 font-display text-lead text-ink">7 คัน</p>
            <p className="text-[11px] text-stone">ที่จอดรถยนต์ส่วนตัว</p>
          </div>

          <div className="bg-paper p-4 rounded-ctl border border-mist-deep/60">
            <div className="flex items-center gap-2 text-stone text-fine">
              <Music className="w-4 h-4 text-brass" />
              <span>การใช้เสียง</span>
            </div>
            <p className="mt-2 font-display text-lead text-ink">ตลอด 24 ชม.</p>
            <p className="text-[11px] text-stone">ในบ้านไม่จำกัดเวลา</p>
          </div>
        </section>

        {/* ── Interactive Room Allocation Plan ────────────── */}
        <section className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
            <div>
              <span className="text-fine text-brass font-medium uppercase tracking-wider">
                間取り · Room Layout & Allocation
              </span>
              <h2 className="font-display text-title text-ink mt-0.5">
                การจัดห้องนอนทั้ง 4 ห้อง
              </h2>
            </div>
            <p className="text-fine text-stone">
              จับคู่เลือกห้องนอนกันได้เลย แตะเลือกห้องที่ต้องการนอน
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stay.rooms.map((room, idx) => {
              const defaultHarperRoom = HARPER_POOL_VILLA.rooms[idx] || HARPER_POOL_VILLA.rooms[0];
              const roomOccupancy = room.guestIds.length;
              const roomCapacity = room.capacity || defaultHarperRoom.capacity;
              const isFull = roomOccupancy >= roomCapacity;
              const isMyRoom = me ? room.guestIds.includes(me.id) : false;

              const roomPhoto = room.photoUrl || (isHarperVilla ? defaultHarperRoom.photoUrl : undefined);
              const roomDisplayName =
                isHarperVilla && (room.roomName.startsWith('ห้องนอนที่') || !room.roomName.includes('·'))
                  ? defaultHarperRoom.roomName
                  : room.roomName;
              const roomBedType =
                isHarperVilla && (room.bedType.includes('เตียงคิงไซส์') || !room.bedType.includes('ควีนไซส์'))
                  ? defaultHarperRoom.bedType
                  : room.bedType;

              return (
                <div
                  key={room.id}
                  className={`bg-paper rounded-panel border transition-all ${
                    isMyRoom
                      ? 'border-brass ring-2 ring-brass/20 shadow-md'
                      : 'border-mist-deep/70 hover:border-mist-deep shadow-xs'
                  } p-5 sm:p-6 flex flex-col justify-between`}
                >
                  <div>
                    {/* Room Header with Photo */}
                    <div className="flex items-start gap-4">
                      {roomPhoto ? (
                        <div
                          onClick={() => {
                            const photoIndex = VILLA_GALLERY.findIndex((p) => p.url === roomPhoto);
                            if (photoIndex !== -1) setLightboxIndex(photoIndex);
                          }}
                          className="relative group cursor-pointer shrink-0"
                          title="คลิกเพื่อดูรูปขยาย"
                        >
                          <img
                            src={roomPhoto}
                            alt={roomDisplayName}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-ctl object-cover bg-mist border border-mist-deep/40 group-hover:opacity-90 transition-opacity"
                          />
                          <span className="absolute bottom-1 right-1 p-1 bg-ink/60 rounded text-paper opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 className="w-3 h-3" />
                          </span>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-ctl bg-surface flex items-center justify-center shrink-0 text-stone">
                          <Bed className="w-6 h-6 text-brass" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] px-2 py-0.5 rounded bg-surface text-stone font-medium">
                            ห้องที่ {idx + 1}
                          </span>
                          <span className="text-fine text-stone">
                            {roomOccupancy} / {roomCapacity} คน
                          </span>
                        </div>

                        <h3 className="font-display text-lead text-ink mt-1 truncate">
                          {roomDisplayName}
                        </h3>

                        <p className="mt-1 text-fine text-stone leading-snug">
                          {roomBedType}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {room.hasBathroom && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-moss/10 text-moss">
                              ห้องน้ำในตัว
                            </span>
                          )}
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface text-stone">
                            แอร์
                          </span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface text-stone">
                            ม่านบังแสง
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="mt-4">
                      <Meter value={roomOccupancy} max={roomCapacity} />
                    </div>

                    {/* Guests inside this room */}
                    <div className="mt-4 pt-3 border-t border-mist-deep/50">
                      <p className="text-[11px] text-stone uppercase tracking-wide mb-2 font-medium">
                        ผู้พักในห้องนี้ ({roomOccupancy} คน):
                      </p>

                      {roomOccupancy === 0 ? (
                        <p className="text-fine text-stone/80 italic py-1">
                          ยังไม่มีใครเลือกนอนห้องนี้
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {room.guestIds.map((guestId) => {
                            const guest = trip.members.find((m) => m.id === guestId);
                            const isCurrentMe = me && guestId === me.id;

                            return (
                              <span
                                key={guestId}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-fine ${
                                  isCurrentMe
                                    ? 'bg-brass text-paper font-medium'
                                    : 'bg-surface text-ink'
                                }`}
                              >
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor: isCurrentMe
                                      ? '#ffffff'
                                      : guest?.avatarColor || '#2f4a3c',
                                  }}
                                  aria-hidden="true"
                                />
                                <span>{guest?.nickname ?? 'เพื่อน'}</span>
                                {isCurrentMe && <span className="text-[10px]">(คุณ)</span>}
                                <button
                                  onClick={() => handleRemoveGuest(room.id, guestId)}
                                  className="opacity-70 hover:opacity-100 hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                                  title={`นำ ${guest?.nickname ?? 'คนนี้'} ออก`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Room Action Row */}
                  <div className="mt-5 pt-3 border-t border-mist-deep/50 flex items-center justify-between gap-3">
                    {me ? (
                      isMyRoom ? (
                        <div className="flex items-center gap-2 bg-moss/10 px-3 py-1.5 rounded-ctl">
                          <Check className="w-4 h-4 text-moss" />
                          <span className="text-fine font-medium text-moss">
                            คุณเลือกนอนห้องนี้
                          </span>
                          <button
                            onClick={() => handleRemoveGuest(room.id, me.id)}
                            className="text-fine text-stone hover:text-ink underline ml-1 cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : isFull ? (
                        <span className="text-fine text-stone italic">ห้องนี้เต็มแล้ว</span>
                      ) : (
                        <button
                          onClick={() => handleAssignGuest(room.id, me.id)}
                          className="px-3.5 py-1.5 bg-brass-lit hover:bg-brass text-ink hover:text-paper text-fine font-medium rounded-ctl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Bed className="w-3.5 h-3.5" />
                          เลือกนอนห้องนี้
                        </button>
                      )
                    ) : (
                      <span className="text-fine text-stone">
                        เลือกชื่อคุณที่มุมขวาบนเพื่อเลือกห้อง
                      </span>
                    )}

                    {!isFull && (
                      <button
                        onClick={() => setAssigningRoomId(room.id)}
                        disabled={trip.members.length === 0}
                        className={`${btnLink} text-stone hover:text-ink ml-auto`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        ใส่เพื่อน
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unassigned members notice */}
          {unroomedMembers.length > 0 && (
            <div className="mt-5 p-4 rounded-ctl bg-surface/70 border border-mist-deep/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brass shrink-0" />
                <p className="text-fine text-ink">
                  <strong>ยังไม่มีห้องนอน ({unroomedMembers.length} คน):</strong>{' '}
                  <span className="text-stone">
                    {unroomedMembers.map((m) => m.nickname).join(', ')}
                  </span>
                </p>
              </div>
              <p className="text-[11px] text-stone shrink-0">
                แตะปุ่ม <em>"ใส่เพื่อน"</em> ในแต่ละห้องเพื่อจัดที่นอน
              </p>
            </div>
          )}
        </section>

        {/* ── Signature Villa Experiences ───────────────── */}
        <section className="mb-10">
          <div className="mb-4">
            <span className="text-fine text-brass font-medium uppercase tracking-wider">
              特別な体験 · Signature Experiences
            </span>
            <h2 className="font-display text-title text-ink mt-0.5">
              สิ่งอำนวยความสะดวก & กิจกรรมในวิลล่า
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-paper p-5 rounded-panel border border-mist-deep/60">
              <div className="w-10 h-10 rounded-ctl bg-surface flex items-center justify-center text-moss mb-3">
                <Sparkles className="w-5 h-5 text-moss" />
              </div>
              <h3 className="font-display text-lead text-ink">
                สระว่ายน้ำระบบน้ำเกลือ & สระเด็ก
              </h3>
              <p className="mt-2 text-fine text-stone leading-relaxed">
                สระกลางแจ้งระบบน้ำเกลือถนอมผิว พร้อมโซนสระเด็ก ไฟใต้น้ำเปลี่ยนสียามค่ำคืน
                เตียงอาบแดด และห่วงยางแฟนซีพร้อมใช้งาน
              </p>
            </div>

            <div className="bg-paper p-5 rounded-panel border border-mist-deep/60">
              <div className="w-10 h-10 rounded-ctl bg-surface flex items-center justify-center text-brass mb-3">
                <Music className="w-5 h-5 text-brass" />
              </div>
              <h3 className="font-display text-lead text-ink">
                โต๊ะพูล & คาราโอเกะไม่จำกัดเวลา
              </h3>
              <p className="mt-2 text-fine text-stone leading-relaxed">
                โต๊ะพูลมาตรฐาน Smart TV และเครื่องเสียง JBL Bluetooth คุณภาพสูง
                <strong> ไม่มีช่วงเวลางดใช้เสียงภายในบ้านพัก</strong> ร้องเพลงปาร์ตี้ได้เต็มที่
              </p>
            </div>

            <div className="bg-paper p-5 rounded-panel border border-mist-deep/60">
              <div className="w-10 h-10 rounded-ctl bg-surface flex items-center justify-center text-ink mb-3">
                <Flame className="w-5 h-5 text-brass" />
              </div>
              <h3 className="font-display text-lead text-ink">
                ลาน BBQ & ของแถมพิเศษฟรี
              </h3>
              <p className="mt-2 text-fine text-stone leading-relaxed">
                ลานสนามหญ้าหน้าบ้านพร้อมเตาบาร์บีคิวถ่าน <strong>แถมฟรี! น้ำแข็ง 1 กระสอบใหญ่,
                ถ่านปิ้งย่าง 1 ถุง และน้ำดื่ม 1 แพ็ก</strong>
              </p>
            </div>

            <div className="bg-paper p-5 rounded-panel border border-mist-deep/60">
              <div className="w-10 h-10 rounded-ctl bg-surface flex items-center justify-center text-moss mb-3">
                <Utensils className="w-5 h-5 text-moss" />
              </div>
              <h3 className="font-display text-lead text-ink">
                ห้องครัวสไตล์ญี่ปุ่นครบวงจร
              </h3>
              <p className="mt-2 text-fine text-stone leading-relaxed">
                ทำอาหารกินเองได้ 24 ชม. ตู้เย็น ไมโครเวฟ เตาไฟฟ้า หม้อหุงข้าว กาต้มน้ำ
                เครื่องปิ้งขนมปัง จานชามช้อนส้อม และฟรีชา/กาแฟ/โอวัลติน
              </p>
            </div>

            <div className="bg-paper p-5 rounded-panel border border-mist-deep/60">
              <div className="w-10 h-10 rounded-ctl bg-surface flex items-center justify-center text-brass mb-3">
                <Car className="w-5 h-5 text-brass" />
              </div>
              <h3 className="font-display text-lead text-ink">
                ที่จอดรถยนต์ส่วนตัว 7 คัน
              </h3>
              <p className="mt-2 text-fine text-stone leading-relaxed">
                ลานจอดรถส่วนตัวกลางแจ้งในรั้วบ้าน กว้างขวาง สะดวกสบายสำหรับแก๊ง Carpool
                เดินทางมาหลายคัน ปลอดภัยและเข้าออกสะดวก
              </p>
            </div>

            <div className="bg-paper p-5 rounded-panel border border-mist-deep/60">
              <div className="w-10 h-10 rounded-ctl bg-surface flex items-center justify-center text-ink mb-3">
                <ShieldCheck className="w-5 h-5 text-ink" />
              </div>
              <h3 className="font-display text-lead text-ink">
                ความเป็นส่วนตัว 100% วิวธรรมชาติ
              </h3>
              <p className="mt-2 text-fine text-stone leading-relaxed">
                วิลล่าเดี่ยว 200 ตร.ม. บนทำเลสงบเงียบ รายล้อมด้วยธรรมชาติเขาใหญ่
                โฮสต์ Yuttapoom ได้รับการยืนยันตัวตนบน Airbnb
              </p>
            </div>
          </div>
        </section>

        {/* ── Neighborhood Highlights & Top Cafes ────────── */}
        <section className="mb-10">
          <div className="mb-4">
            <span className="text-fine text-brass font-medium uppercase tracking-wider">
              周辺のカフェ · Neighborhood & Top Cafes
            </span>
            <h2 className="font-display text-title text-ink mt-0.5">
              พิกัดคาเฟ่ & จุดเช็คอินยอดนิยมใกล้ที่พัก
            </h2>
            <p className="text-fine text-stone mt-1">
              ทำเลสุดยอด ติดกับคาเฟ่สไตล์ญี่ปุ่นและร้านอาหารดังระดับท็อปของเขาใหญ่
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                name: 'MAA KHAOYAI',
                category: 'คาเฟ่เจแปนนิสมินิมอล',
                dist: '1 นาที (600 ม.)',
                note: 'สถาปัตยกรรมไม้สีเข้ม โทนญี่ปุ่นโมเดิร์น มุมถ่ายรูปเพียบ',
              },
              {
                name: 'Khaam Khaoyai',
                category: 'คาเฟ่มัทฉะญี่ปุ่นอันดับ 1',
                dist: '1 นาที (650 ม.)',
                note: 'สวนไผ่และมัทฉะเกรดพิธีการแท้ นั่งจิบชาผ่อนคลาย',
              },
              {
                name: 'Buun Khaoyai',
                category: 'ร้านอาหารโฮมมี่',
                dist: '1 นาที (550 ม.)',
                note: 'อาหารและเครื่องดื่มรสเลิศ ติดกับที่พักเพียงข้ามซอย',
              },
              {
                name: 'Blanco Coffee & Bread',
                category: 'เบเกอรี่ & Specialty Coffee',
                dist: '2 นาที (1.9 กม.)',
                note: 'ขนมปังอบสดใหม่ทุกเช้า กาแฟคั่วหอมกรุ่น',
              },
            ].map((spot) => (
              <div
                key={spot.name}
                className="bg-paper p-4 rounded-ctl border border-mist-deep/60 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-fine text-brass font-medium">
                    <span className="flex items-center gap-1">
                      <Coffee className="w-3.5 h-3.5" />
                      {spot.category}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface text-stone">
                      {spot.dist}
                    </span>
                  </div>
                  <h3 className="font-display text-lead text-ink mt-2">{spot.name}</h3>
                  <p className="mt-1 text-fine text-stone leading-snug">{spot.note}</p>
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    spot.name + ' เขาใหญ่'
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 text-fine text-ink hover:text-brass transition-colors inline-flex items-center gap-1 border-t border-mist-deep/40 pt-2"
                >
                  เปิดแผนที่ <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ── Stay Rules & Wi-Fi Details ─────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-paper p-6 rounded-panel border border-mist-deep/60">
            <h3 className="font-display text-lead text-ink flex items-center gap-2">
              <Wifi className="w-4 h-4 text-brass" />
              การเชื่อมต่อ Wi-Fi & ข้อมูลที่พัก
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-ctl bg-surface/70">
                <div>
                  <span className="text-[11px] text-stone uppercase block">ชื่อเครือข่าย Wi-Fi</span>
                  <span className="font-mono text-body text-ink font-semibold">
                    {stay.wifiSsid || 'Harper_PoolVilla_5G'}
                  </span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(stay.wifiSsid || 'Harper_PoolVilla_5G', 'คัดลอกชื่อ Wi-Fi แล้ว')
                  }
                  className="text-stone hover:text-ink p-1 cursor-pointer"
                  title="คัดลอกชื่อ Wi-Fi"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-ctl bg-surface/70">
                <div>
                  <span className="text-[11px] text-stone uppercase block">รหัสผ่าน Wi-Fi</span>
                  <span className="font-mono text-body text-ink font-semibold">
                    {stay.wifiPassword || 'harperkhaoyai'}
                  </span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      stay.wifiPassword || 'harperkhaoyai',
                      'คัดลอกรหัสผ่าน Wi-Fi แล้ว'
                    )
                  }
                  className="text-stone hover:text-ink p-1 cursor-pointer"
                  title="คัดลอกรหัสผ่าน"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-ctl bg-surface/70">
                <div>
                  <span className="text-[11px] text-stone uppercase block">พิกัดนำทาง</span>
                  <span className="text-fine text-ink truncate block max-w-[240px]">
                    {stay.address}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(stay.address, 'คัดลอกที่อยู่แล้ว')}
                  className="text-stone hover:text-ink p-1 cursor-pointer"
                  title="คัดลอกที่อยู่"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-paper p-6 rounded-panel border border-mist-deep/60">
            <h3 className="font-display text-lead text-ink flex items-center gap-2">
              <Clock className="w-4 h-4 text-moss" />
              กฎของที่พัก & เวลาเข้าพัก
            </h3>
            <ul className="mt-4 space-y-2.5 text-fine text-stone">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-moss mt-1.5 shrink-0" />
                <span>
                  <strong>เวลาเช็คอิน:</strong> 14:00 น. เป็นต้นไป · <strong>เวลาเช็คเอาท์:</strong>{' '}
                  ก่อน 11:00 น.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brass mt-1.5 shrink-0" />
                <span>
                  <strong>การใช้เสียง:</strong> สามารถเปิดเพลง ร้องคาราโอเกะภายในตัวบ้านได้ตลอด 24 ชม.{' '}
                  <em>(พื้นที่กลางแจ้งกรุณาลดเสียงหลัง 22:00 น.)</em>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone mt-1.5 shrink-0" />
                <span>
                  <strong>การสูบบุหรี่:</strong> ห้ามสูบบุหรี่ภายในห้องนอนและตัวบ้านพัก
                  (มีจุดสูบบุหรี่กลางแจ้ง)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone mt-1.5 shrink-0" />
                <span>
                  <strong>ของแถมฟรี:</strong> น้ำแข็ง 1 กระสอบ, ถ่านปิ้งย่าง 1 ถุง, น้ำดื่ม 1 แพ็ก,
                  กาแฟ & โอวัลติน
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* ── Lightbox Gallery Modal ────────────────────── */}
        {lightboxIndex !== null && (
          <div
            className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top Bar */}
            <div
              className="flex items-center justify-between text-paper z-10 pb-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h3 className="font-display text-lead text-paper">
                  Harper Pool Villa Khaoyai
                </h3>
                <p className="text-[12px] opacity-75">
                  รูปที่ {lightboxIndex + 1} จาก {VILLA_GALLERY.length}
                </p>
              </div>

              {/* Category Filter Tabs */}
              <div className="hidden sm:flex items-center gap-1.5 bg-paper/10 p-1 rounded-ctl">
                {[
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'pool', label: 'สระว่ายน้ำ' },
                  { id: 'living', label: 'ห้องนั่งเล่น & พูล' },
                  { id: 'bedroom', label: '4 ห้องนอน' },
                  { id: 'kitchen', label: 'ครัว & สวน' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setGalleryCategory(tab.id);
                      const firstMatch =
                        tab.id === 'all'
                          ? 0
                          : VILLA_GALLERY.findIndex((p) => p.category === tab.id);
                      if (firstMatch !== -1) setLightboxIndex(firstMatch);
                    }}
                    className={`px-2.5 py-1 text-[12px] rounded font-medium transition-colors ${
                      galleryCategory === tab.id
                        ? 'bg-brass text-paper'
                        : 'text-paper/80 hover:text-paper hover:bg-paper/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setLightboxIndex(null)}
                className="w-9 h-9 rounded-full bg-paper/10 hover:bg-paper/20 text-paper flex items-center justify-center transition-colors cursor-pointer"
                aria-label="ปิดรูปภาพ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Image with Navigation Arrows */}
            <div
              className="relative flex-1 flex items-center justify-center min-h-0 py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() =>
                  setLightboxIndex(
                    (lightboxIndex - 1 + VILLA_GALLERY.length) % VILLA_GALLERY.length
                  )
                }
                className="absolute left-2 sm:left-4 z-20 w-11 h-11 rounded-full bg-ink/60 hover:bg-ink text-paper flex items-center justify-center transition-colors cursor-pointer border border-paper/20"
                aria-label="รูปก่อนหน้า"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="max-w-4xl max-h-[72vh] flex flex-col items-center">
                <img
                  src={VILLA_GALLERY[lightboxIndex].url}
                  alt={VILLA_GALLERY[lightboxIndex].title}
                  className="max-h-[55vh] sm:max-h-[58vh] max-w-full object-contain rounded-ctl shadow-2xl"
                />
                <div className="mt-2 text-center text-paper max-w-xl bg-ink/80 px-4 py-2 rounded-ctl border border-paper/15 backdrop-blur-sm shadow-md">
                  <h4 className="font-display text-body font-semibold text-brass-lit">
                    {VILLA_GALLERY[lightboxIndex].title}
                  </h4>
                  <p className="text-fine opacity-90 mt-0.5">
                    {VILLA_GALLERY[lightboxIndex].caption}
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setLightboxIndex((lightboxIndex + 1) % VILLA_GALLERY.length)
                }
                className="absolute right-2 sm:right-4 z-20 w-11 h-11 rounded-full bg-ink/60 hover:bg-ink text-paper flex items-center justify-center transition-colors cursor-pointer border border-paper/20"
                aria-label="รูปถัดไป"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Thumbnail Navigation Strip */}
            <div
              className="flex items-center gap-2 overflow-x-auto py-2 px-1 max-w-4xl mx-auto scrollbar-thin"
              onClick={(e) => e.stopPropagation()}
            >
              {VILLA_GALLERY.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className={`w-14 h-11 shrink-0 rounded overflow-hidden border-2 transition-all cursor-pointer ${
                    lightboxIndex === i
                      ? 'border-brass scale-105'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Assign Guest Modal ────────────────────────── */}
        {assigningRoomId && (
          <Modal
            title="ใครนอนห้องนี้"
            note="กดชื่อเพื่อนเพื่อจัดห้อง คนที่อยู่ห้องอื่นจะถูกย้ายให้อัตโนมัติ"
            onClose={() => setAssigningRoomId(null)}
          >
            <ul className="divide-y divide-mist-deep max-h-72 overflow-y-auto">
              {[...trip.members.filter((m) => m.status !== 'declined')]
                .sort((a, b) => {
                  if (me && a.id === me.id) return -1;
                  if (me && b.id === me.id) return 1;
                  return 0;
                })
                .map((member) => {
                  const currentRoom = stay.rooms.find((r) => r.guestIds.includes(member.id));
                  const isHere = currentRoom?.id === assigningRoomId;
                  const isMe = me && member.id === me.id;

                  return (
                    <li key={member.id}>
                      <button
                        onClick={() => handleAssignGuest(assigningRoomId, member.id)}
                        disabled={isHere}
                        className={`w-full flex items-center justify-between gap-4 py-3 text-left disabled:opacity-50 group cursor-pointer ${
                          isMe ? 'bg-brass/5 px-2 -mx-2 rounded' : ''
                        }`}
                      >
                        <span className="inline-flex items-center gap-2.5 text-body text-ink group-hover:text-brass transition-colors">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: member.avatarColor }}
                            aria-hidden="true"
                          />
                          <span className="font-medium">{member.nickname}</span>
                          {isMe && (
                            <span className="text-[11px] px-1.5 py-0.2 rounded bg-brass text-paper font-medium">
                              คุณ
                            </span>
                          )}
                        </span>
                        <span className="text-fine text-stone">
                          {isHere
                            ? 'อยู่ห้องนี้แล้ว'
                            : currentRoom
                            ? `ย้ายจาก${currentRoom.roomName}`
                            : 'ยังไม่มีห้อง'}
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </Modal>
        )}

        {/* ── Edit Stay Modal ───────────────────────────── */}
        {isEditStayModalOpen && (
          <Modal
            title="แก้ไขข้อมูลที่พัก"
            note="อัปเดตข้อมูลการเช็คอิน ไวไฟ และที่อยู่ของวิลล่า"
            onClose={() => setIsEditStayModalOpen(false)}
          >
            <form onSubmit={handleSaveStayEdits} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="เวลาเช็คอิน" htmlFor="edit-stay-in">
                  <input
                    id="edit-stay-in"
                    type="text"
                    required
                    value={editCheckIn}
                    onChange={(e) => setEditCheckIn(e.target.value)}
                    placeholder="14:00 น."
                    className={input}
                  />
                </Field>
                <Field label="เวลาเช็คเอาท์" htmlFor="edit-stay-out">
                  <input
                    id="edit-stay-out"
                    type="text"
                    required
                    value={editCheckOut}
                    onChange={(e) => setEditCheckOut(e.target.value)}
                    placeholder="11:00 น."
                    className={input}
                  />
                </Field>
              </div>

              <Field label="ชื่อไวไฟ (Wi-Fi SSID)" htmlFor="edit-wifi-ssid">
                <input
                  id="edit-wifi-ssid"
                  type="text"
                  value={editWifiSsid}
                  onChange={(e) => setEditWifiSsid(e.target.value)}
                  placeholder="Harper_PoolVilla_5G"
                  className={input}
                />
              </Field>

              <Field label="รหัสไวไฟ (Wi-Fi Password)" htmlFor="edit-wifi-pass">
                <input
                  id="edit-wifi-pass"
                  type="text"
                  value={editWifiPassword}
                  onChange={(e) => setEditWifiPassword(e.target.value)}
                  placeholder="harperkhaoyai"
                  className={input}
                />
              </Field>

              <Field label="ที่อยู่ / พิกัด" htmlFor="edit-stay-addr">
                <input
                  id="edit-stay-addr"
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className={input}
                />
              </Field>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditStayModalOpen(false)}
                  className={btnQuiet}
                >
                  ยกเลิก
                </button>
                <button type="submit" className={btnSolid}>
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     VIEW 2: Voting & Poll Mode (Still Selecting Accommodation)
     ───────────────────────────────────────────────────────────── */
  return (
    <div className="pb-16">
      <PageHead
        title="ที่พัก"
        note="โหวตเลือกพูลวิลล่าสี่ห้องนอนสำหรับคืนวันที่ 31 ต.ค. – 1 พ.ย. 2569"
        aside={
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Tag tone="wait">กำลังเปิดโหวต</Tag>
            <Tag tone="off">{trip.accommodationOptions.length} ตัวเลือก</Tag>
          </div>
        }
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickConfirmHarper}
              className="px-4 py-2.5 bg-moss text-paper hover:bg-ink text-body font-medium rounded-ctl transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4 text-brass-lit" />
              เลือก Harper Pool Villa ทันที
            </button>
            <button onClick={() => setIsNewOptionModalOpen(true)} className={btnSolid}>
              เสนอที่พักอื่น
            </button>
          </div>
        }
      />

      {/* Featured Spotlight Card: Harper Pool Villa */}
      <div className="mb-6 bg-paper rounded-panel border-2 border-brass/50 overflow-hidden shadow-sm">
        <div className="bg-brass/10 px-6 py-2.5 flex items-center justify-between border-b border-brass/20 text-fine text-brass font-medium">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brass" />
            ตัวเลือกยอดนิยมอันดับ 1 — สไตล์ญี่ปุ่น 4 ห้องนอน พร้อมสระน้ำเกลือ & โต๊ะพูล
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-brass text-paper font-semibold">
            RECOMMENDED
          </span>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-6">
          <div className="relative rounded-ctl overflow-hidden min-h-[220px] bg-mist">
            <img
              src="https://a0.muscache.com/im/pictures/miso/Hosting-1346972548976188677/original/de2a8385-7dff-401b-a610-1759869991a7.jpeg"
              alt="Harper Pool Villa Khaoyai"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-2 left-2 bg-ink/75 text-paper text-[11px] px-2 py-0.5 rounded">
              200 ตร.ม. สระว่ายน้ำน้ำเกลือ
            </span>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-title text-ink">
                    ฮาร์เปอร์ พูลวิลล่า เขาใหญ่ (Harper Pool Villa)
                  </h2>
                  <p className="mt-1 text-fine text-stone">
                    ต.หนองสาหร่าย อ.ปากช่อง · 4 ห้องนอน (7 เตียง 5 ฟุต) · 4 ห้องน้ำ · นอนได้ 14 คน
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-title text-ink">฿12,900</p>
                  <p className="text-[11px] text-stone">
                    ตกคนละ ~฿{Math.round(12900 / confirmedCount).toLocaleString()} ({confirmedCount} คน)
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  'สไตล์ญี่ปุ่น 200 ตร.ม.',
                  'สระน้ำเกลือ + สระเด็ก',
                  'โต๊ะพูล & คาราโอเกะ 24 ชม.',
                  'ฟรีน้ำแข็ง 1 กระสอบ + ถ่านปิ้งย่าง',
                  'ที่จอดรถ 7 คัน',
                  'ติดคาเฟ่ MAA & KHAAM 1 นาที',
                ].map((item, idx) => (
                  <span
                    key={idx}
                    className="text-fine px-2.5 py-1 rounded-ctl bg-surface text-ink font-medium inline-flex items-center gap-1.5"
                  >
                    <Check className="w-3 h-3 text-brass" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-mist-deep/60 flex flex-wrap items-center justify-between gap-4">
              <a
                href="https://th.airbnb.com/rooms/1346972548976188677?adults=10&check_in=2026-10-31&check_out=2026-11-01&guests=10"
                target="_blank"
                rel="noreferrer"
                className={btnLink}
              >
                ดูรายละเอียดบน Airbnb <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={handleQuickConfirmHarper}
                className="px-5 py-2.5 bg-ink hover:bg-ink-soft text-paper text-body font-medium rounded-ctl transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4 text-brass-lit" />
                ยืนยันเลือกวิลล่านี้เข้าทริป
              </button>
            </div>
          </div>
        </div>
      </div>

      {!me && (
        <Panel className="mb-3">
          <p className="text-body text-stone">
            เลือกชื่อคุณที่มุมขวาบนก่อน แล้วจึงจะโหวตได้ เพื่อนจะได้รู้ว่าใครเลือกอะไร
          </p>
        </Panel>
      )}

      {trip.accommodationOptions.length > 0 && (
        <div className="bg-paper rounded-panel overflow-hidden divide-y divide-mist-deep/70">
          {trip.accommodationOptions.map((option) => {
            const estPerPerson = Math.round(option.pricePerNight / confirmedCount);
            const isVoted = !!me && option.votes.includes(me.id);
            const isLeading = mostVotes > 0 && option.votes.length === mostVotes;

            return (
              <article
                key={option.id}
                className="px-6 sm:px-8 py-7 grid grid-cols-1 sm:grid-cols-[13rem_1fr] gap-6"
              >
                <img
                  src={option.imageUrl}
                  alt={option.name}
                  className="w-full h-40 sm:h-full object-cover rounded-ctl bg-mist"
                />

                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-display text-lead text-ink">{option.name}</h2>
                      <p className="mt-1 text-fine text-stone">
                        {option.location} · {option.bedrooms} ห้องนอน · {option.bathrooms} ห้องน้ำ ·
                        นอนได้ {option.capacity} คน
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteOption(option.id)}
                      className="text-stone hover:text-ink transition-colors shrink-0 cursor-pointer"
                      aria-label={`ลบ ${option.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="mt-4 text-body text-ink">
                    {baht(option.pricePerNight)} ต่อคืน
                    <span className="ml-2 text-fine text-stone">
                      หาร {confirmedCount} คน ตกคนละ {baht(estPerPerson)}
                    </span>
                  </p>

                  <p className="mt-3 text-fine text-stone">
                    {option.highlights.join(' · ')}
                  </p>

                  <p className="mt-2 text-fine text-stone">เสนอโดย {option.suggestedBy}</p>

                  {option.linkUrl && (
                    <a
                      href={option.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`mt-4 ${btnLink}`}
                    >
                      ดูรูปและรายละเอียด
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <div className="mt-6 pt-5 border-t border-mist-deep flex flex-wrap items-center gap-x-4 gap-y-3">
                    <button
                      onClick={() => handleVote(option.id)}
                      disabled={!me}
                      aria-pressed={isVoted}
                      title={me ? undefined : 'เลือกชื่อคุณที่มุมขวาบนก่อน'}
                      className={`${isVoted ? btnBrass : btnQuiet} disabled:opacity-40 disabled:pointer-events-none cursor-pointer`}
                    >
                      {isVoted
                        ? `โหวตแล้ว (${option.votes.length})`
                        : `โหวตที่นี่ (${option.votes.length})`}
                    </button>

                    <button
                      onClick={() => setBookingOption(option)}
                      className="px-4 py-2 bg-ink hover:bg-ink-soft text-paper text-fine font-medium rounded-ctl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      เลือกที่นี่เลย
                    </button>

                    {isLeading && <Tag tone="wait">คะแนนนำอยู่</Tag>}

                    {option.votes.length > 0 && (
                      <p className="text-fine text-stone w-full">
                        โหวตโดย{' '}
                        {option.votes.map((v) => voterLabel(trip.members, v)).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Booking confirmation modal */}
      {bookingOption && (
        <Modal
          title={`เลือก ${bookingOption.name}`}
          note="ตรวจสอบข้อมูลการเข้าพัก"
          onClose={() => setBookingOption(null)}
        >
          <form onSubmit={handleFinalizeAccommodation} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="เข้าพักได้ตั้งแต่" htmlFor="stay-in">
                <input
                  id="stay-in"
                  type="text"
                  required
                  value={editCheckIn}
                  onChange={(e) => setEditCheckIn(e.target.value)}
                  placeholder="14:00 น."
                  className={input}
                />
              </Field>
              <Field label="ต้องคืนห้องก่อน" htmlFor="stay-out">
                <input
                  id="stay-out"
                  type="text"
                  required
                  value={editCheckOut}
                  onChange={(e) => setEditCheckOut(e.target.value)}
                  placeholder="11:00 น."
                  className={input}
                />
              </Field>
            </div>

            <Field label="ชื่อไวไฟ" htmlFor="stay-wifi">
              <input
                id="stay-wifi"
                type="text"
                value={editWifiSsid}
                onChange={(e) => setEditWifiSsid(e.target.value)}
                placeholder="Harper_PoolVilla_5G"
                className={input}
              />
            </Field>

            <Field label="รหัสไวไฟ" htmlFor="stay-wifi-pass">
              <input
                id="stay-wifi-pass"
                type="text"
                value={editWifiPassword}
                onChange={(e) => setEditWifiPassword(e.target.value)}
                placeholder="harperkhaoyai"
                className={input}
              />
            </Field>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setBookingOption(null)}
                className={btnQuiet}
              >
                ยกเลิก
              </button>
              <button type="submit" className={btnSolid}>
                ยืนยันการเลือกที่พักนี้
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* New Option Modal */}
      {isNewOptionModalOpen && (
        <Modal
          title="เสนอที่พักสำหรับทริป"
          note="แปะลิงก์และราคาพูลวิลล่าที่น่าสนใจให้เพื่อนๆ ช่วยกันดู"
          onClose={() => setIsNewOptionModalOpen(false)}
        >
          <form onSubmit={handleCreateOption} className="space-y-4">
            <Field label="ชื่อที่พัก / พูลวิลล่า" htmlFor="opt-name">
              <input
                id="opt-name"
                type="text"
                required
                value={optionName}
                onChange={(e) => setOptionName(e.target.value)}
                placeholder="เช่น ปาลิโอ พูลวิลล่า"
                className={input}
              />
            </Field>

            <Field label="ทำเล / โซน" htmlFor="opt-loc">
              <input
                id="opt-loc"
                type="text"
                value={optionLocation}
                onChange={(e) => setOptionLocation(e.target.value)}
                placeholder="เช่น ปากช่อง, ใกล้อุทยาน"
                className={input}
              />
            </Field>

            <Field label="ราคาต่อคืน (บาท)" htmlFor="opt-price">
              <input
                id="opt-price"
                type="number"
                required
                value={optionPrice}
                onChange={(e) =>
                  setOptionPrice(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="เช่น 12900"
                className={input}
              />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="ห้องนอน" htmlFor="opt-beds">
                <input
                  id="opt-beds"
                  type="number"
                  min={1}
                  value={optionBedrooms}
                  onChange={(e) => setOptionBedrooms(Number(e.target.value))}
                  className={input}
                />
              </Field>
              <Field label="ห้องน้ำ" htmlFor="opt-baths">
                <input
                  id="opt-baths"
                  type="number"
                  min={1}
                  value={optionBathrooms}
                  onChange={(e) => setOptionBathrooms(Number(e.target.value))}
                  className={input}
                />
              </Field>
              <Field label="รองรับกี่คน" htmlFor="opt-cap">
                <input
                  id="opt-cap"
                  type="number"
                  min={1}
                  value={optionCapacity}
                  onChange={(e) => setOptionCapacity(Number(e.target.value))}
                  className={input}
                />
              </Field>
            </div>

            <Field label="ลิงก์ Airbnb / Agoda / เพจ" htmlFor="opt-link">
              <input
                id="opt-link"
                type="url"
                value={optionLinkUrl}
                onChange={(e) => setOptionLinkUrl(e.target.value)}
                placeholder="https://..."
                className={input}
              />
            </Field>

            <Field label="ลิงก์รูปภาพตัวอย่าง" htmlFor="opt-img">
              <input
                id="opt-img"
                type="url"
                value={optionImageUrl}
                onChange={(e) => setOptionImageUrl(e.target.value)}
                placeholder="https://..."
                className={input}
              />
            </Field>

            <Field
              label="จุดเด่น (คั่นด้วยจุลภาค)"
              htmlFor="opt-hl"
              hint="เช่น สระน้ำเกลือ, โต๊ะพูล, คาราโอเกะ, ใกล้คาเฟ่"
            >
              <input
                id="opt-hl"
                type="text"
                value={optionHighlights}
                onChange={(e) => setOptionHighlights(e.target.value)}
                className={input}
              />
            </Field>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsNewOptionModalOpen(false)}
                className={btnQuiet}
              >
                ยกเลิก
              </button>
              <button type="submit" className={btnSolid}>
                เพิ่มตัวเลือก
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
