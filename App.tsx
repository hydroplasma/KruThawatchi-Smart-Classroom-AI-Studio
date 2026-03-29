
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  ClipboardCheck, 
  GraduationCap, 
  Calendar as CalendarIcon, 
  Settings, 
  FileText,
  Plus,
  ArrowRight,
  ChevronRight,
  Menu,
  X,
  Send,
  Sparkles,
  UserCircle,
  Database,
  Loader2,
  Cloud,
  LogOut,
  ShieldAlert,
  Lock,
  Search,
  UserCheck
} from 'lucide-react';
import { storageService } from './services/storageService';
import { Student, Subject, AttendanceSession, SubjectScoreSheet, TelegramConfig, UserRole } from './types';
import { initialStudents } from './initialStudents';
import { initialSubjects } from './initialSubjects';

// Components
import Dashboard from './components/Dashboard';
import Subjects from './components/Subjects';
import Students from './components/Students';
import Enrollment from './components/Enrollment';
import Attendance from './components/Attendance';
import Scores from './components/Scores';
import CalendarView from './components/CalendarView';
import TelegramSettings from './components/TelegramSettings';
import StudentPortal from './components/StudentPortal';
import BackupRestore from './components/BackupRestore';
import Modal from './components/Modal';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, string[]>>({});
  const [attendance, setAttendance] = useState<AttendanceSession[]>([]);
  const [scores, setScores] = useState<SubjectScoreSheet[]>([]);
  const [telegramConfigs, setTelegramConfigs] = useState<TelegramConfig[]>([]);

  // Password Login state
  const [showPassPrompt, setShowPassPrompt] = useState<{show: boolean, targetRole: UserRole | null}>({show: false, targetRole: null});
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Initialize data from Supabase
  useEffect(() => {
    const initData = async () => {
      try {
        let storedSubjects = await storageService.getSubjects();
        if (storedSubjects.length === 0) {
          await storageService.saveSubjects(initialSubjects);
          storedSubjects = initialSubjects;
        }
        setSubjects(storedSubjects);
        
        let storedStudents = await storageService.getStudents();
        if (storedStudents.length === 0) {
          await storageService.saveStudents(initialStudents);
          storedStudents = initialStudents;
        }
        setStudents(storedStudents);

        setEnrollments(await storageService.getEnrollment());
        setAttendance(await storageService.getAttendance());
        setScores(await storageService.getScores());
        setTelegramConfigs(await storageService.getTelegram());
      } catch (error) {
        console.error("Supabase Initialization error", error);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
    
    // Check local storage for existing session
    const savedRole = localStorage.getItem('smart_class_role') as UserRole;
    if (savedRole) setRole(savedRole);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPass = 'admin1234';
    const teacherPass = 'teacher1234';
    
    const isCorrect = (showPassPrompt.targetRole === UserRole.ADMIN && passwordInput === adminPass) ||
                      (showPassPrompt.targetRole === UserRole.TEACHER && passwordInput === teacherPass);
    
    if (isCorrect) {
      setRole(showPassPrompt.targetRole);
      localStorage.setItem('smart_class_role', showPassPrompt.targetRole!);
      setShowPassPrompt({show: false, targetRole: null});
      setPasswordInput('');
      setAuthError('');
    } else {
      setAuthError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่');
    }
  };

  const handleLogout = () => {
    setRole(null);
    localStorage.removeItem('smart_class_role');
  };

  const NavItem = ({ to, icon: Icon, label, color = "indigo" }: { to: string; icon: any; label: string; color?: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    
    const activeClass = color === "emerald" ? "bg-emerald-600 shadow-emerald-200" : (color === "amber" ? "bg-amber-600 shadow-amber-200" : "bg-indigo-600 shadow-indigo-200");
    const hoverClass = color === "emerald" ? "hover:bg-emerald-50 hover:text-emerald-600" : (color === "amber" ? "hover:bg-amber-50 hover:text-amber-600" : "hover:bg-indigo-50 hover:text-indigo-600");
    
    return (
      <Link
        to={to}
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
          isActive 
            ? `${activeClass} text-white shadow-lg` 
            : `text-gray-600 ${hoverClass}`
        }`}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-emerald-100 rounded-full"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
          <Cloud className="absolute inset-0 m-auto text-emerald-600" size={32} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">KruThawatchi Smart Classroom</h2>
          <p className="text-gray-500 animate-pulse">กำลังซิงค์ข้อมูล Cloud (Supabase)...</p>
        </div>
      </div>
    );
  }

  // Landing Page
  if (!role && !showPassPrompt.show) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-700">
          <div className="col-span-full text-center mb-8 space-y-4">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-200 mb-6">
              <GraduationCap size={48} />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight underline decoration-indigo-200 decoration-8 underline-offset-8">KruThawatchi Smart Classroom</h1>
            <p className="text-lg text-gray-500 font-medium">โรงเรียนน้ำคำวิทยา (ระบบบริหารจัดการห้องเรียนออนไลน์)</p>
          </div>

          {[
            { role: UserRole.ADMIN, title: 'ผู้ดูแลระบบ/งานทะเบียน', desc: 'จัดการวิชา, นักเรียน และข้อมูลระบบ', icon: ShieldAlert, color: 'indigo' },
            { role: UserRole.TEACHER, title: 'ครูประจำวิชา', desc: 'เช็คชื่อ, บันทึกคะแนน และดูภาพรวม', icon: UserCheck, color: 'blue' },
            { role: UserRole.STUDENT, title: 'นักเรียน', desc: 'ดูการเข้าเรียน และผลคะแนนรายวิชา', icon: Users, color: 'emerald' }
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => {
                if (item.role === UserRole.STUDENT) {
                  setRole(UserRole.STUDENT);
                } else {
                  setShowPassPrompt({show: true, targetRole: item.role});
                }
              }}
              className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col items-center text-center group hover:scale-105 transition-all duration-300 active:scale-95"
            >
              <div className={`w-20 h-20 rounded-3xl mb-6 flex items-center justify-center transition-all ${
                item.color === 'indigo' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' : 
                item.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 
                'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
              }`}>
                <item.icon size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Password Prompt Overlay
  if (showPassPrompt.show) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300">
          <button onClick={() => setShowPassPrompt({show: false, targetRole: null})} className="mb-6 p-2 text-gray-400 hover:bg-gray-100 rounded-2xl"><X /></button>
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-black text-gray-900">ระบุรหัสผ่านเข้าใช้งาน</h2>
            <p className="text-gray-500 font-medium mt-1">
              เข้าถึงในฐานะ: {showPassPrompt.targetRole === UserRole.ADMIN ? 'แอดมิน/งานทะเบียน' : 'ครูประจำวิชา'}
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              autoFocus
              type="password"
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-center text-xl font-bold tracking-widest"
              placeholder="••••••••"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
            />
            {authError && <p className="text-red-500 text-sm font-bold text-center">{authError}</p>}
            <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
              ยืนยันรหัสผ่าน
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-gray-50">
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transition-transform duration-300 lg:static lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-3 mb-10 px-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <GraduationCap size={24} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-gray-900 leading-tight">KruThawatchi</span>
                <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
                  Smart Classroom
                </span>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar pb-6">
              {role !== UserRole.STUDENT && (
                <>
                  <NavItem to="/" icon={LayoutDashboard} label="ภาพรวม" />
                  {role === UserRole.ADMIN && (
                    <>
                      <NavItem to="/subjects" icon={BookOpen} label="จัดการวิชา" />
                      <NavItem to="/students" icon={Users} label="จัดการนักเรียน" />
                      <NavItem to="/enrollment" icon={ArrowRight} label="ลงทะเบียนเรียน" />
                    </>
                  )}
                  <NavItem to="/attendance" icon={ClipboardCheck} label="เช็คชื่อ" />
                  <NavItem to="/scores" icon={FileText} label="บันทึกคะแนน" />
                  <NavItem to="/calendar" icon={CalendarIcon} label="ปฏิทิน" />
                  {role === UserRole.ADMIN && (
                    <>
                      <NavItem to="/telegram" icon={Send} label="ตั้งค่า Telegram" />
                      <NavItem to="/backup" icon={Database} label="สำรองข้อมูล" color="amber" />
                    </>
                  )}
                </>
              )}
              
              <div className="pt-4 mt-4 border-t border-gray-100">
                <NavItem to="/student-portal" icon={UserCircle} label="มุมมองนักเรียน" color="emerald" />
              </div>
            </nav>

            <button 
              onClick={handleLogout}
              className="mt-6 flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all border border-red-100"
            >
              <LogOut size={20} />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 flex-shrink-0">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Menu size={24} /></button>
            <div className="flex-1 flex justify-center lg:justify-start">
              <h1 className="text-lg font-bold text-gray-800 lg:ml-4">KruThawatchi Smart Classroom</h1>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
            <div className="max-w-7xl mx-auto pb-12">
              <Routes>
                <Route path="/" element={<Dashboard subjects={subjects} students={students} attendance={attendance} scores={scores} />} />
                <Route path="/subjects" element={<Subjects subjects={subjects} setSubjects={setSubjects} />} />
                <Route path="/students" element={<Students students={students} setStudents={setStudents} />} />
                <Route path="/enrollment" element={<Enrollment subjects={subjects} students={students} enrollments={enrollments} setEnrollments={setEnrollments} />} />
                <Route path="/attendance" element={<Attendance subjects={subjects} students={students} enrollments={enrollments} attendance={attendance} setAttendance={setAttendance} />} />
                <Route path="/scores" element={<Scores subjects={subjects} students={students} enrollments={enrollments} scoreSheets={scores} setScoreSheets={setScores} attendance={attendance} />} />
                <Route path="/calendar" element={<CalendarView attendance={attendance} />} />
                <Route path="/telegram" element={<TelegramSettings subjects={subjects} telegramConfigs={telegramConfigs} setTelegramConfigs={setTelegramConfigs} />} />
                <Route path="/backup" element={<BackupRestore />} />
                <Route path="/student-portal" element={<StudentPortal subjects={subjects} students={students} enrollments={enrollments} attendance={attendance} scores={scores} />} />
              </Routes>
            </div>
            <footer className="mt-auto py-8 border-t border-gray-100 text-center space-y-2">
              <p className="text-sm font-medium text-gray-600">พัฒนาโดย: <span className="text-indigo-600 font-bold">นายธวัชชัย แก่นจักร์</span> ครู โรงเรียนน้ำคำวิทยา</p>
              <p className="text-xs text-gray-400 font-medium">Copyright © 2026 KruThawatchi Smart Classroom Management System</p>
            </footer>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
