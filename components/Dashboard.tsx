
import React from 'react';
import { BookOpen, Users, ClipboardCheck, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Subject, Student, AttendanceSession, SubjectScoreSheet } from '../types';

interface DashboardProps {
  subjects: Subject[];
  students: Student[];
  attendance: AttendanceSession[];
  scores: SubjectScoreSheet[];
}

const Dashboard: React.FC<DashboardProps> = ({ subjects, students, attendance, scores }) => {
  const stats = [
    { label: 'จำนวนวิชา', value: subjects.length, icon: BookOpen, color: 'bg-blue-500', shadow: 'shadow-blue-200' },
    { label: 'จำนวนนักเรียน', value: students.length, icon: Users, color: 'bg-indigo-500', shadow: 'shadow-indigo-200' },
    { label: 'วันเช็คชื่อ', value: [...new Set(attendance.map(a => a.date))].length, icon: ClipboardCheck, color: 'bg-green-500', shadow: 'shadow-green-200' },
    { label: 'บันทึกคะแนน', value: scores.length, icon: Award, color: 'bg-orange-500', shadow: 'shadow-orange-200' },
  ];

  // Prepare chart data
  const chartData = subjects.map(sub => {
    const subScores = scores.find(s => s.subjectCode === sub.code);
    if (!subScores || subScores.scores.length === 0) return { name: sub.code, avg: 0 };
    
    const validScores = subScores.scores.map(s => s.totalScore).filter(s => !isNaN(s));
    const avg = validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : 0;
    
    return { name: sub.code, avg: parseFloat(avg as string) };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ภาพรวมระบบ</h2>
          <p className="text-gray-500">ข้อมูลสรุปการจัดการเรียนการสอน</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg ${stat.shadow}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100">
          <h3 className="text-lg font-bold mb-6 text-gray-800">แนวโน้มคะแนนเฉลี่ยรายวิชา</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                />
                <Bar dataKey="avg" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100">
          <h3 className="text-lg font-bold mb-6 text-gray-800">กิจกรรมล่าสุด</h3>
          <div className="space-y-4">
            {attendance.slice(-4).reverse().map((att, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <ClipboardCheck size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">บันทึกการเข้าเรียนวิชา {att.subjectCode}</p>
                  <p className="text-xs text-gray-500">{new Date(att.date).toLocaleDateString('th-TH')}</p>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            ))}
            {attendance.length === 0 && (
              <p className="text-center py-10 text-gray-400">ยังไม่มีประวัติกิจกรรม</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChevronRight = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export default Dashboard;
