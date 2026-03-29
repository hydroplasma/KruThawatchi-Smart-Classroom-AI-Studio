
import React, { useState, useMemo } from 'react';
import { Search, UserCircle, BookOpen, ClipboardCheck, Award, LogOut, ChevronRight, MapPin, Calendar } from 'lucide-react';
import { Student, Subject, AttendanceSession, SubjectScoreSheet, AttendanceStatus } from '../types';

interface StudentPortalProps {
  subjects: Subject[];
  students: Student[];
  enrollments: Record<string, string[]>;
  attendance: AttendanceSession[];
  scores: SubjectScoreSheet[];
}

const StudentPortal: React.FC<StudentPortalProps> = ({ subjects, students, enrollments, attendance, scores }) => {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-pad input to 5 digits (e.g., 1477 -> 01477)
    const paddedInput = studentIdInput.trim().padStart(5, '0');
    
    const student = students.find(s => s.studentId === paddedInput);
    if (student) {
      setActiveStudent(student);
      setError('');
    } else {
      setError(`ไม่พบรหัสนักเรียน ${paddedInput} ในระบบ`);
      setActiveStudent(null);
    }
  };

  const studentData = useMemo(() => {
    if (!activeStudent) return null;

    // Get subjects student is enrolled in
    const enrolledSubjectCodes = Object.entries(enrollments)
      .filter(([_, studentIds]) => (studentIds as string[]).includes(activeStudent.studentId))
      .map(([code]) => code);

    const enrolledSubjects = subjects.filter(s => enrolledSubjectCodes.includes(s.code));

    // Get attendance stats per subject
    const attendanceStats = enrolledSubjectCodes.map(code => {
      const subjectSessions = attendance.filter(a => a.subjectCode === code);
      const totalSessions = subjectSessions.length;
      const presentSessions = subjectSessions.filter(s => 
        s.records.find(r => r.studentId === activeStudent.studentId)?.status === AttendanceStatus.PRESENT
      ).length;

      return {
        code,
        total: totalSessions,
        present: presentSessions,
        percent: totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0
      };
    });

    // Get scores per subject
    const studentScores = enrolledSubjectCodes.map(code => {
      const sheet = scores.find(s => s.subjectCode === code);
      const scoreData = sheet?.scores.find(s => s.studentId === activeStudent.studentId);
      return {
        code,
        score: scoreData?.totalScore || 0,
        grade: scoreData?.grade || '-'
      };
    });

    return {
      enrolledSubjects,
      attendanceStats,
      studentScores
    };
  }, [activeStudent, enrollments, subjects, attendance, scores]);

  if (!activeStudent) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-emerald-50 rounded-3xl border border-emerald-100 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-200 mb-8">
          <UserCircle size={48} />
        </div>
        <h2 className="text-3xl font-bold text-emerald-900 mb-2">Student Portal</h2>
        <p className="text-emerald-700 mb-10 text-center max-w-xs">เข้าสู่ระบบเพื่อดูรายละเอียดการเข้าเรียน และผลการเรียนของคุณ</p>
        
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={20} />
            <input 
              required
              type="text"
              inputMode="numeric"
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all bg-white font-bold"
              placeholder="กรอกรหัสนักเรียน (เช่น 1477 หรือ 01477)"
              value={studentIdInput}
              onChange={e => setStudentIdInput(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
          <button 
            type="submit"
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all"
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      {/* Profile Header */}
      <div className="bg-emerald-600 p-8 rounded-[2rem] text-white shadow-xl shadow-emerald-100 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-400/20 rounded-full -ml-12 -mb-12 blur-2xl"></div>
        
        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
          <UserCircle size={40} />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <p className="text-emerald-100 text-sm font-medium mb-1">ยินดีต้อนรับ</p>
          <h2 className="text-2xl font-bold leading-tight">{activeStudent.fullName}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-sm text-emerald-100 font-medium">
            <span className="flex items-center gap-1.5 bg-emerald-500/30 px-3 py-1 rounded-full border border-emerald-400/30">
              <BookOpen size={14} /> ID: {activeStudent.studentId}
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-500/30 px-3 py-1 rounded-full border border-emerald-400/30">
              <MapPin size={14} /> ชั้น {activeStudent.grade}/{activeStudent.room}
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-500/30 px-3 py-1 rounded-full border border-emerald-400/30">
              <Calendar size={14} /> เลขที่ {activeStudent.number}
            </span>
          </div>
        </div>

        <button 
          onClick={() => setActiveStudent(null)}
          className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all border border-white/20"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Summary */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ClipboardCheck className="text-emerald-500" />
              การเข้าเรียน
            </h3>
          </div>
          <div className="space-y-6">
            {studentData?.attendanceStats.map(stat => {
              const sub = studentData.enrolledSubjects.find(s => s.code === stat.code);
              return (
                <div key={stat.code} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{sub?.name}</p>
                      <p className="text-xs text-gray-400 font-bold">{stat.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{stat.percent}%</p>
                      <p className="text-[10px] text-gray-400 font-bold">มา {stat.present}/{stat.total} คาบ</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                    <div 
                      className={`h-full transition-all duration-1000 ${stat.percent >= 80 ? 'bg-emerald-500' : stat.percent >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${stat.percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {studentData?.attendanceStats.length === 0 && (
              <p className="text-center py-10 text-gray-400 font-medium italic">ยังไม่มีข้อมูลการเช็คชื่อ</p>
            )}
          </div>
        </div>

        {/* Grades Summary */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Award className="text-indigo-500" />
              ผลการเรียน
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {studentData?.studentScores.map(score => {
              const sub = studentData.enrolledSubjects.find(s => s.code === score.code);
              return (
                <div key={score.code} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col items-center text-center">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">{score.code}</span>
                  <p className="font-bold text-gray-800 text-sm mb-3 line-clamp-1">{sub?.name}</p>
                  <div className="flex items-center justify-center gap-4 w-full">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Score</span>
                      <span className="text-xl font-bold text-gray-900">{score.score}</span>
                    </div>
                    <div className="w-px h-8 bg-indigo-200"></div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Grade</span>
                      <span className={`text-xl font-bold ${score.grade === '4' ? 'text-emerald-600' : score.grade === '0' ? 'text-red-500' : 'text-indigo-600'}`}>
                        {score.grade}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {studentData?.studentScores.length === 0 && (
              <p className="col-span-full text-center py-10 text-gray-400 font-medium italic">ยังไม่มีข้อมูลเกรด</p>
            )}
          </div>
        </div>
      </div>

      {/* Enrolled Subjects List */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold mb-6">ตารางวิชาที่ลงทะเบียน</h3>
        <div className="space-y-3">
          {studentData?.enrolledSubjects.map(sub => (
            <div key={sub.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-emerald-100 hover:bg-emerald-50/30 transition-all cursor-default group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <BookOpen size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{sub.name}</p>
                  <p className="text-xs text-gray-500 font-bold">{sub.code} | {sub.hours} คาบ/สัปดาห์</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" size={20} />
            </div>
          ))}
          {studentData?.enrolledSubjects.length === 0 && (
            <p className="text-center py-10 text-gray-400">ยังไม่ได้ลงทะเบียนวิชาใดๆ</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
