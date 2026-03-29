
import React, { useState, useEffect } from 'react';
import { AttendanceSession } from '../types';
import { ChevronLeft, ChevronRight, Link as LinkIcon, Calendar as CalendarIcon, X, Check, ExternalLink, Globe } from 'lucide-react';
import Modal, { ModalType } from './Modal';

interface CalendarViewProps {
  attendance: AttendanceSession[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ attendance }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'system' | 'google'>('system');
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState<string>(localStorage.getItem('google_calendar_url') || '');
  const [isSettingUrl, setIsSettingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(googleCalendarUrl);

  const [modal, setModal] = useState<{isOpen: boolean, title: string, message: string, type: ModalType}>({
    isOpen: false, title: '', message: '', type: 'info'
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const handleSaveUrl = () => {
    let finalUrl = urlInput.trim();
    // Simple check to help user if they paste the full iframe code
    if (finalUrl.includes('<iframe')) {
      const match = finalUrl.match(/src="([^"]+)"/);
      if (match) finalUrl = match[1];
    }

    if (finalUrl && !finalUrl.startsWith('http')) {
      setModal({ isOpen: true, title: 'URL ไม่ถูกต้อง', message: 'กรุณากรอกลิงก์ที่ขึ้นต้นด้วย http หรือ https', type: 'error' });
      return;
    }

    localStorage.setItem('google_calendar_url', finalUrl);
    setGoogleCalendarUrl(finalUrl);
    setIsSettingUrl(false);
    setModal({ isOpen: true, title: 'สำเร็จ', message: 'บันทึกการเชื่อมต่อ Google Calendar เรียบร้อยแล้ว', type: 'success' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Modal 
        isOpen={modal.isOpen} 
        onClose={() => setModal({...modal, isOpen: false})} 
        title={modal.title} 
        message={modal.message} 
        type={modal.type} 
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="bg-white p-1 rounded-2xl border border-gray-100 flex shadow-sm w-full sm:w-auto">
          <button 
            onClick={() => setViewMode('system')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'system' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <CalendarIcon size={18} />
            ปฏิทินระบบ
          </button>
          <button 
            onClick={() => setViewMode('google')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'google' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Globe size={18} />
            Google Calendar
          </button>
        </div>

        {viewMode === 'google' && (
          <button 
            onClick={() => setIsSettingUrl(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            <LinkIcon size={18} />
            ตั้งค่าลิงก์ปฏิทิน
          </button>
        )}
      </div>

      {isSettingUrl && (
        <div className="bg-white p-8 rounded-[2rem] border border-indigo-100 shadow-xl animate-in slide-in-from-top duration-300 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <LinkIcon className="text-indigo-600" /> เชื่อมต่อ Google Calendar
            </h3>
            <button onClick={() => setIsSettingUrl(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
          </div>
          <p className="text-gray-500 text-sm">วางลิงก์ปฏิทินแบบสาธารณะ (Public URL) หรือโค้ดฝัง iFrame ของคุณที่นี่</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              className="flex-1 px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-indigo-500 outline-none font-mono text-sm"
              placeholder="https://calendar.google.com/..."
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
            />
            <button 
              onClick={handleSaveUrl}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              <Check size={20} /> ยืนยัน
            </button>
          </div>
        </div>
      )}

      {viewMode === 'system' ? (
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">Attendance Records</span>
              <h2 className="text-2xl font-black text-gray-900">{monthNames[currentMonth]} {currentYear + 543}</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-3 bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all"><ChevronLeft size={24}/></button>
              <button onClick={nextMonth} className="p-3 bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all"><ChevronRight size={24}/></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d, i) => (
              <div key={d} className={`text-center text-xs font-black py-4 uppercase tracking-wider ${i === 0 ? 'text-red-400' : i === 6 ? 'text-purple-400' : 'text-gray-400'}`}>{d}</div>
            ))}
            
            {Array(firstDay).fill(null).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 sm:h-40 bg-gray-50/30 rounded-2xl"></div>
            ))}

            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const sessions = attendance.filter(a => a.date === dateStr);
              const hasAttendance = sessions.length > 0;

              return (
                <div key={day} className={`h-24 sm:h-40 p-3 border-2 rounded-[1.5rem] transition-all relative group ${
                  hasAttendance ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-gray-50 hover:border-gray-200'
                }`}>
                  <span className={`text-sm font-black ${hasAttendance ? 'text-indigo-600' : 'text-gray-300 group-hover:text-gray-900'}`}>{day}</span>
                  {hasAttendance && (
                    <div className="mt-2 space-y-1 overflow-y-auto no-scrollbar max-h-[80%]">
                      {sessions.map(s => (
                        <div key={s.id} className="text-[9px] bg-white border border-indigo-100 text-indigo-600 p-1.5 rounded-lg truncate font-bold shadow-sm">
                          {s.subjectCode}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col items-center justify-center min-h-[600px]">
          {googleCalendarUrl ? (
            <div className="w-full h-full min-h-[700px] relative">
              <iframe 
                src={googleCalendarUrl} 
                style={{ border: 0 }} 
                width="100%" 
                height="700" 
                frameBorder="0" 
                scrolling="no"
                className="rounded-[2.5rem]"
              ></iframe>
              <div className="absolute top-4 right-4">
                <a 
                  href={googleCalendarUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/50 text-indigo-600 hover:bg-white transition-all block"
                >
                  <ExternalLink size={20} />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 space-y-6">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
                <Globe size={48} />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-black text-gray-900 mb-2">ยังไม่ได้ตั้งค่า Google Calendar</h3>
                <p className="text-gray-500 font-medium">คุณสามารถนำลิงก์ปฏิทินที่ตั้งค่าเป็นสาธารณะมาวาง เพื่อดูตารางนัดหมายส่วนตัวหรือตารางสอนได้ในหน้านี้</p>
              </div>
              <button 
                onClick={() => setIsSettingUrl(true)}
                className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all"
              >
                ตั้งค่าลิงก์ตอนนี้
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
