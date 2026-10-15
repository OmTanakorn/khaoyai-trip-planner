import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  collection,
  onSnapshot,
  getDocs,
  setDoc,
  deleteDoc,
  deleteField,
  Firestore,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { TripData, TRIP_LISTS, TripListName } from '../types/trip';
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
        // Clearing something optional — a slip, a note — leaves `undefined`
        // behind, and Firestore rejects the whole write over it, so removing
        // one slip would fail to save the trip at all. Drop those fields
        // instead, which is what the local copy does anyway: JSON.stringify
        // omits them. Without this the two copies disagree about what a
        // cleared field means.
        ignoreUndefinedProperties: true,
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

/** Where slip photos live, or null when the trip is device-only. */
export function getBucket(): FirebaseStorage | null {
  if (!initFirebase() || !firebaseApp) return null;
  return getStorage(firebaseApp);
}

let signInAttempt: Promise<void> | null = null;

/**
 * Sign this browser in, silently.
 *
 * The trip has no accounts and nobody should be asked for one — but the
 * security rules will not hand out the trip to an anonymous request, so the
 * SDK takes an anonymous identity in the background before the first read.
 * Firebase persists it, so the same device keeps the same uid across visits.
 *
 * A failure here is not fatal: the device still has its own copy, and the
 * screens stay editable. Only the shared copy goes out of reach.
 */
export function authReady(): Promise<void> {
  if (signInAttempt) return signInAttempt;

  const app = firebaseApp ?? (initFirebase() ? firebaseApp : null);
  if (!app) return Promise.resolve();

  const auth = getAuth(app);
  signInAttempt = (
    auth.currentUser ? Promise.resolve() : signInAnonymously(auth).then(() => undefined)
  ).catch((err) => {
    console.warn('Anonymous sign-in failed; staying on this device only:', err);
  });

  return signInAttempt;
}

/*
 * How a trip is stored.
 *
 * The trip document holds only what describes the trip as a whole — its title,
 * its dates, which phase it is in. Every list people edit lives in its own
 * subcollection, one document per item:
 *
 *   trips/{tripId}/expenses/{expenseId}
 *   trips/{tripId}/members/{memberId}
 *
 * This is the difference between losing a trip and not. When the whole trip
 * was one document, every save rewrote all of it, so any device writing an
 * older copy erased everyone else's work — which is exactly what happened:
 * three expenses added on a phone were overwritten by a laptop that had been
 * sitting on a stale copy, and the document's revision counted backwards.
 *
 * Now a device only ever writes the items it touched. It cannot express "and
 * nothing else exists", so it cannot take anything away. Something disappears
 * only when `removeTripItem` is called for it — a delete is a deliberate act,
 * never a side effect of syncing.
 */

export type { TripListName };

/** Item of any trip list, as stored. */
type StoredItem = Record<string, unknown> & { id?: string; __order?: number };

/**
 * Which document an item belongs in.
 *
 * Every list item carries an `id` except an itinerary day, which is identified
 * by the day it is — so that is what names its document.
 */
function itemKey(list: TripListName, item: StoredItem): string | null {
  if (list === 'itinerary') {
    const day = item.dayNumber;
    return typeof day === 'number' ? `day-${day}` : null;
  }
  return typeof item.id === 'string' && item.id ? item.id : null;
}

/**
 * Put a list back in the order people expect.
 *
 * Documents come back sorted by id, which is not the order anything was added
 * in. `__order` is stamped when an item is first written and rides along
 * through every later edit, so editing something does not move it.
 */
function sortList(list: TripListName, items: StoredItem[]): StoredItem[] {
  if (list === 'itinerary') {
    return [...items].sort(
      (a, b) => ((a.dayNumber as number) ?? 0) - ((b.dayNumber as number) ?? 0)
    );
  }
  // The board reads newest first; every other list keeps the order it grew in.
  const direction = list === 'announcements' ? -1 : 1;
  return [...items].sort((a, b) => direction * ((a.__order ?? 0) - (b.__order ?? 0)));
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

/**
 * Watch the trip and every list on it, and report the whole thing whenever any
 * part changes.
 *
 * Each list has its own listener, so an expense arriving never carries an
 * opinion about the packing list. The pieces are assembled here into the one
 * `TripData` the screens already expect.
 */
export function subscribeToTrip(
  tripId: string,
  onData: (data: TripData) => void,
  onError?: (err: unknown) => void
): () => void {
  const db = initFirebase();

  if (!db) {
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
    onData(loadLocalTripData());
    return () => window.removeEventListener('storage', handleStorageEvent);
  }

  // Signing in is a round trip, and the rules turn away whatever arrives
  // before it lands. Put this device's copy on screen meanwhile so the trip is
  // never blank while that happens.
  const seed = loadLocalTripData();
  onData(seed);

  let trip: Partial<TripData> = seed;
  const lists = new Map<TripListName, StoredItem[]>();
  let stopped = false;
  const unsubscribes: Array<() => void> = [];

  const emit = () => {
    if (stopped) return;
    const assembled = withDefaults(trip);
    const bag = assembled as unknown as Record<string, unknown>;
    const migrated = (trip as { listsMigrated?: boolean }).listsMigrated === true;

    for (const list of TRIP_LISTS) {
      const items = lists.get(list);
      if (!items) continue; // that list's first snapshot has not arrived yet

      // Once the lists have moved, the subcollection is the whole truth —
      // including when it is empty. Falling back to the copy still sitting
      // inline on the trip document would put back everything just deleted.
      if (migrated || items.length) bag[list] = sortList(list, items);
    }
    saveLocalTripData(assembled);
    onData(assembled);
  };

  const fail = (err: unknown) => {
    console.warn('Firestore subscription error:', err);
    if (onError) onError(err);
  };

  authReady().then(() => {
    if (stopped) return;

    const tripDocRef = doc(db, 'trips', tripId);
    unsubscribes.push(
      onSnapshot(
        tripDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            trip = snapshot.data() as TripData;
            emit();
          } else {
            // First time in Firestore: seed from what this device has.
            seedTrip(tripId, loadLocalTripData()).catch(fail);
          }
        },
        fail
      )
    );

    for (const list of TRIP_LISTS) {
      unsubscribes.push(
        onSnapshot(
          collection(db, 'trips', tripId, list),
          (snapshot) => {
            lists.set(
              list,
              snapshot.docs.map((d) => d.data() as StoredItem)
            );
            emit();
          },
          fail
        )
      );
    }
  });

  return () => {
    stopped = true;
    for (const stop of unsubscribes) stop();
  };
}

