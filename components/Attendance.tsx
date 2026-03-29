
import React, { useState, useEffect } from 'react';
import { Subject, Student, AttendanceSession, AttendanceStatus, AttendanceRecord } from '../types';
import { storageService } from '../services/storageService';
import { Calendar as CalendarIcon, Check, Users, History, Save } from 'lucide-react';

interface AttendanceProps {
  subjects: Subject[];
  students: Student[];
  enrollments: Record<string, string[]>;
  attendance: AttendanceSession[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceSession[]>>;
}

const Attendance: React.FC<AttendanceProps> = ({ subjects, students, enrollments, attendance, setAttendance }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [periods, setPeriods] = useState(1);
  const [currentRecords, setCurrentRecords] = useState<AttendanceRecord[]>([]);

  // Load existing records if any
  useEffect(() => {
    if (selectedSubject && date) {
      const existing = attendance.find(a => a.subjectCode === selectedSubject && a.date === date);
      if (existing) {
        setCurrentRecords(existing.records);
        setPeriods(existing.periods);
      } else {
        const enrolledIds = enrollments[selectedSubject] || [];
        setCurrentRecords(enrolledIds.map(id => ({ studentId: id, status: AttendanceStatus.PRESENT })));
        setPeriods(1);
      }
    }
  }, [selectedSubject, date, enrollments, attendance]);

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setCurrentRecords(prev => prev.map(r => r.studentId === studentId ? { ...r, status } : r));
  };

  const saveAttendance = () => {
    if (!selectedSubject) return;
    
    const newSession: AttendanceSession = {
      id: `${selectedSubject}-${date}`,
      subjectCode: selectedSubject,
      date,
      periods,
      records: currentRecords
    };

    const updated = [...attendance.filter(a => a.id !== newSession.id), newSession];
    setAttendance(updated);
    storageService.saveAttendance(updated);
    alert('บันทึกการเข้าเรียนสำเร็จ!');
  };

  const enrolledStudents = students.filter(s => (enrollments[selectedSubject] || []).includes(s.studentId));

  const statusColors = {
    [AttendanceStatus.PRESENT]: 'bg-green-500 text-white',
    [AttendanceStatus.LEAVE]: 'bg-yellow-500 text-white',
    [AttendanceStatus.ABSENT]: 'bg-red-500 text-white',
    [AttendanceStatus.LATE]: 'bg-blue-500 text-white',
  };

  const statusBg = {
    [AttendanceStatus.PRESENT]: 'bg-green-50 text-green-700 border-green-200',
    [AttendanceStatus.LEAVE]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    [AttendanceStatus.ABSENT]: 'bg-red-50 text-red-700 border-red-200',
    [AttendanceStatus.LATE]: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">เลือกวิชา</label>
          <select 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
          >
            <option value="">-- เลือกวิชา --</option>
            {subjects.map(sub => <option key={sub.id} value={sub.code}>{sub.code} - {sub.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">วันที่</label>
          <input 
            type="date"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">จำนวนคาบ</label>
          <input 
            type="number"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
            value={periods}
            onChange={e => setPeriods(parseInt(e.target.value))}
            min={1}
          />
        </div>
      </div>

      {!selectedSubject ? (
        <div className="bg-indigo-50 py-20 rounded-3xl text-center text-indigo-900 border border-dashed border-indigo-200">
          <Users size={32} className="mx-auto mb-4 text-indigo-400" />
          <p className="font-bold">เลือกวิชาและวันที่เพื่อเริ่มเช็คชื่อ</p>
        </div>
      ) : enrolledStudents.length === 0 ? (
        <div className="bg-red-50 py-10 rounded-3xl text-center text-red-900">
          <p className="font-bold">ไม่พบนักเรียนที่ลงทะเบียนในวิชานี้</p>
          <p className="text-sm">กรุณาไปที่เมนูลงทะเบียนเรียนก่อน</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">รายชื่อนักเรียน ({enrolledStudents.length} คน)</h3>
            <button 
              onClick={saveAttendance}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100"
            >
              <Save size={18} />
              บันทึกการเช็คชื่อ
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {enrolledStudents.sort((a,b) => a.number - b.number).map(student => {
              const record = currentRecords.find(r => r.studentId === student.studentId);
              const status = record?.status || AttendanceStatus.PRESENT;
              
              return (
                <div key={student.id} className="bg-white p-5 rounded-3xl border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400"># {student.number}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBg[status]}`}>
                      {status}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 truncate">{student.fullName}</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.values(AttendanceStatus).map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(student.studentId, s)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          status === s 
                            ? statusColors[s] 
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
