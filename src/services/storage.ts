import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  onSnapshot,
  setDoc,
  runTransaction,
  Firestore,
  DocumentReference,
} from 'firebase/firestore';
import { TripData } from '../types/trip';
import { initialTripData } from '../data/initialData';

const LOCAL_STORAGE_KEY = 'khaoyai_trip_data_v2_planning';

/**
 * Trip identity and artwork ship with the build — no screen edits them — so
 * they always win over whatever an older visit left in storage or Firestore.
 * Everything else on the trip belongs to whoever filled it in.
 */
const BUILD_OWNED_FIELDS = {
  title: initialTripData.title,
  tagline: initialTripData.tagline,
  destination: initialTripData.destination,
  coverImage: initialTripData.coverImage,
} as const;

const FIREBASE_CONFIG_KEY = 'khaoyai_firebase_config';

/**
 * A trip stored before a field existed comes back without it, and screens then
 * map over `undefined`. Fill anything missing from the shipped defaults and
 * re-apply the build-owned fields on top.
 */
function withDefaults(data: Partial<TripData>): TripData {
  return { ...initialTripData, ...data, ...BUILD_OWNED_FIELDS };
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyD1Dtdg6mZhIyrdk936xRUITne31f_Qvxo",
  authDomain: "khaoyaitrip-9ecb7.firebaseapp.com",
  projectId: "khaoyaitrip-9ecb7",
  storageBucket: "khaoyaitrip-9ecb7.firebasestorage.app",
  messagingSenderId: "257261356521",
  appId: "1:257261356521:web:c5151bc502b81f9e373778",
};

// Initialize Firebase if configured
export function getFirebaseConfig(): FirebaseConfig | null {
  try {
    const saved = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error reading saved firebase config', e);
  }

  // Fallback to env vars if provided
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }

  return DEFAULT_FIREBASE_CONFIG;
}

export function isFirebaseConnected(): boolean {
  return getFirebaseConfig() !== null;
}

export function saveFirebaseConfig(config: FirebaseConfig): boolean {
  try {
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
    // Re-init
    firebaseApp = null;
    firestoreDb = null;
    initFirebase();
    return true;
  } catch (e) {
    console.error('Failed to save Firebase config', e);
    return false;
  }
}

export function removeFirebaseConfig(): void {
  localStorage.removeItem(FIREBASE_CONFIG_KEY);
  firebaseApp = null;
  firestoreDb = null;
}

function initFirebase(): Firestore | null {
  if (firestoreDb) return firestoreDb;
  const config = getFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) return null;

  try {
    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }
    try {
      // Keep a copy of the trip in the browser so it opens and stays editable
      // where the signal drops — which is most of Khao Yai. Firestore replays
      // the queued writes once it reconnects.
      firestoreDb = initializeFirestore(firebaseApp, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      // Already initialised on this page, or the browser refuses storage.
      firestoreDb = getFirestore(firebaseApp);
    }
    return firestoreDb;
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
    return null;
  }
}

/** The live Firestore handle, or null when the trip is device-only. */
export function getDb(): Firestore | null {
  return initFirebase();
}

// Local Storage helpers
export function loadLocalTripData(): TripData {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return withDefaults(parsed);
    }
  } catch (e) {
    console.warn('Error reading local trip data', e);
  }
  return initialTripData;
}

export function saveLocalTripData(data: TripData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving local trip data', e);
  }
}

/** Higher wins. A trip stored before revisions existed counts as zero. */
const revisionOf = (trip: Partial<TripData>): number => trip.revision ?? 0;

