
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, User, Search, FileText, Check, AlertCircle, X, Download, Save } from 'lucide-react';
import { Student } from '../types';
import { storageService } from '../services/storageService';

interface StudentsProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const Students: React.FC<StudentsProps> = ({ students, setStudents }) => {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [importText, setImportText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Student>>({
    studentId: '',
    fullName: '',
    grade: 'ม.1',
    room: '1',
    number: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Auto-pad student ID to 5 digits
    const paddedId = (formData.studentId || '').trim().padStart(5, '0');
    const finalFormData = { ...formData, studentId: paddedId };
    
    let updated: Student[];
    if (editingId) {
      updated = students.map(s => s.id === editingId ? { ...s, ...finalFormData } as Student : s);
    } else {
      updated = [...students, { ...finalFormData, id: Date.now().toString() } as Student];
    }
    
    await storageService.saveStudents(updated);
    setStudents(updated);
    setIsSaving(false);
    setShowForm(false);
    setEditingId(null);
    setFormData({ studentId: '', fullName: '', grade: 'ม.1', room: '1', number: 1 });
  };

  const handleBulkImport = async () => {
    if (!importText.trim()) return;

    try {
      setIsSaving(true);
      const lines = importText.trim().split('\n');
      const startIdx = lines[0].toLowerCase().includes('id') || lines[0].includes('รหัส') ? 1 : 0;
      
      const newEntries: Student[] = lines.slice(startIdx).map((line, index) => {
        const cols = line.split(/\t/);
        // Auto-pad student ID during bulk import
        const studentId = (cols[0]?.trim() || '').padStart(5, '0');
        const fullName = cols[1]?.trim() || '';
        const classStr = cols[2]?.trim() || '';
        const grade = cols[3]?.trim() || 'ม.1';
        const number = parseInt(cols[5]?.trim() || '0');
        const room = classStr.includes('/') ? classStr.split('/')[1] : '1';

        return {
          id: (Date.now() + index).toString(),
          studentId,
          fullName,
          grade,
          room,
          number
        };
      }).filter(s => s.studentId && s.fullName && s.studentId !== '00000');

      if (newEntries.length === 0) {
        alert('ไม่พบข้อมูลที่ถูกต้อง กรุณาตรวจสอบรูปแบบข้อความ');
        setIsSaving(false);
        return;
      }

      const existingIds = new Set(students.map(s => s.studentId));
      const uniqueNewEntries = newEntries.filter(s => !existingIds.has(s.studentId));
      
      const updated = [...students, ...uniqueNewEntries];
      await storageService.saveStudents(updated);
      setStudents(updated);
      
      alert(`นำเข้าสำเร็จ ${uniqueNewEntries.length} รายการ (ข้ามรายการซ้ำ ${newEntries.length - uniqueNewEntries.length} รายการ)`);
      setImportText('');
      setShowImport(false);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const header = "StudentId,FullName,Grade,Room,Number\n";
    const csvContent = students.sort((a,b) => {
      if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
      return a.number - b.number;
    }).map(s => `${s.studentId},${s.fullName},${s.grade},${s.room},${s.number}`).join("\n");
    
    const blob = new Blob(["\ufeff" + header + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `student_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    if (confirm('ยืนยันการลบนักเรียน?')) {
      const updated = students.filter(s => s.id !== id);
      await storageService.saveStudents(updated);
      setStudents(updated);
    }
  };

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.studentId.includes(searchTerm) ||
    s.grade.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">จัดการนักเรียน</h2>
          <p className="text-gray-500">ฐานข้อมูลหลัก (ทั้งหมด {students.length} คน)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-indigo-500 w-full sm:w-64" 
              placeholder="ค้นหา..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={handleExportCSV} className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
            <Download size={20} />
          </button>
          <button 
            disabled={isSaving}
            onClick={() => { setShowImport(!showImport); setShowForm(false); }}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 border transition-all ${
              showImport ? 'bg-gray-100 text-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText size={20} />
            <span className="hidden sm:inline">นำเข้า</span>
          </button>
          <button 
            disabled={isSaving}
            onClick={() => { setShowForm(!showForm); setShowImport(false); }}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">เพิ่ม</span>
          </button>
        </div>
      </div>

      {showImport && (
        <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-xl space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">นำเข้าข้อมูลจาก Excel</h3>
            <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <textarea 
            className="w-full h-48 px-4 py-3 rounded-2xl border border-gray-200 font-mono text-sm focus:border-indigo-500 outline-none"
            placeholder="วางข้อมูลจาก Excel ที่นี่..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <button 
              onClick={handleBulkImport} 
              disabled={isSaving}
              className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'ยืนยันนำเข้าลงฐานข้อมูล'}
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">รหัสประจำตัว (ระบบจะเติม 0 ให้อัตโนมัติ)</label>
              <input 
                required 
                type="text"
                className="w-full px-4 py-2 rounded-xl border border-gray-200" 
                placeholder="0xxxx"
                value={formData.studentId} 
                onChange={e => setFormData({...formData, studentId: e.target.value})} 
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase">ชื่อ-นามสกุล</label>
              <input required className="w-full px-4 py-2 rounded-xl border border-gray-200" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-4 lg:col-span-3">
              <select className="w-full px-4 py-2 rounded-xl border border-gray-200" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                {['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input required placeholder="ห้อง" className="w-full px-4 py-2 rounded-xl border border-gray-200" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} />
              <input required type="number" placeholder="เลขที่" className="w-full px-4 py-2 rounded-xl border border-gray-200" value={formData.number} onChange={e => setFormData({...formData, number: parseInt(e.target.value)})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'บันทึกลงฐานข้อมูล'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">รหัส</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ชั้น/ห้อง</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">เลขที่</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.sort((a,b) => {
                if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
                if (a.room !== b.room) return a.room.localeCompare(b.room);
                return a.number - b.number;
              }).map(student => (
                <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-indigo-600 font-mono">{student.studentId}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900">{student.fullName}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.grade}/{student.room}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-bold">{student.number}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setFormData(student); setEditingId(student.id); setShowForm(true); }} className="p-2 text-gray-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(student.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Loader2 = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

export default Students;
