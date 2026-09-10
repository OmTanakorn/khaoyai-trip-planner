import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewTab } from './components/OverviewTab';
import { CarsTab } from './components/CarsTab';
import { AccommodationTab } from './components/AccommodationTab';
import { ItineraryTab } from './components/ItineraryTab';
import { ExpensesTab } from './components/ExpensesTab';
import { PackingTab } from './components/PackingTab';
import { MembersTab } from './components/MembersTab';
import { SyncModal } from './components/SyncModal';
import { ShareModal } from './components/ShareModal';
import { TripData } from './types/trip';
import { initialTripData } from './data/initialData';
import { 
  subscribeToTrip, 
  persistTripData, 
  isFirebaseConnected 
} from './services/storage';

export function App() {
  const [trip, setTrip] = useState<TripData>(initialTripData);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const isFirebase = isFirebaseConnected();

  // Subscribe to realtime changes (Firestore or LocalStorage event)
  useEffect(() => {
    const unsubscribe = subscribeToTrip(
      'khaoyai-trip-2026',
      (updatedTrip) => {
        setTrip(updatedTrip);
      },
      (err) => {
        console.warn('Realtime sync notification:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleUpdateTrip = (updatedTrip: TripData) => {
    setTrip(updatedTrip);
    persistTripData(updatedTrip).catch((err) => {
      console.error('Error persisting trip update:', err);
    });
  };

  const confirmedCount = trip.members.filter((m) => m.status === 'confirmed').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Prompt',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isFirebase={isFirebase}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onShare={() => setIsShareModalOpen(true)}
        confirmedCount={confirmedCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
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
          />
        )}

        {activeTab === 'itinerary' && (
          <ItineraryTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
          />
        )}

        {activeTab === 'packing' && (
          <PackingTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
          />
        )}

        {activeTab === 'members' && (
          <MembersTab
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            🌿 <strong>{trip.title}</strong> • สร้างเพื่อเพื่อนๆ แก๊ง 10-12 คน
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="hover:text-emerald-700 transition-colors"
            >
              ส่งสรุปเข้า LINE
            </button>
            <span>•</span>
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="hover:text-emerald-700 transition-colors"
            >
              ตั้งค่า Cloud Sync
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
