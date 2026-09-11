import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getBucket, getDb } from './storage';

/*
 * Transfer slips.
 *
 * A slip is a photo, and photos belong in Cloud Storage rather than in a
 * Firestore document: base64 inflates the bytes by a third, every read bills
 * for the whole document, and 1 MiB is not far away.
 *
 * Slips written before the bucket existed are still base64 inside
 * `trips/{tripId}/slips/{slipId}`, so reads fall back to there. Nothing
 * migrates them; they are read where they lie until someone replaces them.
 *
 * What callers get back is always something an `<img src>` accepts — an https
 * URL for a stored photo, a data URL for a cached or legacy one.
 */

const SLIP_PREFIX = 'khaoyai_slip_';

/** Well under what a phone will happily load on a weak signal. */
const MAX_EDGE = 1200;
const JPEG_QUALITY = 0.65;

function storagePath(tripId: string, slipId: string): string {
  return `trips/${tripId}/slips/${slipId}`;
}

/**
 * Shrink a photo before it is stored. Phone cameras produce several megabytes
 * for something that only has to be legible, and everyone on the trip pays
 * for that in loading time on a weak signal.
 */
export function compressImage(file: File): Promise<Blob> {
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
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('เบราว์เซอร์นี้ย่อรูปไม่ได้'));
          },
          'image/jpeg',
          JPEG_QUALITY
        );
      };
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('อ่านไฟล์รูปไม่ได้'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

function cacheLocally(slipId: string, dataUrl: string): void {
  try {
    localStorage.setItem(SLIP_PREFIX + slipId, dataUrl);
  } catch {
    // Storage full, or a browser that refuses it. The slip still shows; it
    // just gets fetched again next time.
  }
}

/**
 * Store a slip and return something that will display it.
 *
 * The upload is the good path. Where it fails — which on this trip usually
 * means no signal — the photo goes into Firestore as base64 instead: that
 * write is queued by the SDK and replayed on reconnect, so the slip survives
 * a reload halfway up the mountain rather than vanishing with the tab.
 */
export async function saveSlip(
  tripId: string,
  slipId: string,
  image: Blob,
  uploadedBy: string
): Promise<string> {
  const dataUrl = await toDataUrl(image);
  cacheLocally(slipId, dataUrl);

  const bucket = getBucket();
  const db = getDb();
  if (!bucket || !db) return dataUrl;

  const uploadedAt = new Date().toISOString();

  try {
    const object = ref(bucket, storagePath(tripId, slipId));
    await uploadBytes(object, image, { contentType: 'image/jpeg' });
    const url = await getDownloadURL(object);

    await setDoc(doc(db, 'trips', tripId, 'slips', slipId), {
      url,
      uploadedBy,
      uploadedAt,
    });
    return url;
  } catch (e) {
    console.warn('Could not upload the slip; keeping it in Firestore instead', e);
    await setDoc(doc(db, 'trips', tripId, 'slips', slipId), {
      image: dataUrl,
      uploadedBy,
      uploadedAt,
    });
    return dataUrl;
  }
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

  const data = snapshot.data() as { url?: string; image?: string };

  // Written before the bucket existed: base64, and worth caching because
  // every read of it bills for the whole document.
  if (data.image) {
    cacheLocally(slipId, data.image);
    return data.image;
  }

  return data.url ?? null;
}

export async function deleteSlip(tripId: string, slipId: string): Promise<void> {
  try {
    localStorage.removeItem(SLIP_PREFIX + slipId);
  } catch {
    // Nothing cached here.
  }

  const db = getDb();
  if (!db) return;

  const bucket = getBucket();
  if (bucket) {
    // A legacy slip has no object behind it, and a delete that already
    // happened is not a failure either.
    await deleteObject(ref(bucket, storagePath(tripId, slipId))).catch(() => undefined);
  }

  await deleteDoc(doc(db, 'trips', tripId, 'slips', slipId));
}
