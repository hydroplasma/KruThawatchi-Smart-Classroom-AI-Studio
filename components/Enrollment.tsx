
import React, { useState, useEffect } from 'react';
import { Subject, Student } from '../types';
import { storageService } from '../services/storageService';
// Removed Loader2 from lucide-react import to resolve conflict with local declaration
import { Search, CheckCircle2, Circle, Save, CheckSquare, Square, AlertCircle } from 'lucide-react';

interface EnrollmentProps {
  subjects: Subject[];
  students: Student[];
  enrollments: Record<string, string[]>;
  setEnrollments: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

const Enrollment: React.FC<EnrollmentProps> = ({ subjects, students, enrollments, setEnrollments }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [localEnrollments, setLocalEnrollments] = useState<Record<string, string[]>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when global enrollments change
  useEffect(() => {
    setLocalEnrollments(enrollments);
  }, [enrollments]);

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.studentId.includes(searchTerm) || 
    s.grade.includes(searchTerm)
  ).sort((a,b) => {
    if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
    if (a.room !== b.room) return a.room.localeCompare(b.room);
    return a.number - b.number;
  });

  const toggleStudent = (studentId: string) => {
    if (!selectedSubject) return;
    const current = localEnrollments[selectedSubject] || [];
    const updated = current.includes(studentId) 
      ? current.filter(id => id !== studentId) 
      : [...current, studentId];
    
    setLocalEnrollments({ ...localEnrollments, [selectedSubject]: updated });
    setIsDirty(true);
  };

  const handleSelectAll = () => {
    if (!selectedSubject) return;
    const current = localEnrollments[selectedSubject] || [];
    const filteredIds = filteredStudents.map(s => s.studentId);
    const updated = Array.from(new Set([...current, ...filteredIds]));
    
    setLocalEnrollments({ ...localEnrollments, [selectedSubject]: updated });
    setIsDirty(true);
  };

  const handleDeselectAll = () => {
    if (!selectedSubject) return;
    const current = localEnrollments[selectedSubject] || [];
    const filteredIds = filteredStudents.map(s => s.studentId);
    const updated = current.filter(id => !filteredIds.includes(id));
    
    setLocalEnrollments({ ...localEnrollments, [selectedSubject]: updated });
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!selectedSubject) return;
    setIsSaving(true);
    await storageService.saveEnrollment(localEnrollments);
    setEnrollments(localEnrollments);
    setIsDirty(false);
    setIsSaving(false);
    alert('บันทึกข้อมูลการลงทะเบียนเรียนลงฐานข้อมูลสำเร็จ!');
  };

  const currentEnrolled = selectedSubject ? (localEnrollments[selectedSubject] || []) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Controls */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-bold text-gray-700">เลือกวิชาที่จะลงทะเบียน</label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 bg-gray-50/50"
              value={selectedSubject}
              onChange={e => {
                setSelectedSubject(e.target.value);
                setSearchTerm('');
              }}
            >
              <option value="">-- เลือกวิชา --</option>
              {subjects.map(sub => <option key={sub.id} value={sub.code}>{sub.code} - {sub.name} ({sub.grade})</option>)}
            </select>
          </div>
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 bg-gray-50/50"
              placeholder="ค้นหาตามชื่อ/รหัส/ชั้น..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {selectedSubject && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-50">
            <div className="flex gap-2">
              <button 
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all"
              >
                <CheckSquare size={16} />
                เลือกทั้งหมดที่เจอ
              </button>
              <button 
                onClick={handleDeselectAll}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all"
              >
                <Square size={16} />
                ยกเลิกทั้งหมดที่เจอ
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              {isDirty && (
                <span className="text-amber-600 text-xs font-bold flex items-center gap-1 animate-pulse">
                  <AlertCircle size={14} />
                  มีข้อมูลที่ยังไม่บันทึก
                </span>
              )}
              <button 
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all ${
                  isDirty 
                    ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' 
                    : 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
                }`}
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                บันทึกฐานข้อมูล
              </button>
            </div>
          </div>
        )}
      </div>

      {!selectedSubject ? (
        <div className="bg-indigo-50 py-20 rounded-[2.5rem] border border-dashed border-indigo-200 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 mb-4">
            <Search size={32} />
          </div>
          <h3 className="text-lg font-bold text-indigo-900">กรุณาเลือกรายวิชาก่อน</h3>
          <p className="text-indigo-600">เพื่อจัดการรายชื่อนักเรียนในฐานข้อมูล IndexedDB</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              แสดงนักเรียน {filteredStudents.length} คน (ลงทะเบียนแล้ว {currentEnrolled.length} คน)
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map(student => {
              const isEnrolled = currentEnrolled.includes(student.studentId);
              return (
                <button
                  key={student.id}
                  onClick={() => toggleStudent(student.studentId)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                    isEnrolled 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                      : 'bg-white border-gray-100 text-gray-900 hover:border-indigo-200 hover:bg-indigo-50/30'
                  }`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-transform group-active:scale-90 ${isEnrolled ? 'text-white' : 'text-gray-300'}`}>
                    {isEnrolled ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{student.fullName}</p>
                    <p className={`text-xs ${isEnrolled ? 'text-indigo-100' : 'text-gray-500'}`}>
                      ID: {student.studentId} | เลขที่ {student.number} | {student.grade}/{student.room}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Local definition of Loader2 (SVG spinner)
const Loader2 = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

export default Enrollment;
