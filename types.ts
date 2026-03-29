
export enum AttendanceStatus {
  PRESENT = 'มา',
  LEAVE = 'ลา',
  ABSENT = 'ขาด',
  LATE = 'สาย'
}

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student'
}

export interface Student {
  id: string;
  studentId: string;
  fullName: string;
  grade: string;
  room: string;
  number: number;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  grade: string;
  semester: string;
  year: string;
  hours: number;
  numCollectScores: number;
  collectPercent: number;
  midtermPercent: number;
  finalPercent: number;
}

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceSession {
  id: string;
  subjectCode: string;
  date: string;
  periods: number;
  records: AttendanceRecord[];
}

export interface Score {
  studentId: string;
  collectScores: Record<number, number>;
  midterm: number;
  final: number;
  totalScore: number;
  grade: string;
}

export interface SubjectScoreSheet {
  subjectCode: string;
  scores: Score[];
  assignmentNames: Record<number, { name: string; maxScore: number }>;
}

export interface TelegramConfig {
  subjectCode: string;
  botName: string;
  botToken: string;
  chatId: string;
}
