
import { supabase } from './supabaseClient';
import { Student, Subject, AttendanceSession, SubjectScoreSheet, TelegramConfig } from '../types';

const handleError = (error: any, operation: string) => {
  console.error(`Supabase Error during ${operation}:`, error);
  if (error.code === '42P01') {
    throw new Error(`ไม่พบตารางข้อมูล (${operation}) กรุณารัน SQL Setup ใน Supabase Editor ก่อน`);
  }
  if (error.code === '42501') {
    throw new Error(`ไม่มีสิทธิ์เขียนข้อมูล (${operation}) กรุณาตรวจสอบนโยบาย RLS หรือ Disable RLS ใน Supabase`);
  }
  throw error;
};

export const storageService = {
  // Students
  getStudents: async (): Promise<Student[]> => {
    try {
      const { data, error } = await supabase.from('students').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn("Could not fetch students, table might not exist yet.");
      return [];
    }
  },
  saveStudents: async (data: Student[]) => {
    try {
      // Clear existing records safely
      await supabase.from('students').delete().neq('id', 'EMPTY_FILTER');
      const { error } = await supabase.from('students').upsert(data);
      if (error) throw error;
    } catch (e) {
      handleError(e, 'students');
    }
  },
  
  // Subjects
  getSubjects: async (): Promise<Subject[]> => {
    try {
      const { data, error } = await supabase.from('subjects').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      return [];
    }
  },
  saveSubjects: async (data: Subject[]) => {
    try {
      await supabase.from('subjects').delete().neq('id', 'EMPTY_FILTER');
      const { error } = await supabase.from('subjects').upsert(data);
      if (error) throw error;
    } catch (e) {
      handleError(e, 'subjects');
    }
  },
  
  // Attendance
  getAttendance: async (): Promise<AttendanceSession[]> => {
    try {
      const { data, error } = await supabase.from('attendance').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) { return []; }
  },
  saveAttendance: async (data: AttendanceSession[]) => {
    try {
      await supabase.from('attendance').delete().neq('id', 'EMPTY_FILTER');
      const { error } = await supabase.from('attendance').upsert(data);
      if (error) throw error;
    } catch (e) { handleError(e, 'attendance'); }
  },
  
  // Scores
  getScores: async (): Promise<SubjectScoreSheet[]> => {
    try {
      const { data, error } = await supabase.from('scores').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) { return []; }
  },
  saveScores: async (data: SubjectScoreSheet[]) => {
    try {
      await supabase.from('scores').delete().neq('subjectCode', 'EMPTY_FILTER');
      const { error } = await supabase.from('scores').upsert(data);
      if (error) throw error;
    } catch (e) { handleError(e, 'scores'); }
  },
  
  // Telegram
  getTelegram: async (): Promise<TelegramConfig[]> => {
    try {
      const { data, error } = await supabase.from('telegram').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) { return []; }
  },
  saveTelegram: async (data: TelegramConfig[]) => {
    try {
      await supabase.from('telegram').delete().neq('subjectCode', 'EMPTY_FILTER');
      const { error } = await supabase.from('telegram').upsert(data);
      if (error) throw error;
    } catch (e) { handleError(e, 'telegram'); }
  },

  // Enrollment
  getEnrollment: async (): Promise<Record<string, string[]>> => {
    try {
      const { data, error } = await supabase.from('enrollment').select('*');
      if (error) throw error;
      const result: Record<string, string[]> = {};
      data?.forEach(item => {
        result[item.subjectCode] = item.studentIds;
      });
      return result;
    } catch (e) { return {}; }
  },
  saveEnrollment: async (data: Record<string, string[]>) => {
    try {
      await supabase.from('enrollment').delete().neq('subjectCode', 'EMPTY_FILTER');
      const payload = Object.entries(data).map(([code, ids]) => ({ subjectCode: code, studentIds: ids }));
      const { error } = await supabase.from('enrollment').upsert(payload);
      if (error) throw error;
    } catch (e) { handleError(e, 'enrollment'); }
  },

  saveSetting: (key: string, value: string) => {
    localStorage.setItem(key, value);
  },

  getSetting: (key: string): string => {
    return localStorage.getItem(key) || '';
  },

  getAllData: async () => {
    return {
      STUDENTS: await storageService.getStudents(),
      SUBJECTS: await storageService.getSubjects(),
      ATTENDANCE: await storageService.getAttendance(),
      SCORES: await storageService.getScores(),
      TELEGRAM: await storageService.getTelegram(),
      ENROLLMENT: await storageService.getEnrollment()
    };
  },

  restoreAllData: async (data: any) => {
    try {
      if (data.STUDENTS) await storageService.saveStudents(data.STUDENTS);
      if (data.SUBJECTS) await storageService.saveSubjects(data.SUBJECTS);
      if (data.ATTENDANCE) await storageService.saveAttendance(data.ATTENDANCE);
      if (data.SCORES) await storageService.saveScores(data.SCORES);
      if (data.TELEGRAM) await storageService.saveTelegram(data.TELEGRAM);
      if (data.ENROLLMENT) await storageService.saveEnrollment(data.ENROLLMENT);
      return true;
    } catch (e) {
      console.error("Restore failed full report:", e);
      throw e; // Pass it up to UI to show specific message
    }
  },

  clearAllData: async () => {
    try {
      await supabase.from('students').delete().neq('id', 'FORCE');
      await supabase.from('subjects').delete().neq('id', 'FORCE');
      await supabase.from('attendance').delete().neq('id', 'FORCE');
      await supabase.from('scores').delete().neq('subjectCode', 'FORCE');
      await supabase.from('telegram').delete().neq('subjectCode', 'FORCE');
      await supabase.from('enrollment').delete().neq('subjectCode', 'FORCE');
    } catch (e) {
      console.error("Clear data failed", e);
    }
  }
};
