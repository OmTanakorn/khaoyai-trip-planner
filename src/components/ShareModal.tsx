import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { TripData } from '../types/trip';
import { Modal, Field } from './ui';
import { input, btnSolid, btnQuiet } from './ui-kit';

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

  const generateLineSummary = () => {
    let text = `ทริปเขาใหญ่ สองวันหนึ่งคืน\n`;
    text += `31 ต.ค. — 1 พ.ย. 2569\n\n`;
    text += `ไปแน่แล้ว ${confirmedMembers.length} คน`;
    text +=
      confirmedMembers.length > 0
        ? `: ${confirmedMembers.map((m) => m.nickname).join(', ')}\n`
        : ` ยังเปิดรับลงชื่ออยู่\n`;

    text += trip.confirmedAccommodation
      ? `ที่พัก: ${trip.confirmedAccommodation.name}\n`
      : `ที่พัก: ยังโหวตกันอยู่ เสนอวิลล่าที่เจอมาได้\n`;

    if (trip.cars.length > 0) {
      text += `\nรถ ${trip.cars.length} คัน\n`;
      trip.cars.forEach((car, i) => {
        text += `${i + 1}. ${car.driverName} · ${car.carModel} · ${car.maxSeats} ที่นั่ง\n`;
      });
    } else {
      text += `รถ: ยังไม่มีใครอาสาขับ\n`;
    }

    text += `\nลงชื่อ เสนอที่พัก และโหวตแผนเที่ยวได้ที่\n${window.location.href}`;
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
    <Modal
      title="แชร์ทริปให้เพื่อน"
      note="ส่งลิงก์ให้เปิดเอง หรือคัดลอกสรุปไปวางในไลน์กลุ่ม"
      onClose={onClose}
      wide
    >
      <div className="space-y-7">
        <Field label="ลิงก์เว็บทริป" htmlFor="share-link">
          <div className="flex gap-3">
            <input
              id="share-link"
              type="text"
              readOnly
              value={window.location.href}
              className={`${input} flex-1 truncate`}
            />
            <button onClick={handleCopyLink} className={`${btnSolid} shrink-0`}>
              <span className="inline-flex items-center gap-1.5">
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'คัดลอกแล้ว' : 'คัดลอก'}
              </span>
            </button>
          </div>
        </Field>

        <div>
          <div className="flex items-end justify-between gap-4 mb-1.5">
            <label htmlFor="share-summary" className="text-fine text-stone">
              สรุปสำหรับวางในไลน์
            </label>
            <button onClick={handleCopyLineText} className={btnSolid}>
              <span className="inline-flex items-center gap-1.5">
                {copiedLineText ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedLineText ? 'คัดลอกแล้ว' : 'คัดลอกสรุป'}
              </span>
            </button>
          </div>
          <textarea
            id="share-summary"
            readOnly
            rows={10}
            value={generateLineSummary()}
            className={`${input} leading-relaxed`}
          />
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className={btnQuiet}>
            ปิด
          </button>
        </div>
      </div>
    </Modal>
  );
};
