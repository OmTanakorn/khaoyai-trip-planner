import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { TripData } from '../types/trip';
import { TripUpdate } from '../services/storage';
import { PageHead, Panel, Empty, Field } from './ui';
import { input, btnSolid, btnQuiet, btnLink } from './ui-kit';

interface BoardTabProps {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
}

const MIRO_DASHBOARD = 'https://miro.com/app/dashboard/';

/** A pasted link, accepted only when it is https so nothing pasted can run inside the app. */
function httpsUrlOf(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/**
 * The live-embed form of a Miro board link, the only Miro page that allows
 * being framed and stays in sync for everyone. Any other board gets null:
 * Excalidraw, for one, turns its collaboration off when framed, so each
 * viewer would draw on a private copy.
 */
function miroEmbedOf(raw: string): string | null {
  const url = httpsUrlOf(raw);
  if (!url || !url.hostname.endsWith('miro.com')) return null;
  const board = url.pathname.match(/^\/app\/(?:board|live-embed)\/([^/]+)/);
  return board ? `https://miro.com/app/live-embed/${board[1]}/` : null;
}

/**
 * One shared whiteboard for the whole trip. The board itself lives on Miro;
 * the trip only keeps the link.
 */
export const BoardTab: React.FC<BoardTabProps> = ({ trip, onUpdateTrip }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(trip.boardUrl ?? '');

  const embedUrl = trip.boardUrl ? miroEmbedOf(trip.boardUrl) : null;
  const linkIsSafe = trip.boardUrl ? httpsUrlOf(trip.boardUrl) !== null : false;
  const draftIsValid = draft.trim() === '' || httpsUrlOf(draft) !== null;

  const saveBoard = (url: string | undefined) => {
    onUpdateTrip((current) => ({ ...current, boardUrl: url }));
    setIsEditing(false);
  };

  const startEditing = () => {
    setDraft(trip.boardUrl ?? '');
    setIsEditing(true);
  };

  return (
    <div className="pb-16">
      <PageHead
        title="บอร์ดรวม"
        note="กระดาน Miro เดียวที่ทุกคนวาด แปะไอเดีย จดสรุปได้พร้อมกัน ทุกคนต้องล็อกอิน Miro ก่อนถึงจะแก้บอร์ดได้"
        action={
          trip.boardUrl && !isEditing ? (
            <div className="flex items-center gap-5">
              {linkIsSafe && (
                <a href={trip.boardUrl} target="_blank" rel="noopener noreferrer" className={btnLink}>
                  เปิดในแท็บใหม่
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button onClick={startEditing} className={btnLink}>
                เปลี่ยนบอร์ด
              </button>
            </div>
          ) : undefined
        }
      />

      {isEditing ? (
        <Panel>
          <Field
            label="ลิงก์บอร์ด Miro"
            htmlFor="board-url"
            hint="ใน Miro กด Share ตั้งเป็น “Anyone with the link can edit” แล้วกด Copy board link มาวาง ถ้าว่างไว้จะเอาบอร์ดออกจากทริป"
          >
            <input
              id="board-url"
              type="url"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="https://miro.com/app/board/…"
              className={input}
            />
          </Field>
          {!draftIsValid && (
            <p className="mt-2 text-fine text-brass">ต้องเป็นลิงก์ที่ขึ้นต้นด้วย https://</p>
          )}
          {draftIsValid && draft.trim() !== '' && !miroEmbedOf(draft) && (
            <p className="mt-2 text-fine text-brass">
              ไม่ใช่ลิงก์บอร์ด Miro จะฝังในหน้านี้ไม่ได้ ทุกคนต้องกด “เปิดในแท็บใหม่” แทน
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => saveBoard(draft.trim() || undefined)}
              disabled={!draftIsValid}
              className={btnSolid}
            >
              บันทึก
            </button>
            <a href={MIRO_DASHBOARD} target="_blank" rel="noopener noreferrer" className={btnQuiet}>
              สร้างบอร์ดใหม่ใน Miro
            </a>
            <button onClick={() => setIsEditing(false)} className={btnQuiet}>
              ยกเลิก
            </button>
          </div>
        </Panel>
      ) : !trip.boardUrl ? (
        <Panel>
          <Empty
            title="ยังไม่มีบอร์ด"
            note="สร้างบอร์ดใน Miro แล้วเอาลิงก์มาวาง ทุกคนในทริปจะเห็นและแก้บอร์ดเดียวกัน"
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <a href={MIRO_DASHBOARD} target="_blank" rel="noopener noreferrer" className={btnQuiet}>
                  สร้างบอร์ดใน Miro
                </a>
                <button onClick={startEditing} className={btnSolid}>
                  วางลิงก์บอร์ด
                </button>
              </div>
            }
          />
        </Panel>
      ) : embedUrl ? (
        <>
          <iframe
            src={embedUrl}
            title="บอร์ดรวม"
            allow="clipboard-read; clipboard-write; fullscreen"
            allowFullScreen
            className="block w-full h-[75vh] min-h-[420px] bg-paper border border-mist-deep"
          />
          <p className="mt-3 text-fine text-stone">
            ถ้าบอร์ดไม่ขึ้นหรือแก้ไม่ได้ ให้ล็อกอิน Miro ในกรอบ หรือกด “เปิดในแท็บใหม่” ด้านบน
          </p>
        </>
      ) : (
        <Panel>
          <Empty
            title={linkIsSafe ? 'บอร์ดนี้ฝังในหน้าไม่ได้' : 'ลิงก์บอร์ดใช้ไม่ได้'}
            note={
              linkIsSafe
                ? 'ฝังได้เฉพาะบอร์ด Miro ถ้าฝังบอร์ดอื่นแต่ละคนจะเห็นคนละกระดาน กด “เปิดในแท็บใหม่” ด้านบน หรือเปลี่ยนเป็นบอร์ด Miro'
                : 'ลิงก์ที่บันทึกไว้ไม่ใช่ https ลองเปลี่ยนเป็นลิงก์ใหม่'
            }
            action={
              <button onClick={startEditing} className={btnSolid}>
                เปลี่ยนบอร์ด
              </button>
            }
          />
        </Panel>
      )}
    </div>
  );
};
