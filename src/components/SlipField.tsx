import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { compressImage, loadSlip, saveSlip, deleteSlip } from '../services/slips';
import { btnLink } from './ui-kit';

interface SlipFieldProps {
  tripId: string;
  slipId?: string;
  uploadedBy: string;
  label?: string;
  onChange: (slipId: string | undefined) => void;
}

/**
 * Attach a photo of a slip or receipt, and show it back.
 *
 * The image is shrunk in the browser before it goes anywhere, so a 4 MB
 * camera photo becomes something the group can load over a weak signal.
 */
export const SlipField: React.FC<SlipFieldProps> = ({
  tripId,
  slipId,
  uploadedBy,
  label = 'สลิป',
  onChange,
}) => {
  // Kept with the id it belongs to, so a stale image never shows against a
  // different slip while the new one loads.
  const [loaded, setLoaded] = useState<{ id: string; image: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!slipId) return;
    let cancelled = false;

    loadSlip(tripId, slipId)
      .then((found) => {
        if (!cancelled && found) setLoaded({ id: slipId, image: found });
      })
      .catch(() => {
        if (!cancelled) setError('เปิดสลิปไม่ได้');
      });

    return () => {
      cancelled = true;
    };
  }, [tripId, slipId]);

  const image = slipId && loaded?.id === slipId ? loaded.image : null;

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const compressed = await compressImage(file);
      const id = `slip-${Date.now()}`;
      // What comes back is what displays it: the uploaded photo's URL, or a
      // data URL when there was no signal to upload it with.
      const image = await saveSlip(tripId, id, compressed, uploadedBy);
      setLoaded({ id, image });
      onChange(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เก็บสลิปไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!slipId) return;
    if (!window.confirm('ลบสลิปนี้?')) return;
    await deleteSlip(tripId, slipId).catch(() => undefined);
    setLoaded(null);
    onChange(undefined);
  };

  return (
    <div>
      {image ? (
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="shrink-0"
            aria-expanded={isOpen}
          >
            <img
              src={image}
              alt={label}
              className={`rounded-ctl border border-mist-deep object-cover transition-all ${
                isOpen ? 'w-full max-w-sm h-auto' : 'w-16 h-16'
              }`}
            />
          </button>
          {!isOpen && (
            <div>
              <p className="text-fine text-stone">{label}แนบแล้ว กดที่รูปเพื่อดูเต็ม</p>
              <button
                type="button"
                onClick={handleRemove}
                className="mt-2 inline-flex items-center gap-1.5 text-fine text-stone hover:text-ink transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ลบ
              </button>
            </div>
          )}
        </div>
      ) : (
        <label className={`${btnLink} cursor-pointer`}>
          {busy ? 'กำลังย่อรูป' : `แนบ${label}`}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
        </label>
      )}

      {error && <p className="mt-2 text-fine text-ink">{error}</p>}
    </div>
  );
};
