import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Copy,
  Check,
  MapPin,
  Car,
  Home,
  CheckCircle2,
  AlertCircle,
  Package,
  Bot,
  Settings2,
  ArrowRight,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { TripData, Member, TripListEditor, PlaceIdea, PackingItem } from '../types/trip';

interface TripSecretaryProps extends TripListEditor {
  trip: TripData;
  me: Member | null;
  setActiveTab: (tab: string) => void;
}

export type AIProvider = 'openrouter' | 'gemini' | 'custom' | 'builtin';

export const OPENROUTER_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'เร็ว & ประหยัด แนะนำ' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', tag: 'ฉลาดสุด เรียบเรียงเก่ง' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o mini', tag: 'รวดเร็ว ฉับไว' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', tag: 'ประหยัด ยอดนิยม' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', tag: 'Open Source ตัวท็อป' },
];

interface MessageAction {
  label: string;
  type: 'copy' | 'add_place' | 'add_packing' | 'go_tab';
  payload?: any;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  actions?: MessageAction[];
}

// Curated Khao Yai spots for smart suggestions
const KHAOYAI_RECOMMENDATIONS = [
  {
    title: 'ร้านเป็นลาว (Penlaos)',
    category: 'food' as const,
    location: 'ถนนธนะรัชต์ กม. 4',
    description: 'ร้านส้มตำ ไก่ย่าง แกงลาวชื่อดังระดับมิชลินไกด์ เหมาะมากกับแก๊งใหญ่ 10–12 คน',
  },
  {
    title: 'Midwinter Khao Yai',
    category: 'food' as const,
    location: 'ถนนมิตรภาพ ปากช่อง',
    description: 'ปราสาทสไตล์ยุโรป อาหารฟิวชั่น เบเกอรี่ ดนตรีสด บรรยากาศช่วงค่ำโรแมนติกและเย็นสบาย',
  },
  {
    title: "The Birder's Lodge Cafe",
    category: 'cafe' as const,
    location: 'ถนนกุดคล้า-ผ่านศึก',
    description: 'คาเฟ่โรงนาไม้ดีไซน์เก๋ มุมถ่ายรูปเยอะมาก มีตลาดนัดเกษตรกรวันหยุด',
  },
  {
    title: 'Floryday Khaoyai : Cafe & Flower',
    category: 'cafe' as const,
    location: 'กม. 14 ถนนธนะรัชต์',
    description: 'ทุ่งดอกไม้หลากสีบนเนินเขาแบบขั้นบันได ถ่ายรูปสวยปังทุกมุม มีเครื่องดื่มและขนม',
  },
  {
    title: 'อุทยานแห่งชาติเขาใหญ่ (จุดชมวิว กม. 30 & ผากล้วยไม้)',
    category: 'nature' as const,
    location: 'ด่านตรวจศาลเจ้าพ่อเขาใหญ่',
    description: 'รับลมหนาว ชมวิวทิวทัศน์ เดินส่องสัตว์ช่วงค่ำ หรือแวะน้ำตกเหวสุวัต',
  },
  {
    title: 'ไร่องุ่น PB Valley Khao Yai Winery',
    category: 'nature' as const,
    location: 'พญาเย็น ปากช่อง',
    description: 'ชมไร่องุ่น ชิมไวน์และน้ำองุ่นชีราซแท้ 100% บรรยากาศเหมือนอยู่ทัสคานี',
  },
];

const PACKING_SUGGESTIONS = [
  { title: 'ปลั๊กพ่วง 3–5 เมตร (สำคัญมากสำหรับพูลวิลล่า)', category: 'shared' as const },
  { title: 'ถ่านปิ้งย่าง + ตะแกรงสำรอง', category: 'shared' as const },
  { title: 'น้ำแข็ง + กระติกน้ำแข็งกลาง', category: 'shared' as const },
  { title: 'เสื้อกันหนาว / เสื้อคลุม (กลางคืนเขาใหญ่อากาศเย็น)', category: 'personal' as const },
  { title: 'สเปรย์ / โลชั่นกันยุงและแมลง', category: 'shared' as const },
  { title: 'บอร์ดเกม / การ์ดเกมสำหรับสังสรรค์', category: 'shared' as const },
];

