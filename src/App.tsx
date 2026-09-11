import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewTab } from './components/OverviewTab';
import { CarsTab } from './components/CarsTab';
import { AccommodationTab } from './components/AccommodationTab';
import { ItineraryTab } from './components/ItineraryTab';
import { FoodTab } from './components/FoodTab';
import { ExpensesTab } from './components/ExpensesTab';
import { PackingTab } from './components/PackingTab';
import { MembersTab } from './components/MembersTab';
import { DayOfTab } from './components/DayOfTab';
import { SyncModal } from './components/SyncModal';
import { ShareModal } from './components/ShareModal';
import { TripData, Member, TripListName } from './types/trip';
import { initialTripData } from './data/initialData';
import {
  subscribeToTrip,
  persistTripData,
  replaceTripData,
  saveTripItem,
  removeTripItem,
  isFirebaseConnected,
  TripUpdate,
} from './services/storage';
import {
  getMyIdentity,
  rememberMyIdentity,
  resolveMe,
  isBrowsingAsGuest,
  setBrowsingAsGuest,
  DeviceIdentity,
} from './services/identity';
import { WelcomeGate } from './components/WelcomeGate';

export function App() {
  const [trip, setTrip] = useState<TripData>(initialTripData);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [myIdentity, setMyIdentity] = useState<DeviceIdentity | null>(getMyIdentity);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(isBrowsingAsGuest);
  // The stored trip arrives a moment after the first paint. Until it does we
  // cannot tell a first-time visitor from someone whose member has not loaded
  // yet, so hold the question rather than flash it at a returning friend.
  const [isTripLoaded, setIsTripLoaded] = useState(false);
  const isFirebase = isFirebaseConnected();

  const me = resolveMe(trip.members, myIdentity);

  // Takes a member id (the picker) or the member itself — someone who has
  // just signed up is not in `trip.members` yet on this render.
  const chooseMyMember = (who: string | Member | null) => {
    const member =
      typeof who === 'string' ? trip.members.find((m) => m.id === who) ?? null : who;
    const identity = member ? { id: member.id, nickname: member.nickname } : null;
    rememberMyIdentity(identity);
    setMyIdentity(identity);
    // Dropping the name puts the question back, rather than leaving the app in
    // a state where nothing can be voted on and nothing explains why.
    setBrowsingAsGuest(false);
    setIsGuest(false);
  };

  const browseAsGuest = () => {
    setBrowsingAsGuest(true);
    setIsGuest(true);
  };

  // The remembered id goes stale when the trip is re-imported, and the
  // nickname when someone renames themselves. Whoever resolved here is the
  // truth now, so keep the stored copy in step — storage only: this render
  // already has the right person.
  useEffect(() => {
    if (!me || !myIdentity) return;
    if (me.id === myIdentity.id && me.nickname === myIdentity.nickname) return;
    rememberMyIdentity({ id: me.id, nickname: me.nickname });
  }, [me, myIdentity]);

  // Subscribe to realtime changes (Firestore or LocalStorage event)
  useEffect(() => {
    const unsubscribe = subscribeToTrip(
      'khaoyai-trip-2026',
      (updatedTrip) => {
        setTrip(updatedTrip);
        setIsTripLoaded(true);
      },
      (err) => {
        console.warn('Realtime sync notification:', err);
        setIsTripLoaded(true);
        setSyncError('เชื่อมต่อกับคลาวด์ไม่ได้ การแก้ไขจะเก็บไว้ในเครื่องนี้ก่อน');
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const reportSync = (err: unknown) => {
    console.error('Error persisting trip update:', err);
    setSyncError('บันทึกขึ้นคลาวด์ไม่สำเร็จ เพื่อนจะยังไม่เห็นการแก้ไขนี้');
  };

  // Show the change straight away, then let the write settle what is stored.
  // Whatever it writes comes back through the subscription.
  const handleUpdateTrip = (update: TripUpdate) => {
    setTrip((current) =>
      typeof update === 'function' ? update(current) : update
    );

    persistTripData(trip.id, update)
      .then(() => setSyncError(null))
      .catch(reportSync);
  };

  /**
   * Add an item to one of the trip's lists, or save a change to one.
   *
   * The screen is updated here and the item is written on its own. Nothing
   * this call sends says anything about the other items, so no save can take
   * somebody else's work away.
   */
  const handleSaveItem = (list: TripListName, value: object) => {
    const item = value as { id?: string; dayNumber?: number };
    setTrip((current) => {
      const bag = current as unknown as Record<string, unknown>;
      const existing = (bag[list] ?? []) as Array<{ id?: string; dayNumber?: number }>;
      const matches = (other: { id?: string; dayNumber?: number }) =>
        list === 'itinerary' ? other.dayNumber === item.dayNumber : other.id === item.id;
      // Replaced rather than merged, to match what is written: a field the
      // form cleared has to disappear here too.
      const next = existing.some(matches)
        ? existing.map((other) => (matches(other) ? item : other))
        : [...existing, item];
      return { ...current, [list]: next };
    });

    saveTripItem(trip.id, list, item)
      .then(() => setSyncError(null))
      .catch(reportSync);
  };

  /**
   * Swap the whole trip out — an imported backup, or a reset. Deliberate, and
   * the only path that drops items nobody removed by hand.
   */
  const handleReplaceTrip = (next: TripData) => {
    setTrip(next);
    replaceTripData(next.id, next)
      .then(() => setSyncError(null))
      .catch(reportSync);
  };

  /** Take an item off a list. The only thing that removes anything. */
  const handleRemoveItem = (list: TripListName, itemId: string) => {
    setTrip((current) => {
      const bag = current as unknown as Record<string, unknown>;
      const existing = (bag[list] ?? []) as Array<{ id?: string; dayNumber?: number }>;
      const keep = existing.filter((other) =>
        list === 'itinerary' ? `day-${other.dayNumber}` !== itemId : other.id !== itemId
      );
      return { ...current, [list]: keep };
    });

    removeTripItem(trip.id, list, itemId)
      .then(() => setSyncError(null))
      .catch(reportSync);
  };

  const confirmedCount = trip.members.filter((m) => m.status === 'confirmed').length;

  if (!isTripLoaded) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center">
        <p className="text-fine text-stone">กำลังเปิดทริป…</p>
      </div>
    );
  }

  if (!me && !isGuest) {
    return (
      <WelcomeGate
        trip={trip}
        onUpdateTrip={handleUpdateTrip}
        onSaveItem={handleSaveItem}
        onRemoveItem={handleRemoveItem}
        onChooseMe={chooseMyMember}
        onSkip={browseAsGuest}
      />
    );
  }

  return (
    <div className="min-h-screen bg-mist flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isFirebase={isFirebase}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onShare={() => setIsShareModalOpen(true)}
        confirmedCount={confirmedCount}
        members={trip.members}
        me={me}
        onChooseMe={chooseMyMember}
        syncError={syncError}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 max-w-6xl w-full mx-auto ${
          activeTab === 'overview' ? '' : 'px-5 sm:px-8 pt-8'
        }`}
      >
        {activeTab === 'overview' && (
          <OverviewTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
        onSaveItem={handleSaveItem}
        onRemoveItem={handleRemoveItem}
            setActiveTab={setActiveTab}
            me={me}
            onChooseMe={chooseMyMember}
          />
        )}

        {activeTab === 'cars' && (
          <CarsTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
        onSaveItem={handleSaveItem}
        onRemoveItem={handleRemoveItem}
          />
        )}

        {activeTab === 'stay' && (
          <AccommodationTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
        onSaveItem={handleSaveItem}
        onRemoveItem={handleRemoveItem}
            me={me}
          />
        )}

        {activeTab === 'itinerary' && (
          <ItineraryTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
        onSaveItem={handleSaveItem}
        onRemoveItem={handleRemoveItem}
            me={me}
          />
        )}

        {activeTab === 'food' && (
          <FoodTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
        onSaveItem={handleSaveItem}
        onRemoveItem={handleRemoveItem}
            me={me}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
        onSaveItem={handleSaveItem}
        onRemoveItem={handleRemoveItem}
            me={me}
          />
        )}

        {activeTab === 'packing' && (
          <PackingTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
        onSaveItem={handleSaveItem}
        onRemoveItem={handleRemoveItem}
          />
        )}

        {activeTab === 'dayof' && (
          <DayOfTab trip={trip} me={me} setActiveTab={setActiveTab} />
        )}

        {activeTab === 'members' && (
          <MembersTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
        onSaveItem={handleSaveItem}
        onRemoveItem={handleRemoveItem}
            me={me}
            onChooseMe={chooseMyMember}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-mist-deep mt-px">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-fine text-stone">
          <p>{trip.title} · วางแผนร่วมกันของแก๊ง 10–12 คน</p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="hover:text-ink transition-colors"
            >
              ส่งสรุปเข้าไลน์
            </button>
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="hover:text-ink transition-colors"
            >
              ตั้งค่าการซิงก์
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        trip={trip}
        onUpdateTrip={handleUpdateTrip}
        onSaveItem={handleSaveItem}
        onRemoveItem={handleRemoveItem}
        onReplaceTrip={handleReplaceTrip}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        trip={trip}
      />
    </div>
  );
}

export default App;
