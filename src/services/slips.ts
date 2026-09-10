import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getDb } from './storage';

/*
 * Transfer slips.
 *
 * Firebase Storage is not turned on for this project, so slips live as
 * compressed images in their own Firestore documents — one per slip, kept out
 * of the trip document so they cannot push it towards the 1 MiB ceiling. They
 * are fetched only when somebody opens one.
 */

const SLIP_PREFIX = 'khaoyai_slip_';

/** Well under the document limit, and still readable enough to check a slip. */
const MAX_EDGE = 1200;
const JPEG_QUALITY = 0.65;

/**
 * Shrink a photo before it is stored. Phone cameras produce several megabytes
 * for something that only has to be legible, and everyone on the trip pays
 * for that in loading time on a weak signal.
 */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('อ่านไฟล์รูปไม่ได้'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('ไฟล์นี้ไม่ใช่รูปภาพ'));
      image.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('เบราว์เซอร์นี้ย่อรูปไม่ได้'));
          return;
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function saveSlip(
  tripId: string,
  slipId: string,
  image: string,
  uploadedBy: string
): Promise<void> {
  try {
    localStorage.setItem(SLIP_PREFIX + slipId, image);
  } catch (e) {
    console.warn('Could not keep a local copy of the slip', e);
  }

  const db = getDb();
  if (!db) return;

  await setDoc(doc(db, 'trips', tripId, 'slips', slipId), {
    image,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
  });
}

export async function loadSlip(tripId: string, slipId: string): Promise<string | null> {
  try {
    const cached = localStorage.getItem(SLIP_PREFIX + slipId);
    if (cached) return cached;
  } catch {
    // No local copy; fall through to the network.
  }

  const db = getDb();
  if (!db) return null;

  const snapshot = await getDoc(doc(db, 'trips', tripId, 'slips', slipId));
  if (!snapshot.exists()) return null;

  const image = (snapshot.data() as { image?: string }).image ?? null;
  if (image) {
    try {
      localStorage.setItem(SLIP_PREFIX + slipId, image);
    } catch {
      // Storage full — showing the slip still works, it just refetches later.
    }
  }
  return image;
}

export async function deleteSlip(tripId: string, slipId: string): Promise<void> {
  try {
    localStorage.removeItem(SLIP_PREFIX + slipId);
  } catch {
    // Nothing cached here.
  }

  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'trips', tripId, 'slips', slipId));
}