export const TripSecretary: React.FC<TripSecretaryProps> = ({
  trip,
  me,
  setActiveTab,
  onSaveItem,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedActionId, setCopiedActionId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Settings State: Multi-provider support
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState<AIProvider>(() => {
    return (localStorage.getItem('trip_ai_provider') as AIProvider) || 'openrouter';
  });
  const [openrouterKey, setOpenrouterKey] = useState<string>(() => {
    return localStorage.getItem('trip_openrouter_key') || '';
  });
  const [openrouterModel, setOpenrouterModel] = useState<string>(() => {
    return localStorage.getItem('trip_openrouter_model') || 'google/gemini-2.5-flash';
  });
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('trip_gemini_api_key') || '';
  });
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(() => {
    return localStorage.getItem('trip_custom_base_url') || '';
  });
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('trip_custom_api_key') || '';
  });
  const [customModel, setCustomModel] = useState<string>(() => {
    return localStorage.getItem('trip_custom_model') || '';
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Statistics from trip state
  const confirmedMembers = trip.members.filter((m) => m.status === 'confirmed');
  const allAssignedPassengerIds = new Set(trip.cars.flatMap((c) => c.passengerIds));
  const unassignedMembers = confirmedMembers.filter(
    (m) => !allAssignedPassengerIds.has(m.id)
  );
  const totalCarSeats = trip.cars.reduce((sum, c) => sum + c.maxSeats, 0);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const activeEngineText =
        provider === 'openrouter' && openrouterKey
          ? `(เชื่อมต่อ OpenRouter: ${openrouterModel})`
          : provider === 'gemini' && geminiApiKey
            ? `(เชื่อมต่อ Google Gemini)`
            : provider === 'custom' && customBaseUrl
              ? `(เชื่อมต่อ Custom Endpoint)`
              : `(โหมด Smart Rule Engine)`;

      const welcome: Message = {
        id: 'msg-welcome',
        sender: 'ai',
        text: `สวัสดีครับ ${me ? `คุณ${me.nickname}` : 'เพื่อนร่วมทริป'}! 🌿\nผมเป็นเลขา AI ประจำทริปเขาใหญ่ สองวันหนึ่งคืน ${activeEngineText}\n\nผมช่วยเช็กสถานะทริป, ร่างข้อความตามเพื่อนใน LINE, แนะนำคาเฟ่และร้านเด็ด หรือช่วยตรวจเช็กความพร้อมให้ได้ทันทีครับ อยากให้ผมช่วยอะไรดีครับ?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([welcome]);
    }
  }, [me, provider, openrouterModel]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('trip_ai_provider', provider);
    localStorage.setItem('trip_openrouter_key', openrouterKey.trim());
    localStorage.setItem('trip_openrouter_model', openrouterModel.trim());
    localStorage.setItem('trip_gemini_api_key', geminiApiKey.trim());
    localStorage.setItem('trip_custom_base_url', customBaseUrl.trim());
    localStorage.setItem('trip_custom_api_key', customApiKey.trim());
    localStorage.setItem('trip_custom_model', customModel.trim());
    setShowSettings(false);
    setActionSuccess('บันทึกการตั้งค่า AI Provider เรียบร้อยแล้ว!');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleCopyText = (text: string, actionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedActionId(actionId);
    setTimeout(() => setCopiedActionId(null), 2500);
  };

  const handleAddPlace = (place: (typeof KHAOYAI_RECOMMENDATIONS)[0]) => {
    const newIdea: PlaceIdea = {
      id: `idea-${Date.now()}`,
      title: place.title,
      category: place.category,
      location: place.location,
      suggestedBy: me ? me.nickname : 'เลขา AI',
      votes: me ? [me.id] : [],
      notes: place.description,
    };
    onSaveItem('placeIdeas', newIdea);
    setActionSuccess(`ปักหมุด "${place.title}" ลงในตารางเที่ยวแล้ว!`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleAddPackingItem = (item: (typeof PACKING_SUGGESTIONS)[0]) => {
    const newItem: PackingItem = {
      id: `p-${Date.now()}`,
      title: item.title,
      category: item.category,
      isPacked: false,
      assignedMemberId: me?.id,
    };
    onSaveItem('packingList', newItem);
    setActionSuccess(`เพิ่ม "${item.title}" ในรายการของที่ต้องเตรียมแล้ว!`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Pre-built Smart Generators based on current live trip context
  const generateStatusBriefing = (): Message => {
    const daysLeft = Math.ceil(
      (new Date(trip.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    let briefing = `📊 **สรุปสถานะทริปเขาใหญ่ ณ ตอนนี้** (${daysLeft > 0 ? `อีก ${daysLeft} วันเดินทาง` : 'ถึงวันเดินทางแล้ว'})\n\n`;

    // 1. Members
    briefing += `👥 **สมาชิก**: คอนเฟิร์มแล้ว ${confirmedMembers.length} คน (เป้าหมาย 10–12 คน) ${
      confirmedMembers.length >= 10 ? '✅ ครบแก๊งแล้ว' : `⚠️ ขาดอีก ${10 - confirmedMembers.length} คน`
    }\n`;

    // 2. Cars
    briefing += `🚗 **รถเดินทาง**: มี ${trip.cars.length} คัน (ที่นั่งรวม ${totalCarSeats} ที่)\n`;
    if (unassignedMembers.length > 0) {
      briefing += `   ⚠️ ยังไม่ได้เลือกรถ ${unassignedMembers.length} คน: ${unassignedMembers.map((m) => m.nickname).join(', ')}\n`;
    } else {
      briefing += `   ✅ ทุกคนมีที่นั่งรถครบแล้ว\n`;
    }

    // 3. Stay
    if (trip.confirmedAccommodation) {
      briefing += `🏡 **ที่พัก**: จองเรียบร้อยแล้ว (${trip.confirmedAccommodation.name}) ✅\n`;
    } else if (trip.accommodationOptions.length > 0) {
      briefing += `🏡 **ที่พัก**: มี ${trip.accommodationOptions.length} ตัวเลือก กำลังเปิดโหวต ⏳\n`;
    } else {
      briefing += `🏡 **ที่พัก**: ยังไม่มีตัวเลือกพูลวิลล่า 🔴\n`;
    }

    // 4. Places & Food
    briefing += `📍 **จุดแวะเที่ยว**: ${trip.placeIdeas.length} แห่ง\n`;
    briefing += `🍲 **เมนูอาหาร**: ${trip.menuIdeas.length} เมนู\n`;

    // 5. Total Expenses
    const totalExp = trip.expenses.reduce((s, e) => s + e.amount, 0);
    briefing += `💰 **งบใช้จ่ายที่บันทึกแล้ว**: ฿${totalExp.toLocaleString()} บาท`;

    return {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text: briefing,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { label: '🚗 ไปจัดที่นั่งรถ', type: 'go_tab', payload: 'cars' },
        { label: '🏡 ดูที่พัก', type: 'go_tab', payload: 'stay' },
        { label: '📍 เพิ่มที่เที่ยว', type: 'go_tab', payload: 'itinerary' },
      ],
    };
  };

  const generateLineAnnouncement = (): Message => {
    let lineText = `📢 [อัปเดตทริปเขาใหญ่ 2 วัน 1 คืน] 🌿⛰️\n`;
    lineText += `🗓️ วันที่ 31 ต.ค. - 1 พ.ย. 2569\n\n`;

    lineText += `👥 ยอดคอนเฟิร์ม: ${confirmedMembers.length} คน\n`;

    if (trip.confirmedAccommodation) {
      lineText += `🏡 ที่พัก: จองแล้วเรียบร้อย (${trip.confirmedAccommodation.name})\n`;
    } else {
      lineText += `🏡 ที่พัก: ช่วยกันเข้าไปโหวตพูลวิลล่าในเว็บหน่อยน้า\n`;
    }

    if (unassignedMembers.length > 0) {
      lineText += `🚗 รถเดินทาง: ${unassignedMembers.map((m) => `@${m.nickname}`).join(' ')} รบกวนกดเข้าไปเลือกรถในเว็บด่วนน้า (รถเหลือที่ว่างอีก ${totalCarSeats - (confirmedMembers.length - unassignedMembers.length)} ที่)\n`;
    } else {
      lineText += `🚗 รถเดินทาง: จัดคนขึ้นรถครบทุกคันแล้ว\n`;
    }

    if (trip.placeIdeas.length === 0) {
      lineText += `☕ ที่เที่ยว/คาเฟ่: ยังไม่มีใครเสนอจุดแวะเลย ใครอยากไปไหนแปะในเว็บได้เลย!\n`;
    }

    lineText += `\n👉 เข้าไปดูข้อมูลและโหวตกันได้ที่นี่:\n${window.location.href}`;

    return {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text: `ผมร่างข้อความสำหรับส่งเข้า LINE กลุ่มให้แล้วครับ คัดลอกแล้วส่งได้ทันทีเลยครับ 👇\n\n\`\`\`\n${lineText}\n\`\`\``,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [
        {
          label: '📋 คัดลอกข้อความส่ง LINE',
          type: 'copy',
          payload: lineText,
        },
      ],
    };
  };

  const generateCarReport = (): Message => {
    let text = `🚗 **รายงานการจัดรถและที่นั่ง**\n\n`;
    text += `• จำนวนรถทั้งหมด: ${trip.cars.length} คัน\n`;
    text += `• ที่นั่งทั้งหมด: ${totalCarSeats} ที่\n`;
    text += `• คนคอนเฟิร์ม: ${confirmedMembers.length} คน\n\n`;

    if (trip.cars.length === 0) {
      text += `⚠️ ตอนนี้ยังไม่มีใครลงชื่ออาสาเอารถไปเลยครับ! ต้องมีคนอาสาอย่างน้อย 2–3 คัน`;
    } else {
      trip.cars.forEach((c, idx) => {
        const available = c.maxSeats - c.passengerIds.length;
        text += `**คันที่ ${idx + 1}: ${c.driverName} (${c.carModel})**\n`;
        text += `  • นั่งแล้ว: ${c.passengerIds.length}/${c.maxSeats} ที่ (${available > 0 ? `ว่าง ${available} ที่` : 'เต็มแล้ว'})\n`;
        if (c.passengerIds.length > 0) {
          const names = c.passengerIds
            .map((id) => trip.members.find((m) => m.id === id)?.nickname || 'เพื่อน')
            .join(', ');
          text += `  • ผู้โดยสาร: ${names}\n`;
        }
      });

      if (unassignedMembers.length > 0) {
        text += `\n⚠️ **คนที่ยังไม่มีที่นั่ง (${unassignedMembers.length} คน)**: ${unassignedMembers
          .map((m) => m.nickname)
          .join(', ')}`;
      } else {
        text += `\n🎉 ยอดเยี่ยมมาก ทุกคนมีรถนั่งเรียบร้อยแล้วครับ`;
      }
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [{ label: '🚗 ไปหน้าจัดรถ', type: 'go_tab', payload: 'cars' }],
    };
  };

  const generateRecommendations = (): Message => {
    return {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text: `☕ **แนะนำจุดแวะ & ร้านเด็ดเขาใหญ่สำหรับแก๊งเพื่อน**\n\nผมคัดเลือกสถานที่ยอดนิยมที่เหมาะกับกลุ่ม 10–12 คนมาให้แล้วครับ สามารถกดปุ่ม **[+ ปักหมุดลงทริป]** ใต้ข้อความนี้เพื่อเพิ่มเข้าตารางเที่ยวได้เลยทันที!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: KHAOYAI_RECOMMENDATIONS.slice(0, 4).map((rec) => ({
        label: `+ ปักหมุด ${rec.title}`,
        type: 'add_place',
        payload: rec,
      })),
    };
  };

  const generatePackingSuggestions = (): Message => {
    return {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text: `🎒 **ของสำคัญที่แนะนำให้พกไปเขาใหญ่ช่วงนี้ (ปลายฝนต้นหนาว)**\n\nกลางคืนที่เขาใหญ่อากาศจะเริ่มเย็นสบาย และพูลวิลล่ายอดฮิตมักจะต้องเตรียมปลั๊กพ่วงและอุปกรณ์เสริมไปด้วย กดปุ่มด้านล่างเพื่อเพิ่มเข้ารายการเตรียมของได้ทันทีครับ:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: PACKING_SUGGESTIONS.map((item) => ({
        label: `+ เพิ่ม "${item.title}"`,
        type: 'add_packing',
        payload: item,
      })),
    };
  };

  const handleQuickPrompt = (type: 'brief' | 'line' | 'cars' | 'places' | 'packing') => {
    setIsTyping(true);
    setTimeout(() => {
      let reply: Message;
      if (type === 'brief') reply = generateStatusBriefing();
      else if (type === 'line') reply = generateLineAnnouncement();
      else if (type === 'cars') reply = generateCarReport();
      else if (type === 'places') reply = generateRecommendations();
      else reply = generatePackingSuggestions();

      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
    }, 400);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const tripContext = `
คุณคือ "เลขาทริป AI" ผู้ช่วยอัจฉริยะประจำทริปเขาใหญ่ สองวันหนึ่งคืน (31 ต.ค. - 1 พ.ย. 2569)
ข้อมูลปัจจุบันของทริป:
- ชื่อทริป: ${trip.title}
- สถานที่: ${trip.destination}
- สมาชิกที่คอนเฟิร์ม: ${confirmedMembers.map((m) => m.nickname).join(', ')} (รวม ${confirmedMembers.length} คน)
- รถ: ${trip.cars.map((c) => `${c.driverName} (${c.carModel}) นั่ง ${c.passengerIds.length}/${c.maxSeats} คน`).join('; ')}
- คนที่ยังไม่มีที่นั่งรถ: ${unassignedMembers.map((m) => m.nickname).join(', ') || 'ไม่มี ทุกคนมีรถแล้ว'}
- ที่พัก: ${trip.confirmedAccommodation ? `จองแล้ว (${trip.confirmedAccommodation.name})` : 'ยังไม่ได้จอง'}
- จุดแวะเที่ยวที่เสนอไว้: ${trip.placeIdeas.map((p) => p.title).join(', ') || 'ยังไม่มี'}
- เมนูอาหาร: ${trip.menuIdeas.map((m) => m.title).join(', ') || 'ยังไม่มี'}
- ผู้ใช้งานปัจจุบัน: ${me ? `คุณ${me.nickname}` : 'เพื่อนร่วมทริป'}

คำสั่ง:
ตอบคำถามด้วยภาษาไทยที่สุภาพ เป็นกันเอง กระตือรือร้น กระชับ ช่วยเหลือคนจัดทริปได้จริง ถ้าแนะนำสถานที่ให้แนะนำจุดเด่นและทำเลที่เหมาะสมกับแก๊งเพื่อน 10-12 คน
`;

    // 1. OPENROUTER PROVIDER
    if (provider === 'openrouter' && openrouterKey) {
      try {
        const historyForApi = messages.slice(-4).map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openrouterKey.trim()}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Khao Yai Trip Planner',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: openrouterModel || 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: tripContext },
              ...historyForApi,
              { role: 'user', content: userText },
            ],
          }),
        });

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error.message || 'OpenRouter Error');
        }

        const aiText =
          data?.choices?.[0]?.message?.content ||
          'ขออภัยครับ ไม่ได้รับข้อความตอบกลับจาก OpenRouter';

        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
        return;
      } catch (err: any) {
        console.error('OpenRouter API call failed:', err);
        const errMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ เชื่อมต่อ OpenRouter ไม่สำเร็จ: ${err.message || 'กรุณาตรวจสอบ API Key'}\nกำลังสลับใช้ Smart Rule Engine ชั่วคราว...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    }

    // 2. GOOGLE GEMINI DIRECT PROVIDER
    if (provider === 'gemini' && geminiApiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${tripContext}\n\nคำถามจากผู้ใช้: ${userText}` }],
                },
              ],
            }),
          }
        );

        const data = await response.json();
        const aiText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          'ขออภัยครับ ไม่สามารถเชื่อมต่อกับ Gemini ได้ในขณะนี้';

        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
        return;
      } catch (err) {
        console.error('Gemini API call failed:', err);
      }
    }

    // 3. CUSTOM OPENAI-COMPATIBLE PROVIDER
    if (provider === 'custom' && customBaseUrl) {
      try {
        const endpoint = `${customBaseUrl.replace(/\/+$/, '')}/chat/completions`;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (customApiKey) headers['Authorization'] = `Bearer ${customApiKey.trim()}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: customModel || 'default',
            messages: [
              { role: 'system', content: tripContext },
              { role: 'user', content: userText },
            ],
          }),
        });

        const data = await response.json();
        const aiText = data?.choices?.[0]?.message?.content || 'ไม่ได้รับข้อความตอบกลับจาก API';

        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
        return;
      } catch (err) {
        console.error('Custom endpoint failed:', err);
      }
    }

    // 4. SMART LOCAL FALLBACK ENGINE
    setTimeout(() => {
      const lower = userText.toLowerCase();
      let replyText = '';
      let actions: MessageAction[] | undefined;

      if (lower.includes('สรุป') || lower.includes('สถานะ') || lower.includes('ถึงไหน')) {
        const brief = generateStatusBriefing();
        replyText = brief.text;
        actions = brief.actions;
      } else if (lower.includes('ไลน์') || lower.includes('line') || lower.includes('ร่าง') || lower.includes('ตาม')) {
        const line = generateLineAnnouncement();
        replyText = line.text;
        actions = line.actions;
      } else if (lower.includes('รถ') || lower.includes('ที่นั่ง') || lower.includes('ขับ')) {
        const car = generateCarReport();
        replyText = car.text;
        actions = car.actions;
      } else if (
        lower.includes('กิน') ||
        lower.includes('เที่ยว') ||
        lower.includes('คาเฟ่') ||
        lower.includes('ร้าน')
      ) {
        const rec = generateRecommendations();
        replyText = rec.text;
        actions = rec.actions;
      } else if (lower.includes('เตรียม') || lower.includes('ของ') || lower.includes('กระเป๋า')) {
        const pack = generatePackingSuggestions();
        replyText = pack.text;
        actions = pack.actions;
      } else {
        replyText = `ได้รับคำถามเรื่อง "${userText}" แล้วครับ! 🌲\n\nผมได้วิเคราะห์ข้อมูลทริปเขาใหญ่ของเราแล้ว:\n• มีเพื่อนร่วมทริป ${confirmedMembers.length} คน\n• ${trip.confirmedAccommodation ? `ที่พักจองเรียบร้อยแล้วที่ ${trip.confirmedAccommodation.name}` : 'ยังรอสรุปที่พัก'}\n• รถมีทั้งหมด ${trip.cars.length} คัน\n\nคุณสามารถกดปุ่มลัดด้านบนเพื่อให้ผมสรุปสถานะ ร่างข้อความ LINE หรือแนะนำที่เที่ยวเขาใหญ่ได้เลยครับ!`;
        actions = [
          { label: '📊 สรุปภาพรวมทริป', type: 'go_tab', payload: 'overview' },
          { label: '☕ แนะนำที่เที่ยว', type: 'go_tab', payload: 'itinerary' },
        ];
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 450);
  };

  const getProviderBadge = () => {
    if (provider === 'openrouter') {
      const shortModel = openrouterModel.split('/')[1] || openrouterModel;
      return openrouterKey ? `🌐 OpenRouter: ${shortModel}` : '🌐 OpenRouter (ใส่ Key)';
    }
    if (provider === 'gemini') {
      return geminiApiKey ? '✨ Gemini Direct' : '✨ Gemini (ใส่ Key)';
    }
    if (provider === 'custom') {
      return '⚙️ Custom AI';
    }
    return '⚡ Smart Local';
  };

  return (
    <>
      {/* ── Floating Action Button (FAB) ────────────────────── */}
      <aside aria-label="ผู้ช่วยทริป AI" className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 px-4 py-3 bg-ink hover:bg-moss text-paper border border-brass/50 rounded-full shadow-2xl transition-all hover:scale-105 cursor-pointer"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brass opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brass" />
            </span>
            <Sparkles className="w-4 h-4 text-brass-lit" />
            <span className="font-display text-body tracking-wide font-medium">
              เลขาทริป AI
            </span>
          </button>
        )}
      </aside>

      {/* ── Slide-over / Modal Assistant ────────────────────── */}
      {isOpen && (
        <aside
          role="dialog"
          aria-label="แผงพูดคุยกับเลขาทริป AI"
          aria-modal="true"
          className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-paper shadow-2xl border-l border-mist-deep flex flex-col animate-in slide-in-from-right duration-300"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-ink text-paper flex items-center justify-between border-b border-paper/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-moss flex items-center justify-center border border-brass/40 text-brass-lit">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lead text-paper font-normal">เลขาทริป AI</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-brass/25 text-brass-lit font-medium">
                    {getProviderBadge()}
                  </span>
                </div>
                <p className="text-fine text-mist/70">
                  {me ? `คุยกับ คุณ${me.nickname}` : 'ผู้ช่วยดูแลทริปเพื่อน'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowSettings(!showSettings)}
                title="ตั้งค่า AI Provider (OpenRouter / Gemini)"
                className="p-2 text-mist/70 hover:text-paper hover:bg-paper/10 rounded-full transition-colors cursor-pointer"
              >
                <Settings2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-mist/70 hover:text-paper hover:bg-paper/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* AI Settings Drawer (Multi-provider) */}
          {showSettings && (
            <div className="bg-ink-soft p-5 border-b border-paper/15 text-paper max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-brass" />
                  <h4 className="font-display text-body font-medium text-paper">
                    ตั้งค่าผู้ให้บริการ AI (AI Provider)
                  </h4>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-mist/70 hover:text-paper text-fine cursor-pointer"
                >
                  ปิด
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-fine">
                {/* Provider Selector */}
                <div>
                  <label className="block text-mist/80 mb-1.5 font-medium">ผู้ให้บริการ:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProvider('openrouter')}
                      className={`py-2 px-3 rounded-ctl text-left border transition-colors cursor-pointer ${
                        provider === 'openrouter'
                          ? 'bg-brass text-ink border-brass font-medium'
                          : 'bg-ink border-paper/20 text-mist hover:text-paper'
                      }`}
                    >
                      <span className="block font-medium">🌐 OpenRouter</span>
                      <span className="text-[11px] opacity-80">Claude, GPT, Gemini...</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProvider('gemini')}
                      className={`py-2 px-3 rounded-ctl text-left border transition-colors cursor-pointer ${
                        provider === 'gemini'
                          ? 'bg-brass text-ink border-brass font-medium'
                          : 'bg-ink border-paper/20 text-mist hover:text-paper'
                      }`}
                    >
                      <span className="block font-medium">✨ Google Gemini</span>
                      <span className="text-[11px] opacity-80">Gemini 1.5 Flash API</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProvider('custom')}
                      className={`py-2 px-3 rounded-ctl text-left border transition-colors cursor-pointer ${
                        provider === 'custom'
                          ? 'bg-brass text-ink border-brass font-medium'
                          : 'bg-ink border-paper/20 text-mist hover:text-paper'
                      }`}
                    >
                      <span className="block font-medium">⚙️ Custom Endpoint</span>
                      <span className="text-[11px] opacity-80">Ollama, LM Studio, Groq</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProvider('builtin')}
                      className={`py-2 px-3 rounded-ctl text-left border transition-colors cursor-pointer ${
                        provider === 'builtin'
                          ? 'bg-brass text-ink border-brass font-medium'
                          : 'bg-ink border-paper/20 text-mist hover:text-paper'
                      }`}
                    >
                      <span className="block font-medium">⚡ Smart Local</span>
                      <span className="text-[11px] opacity-80">ไม่ต้องใช้ Key (ออฟไลน์)</span>
                    </button>
                  </div>
                </div>

                {/* OpenRouter Config */}
                {provider === 'openrouter' && (
                  <div className="space-y-3 pt-2 border-t border-paper/10">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-mist/90">OpenRouter API Key:</label>
                        <a
                          href="https://openrouter.ai/keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-brass-lit hover:underline inline-flex items-center gap-1"
                        >
                          รับคีย์ที่ openrouter.ai/keys
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <input
                        type="password"
                        value={openrouterKey}
                        onChange={(e) => setOpenrouterKey(e.target.value)}
                        placeholder="sk-or-v1-..."
                        className="w-full px-3 py-1.5 text-fine bg-ink rounded-ctl border border-paper/25 text-paper focus:outline-none focus:border-brass font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-mist/90 mb-1">เลือกโมเดล (Model):</label>
                      <div className="space-y-1.5 mb-2">
                        {OPENROUTER_MODELS.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setOpenrouterModel(m.id)}
                            className={`w-full py-1.5 px-3 rounded-ctl text-left text-[12px] flex items-center justify-between border transition-colors cursor-pointer ${
                              openrouterModel === m.id
                                ? 'bg-paper/20 border-brass text-brass-lit font-medium'
                                : 'bg-ink/50 border-paper/10 text-mist/80 hover:text-paper hover:bg-ink'
                            }`}
                          >
                            <span>{m.name}</span>
                            <span className="text-[11px] text-mist/60">{m.tag}</span>
                          </button>
                        ))}
                      </div>

                      <div className="pt-1">
                        <span className="block text-[11px] text-mist/60 mb-1">
                          หรือพิมพ์โมเดลอื่นๆ จาก OpenRouter:
                        </span>
                        <input
                          type="text"
                          value={openrouterModel}
                          onChange={(e) => setOpenrouterModel(e.target.value)}
                          placeholder="e.g. google/gemini-2.0-flash-exp:free"
                          className="w-full px-3 py-1.5 text-fine bg-ink rounded-ctl border border-paper/25 text-paper focus:outline-none focus:border-brass font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Gemini Config */}
                {provider === 'gemini' && (
                  <div className="space-y-3 pt-2 border-t border-paper/10">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-mist/90">Google Gemini API Key:</label>
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-brass-lit hover:underline inline-flex items-center gap-1"
                        >
                          รับคีย์ที่ Google AI Studio
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <input
                        type="password"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full px-3 py-1.5 text-fine bg-ink rounded-ctl border border-paper/25 text-paper focus:outline-none focus:border-brass font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Custom Endpoint Config */}
                {provider === 'custom' && (
                  <div className="space-y-3 pt-2 border-t border-paper/10">
                    <div>
                      <label className="block text-mist/90 mb-1">Base URL:</label>
                      <input
                        type="url"
                        value={customBaseUrl}
                        onChange={(e) => setCustomBaseUrl(e.target.value)}
                        placeholder="https://api.groq.com/openai/v1 หรือ http://localhost:11434/v1"
                        className="w-full px-3 py-1.5 text-fine bg-ink rounded-ctl border border-paper/25 text-paper focus:outline-none focus:border-brass font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-mist/90 mb-1">API Key (ถ้ามี):</label>
                      <input
                        type="password"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="Bearer token หรือ gsk_..."
                        className="w-full px-3 py-1.5 text-fine bg-ink rounded-ctl border border-paper/25 text-paper focus:outline-none focus:border-brass font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-mist/90 mb-1">Model Name:</label>
                      <input
                        type="text"
                        value={customModel}
                        onChange={(e) => setCustomModel(e.target.value)}
                        placeholder="llama-3.3-70b-versatile, llama3, qwen2.5..."
                        className="w-full px-3 py-1.5 text-fine bg-ink rounded-ctl border border-paper/25 text-paper focus:outline-none focus:border-brass font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-brass hover:bg-brass-lit text-ink font-medium rounded-ctl transition-colors shadow-sm cursor-pointer"
                  >
                    บันทึกการตั้งค่า
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('trip_openrouter_key');
                      localStorage.removeItem('trip_gemini_api_key');
                      localStorage.removeItem('trip_custom_api_key');
                      setOpenrouterKey('');
                      setGeminiApiKey('');
                      setCustomApiKey('');
                      setProvider('builtin');
                      setShowSettings(false);
                      setActionSuccess('ล้างข้อมูล Key และเปลี่ยนเป็น Smart Local Engine แล้ว');
                    }}
                    className="px-3 py-2 bg-paper/10 hover:bg-paper/20 text-mist text-[12px] rounded-ctl transition-colors cursor-pointer"
                  >
                    ล้างค่า
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Toast Notification */}
          {actionSuccess && (
            <div className="bg-moss text-paper text-fine px-4 py-2 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-brass-lit shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Quick Action Prompt Chips */}
          <div className="px-4 py-2.5 bg-mist/60 border-b border-mist-deep flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleQuickPrompt('brief')}
              className="px-2.5 py-1 bg-paper hover:bg-brass hover:text-ink text-fine text-ink border border-mist-deep rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              📊 สรุปทริป
            </button>
            <button
              onClick={() => handleQuickPrompt('line')}
              className="px-2.5 py-1 bg-paper hover:bg-brass hover:text-ink text-fine text-ink border border-mist-deep rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              📢 ร่างส่ง LINE
            </button>
            <button
              onClick={() => handleQuickPrompt('cars')}
              className="px-2.5 py-1 bg-paper hover:bg-brass hover:text-ink text-fine text-ink border border-mist-deep rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              🚗 ใครยังไม่มีรถ
            </button>
            <button
              onClick={() => handleQuickPrompt('places')}
              className="px-2.5 py-1 bg-paper hover:bg-brass hover:text-ink text-fine text-ink border border-mist-deep rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              ☕ แนะนำที่เที่ยว
            </button>
            <button
              onClick={() => handleQuickPrompt('packing')}
              className="px-2.5 py-1 bg-paper hover:bg-brass hover:text-ink text-fine text-ink border border-mist-deep rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              🎒 ของต้องเตรียม
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] p-3.5 rounded-lg text-body leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-ink text-paper'
                      : 'bg-white text-ink border border-mist-deep shadow-xs'
                  }`}
                >
                  {msg.text}

                  {/* Message Action Buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-mist-deep/60 flex flex-wrap gap-2">
                      {msg.actions.map((act, idx) => {
                        const actId = `${msg.id}-${idx}`;
                        if (act.type === 'copy') {
                          return (
                            <button
                              key={actId}
                              onClick={() => handleCopyText(act.payload, actId)}
                              className="px-3 py-1.5 bg-brass hover:bg-brass-lit text-ink text-fine font-medium rounded-ctl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              {copiedActionId === actId ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>คัดลอกแล้ว!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>{act.label}</span>
                                </>
                              )}
                            </button>
                          );
                        }

                        if (act.type === 'add_place') {
                          return (
                            <button
                              key={actId}
                              onClick={() => handleAddPlace(act.payload)}
                              className="px-3 py-1.5 bg-moss/10 hover:bg-moss hover:text-paper text-moss text-fine font-medium border border-moss/30 rounded-ctl transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{act.label}</span>
                            </button>
                          );
                        }

                        if (act.type === 'add_packing') {
                          return (
                            <button
                              key={actId}
                              onClick={() => handleAddPackingItem(act.payload)}
                              className="px-3 py-1.5 bg-brass/15 hover:bg-brass hover:text-ink text-ink text-fine font-medium border border-brass/40 rounded-ctl transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>{act.label}</span>
                            </button>
                          );
                        }

                        if (act.type === 'go_tab') {
                          return (
                            <button
                              key={actId}
                              onClick={() => {
                                setActiveTab(act.payload);
                                setIsOpen(false);
                              }}
                              className="px-3 py-1.5 bg-mist/60 hover:bg-ink hover:text-paper text-ink text-fine font-medium rounded-ctl transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>{act.label}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          );
                        }

                        return null;
                      })}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-stone mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-fine text-stone py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brass animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-brass animate-pulse [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-brass animate-pulse [animation-delay:0.4s]" />
                <span>เลขากำลังคิดคำตอบ...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-mist-deep flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                provider === 'openrouter' && !openrouterKey
                  ? 'ใส่ OpenRouter Key ที่ไอคอน ⚙️ เพื่อปลดล็อก AI เต็มรูปแบบ...'
                  : 'ถามเลขา เช่น แนะนำมื้อเย็น, ทริปขาดอะไร...'
              }
              className="flex-1 px-3.5 py-2.5 text-body bg-mist/40 border border-mist-deep rounded-ctl focus:outline-none focus:border-brass text-ink"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="px-4 py-2.5 bg-ink hover:bg-moss disabled:opacity-40 text-paper rounded-ctl transition-colors cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
};
