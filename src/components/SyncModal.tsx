import React, { useState } from 'react';
import { 
  Cloud, 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  X, 
  Key, 
  ExternalLink 
} from 'lucide-react';
import { TripData } from '../types/trip';
import { 
  getFirebaseConfig, 
  saveFirebaseConfig, 
  removeFirebaseConfig, 
  FirebaseConfig, 
  exportTripToJson, 
  importTripFromJson 
} from '../services/storage';
import { initialTripData } from '../data/initialData';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripData;
  onUpdateTrip: (trip: TripData) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  trip,
  onUpdateTrip,
}) => {
  const [configJson, setConfigJson] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'cloud' | 'backup'>('cloud');

  const currentConfig = getFirebaseConfig();

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      // Parse JSON from text
      let parsed: Partial<FirebaseConfig>;
      try {
        parsed = JSON.parse(configJson);
      } catch (err) {
        throw new Error('รูปแบบ JSON ไม่ถูกต้อง กรุณาคัดลอก firebaseConfig จาก Firebase Console มาวาง');
      }

      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('ต้องมี apiKey และ projectId เป็นอย่างน้อย');
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
      setErrorMessage(err.message || 'บันทึกไม่สำเร็จ ตรวจสอบรูปแบบ config');
    }
  };

  const handleDisconnectFirebase = () => {
    if (window.confirm('คุณต้องการยกเลิกการเชื่อมต่อ Firebase Cloud หรือไม่? ข้อมูลจะถูกบันทึกลงในเครื่อง (LocalStorage) แทน')) {
      removeFirebaseConfig();
      window.location.reload();
    }
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
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = importTripFromJson(content);
        onUpdateTrip(imported);
        alert('นำเข้าข้อมูลทริปสำเร็จเรียบร้อย!');
        onClose();
      } catch (err: any) {
        alert(`เกิดข้อผิดพลาดในการนำเข้าไฟล์: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('ต้องการรีเซ็ตข้อมูลทริปกลับเป็นค่าตัวอย่างเริ่มต้น (เขาใหญ่ 10-12 คน) หรือไม่?')) {
      onUpdateTrip(initialTripData);
      alert('รีเซ็ตข้อมูลเริ่มต้นเรียบร้อย');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">การซิงก์ข้อมูล & สำรองไฟล์</h3>
              <p className="text-xs text-slate-500">Realtime Cloud Sync & Data Management</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('cloud')}
            className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'cloud'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            ☁️ เชื่อมต่อ Firebase Realtime
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'backup'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            💾 สำรองไฟล์ & นำเข้า JSON
          </button>
        </div>

        {activeTab === 'cloud' ? (
          <div className="space-y-4 text-xs">
            {currentConfig ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <Check className="w-4 h-4" />
                  <span>เชื่อมต่อกับ Firebase Project: {currentConfig.projectId} เรียบร้อยแล้ว!</span>
                </div>
                <p className="text-emerald-700 leading-relaxed text-[11px]">
                  เมื่อเพื่อนๆ เปิดเว็บนี้ ข้อมูลการเลือกรถ จองห้องนอน และค่าใช้จ่ายจะซิงก์หากันแบบ Realtime ทันที
                </p>
                <button
                  onClick={handleDisconnectFirebase}
                  className="px-3 py-1.5 bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-semibold transition-colors"
                >
                  ยกเลิกการเชื่อมต่อ Cloud
                </button>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Key className="w-4 h-4 text-emerald-600" />
                    <span>วิธีตั้งค่า Realtime ร่วมกับเพื่อน (ใช้เวลา 1 นาที ฟรี 100%)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                    <li>
                      ไปที่{' '}
                      <a
                        href="https://console.firebase.google.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 underline font-semibold inline-flex items-center gap-0.5"
                      >
                        Firebase Console <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      แล้วสร้างโปรเจกต์ใหม่ฟรี
                    </li>
                    <li>เปิดใช้งาน <strong>Cloud Firestore</strong> (เลือกโหมด Test rules ให้อ่าน/เขียนได้)</li>
                    <li>กดเพิ่ม Web App แล้วคัดลอกตัวแปร <code>firebaseConfig</code> (JSON) มาวางในช่องด้านล่าง</li>
                  </ol>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {savedSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>เชื่อมต่อสำเร็จ กำลังรีเฟรชระบบ...</span>
                  </div>
                )}

                <form onSubmit={handleSaveConfig} className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      วางโค้ด firebaseConfig (JSON):
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={configJson}
                      onChange={(e) => setConfigJson(e.target.value)}
                      placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "my-trip.firebaseapp.com",\n  "projectId": "my-trip-id",\n  ...\n}`}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-[11px] bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition-colors"
                  >
                    เชื่อมต่อ Cloud Realtime
                  </button>
                </form>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800">ส่งออก / นำเข้าไฟล์ทริป (JSON)</h4>
              <p className="text-[11px] text-slate-500">
                หากยังไม่ต้องการต่อ Firebase คุณสามารถส่งออกไฟล์ทริปนี้ส่งให้เพื่อนใน Line แล้วให้เพื่อนกดนำเข้า (Import) ได้เช่นกัน
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExportJson}
                className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center gap-2 font-bold text-slate-800 group-hover:text-emerald-700 mb-1">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>ดาวน์โหลดไฟล์ JSON</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  สำรองข้อมูลรถ ที่พัก กิจกรรมทั้งหมดเป็นไฟล์
                </span>
              </button>

              <label className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all flex flex-col justify-between group cursor-pointer">
                <div className="flex items-center gap-2 font-bold text-slate-800 group-hover:text-blue-700 mb-1">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>นำเข้าไฟล์ JSON</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  เปิดไฟล์ที่เพื่อนส่งมาเพื่ออัปเดตข้อมูล
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">เริ่มต้นใหม่:</span>
              <button
                onClick={handleResetData}
                className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ตเป็นข้อมูลตัวอย่างเริ่มต้น</span>
              </button>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
