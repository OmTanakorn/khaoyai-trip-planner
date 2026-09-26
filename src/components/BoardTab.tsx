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

/**
 * A fresh Excalidraw collaboration room, in the shape excalidraw.com makes
 * itself: 10 random bytes as hex for the room, a 128-bit key as base64url for
 * the end-to-end encryption. The key rides in the fragment, so it never
 * reaches Excalidraw's server — whoever holds the link can open the board.
 */
function newExcalidrawRoom(): string {
  const bytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));
  const roomId = Array.from(bytes(10), (b) => b.toString(16).padStart(2, '0')).join('');
  const roomKey = btoa(String.fromCharCode(...bytes(16)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `https://excalidraw.com/#room=${roomId},${roomKey}`;
}

/**
 * What goes in the iframe. Only https is let through, so a pasted
 * `javascript:` link cannot run inside the app. A Miro board link is turned
 * into its live-embed form, the only Miro page that allows being framed.
 */
function embedUrlOf(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;

  const miro = url.hostname.endsWith('miro.com') && url.pathname.match(/^\/app\/board\/([^/]+)/);
  if (miro) return `https://miro.com/app/live-embed/${miro[1]}/`;

  return url.toString();
}

/**
 * One shared whiteboard for the whole trip. The board itself lives on
 * Excalidraw (or wherever the link points); the trip only keeps the link.
 */
export const BoardTab: React.FC<BoardTabProps> = ({ trip, onUpdateTrip }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(trip.boardUrl ?? '');

  const embedUrl = trip.boardUrl ? embedUrlOf(trip.boardUrl) : null;
  const draftIsValid = draft.trim() === '' || embedUrlOf(draft) !== null;

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
        note="กระดานเดียวที่ทุกคนวาด แปะไอเดีย จดสรุปได้พร้อมกัน ใครมีลิงก์ทริปก็เข้าบอร์ดได้"
        action={
          trip.boardUrl && !isEditing ? (
            <div className="flex items-center gap-5">
              {embedUrl && (
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
            label="ลิงก์บอร์ด"
            htmlFor="board-url"
            hint="Excalidraw, Miro หรือบอร์ดอื่นที่เป็น https ถ้าว่างไว้จะเอาบอร์ดออกจากทริป"
          >
            <input
              id="board-url"
              type="url"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="https://excalidraw.com/#room=…"
              className={input}
            />
          </Field>
          {!draftIsValid && (
            <p className="mt-2 text-fine text-brass">ต้องเป็นลิงก์ที่ขึ้นต้นด้วย https://</p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => saveBoard(draft.trim() || undefined)}
              disabled={!draftIsValid}
              className={btnSolid}
            >
              บันทึก
            </button>
            <button onClick={() => setDraft(newExcalidrawRoom())} className={btnQuiet}>
              สร้างห้อง Excalidraw ใหม่
            </button>
            <button onClick={() => setIsEditing(false)} className={btnQuiet}>
              ยกเลิก
            </button>
          </div>
        </Panel>
      ) : !trip.boardUrl ? (
        <Panel>
          <Empty
            title="ยังไม่มีบอร์ด"
            note="สร้างห้อง Excalidraw ได้ในคลิกเดียว ไม่ต้องสมัครอะไร หรือวางลิงก์บอร์ดที่มีอยู่แล้ว"
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={() => saveBoard(newExcalidrawRoom())} className={btnSolid}>
                  สร้างบอร์ดใหม่
                </button>
                <button onClick={startEditing} className={btnQuiet}>
                  วางลิงก์ที่มีอยู่
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
            referrerPolicy="no-referrer"
            className="block w-full h-[75vh] min-h-[420px] bg-paper border border-mist-deep"
          />
          <p className="mt-3 text-fine text-stone">
            ถ้าบอร์ดไม่ขึ้น บางเว็บไม่ยอมให้ฝัง กด “เปิดในแท็บใหม่” ด้านบนแทน
          </p>
        </>
      ) : (
        <Panel>
          <Empty
            title="ลิงก์บอร์ดใช้ไม่ได้"
            note="ลิงก์ที่บันทึกไว้ไม่ใช่ https เลยฝังไม่ได้ ลองเปลี่ยนเป็นลิงก์ใหม่"
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
