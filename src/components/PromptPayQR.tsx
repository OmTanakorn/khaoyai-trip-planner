import React, { useEffect, useState } from 'react';
import { buildPromptPayPayload } from '../services/promptpay';
import { baht } from './ui-kit';

interface PromptPayQRProps {
  promptPayId: string;
  amount: number;
  payeeName: string;
}

/**
 * A scannable code for one exact payment.
 *
 * The QR library is pulled in only when a code is actually shown — most
 * visits never settle up, and it is not worth the download on a hilltop.
 */
export const PromptPayQR: React.FC<PromptPayQRProps> = ({
  promptPayId,
  amount,
  payeeName,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const payload = buildPromptPayPayload(promptPayId, amount);

  useEffect(() => {
    if (!payload) return;
    let cancelled = false;

    import('qrcode')
      .then((QRCode) =>
        QRCode.toDataURL(payload, {
          margin: 1,
          width: 512,
          color: { dark: '#12211cff', light: '#f7f7f4ff' },
        })
      )
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (!payload) {
    return (
      <p className="text-body text-stone">
        เลข{payeeName ? `พร้อมเพย์ของ ${payeeName}` : 'พร้อมเพย์'}ยังไม่ถูกต้อง
        ใส่เบอร์มือถือ 10 หลัก หรือเลขบัตรประชาชน 13 หลัก ในหน้าเพื่อน
      </p>
    );
  }

  return (
    <figure className="text-center">
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`คิวอาร์พร้อมเพย์ โอนให้ ${payeeName} ${baht(amount)}`}
          className="w-56 h-56 mx-auto rounded-ctl"
        />
      ) : (
        <div className="w-56 h-56 mx-auto rounded-ctl bg-mist flex items-center justify-center">
          <span className="text-fine text-stone">
            {failed ? 'สร้างคิวอาร์ไม่สำเร็จ' : 'กำลังสร้างคิวอาร์'}
          </span>
        </div>
      )}
      <figcaption className="mt-4">
        <span className="block font-display text-title text-ink">{baht(amount)}</span>
        <span className="block mt-1 text-fine text-stone">
          พร้อมเพย์ {payeeName} · {promptPayId}
        </span>
        <span className="block mt-3 text-fine text-stone">
          ยอดฝังอยู่ในคิวอาร์แล้ว สแกนแล้วกดยืนยันได้เลย ไม่ต้องพิมพ์เลขเอง
        </span>
      </figcaption>
    </figure>
  );
};
