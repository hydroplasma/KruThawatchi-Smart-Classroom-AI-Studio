
import React, { useState } from 'react';
import { Send, Plus, Trash2, Info } from 'lucide-react';
import { Subject, TelegramConfig } from '../types';
import { storageService } from '../services/storageService';

interface TelegramSettingsProps {
  subjects: Subject[];
  telegramConfigs: TelegramConfig[];
  setTelegramConfigs: React.Dispatch<React.SetStateAction<TelegramConfig[]>>;
}

const TelegramSettings: React.FC<TelegramSettingsProps> = ({ subjects, telegramConfigs, setTelegramConfigs }) => {
  const [formData, setFormData] = useState<Partial<TelegramConfig>>({
    subjectCode: '',
    botName: '',
    botToken: '',
    chatId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = [...telegramConfigs.filter(c => c.subjectCode !== formData.subjectCode), formData as TelegramConfig];
    setTelegramConfigs(updated);
    storageService.saveTelegram(updated);
    setFormData({ subjectCode: '', botName: '', botToken: '', chatId: '' });
    alert('บันทึกการตั้งค่า Telegram เรียบร้อย!');
  };

  const handleDelete = (code: string) => {
    const updated = telegramConfigs.filter(c => c.subjectCode !== code);
    setTelegramConfigs(updated);
    storageService.saveTelegram(updated);
  };

  return (
    <div className="space-y-8">
      <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">ตั้งค่า Telegram Bot</h2>
          <p className="text-indigo-100">เชื่อมต่อระบบแจ้งเตือนอัตโนมัติไปยังกลุ่มหรือแชทส่วนตัว</p>
        </div>
        <Send className="absolute -bottom-4 -right-4 text-indigo-500 w-32 h-32 opacity-20 rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">เลือกวิชา</label>
              <select 
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                value={formData.subjectCode}
                onChange={e => setFormData({...formData, subjectCode: e.target.value})}
              >
                <option value="">-- เลือกวิชา --</option>
                {subjects.map(sub => <option key={sub.id} value={sub.code}>{sub.code} - {sub.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">ชื่อบอท (สำหรับแสดงผล)</label>
              <input required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" value={formData.botName} onChange={e => setFormData({...formData, botName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Bot Token</label>
              <input required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none font-mono text-sm" value={formData.botToken} onChange={e => setFormData({...formData, botToken: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Chat ID / Group ID</label>
              <input required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" value={formData.chatId} onChange={e => setFormData({...formData, chatId: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100">
            บันทึกการเชื่อมต่อ
          </button>
        </form>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 px-2">รายการบอทที่เชื่อมต่อแล้ว</h3>
          {telegramConfigs.length === 0 ? (
            <div className="bg-gray-50 p-12 rounded-3xl text-center border border-dashed border-gray-200">
              <Info size={32} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-medium">ยังไม่มีการตั้งค่าบอท</p>
            </div>
          ) : (
            telegramConfigs.map(config => (
              <div key={config.subjectCode} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Send size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{config.botName}</p>
                    <p className="text-xs text-indigo-600 font-bold">วิชา {config.subjectCode}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-1">Chat ID: {config.chatId}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(config.subjectCode)}
                  className="p-3 text-red-100 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TelegramSettings;
