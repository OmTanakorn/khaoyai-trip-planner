import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { TripData, TripListEditor } from '../types/trip';
import {
  getFirebaseConfig,
  saveFirebaseConfig,
  removeFirebaseConfig,
  FirebaseConfig,
  exportTripToJson,
  importTripFromJson,
  TripUpdate,
} from '../services/storage';
import { initialTripData } from '../data/initialData';
import { Modal, Field } from './ui';
import { input, btnSolid, btnQuiet } from './ui-kit';

interface SyncModalProps extends TripListEditor {
  isOpen: boolean;
  onClose: () => void;
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
  onReplaceTrip: (trip: TripData) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  trip,
  onReplaceTrip,
}) => {
  const [configJson, setConfigJson] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'cloud' | 'backup'>('cloud');

  const currentConfig = getFirebaseConfig();

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      let parsed: Partial<FirebaseConfig>;
      try {
        parsed = JSON.parse(configJson);
      } catch {
        throw new Error('อ่าน JSON ไม่ออก คัดลอก firebaseConfig จาก Firebase Console มาวางทั้งก้อน');
      }

      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('ต้องมีอย่างน้อย apiKey และ projectId');
      }

      const cleanConfig: FirebaseConfig = {
        apiKey: parsed.apiKey || '',
        authDomain: parsed.authDomain || '',
        projectId: parsed.projectId || '',
        storageBucket: parsed.storageBucket || '',
        messagingSenderId: parsed.messagingSenderId || '',
        appId: parsed.appId || '',
      };

      saveFirebaseConfig(cleanConfig);
      setSavedSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'บันทึกไม่สำเร็จ ตรวจสอบรูปแบบ config อีกครั้ง');
    }
  };

  const handleDisconnectFirebase = () => {
    if (
      !window.confirm('เลิกซิงก์ขึ้นคลาวด์? ข้อมูลจะกลับไปเก็บในเครื่องนี้เครื่องเดียว')
    ) {
      return;
    }
    removeFirebaseConfig();
    window.location.reload();
  };

  const handleExportJson = () => {
    const jsonString = exportTripToJson(trip);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khaoyai-trip-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('ดาวน์โหลดไฟล์ทริปแล้ว');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = importTripFromJson(content);
        onReplaceTrip(imported);
        setStatusMessage('');
        onClose();
      } catch (err: any) {
        setStatusMessage(`เปิดไฟล์ไม่ได้: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (!window.confirm('ล้างข้อมูลทั้งหมดแล้วเริ่มจากทริปตัวอย่างใหม่?')) return;
    onReplaceTrip(initialTripData);
    setStatusMessage('');
    onClose();
  };

  const tabs = [
    { id: 'cloud' as const, label: 'ซิงก์ขึ้นคลาวด์' },
    { id: 'backup' as const, label: 'สำรองเป็นไฟล์' },
  ];

  return (
    <Modal
      title="ข้อมูลและการซิงก์"
      note="ต่อคลาวด์เพื่อให้เพื่อนเห็นการแก้ไขพร้อมกัน หรือสำรองไว้เป็นไฟล์"
      onClose={onClose}
      wide
    >
      <div className="flex gap-6 border-b border-mist-deep -mt-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            aria-current={activeTab === t.id ? 'true' : undefined}
            className={`pb-3 text-fine border-b-2 -mb-px transition-colors ${
              activeTab === t.id
                ? 'border-brass text-ink'
                : 'border-transparent text-stone hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'cloud' ? (
        <div className="mt-6 space-y-5">
          {currentConfig ? (
            <>
              <p className="text-body text-ink">
                ซิงก์อยู่กับโปรเจกต์ {currentConfig.projectId}
              </p>
              <p className="text-fine text-stone">
                ทุกคนที่เปิดลิงก์นี้จะเห็นการเลือกรถ ห้องนอน และค่าใช้จ่ายตรงกันทันที
              </p>
              <button onClick={handleDisconnectFirebase} className={btnQuiet}>
                เลิกซิงก์
              </button>
            </>
          ) : (
            <>
              <div>
                <p className="text-body text-ink">ตั้งค่าครั้งเดียว ใช้เวลาราวหนึ่งนาที ไม่มีค่าใช้จ่าย</p>
                <ol className="mt-4 space-y-3 text-fine text-stone">
                  <li className="flex gap-3">
                    <span className="font-display text-brass leading-none">1</span>
                    <span>
                      สร้างโปรเจกต์ใหม่ที่{' '}
                      <a
                        href="https://console.firebase.google.com"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-ink border-b border-brass pb-0.5 hover:text-brass transition-colors"
                      >
                        Firebase Console
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-display text-brass leading-none">2</span>
                    <span>เปิด Cloud Firestore เลือกโหมด Test rules ให้อ่านและเขียนได้</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-display text-brass leading-none">3</span>
                    <span>เพิ่ม Web App แล้วคัดลอก firebaseConfig มาวางข้างล่าง</span>
                  </li>
                </ol>
              </div>

              {errorMessage && <p className="text-body text-ink">{errorMessage}</p>}
              {savedSuccess && (
                <p className="text-body text-ink">เชื่อมต่อได้แล้ว กำลังโหลดหน้าใหม่</p>
              )}

              <form onSubmit={handleSaveConfig} className="space-y-4">
                <Field label="firebaseConfig" htmlFor="fb-config">
                  <textarea
                    id="fb-config"
                    rows={6}
                    required
                    value={configJson}
                    onChange={(e) => setConfigJson(e.target.value)}
                    placeholder={`{\n  "apiKey": "AIzaSy...",\n  "projectId": "my-trip-id"\n}`}
                    className={input}
                  />
                </Field>

                <button type="submit" className={`w-full ${btnSolid}`}>
                  เชื่อมต่อ
                </button>
              </form>
            </>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <p className="text-body text-ink">
            ยังไม่อยากต่อคลาวด์ก็ส่งไฟล์ทริปให้เพื่อนเปิดเองได้
          </p>

          <div className="divide-y divide-mist-deep border-y border-mist-deep">
            <button
              onClick={handleExportJson}
              className="w-full py-5 text-left group"
            >
              <span className="block text-body text-ink group-hover:text-brass transition-colors">
                ดาวน์โหลดไฟล์ทริป
              </span>
              <span className="block mt-1 text-fine text-stone">
                เก็บรถ ที่พัก ตาราง และค่าใช้จ่ายทั้งหมดไว้เป็นไฟล์เดียว
              </span>
            </button>

            <label className="block py-5 cursor-pointer group">
              <span className="block text-body text-ink group-hover:text-brass transition-colors">
                เปิดไฟล์ที่เพื่อนส่งมา
              </span>
              <span className="block mt-1 text-fine text-stone">
                ข้อมูลในเครื่องจะถูกแทนที่ด้วยไฟล์ที่เปิด
              </span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>

            <button onClick={handleResetData} className="w-full py-5 text-left group">
              <span className="block text-body text-ink group-hover:text-brass transition-colors">
                เริ่มใหม่จากทริปตัวอย่าง
              </span>
              <span className="block mt-1 text-fine text-stone">
                ล้างทุกอย่างที่กรอกไว้ กู้คืนไม่ได้
              </span>
            </button>
          </div>

          {statusMessage && <p className="text-body text-ink">{statusMessage}</p>}
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <button onClick={onClose} className={btnQuiet}>
          ปิด
        </button>
      </div>
    </Modal>
  );
};
