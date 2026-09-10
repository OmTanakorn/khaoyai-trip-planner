import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, Firestore } from 'firebase/firestore';
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
    firestoreDb = getFirestore(firebaseApp);
    return firestoreDb;
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
    return null;
  }
}

// Local Storage helpers
export function loadLocalTripData(): TripData {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...initialTripData, ...parsed, ...BUILD_OWNED_FIELDS };
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
            const data = {
              ...(snapshot.data() as TripData),
              ...BUILD_OWNED_FIELDS,
            };
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
        onData(JSON.parse(event.newValue));
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

export async function persistTripData(data: TripData): Promise<void> {
  // Always update local storage first for snappy UI
  saveLocalTripData(data);

  const db = initFirebase();
  if (db) {
    try {
      const tripDocRef = doc(db, 'trips', data.id);
      await setDoc(tripDocRef, data);
    } catch (e) {
      console.error('Failed to sync to Firestore:', e);
      throw e;
    }
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
  saveLocalTripData(parsed);
  return parsed;
}
