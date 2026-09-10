import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewTab } from './components/OverviewTab';
import { CarsTab } from './components/CarsTab';
import { AccommodationTab } from './components/AccommodationTab';
import { ItineraryTab } from './components/ItineraryTab';
import { ExpensesTab } from './components/ExpensesTab';
import { PackingTab } from './components/PackingTab';
import { MembersTab } from './components/MembersTab';
import { DayOfTab } from './components/DayOfTab';
import { SyncModal } from './components/SyncModal';
import { ShareModal } from './components/ShareModal';
import { TripData } from './types/trip';
import { initialTripData } from './data/initialData';
import {
  subscribeToTrip,
  persistTripData,
  isFirebaseConnected,
  TripUpdate,
} from './services/storage';
import { getMyMemberId, setMyMemberId } from './services/identity';

export function App() {
  const [trip, setTrip] = useState<TripData>(initialTripData);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [myMemberId, setMyMemberIdState] = useState<string | null>(getMyMemberId);
  const [syncError, setSyncError] = useState<string | null>(null);
  const isFirebase = isFirebaseConnected();

  const me = trip.members.find((m) => m.id === myMemberId) ?? null;

  const chooseMyMember = (id: string | null) => {
    setMyMemberId(id);
    setMyMemberIdState(id);
  };

  // Subscribe to realtime changes (Firestore or LocalStorage event)
  useEffect(() => {
    const unsubscribe = subscribeToTrip(
      'khaoyai-trip-2026',
      (updatedTrip) => {
        setTrip(updatedTrip);
      },
      (err) => {
        console.warn('Realtime sync notification:', err);
        setSyncError('เชื่อมต่อกับคลาวด์ไม่ได้ การแก้ไขจะเก็บไว้ในเครื่องนี้ก่อน');
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Show the change straight away, then let the transaction settle what is
  // stored. Whatever it writes comes back through the subscription.
  const handleUpdateTrip = (update: TripUpdate) => {
    setTrip((current) =>
      typeof update === 'function' ? update(current) : update
    );

    persistTripData(trip.id, update)
      .then(() => setSyncError(null))
      .catch((err) => {
        console.error('Error persisting trip update:', err);
        setSyncError('บันทึกขึ้นคลาวด์ไม่สำเร็จ เพื่อนจะยังไม่เห็นการแก้ไขนี้');
      });
  };

  const confirmedCount = trip.members.filter((m) => m.status === 'confirmed').length;

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
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'cars' && (
          <CarsTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
          />
        )}

        {activeTab === 'stay' && (
          <AccommodationTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
            me={me}
          />
        )}

        {activeTab === 'itinerary' && (
          <ItineraryTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
            me={me}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
            me={me}
          />
        )}

        {activeTab === 'packing' && (
          <PackingTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
          />
        )}

        {activeTab === 'dayof' && (
          <DayOfTab trip={trip} me={me} setActiveTab={setActiveTab} />
        )}

        {activeTab === 'members' && (
          <MembersTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
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