// Realtime subscription or local polling
export function subscribeToTrip(
  tripId: string,
  onData: (data: TripData) => void,
  onError?: (err: unknown) => void
): () => void {
  const db = initFirebase();

  if (db) {
    try {
      const tripDocRef = doc(db, 'trips', tripId);
      const unsubscribe = onSnapshot(
        tripDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = withDefaults(snapshot.data() as TripData);
            const local = loadLocalTripData();

            // An edit made while the network was out lives only on this
            // device, and Firestore serves the older document from its cache
            // until it reconnects. Keep the newer copy and push it up rather
            // than letting the stale one erase what was typed.
            if (revisionOf(data) < revisionOf(local)) {
              onData(local);
              repairCloudCopy(tripDocRef, local);
              return;
            }

            saveLocalTripData(data);
            onData(data);
          } else {
            // First time in Firestore: seed initial data
            const initial = loadLocalTripData();
            setDoc(tripDocRef, initial)
              .then(() => onData(initial))
              .catch((err) => {
                console.error('Error seeding initial Firestore trip:', err);
                if (onError) onError(err);
              });
          }
        },
        (error) => {
          console.warn('Firestore subscription error (falling back to LocalStorage):', error);
          if (onError) onError(error);
          onData(loadLocalTripData());
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Firestore subscription initialization failed:', e);
      if (onError) onError(e);
    }
  }

  // LocalStorage broadcast listener across browser tabs!
  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === LOCAL_STORAGE_KEY && event.newValue) {
      try {
        onData(withDefaults(JSON.parse(event.newValue)));
      } catch (err) {
        console.error('Storage event parse error', err);
      }
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  // Initial local delivery
  onData(loadLocalTripData());

  return () => {
    window.removeEventListener('storage', handleStorageEvent);
  };
}

/**
 * Push this device's newer copy back up. Unlike a transaction — which needs a
 * live connection — a plain write is queued by Firestore and replayed on
 * reconnect, which is what makes the repair land at all.
 */
let repairInFlight = false;

function repairCloudCopy(tripDocRef: DocumentReference, local: TripData): void {
  if (repairInFlight) return;
  repairInFlight = true;
  setDoc(tripDocRef, local)
    .catch((err) => console.warn('Could not push the local trip copy up:', err))
    .finally(() => {
      repairInFlight = false;
    });
}

/**
 * A change to the trip: either a whole replacement (import, reset) or a
 * function describing the change. Prefer the function — it is applied to
 * whatever is stored at that moment, so two people saving at once keep both
 * edits instead of the later save overwriting the earlier one.
 *
 * The function runs more than once (locally, then again inside the
 * transaction, then again on every retry), so it must be pure: build new ids
 * and timestamps before calling, not inside.
 */
export type TripUpdate = TripData | ((current: TripData) => TripData);

function applyUpdate(update: TripUpdate, current: TripData): TripData {
  return typeof update === 'function' ? update(current) : update;
}

/**
 * Apply a change and sync it.
 *
 * With Firestore, the change runs inside a transaction: read the newest
 * document, apply the change to that, write it back. Firestore retries the
 * whole thing if someone else wrote in between, so concurrent edits to
 * different parts of the trip both survive.
 *
 * Without Firestore, the change is applied to what is in local storage right
 * now rather than to the caller's copy, which keeps two browser tabs honest.
 */
export async function persistTripData(
  tripId: string,
  update: TripUpdate
): Promise<TripData> {
  // This device's own copy is written first, always. A transaction needs a
  // live connection — offline it hangs rather than failing — and an edit must
  // still survive a reload on a phone halfway up the mountain.
  const previous = loadLocalTripData();
  const local = {
    ...applyUpdate(update, previous),
    revision: revisionOf(previous) + 1,
  };
  saveLocalTripData(local);

  const db = initFirebase();
  if (!db) return local;

  const tripDocRef = doc(db, 'trips', tripId);

  try {
    const next = await runTransaction(db, async (tx) => {
      const snapshot = await tx.get(tripDocRef);
      const current = snapshot.exists()
        ? withDefaults(snapshot.data() as TripData)
        : loadLocalTripData();

      const updated = {
        ...applyUpdate(update, current),
        // Past both what the cloud holds and what this device already counted,
        // so neither side reads the result as stale.
        revision: Math.max(revisionOf(current) + 1, revisionOf(local)),
      };
      tx.set(tripDocRef, updated);
      return updated;
    });

    saveLocalTripData(next);
    return next;
  } catch (e) {
    console.error('Failed to sync to Firestore:', e);
    // The edit is already on this device; only the cloud copy is behind.
    throw e;
  }
}

export function exportTripToJson(data: TripData): string {
  return JSON.stringify(data, null, 2);
}

export function importTripFromJson(jsonStr: string): TripData {
  const parsed = JSON.parse(jsonStr);
  if (!parsed.id || !parsed.title || !Array.isArray(parsed.members)) {
    throw new Error('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
  }
  const trip = withDefaults(parsed);
  saveLocalTripData(trip);
  return trip;
}
