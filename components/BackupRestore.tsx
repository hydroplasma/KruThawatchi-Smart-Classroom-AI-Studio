
import React, { useRef, useState } from 'react';
import { Download, Upload, Trash2, ShieldCheck, AlertTriangle, FileJson, RefreshCw, RotateCcw, Database, Copy, Check, Terminal, ExternalLink, Loader2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { initialStudents } from '../initialStudents';
import { initialSubjects } from '../initialSubjects';
import Modal, { ModalType } from './Modal';

const BackupRestore: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [modal, setModal] = useState<{isOpen: boolean, title: string, message: string, type: ModalType, onConfirm?: () => void}>({
    isOpen: false, title: '', message: '', type: 'info'
  });

  const showAlert = (title: string, message: string, type: ModalType = 'info', onConfirm?: () => void) => {
    setModal({ isOpen: true, title, message, type, onConfirm });
  };

  const handleExport = async () => {
    try {
      const data = await storageService.getAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      const time = new Date().toLocaleTimeString('th-TH').replace(/:/g, '-');
      
      link.href = url;
      link.download = `smartclass_backup_${date}_${time}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showAlert('สำเร็จ', 'ดาวน์โหลดไฟล์สำรองข้อมูลเรียบร้อยแล้ว', 'success');
    } catch (e) {
      showAlert('ผิดพลาด', 'ไม่สามารถดึงข้อมูลเพื่อสำรองได้', 'error');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        showAlert('ยืนยันการนำเข้า', 'การนำเข้าข้อมูลจะเขียนทับข้อมูลใน Cloud ทั้งหมด ยืนยันที่จะดำเนินการต่อหรือไม่?', 'confirm', async () => {
          setIsResetting(true);
          try {
            const success = await storageService.restoreAllData(json);
            if (success) {
              showAlert('สำเร็จ', 'นำเข้าข้อมูลสำเร็จ! ระบบจะทำการรีโหลดหน้าเว็บ', 'success', () => window.location.reload());
            }
          } catch (err: any) {
            showAlert('ผิดพลาด', err.message || 'เกิดข้อผิดพลาดในการเขียนข้อมูลลงฐานข้อมูล', 'error');
          } finally {
            setIsResetting(false);
          }
        });
      } catch (err) {
        showAlert('ไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์ JSON ที่ถูกต้อง', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearData = () => {
    showAlert('อันตราย!', 'ข้อมูลทั้งหมดจะถูกลบออกจาก Cloud อย่างถาวร ยืนยันการลบหรือไม่?', 'confirm', async () => {
      await storageService.clearAllData();
      showAlert('สำเร็จ', 'ล้างข้อมูลสำเร็จ!', 'success', () => window.location.reload());
    });
  };

  const handleResetToDefaults = () => {
    showAlert('ยืนยันการรีเซ็ต', 'ระบบจะล้างข้อมูลปัจจุบันและแทนที่ด้วยข้อมูลเริ่มต้น (รหัสนักเรียน 5 หลักและวิชาปี 2568) ยืนยันหรือไม่?', 'confirm', async () => {
      setIsResetting(true);
      try {
        const success = await storageService.restoreAllData({
          STUDENTS: initialStudents,
          SUBJECTS: initialSubjects
        });
        if (success) {
          showAlert('สำเร็จ', 'อัปเดตข้อมูลเป็นค่าเริ่มต้นสำเร็จ!', 'success', () => window.location.reload());
        }
      } catch (err: any) {
        showAlert('ผิดพลาด', err.message || 'ไม่สามารถรีเซ็ตข้อมูลได้ กรุณาลองใช้ SQL Editor แก้ไขสิทธิ์', 'error');
      } finally {
        setIsResetting(false);
      }
    });
  };

  // Improved SQL script using quoted identifiers to handle camelCase columns like "fullName" correctly in Postgres
  const generateFullSql = () => {
    return `-- 1. ลบตารางเดิมทิ้ง (เพื่อให้แน่ใจว่าโครงสร้างคอลัมน์จะถูกสร้างใหม่ให้ถูกต้อง)
DROP TABLE IF EXISTS "enrollment";
DROP TABLE IF EXISTS "telegram";
DROP TABLE IF EXISTS "scores";
DROP TABLE IF EXISTS "attendance";
DROP TABLE IF EXISTS "subjects";
DROP TABLE IF EXISTS "students";

-- 2. สร้างตารางทั้งหมดใหม่ (พร้อมใส่ " " ครอบชื่อคอลัมน์เพื่อรักษาตัวพิมพ์ใหญ่-เล็ก)
CREATE TABLE "students" (
  "id" TEXT PRIMARY KEY, 
  "studentId" TEXT, 
  "fullName" TEXT, 
  "grade" TEXT, 
  "room" TEXT, 
  "number" INTEGER
);

CREATE TABLE "subjects" (
  "id" TEXT PRIMARY KEY, 
  "code" TEXT, 
  "name" TEXT, 
  "grade" TEXT, 
  "semester" TEXT, 
  "year" TEXT, 
  "hours" INTEGER, 
  "numCollectScores" INTEGER, 
  "collectPercent" INTEGER, 
  "midtermPercent" INTEGER, 
  "finalPercent" INTEGER
);

CREATE TABLE "attendance" (
  "id" TEXT PRIMARY KEY, 
  "subjectCode" TEXT, 
  "date" TEXT, 
  "periods" INTEGER, 
  "records" JSONB
);

CREATE TABLE "scores" (
  "subjectCode" TEXT PRIMARY KEY, 
  "scores" JSONB, 
  "assignmentNames" JSONB
);

CREATE TABLE "telegram" (
  "subjectCode" TEXT PRIMARY KEY, 
  "botName" TEXT, 
  "botToken" TEXT, 
  "chatId" TEXT
);

CREATE TABLE "enrollment" (
  "subjectCode" TEXT PRIMARY KEY, 
  "studentIds" JSONB
);

-- 3. ปิดระบบความปลอดภัย (เพื่อให้แอปใช้งานได้ทันทีโดยไม่ต้องตั้งค่า Policy ซับซ้อน)
ALTER TABLE "students" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "subjects" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "scores" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "telegram" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollment" DISABLE ROW LEVEL SECURITY;

-- 4. คำแนะนำ: หลังจากรันคำสั่งนี้สำเร็จ ให้กลับมาที่แอปแล้วกดปุ่ม "โหลดข้อมูลเริ่มต้นใหม่" ด้านล่างครับ
`;
  };

  const sqlSchema = generateFullSql();

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-500 pb-20">
      <Modal 
        isOpen={modal.isOpen} 
        onClose={() => setModal({...modal, isOpen: false})} 
        onConfirm={modal.onConfirm}
        title={modal.title} 
        message={modal.message} 
        type={modal.type} 
      />

      {isResetting && (
        <div className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <p className="text-indigo-900 font-bold animate-pulse">กำลังเขียนข้อมูลลงระบบคลาวด์...</p>
        </div>
      )}

      <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
            <ShieldCheck size={32} />
            จัดการและแก้ปัญหา Cloud
          </h2>
          <p className="text-indigo-100">แก้ปัญหา Error เขียนข้อมูลไม่เข้า หรือ Schema Cache Mismatch</p>
        </div>
      </div>

      {/* SQL Fix Section */}
      <div className="bg-white p-8 rounded-[2rem] border-2 border-indigo-100 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-sm">
              <Terminal size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">วิธีแก้ปัญหา: รัน SQL Setup (ตัวใหม่)</h3>
              <p className="text-gray-500 text-sm font-medium">คำสั่งนี้จะลบตารางเดิมและสร้างใหม่ด้วยโครงสร้างที่ถูกต้องที่สุด</p>
            </div>
          </div>
          <button 
            onClick={copySql}
            className={`w-full md:w-auto p-4 rounded-xl transition-all flex items-center justify-center gap-2 font-bold ${
              copied ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
            }`}
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
            <span>{copied ? 'คัดลอกสำเร็จ!' : 'คัดลอกคำสั่ง SQL แก้ไขระบบ'}</span>
          </button>
        </div>

        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 space-y-3">
          <div className="flex gap-3 text-amber-800 font-bold">
            <AlertTriangle className="shrink-0" size={20} />
            <p>สำคัญมาก:</p>
          </div>
          <ol className="list-decimal list-inside text-amber-700 text-sm space-y-1 pl-2 font-medium">
            <li>กดปุ่มสีน้ำเงินด้านบนเพื่อคัดลอกคำสั่ง SQL ที่อัปเดตใหม่</li>
            <li>ไปที่ <a href="https://supabase.com/dashboard" target="_blank" className="underline font-black">Supabase SQL Editor</a> วางคำสั่งแล้วกด <b>Run</b></li>
            <li>รันเสร็จแล้ว กลับมาที่หน้านี้แล้วกดปุ่ม <b>"โหลดข้อมูลเริ่มต้นใหม่"</b> เพื่อเพิ่มนักเรียนปี 2568 เข้าไปใหม่ครับ</li>
          </ol>
        </div>

        <div className="relative group">
          <pre className="bg-gray-900 text-gray-300 p-6 rounded-2xl text-xs overflow-x-auto font-mono h-48 no-scrollbar border border-gray-800 group-hover:border-indigo-500 transition-colors">
            {sqlSchema}
          </pre>
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-gray-900 to-transparent rounded-b-2xl pointer-events-none"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:border-indigo-200 transition-all flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <Download size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">สำรองข้อมูล (Export)</h3>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">ดาวน์โหลดข้อมูลจาก Cloud เก็บเป็นไฟล์ .json</p>
          <button onClick={handleExport} className="w-full mt-auto bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
            <FileJson size={20} /> ดาวน์โหลดไฟล์ JSON
          </button>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:border-purple-200 transition-all flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
            <Upload size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">กู้คืนไฟล์ (Restore)</h3>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">นำข้อมูลจากไฟล์ที่สำรองไว้กลับเข้าระบบ Cloud</p>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="w-full mt-auto bg-purple-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-purple-100 flex items-center justify-center gap-2">
            <RefreshCw size={20} /> กู้คืนข้อมูลจากไฟล์
          </button>
        </div>
      </div>

      <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-100">
              <RotateCcw size={24} />
            </div>
            <div>
              <h4 className="font-bold text-indigo-900 text-lg">เริ่มใช้งานระบบ (โหลดข้อมูล)</h4>
              <p className="text-indigo-700 text-sm">กดที่นี่เพื่อนำรายชื่อนักเรียนและวิชาเข้าสู่ฐานข้อมูลที่สร้างใหม่</p>
            </div>
          </div>
          <button 
            onClick={handleResetToDefaults}
            disabled={isResetting}
            className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={24} />
            โหลดข้อมูลเริ่มต้นใหม่
          </button>
        </div>
      </div>

      <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
              <Trash2 size={24} />
            </div>
            <div>
              <h4 className="font-bold text-red-900 text-lg">ล้างข้อมูลทั้งหมด</h4>
              <p className="text-red-700 text-sm">ล้างข้อมูลนักเรียนและวิชาทั้งหมดใน Cloud อย่างถาวร</p>
            </div>
          </div>
          <button onClick={handleClearData} className="bg-red-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
            <Trash2 size={20} /> ลบข้อมูล Cloud
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;