/** Fields that describe the trip itself rather than a list on it. */
const SCALAR_FIELDS = [
  'id',
  'title',
  'tagline',
  'destination',
  'startDate',
  'endDate',
  'statusPhase',
  'coverImage',
  'confirmedAccommodation',
] as const;

function scalarsOf(trip: Partial<TripData>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of SCALAR_FIELDS) {
    const value = (trip as Record<string, unknown>)[key];
    // These fields are merged into the trip document, and a merge leaves out
    // what it is not given — so cancelling the villa has to be spelled out as
    // a removal rather than passed along as `undefined`.
    out[key] = value === undefined ? deleteField() : value;
  }
  return out;
}

/** Write a trip that Firestore has never seen, lists and all. */
async function seedTrip(tripId: string, trip: TripData): Promise<void> {
  const db = initFirebase();
  if (!db) return;
  await setDoc(doc(db, 'trips', tripId), scalarsOf(trip), { merge: true });
  await Promise.all(
    TRIP_LISTS.flatMap((list) => {
      const items = ((trip as unknown as Record<string, unknown>)[list] ?? []) as StoredItem[];
      return items.map((item) => saveTripItem(tripId, list, item));
    })
  );
}

/**
 * Add an item to a list, or save a change to one already there.
 *
 * The write names one document, so it cannot affect any other item, and it
 * cannot remove anything.
 *
 * Within that one document the item is replaced, not merged, so clearing an
 * optional field actually clears it — pass the whole item, not a patch. The
 * item read back carries `__order`, and spreading it through an edit brings
 * that along, which is why editing something does not move it in the list.
 */
export async function saveTripItem(
  tripId: string,
  list: TripListName,
  item: StoredItem
): Promise<void> {
  const key = itemKey(list, item);
  if (!key) {
    console.warn(`Refusing to save an item with no id to ${list}`, item);
    return;
  }

  const db = initFirebase();
  if (!db) return;
  await authReady();

  const stored: StoredItem = { ...item, __order: item.__order ?? Date.now() };
  await setDoc(doc(db, 'trips', tripId, list, key), stored);
}

/**
 * Take an item off a list.
 *
 * The only way anything leaves a trip. Nothing disappears as a consequence of
 * a sync, an older copy arriving, or a device catching up.
 */
export async function removeTripItem(
  tripId: string,
  list: TripListName,
  itemId: string
): Promise<void> {
  const db = initFirebase();
  if (!db) return;
  await authReady();
  await deleteDoc(doc(db, 'trips', tripId, list, itemId));
}

/**
 * A change to the trip itself — its title, its phase, the villa once it is
 * booked. Lists are not written here; they go item by item.
 *
 * The function form is applied to what this device currently holds. It runs
 * more than once, so it must be pure: build ids and timestamps before calling.
 */
export type TripUpdate = TripData | ((current: TripData) => TripData);

function applyUpdate(update: TripUpdate, current: TripData): TripData {
  return typeof update === 'function' ? update(current) : update;
}

export async function persistTripData(
  tripId: string,
  update: TripUpdate
): Promise<TripData> {
  // This device's own copy is written first, always — an edit must survive a
  // reload on a phone halfway up the mountain.
  const local = applyUpdate(update, loadLocalTripData());
  saveLocalTripData(local);

  const db = initFirebase();
  if (!db) return local;

  await authReady();

  // Only the trip's own fields, and merged, so a save here can never reach a
  // list. Firestore queues this offline and replays it on reconnect.
  await setDoc(doc(db, 'trips', tripId), scalarsOf(local), { merge: true });
  return local;
}

/**
 * Replace the whole trip: importing a backup file, or resetting to the trip
 * that ships with the build.
 *
 * The only write that removes items nobody asked to remove, and that is the
 * point of it — somebody chose to replace the trip. Every other path adds and
 * edits one item at a time and can take nothing away.
 */
export async function replaceTripData(tripId: string, trip: TripData): Promise<TripData> {
  saveLocalTripData(trip);

  const db = initFirebase();
  if (!db) return trip;
  await authReady();

  await setDoc(doc(db, 'trips', tripId), scalarsOf(trip), { merge: true });

  for (const list of TRIP_LISTS) {
    const items = ((trip as unknown as Record<string, unknown>)[list] ?? []) as StoredItem[];
    const keep = new Set(items.map((item) => itemKey(list, item)).filter(Boolean));

    const existing = await getDocs(collection(db, 'trips', tripId, list));
    await Promise.all(
      existing.docs.filter((d) => !keep.has(d.id)).map((d) => deleteDoc(d.ref))
    );
    await Promise.all(items.map((item) => saveTripItem(tripId, list, item)));
  }

  return trip;
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
