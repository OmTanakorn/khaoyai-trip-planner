import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  MessageCircle, 
  Link as LinkIcon, 
  X, 
  Sparkles 
} from 'lucide-react';
import { TripData } from '../types/trip';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripData;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, trip }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedLineText, setCopiedLineText] = useState(false);

  if (!isOpen) return null;

  const confirmedMembers = trip.members.filter((m) => m.status === 'confirmed');

  // Format LINE text summary
  const generateLineSummary = () => {
    let text = `🌿 ชวนไปเที่ยวเขาใหญ่ 2 วัน 1 คืน! 🚗⛺\n`;
    text += `📅 วันที่: 31 ต.ค. - 1 พ.ย. 2569\n`;
    text += `👥 เพื่อนที่คอนเฟิร์มแล้ว (${confirmedMembers.length} คน): ${confirmedMembers.length > 0 ? confirmedMembers.map(m => m.nickname).join(', ') : 'กำลังเปิดรับลงชื่อ'}\n\n`;

    if (trip.confirmedAccommodation) {
      text += `🏡 ที่พัก: ${trip.confirmedAccommodation.name}\n`;
    } else {
      text += `🏡 ที่พัก: กำลังเปิดโหวตพูลวิลล่า (ช่วยกันเสนอตัวเลือกได้เลย)\n`;
    }

    if (trip.cars.length > 0) {
      text += `🚗 รถเดินทาง (${trip.cars.length} คัน):\n`;
      trip.cars.forEach((car, i) => {
        text += `• คันที่ ${i + 1} (${car.driverName}): ${car.carModel} [รับได้ ${car.maxSeats} ที่นั่ง]\n`;
      });
    } else {
      text += `🚗 รถเดินทาง: กำลังเปิดรับอาสาสมัครคนขับรถ\n`;
    }

    text += `\n📌 มาร่วมลงชื่อ เสนอที่พัก/รถ และโหวตแผนเที่ยวได้ที่ลิงก์นี้:\n${window.location.href}`;
    return text;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyLineText = () => {
    navigator.clipboard.writeText(generateLineSummary());
    setCopiedLineText(true);
    setTimeout(() => setCopiedLineText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">แชร์ข้อมูลทริปให้เพื่อนในกลุ่ม</h3>
              <p className="text-xs text-slate-500">คัดลอกลิงก์หรือข้อความสรุปส่งเข้ากลุ่ม LINE</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option 1: Copy Direct Link */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <label className="block text-xs font-bold text-slate-700">1. ลิงก์สำหรับเปิดดูเว็บทริป</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={window.location.href}
              className="flex-1 p-2 text-xs rounded-xl border border-slate-200 bg-white font-mono text-slate-600 truncate"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
            </button>
          </div>
        </div>

        {/* Option 2: Formatted text for LINE */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>2. ข้อความสรุปสำหรับส่งเข้ากลุ่ม LINE</span>
            </label>
            <button
              onClick={handleCopyLineText}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copiedLineText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLineText ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความ LINE'}</span>
            </button>
          </div>

          <textarea
            readOnly
            rows={8}
            value={generateLineSummary()}
            className="w-full p-2.5 text-[11px] rounded-xl border border-emerald-200 bg-white text-slate-700 font-mono leading-relaxed"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
