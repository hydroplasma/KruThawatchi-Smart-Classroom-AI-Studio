
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Book, FileText, X, Loader2, Save } from 'lucide-react';
import { Subject } from '../types';
import { storageService } from '../services/storageService';

interface SubjectsProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
}

const Subjects: React.FC<SubjectsProps> = ({ subjects, setSubjects }) => {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [importText, setImportText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Subject>>({
    code: '',
    name: '',
    grade: 'ม.1',
    semester: '1',
    year: '2568',
    hours: 2,
    numCollectScores: 3,
    collectPercent: 30,
    midtermPercent: 30,
    finalPercent: 40
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updated: Subject[];
    if (editingId) {
      updated = subjects.map(s => s.id === editingId ? { ...s, ...formData } as Subject : s);
    } else {
      updated = [...subjects, { ...formData, id: Date.now().toString() } as Subject];
    }
    setSubjects(updated);
    storageService.saveSubjects(updated);
    setShowForm(false);
    setEditingId(null);
    setFormData({ code: '', name: '', grade: 'ม.1', semester: '1', year: '2568', hours: 2, numCollectScores: 3, collectPercent: 30, midtermPercent: 30, finalPercent: 40 });
  };

  const handleBulkImport = async () => {
    if (!importText.trim()) return;

    try {
      setIsSaving(true);
      const lines = importText.trim().split('\n');
      
      // Filter out header lines if present
      const filteredLines = lines.filter(line => {
        const lowerLine = line.toLowerCase();
        return !lowerLine.includes('รหัส') && !lowerLine.includes('ชื่อวิชา') && line.trim() !== '';
      });

      const newEntries: Subject[] = filteredLines.map((line, index) => {
        // Handle both Tab and Space separation
        const cols = line.split(/\t| {2,}/).filter(c => c.trim() !== '');
        
        // If simple split doesn't work, try space split but handle names with spaces
        let grade = 'ม.1', code = '', name = '', hours = 2;

        if (cols.length >= 4) {
          grade = cols[0].trim();
          code = cols[1].trim();
          hours = parseInt(cols[cols.length - 1].trim()) || 2;
          // Join everything in between as name
          name = cols.slice(2, cols.length - 1).join(' ').trim();
        } else {
          // Fallback for space separated: ม.3 ว23102 วิทยาศาสตร์พื้นฐาน 6 3
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 4) {
            grade = parts[0];
            code = parts[1];
            hours = parseInt(parts[parts.length - 1]) || 2;
            name = parts.slice(2, parts.length - 1).join(' ');
          }
        }

        return {
          id: `bulk-${Date.now()}-${index}`,
          code,
          name,
          grade,
          semester: '2',
          year: '2568',
          hours,
          numCollectScores: 3,
          collectPercent: 30,
          midtermPercent: 30,
          finalPercent: 40
        };
      }).filter(s => s.code && s.name);

      if (newEntries.length === 0) {
        alert('ไม่พบข้อมูลที่ถูกต้อง กรุณาตรวจสอบรูปแบบข้อความ');
        setIsSaving(false);
        return;
      }

      // Merge with existing, avoiding duplicates by code
      const existingCodes = new Set(subjects.map(s => s.code));
      const uniqueNew = newEntries.filter(s => !existingCodes.has(s.code));
      
      const updated = [...subjects, ...uniqueNew];
      await storageService.saveSubjects(updated);
      setSubjects(updated);
      
      alert(`นำเข้าวิชาสำเร็จ ${uniqueNew.length} วิชา (ข้ามวิชาที่มีอยู่แล้ว ${newEntries.length - uniqueNew.length} วิชา)`);
      setImportText('');
      setShowImport(false);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('ยืนยันการลบวิชานี้?')) {
      const updated = subjects.filter(s => s.id !== id);
      setSubjects(updated);
      storageService.saveSubjects(updated);
    }
  };

  const handleEdit = (sub: Subject) => {
    setFormData(sub);
    setEditingId(sub.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">จัดการวิชา</h2>
          <p className="text-gray-500">ทั้งหมด {subjects.length} รายวิชา</p>
        </div>
        <div className="flex gap-2">
          <button 
            disabled={isSaving}
            onClick={() => { setShowImport(!showImport); setShowForm(false); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold border transition-all ${
              showImport ? 'bg-gray-100 text-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText size={20} />
            <span className="hidden sm:inline">นำเข้าวิชา</span>
          </button>
          <button 
            disabled={isSaving}
            onClick={() => { setShowForm(!showForm); setShowImport(false); }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">{showForm ? 'ปิดแบบฟอร์ม' : 'เพิ่มวิชาเดี่ยว'}</span>
          </button>
        </div>
      </div>

      {showImport && (
        <div className="bg-white p-8 rounded-[2rem] border border-indigo-100 shadow-xl space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">นำเข้ารายวิชาแบบกลุ่ม</h3>
            <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <p className="text-sm text-gray-500">วางรายชื่อวิชา (รูปแบบ: ชั้น รหัสวิชา ชื่อวิชา คาบ)</p>
          <textarea 
            className="w-full h-48 px-4 py-3 rounded-2xl border border-gray-200 font-mono text-sm focus:border-indigo-500 outline-none"
            placeholder="ม.3 ว23102 วิทยาศาสตร์พื้นฐาน 6 3&#10;ม.4 ว30202 ฟิสิกส์ 2 3..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <button 
              onClick={handleBulkImport} 
              disabled={isSaving}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              ยืนยันการนำเข้า
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-6 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">รหัสวิชา</label>
              <input 
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">ชื่อวิชา</label>
              <input 
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">ระดับชั้น</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-indigo-500"
                value={formData.grade}
                onChange={e => setFormData({...formData, grade: e.target.value})}
              >
                {['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">ภาคเรียน</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                  value={formData.semester}
                  onChange={e => setFormData({...formData, semester: e.target.value})}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">ปีการศึกษา</label>
                <input 
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                  value={formData.year}
                  onChange={e => setFormData({...formData, year: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">% เก็บ</label>
              <input type="number" className="w-full px-4 py-3 rounded-xl border border-gray-200" value={formData.collectPercent} onChange={e => setFormData({...formData, collectPercent: parseInt(e.target.value)})}/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">% กลางภาค</label>
              <input type="number" className="w-full px-4 py-3 rounded-xl border border-gray-200" value={formData.midtermPercent} onChange={e => setFormData({...formData, midtermPercent: parseInt(e.target.value)})}/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">% ปลายภาค</label>
              <input type="number" className="w-full px-4 py-3 rounded-xl border border-gray-200" value={formData.finalPercent} onChange={e => setFormData({...formData, finalPercent: parseInt(e.target.value)})}/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">จำนวนคาบ/สัปดาห์</label>
              <input type="number" className="w-full px-4 py-3 rounded-xl border border-gray-200" value={formData.hours} onChange={e => setFormData({...formData, hours: parseInt(e.target.value)})}/>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100">บันทึกวิชา</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map(sub => (
          <div key={sub.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all group relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm">
                <Book size={24} />
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(sub)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(sub.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                {sub.name}
              </h3>
              <p className="text-indigo-600 font-bold text-lg">
                {sub.code}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mt-6">
              <span className="px-4 py-1.5 bg-gray-50 text-gray-600 rounded-full text-xs font-bold border border-gray-100">
                {sub.hours} ชม.
              </span>
              <span className="px-4 py-1.5 bg-gray-50 text-gray-600 rounded-full text-xs font-bold border border-gray-100">
                {sub.grade}
              </span>
              <span className="px-4 py-1.5 bg-gray-50 text-gray-600 rounded-full text-xs font-bold border border-gray-100">
                เทอม {sub.semester}/{sub.year}
              </span>
            </div>
          </div>
        ))}
        {subjects.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <Book size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">ยังไม่มีข้อมูลรายวิชา</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subjects;
