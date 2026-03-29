
import React, { useState, useEffect } from 'react';
import { Subject, Student, SubjectScoreSheet, Score, AttendanceSession } from '../types';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { Sparkles, Save, BrainCircuit, Plus, Trash2, Edit3, Settings2, X, AlertCircle, Info } from 'lucide-react';
import Modal, { ModalType } from './Modal';

interface ScoresProps {
  subjects: Subject[];
  students: Student[];
  enrollments: Record<string, string[]>;
  scoreSheets: SubjectScoreSheet[];
  setScoreSheets: React.Dispatch<React.SetStateAction<SubjectScoreSheet[]>>;
  attendance: AttendanceSession[];
}

const Scores: React.FC<ScoresProps> = ({ subjects, students, enrollments, scoreSheets, setScoreSheets, attendance }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [currentSheet, setCurrentSheet] = useState<SubjectScoreSheet | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Modal State
  const [modal, setModal] = useState<{isOpen: boolean, title: string, message: string, type: ModalType, onConfirm?: () => void}>({
    isOpen: false, title: '', message: '', type: 'info'
  });

  const showAlert = (title: string, message: string, type: ModalType = 'info', onConfirm?: () => void) => {
    setModal({ isOpen: true, title, message, type, onConfirm });
  };

  // Load or Initialize ScoreSheet
  useEffect(() => {
    if (selectedSubject) {
      const sheet = scoreSheets.find(s => s.subjectCode === selectedSubject);
      if (sheet) {
        setCurrentSheet(JSON.parse(JSON.stringify(sheet))); // Deep copy
      } else {
        const enrolledIds = enrollments[selectedSubject] || [];
        const subject = subjects.find(s => s.code === selectedSubject);
        const newSheet: SubjectScoreSheet = {
          subjectCode: selectedSubject,
          scores: enrolledIds.map(id => ({
            studentId: id,
            collectScores: {},
            midterm: 0,
            final: 0,
            totalScore: 0,
            grade: '0'
          })),
          assignmentNames: {
            1: { name: 'งานที่ 1', maxScore: 10 }
          }
        };
        setCurrentSheet(newSheet);
      }
    } else {
      setCurrentSheet(null);
    }
  }, [selectedSubject, enrollments, scoreSheets, subjects]);

  const calculateTotalAndGrade = (score: Score, sheet: SubjectScoreSheet, subject: Subject) => {
    let totalStudentRaw = 0;
    let totalMaxPossible = 0;

    (Object.entries(sheet.assignmentNames) as [string, { name: string; maxScore: number }][]).forEach(([idx, config]) => {
      const studentScore = score.collectScores[parseInt(idx)] || 0;
      totalStudentRaw += studentScore;
      totalMaxPossible += config.maxScore;
    });

    const weightedCollect = totalMaxPossible > 0 
      ? (totalStudentRaw / totalMaxPossible) * subject.collectPercent 
      : 0;
    
    const midtermWeight = (score.midterm / 100) * subject.midtermPercent;
    const finalWeight = (score.final / 100) * subject.finalPercent;

    const total = weightedCollect + midtermWeight + finalWeight;
    const rounded = Math.round(total * 100) / 100;

    let grade = '0';
    if (rounded >= 80) grade = '4';
    else if (rounded >= 75) grade = '3.5';
    else if (rounded >= 70) grade = '3';
    else if (rounded >= 65) grade = '2.5';
    else if (rounded >= 60) grade = '2';
    else if (rounded >= 55) grade = '1.5';
    else if (rounded >= 50) grade = '1';

    return { total: rounded, grade };
  };

  const updateScore = (studentId: string, field: string, value: any, collectIndex?: number) => {
    if (!currentSheet || !selectedSubject) return;
    const subject = subjects.find(s => s.code === selectedSubject)!;
    
    const updatedScores = currentSheet.scores.map(s => {
      if (s.studentId === studentId) {
        let newScore = { ...s };
        if (collectIndex !== undefined) {
          const val = parseFloat(value);
          const max = currentSheet.assignmentNames[collectIndex].maxScore;
          newScore.collectScores = { ...s.collectScores, [collectIndex]: Math.min(val || 0, max) };
        } else {
          (newScore as any)[field] = parseFloat(value) || 0;
        }
        const { total, grade } = calculateTotalAndGrade(newScore, currentSheet, subject);
        newScore.totalScore = total;
        newScore.grade = grade;
        return newScore;
      }
      return s;
    });

    setCurrentSheet({ ...currentSheet, scores: updatedScores });
  };

  const addAssignment = () => {
    if (!currentSheet) return;
    const nextIdx = Math.max(0, ...Object.keys(currentSheet.assignmentNames).map(Number)) + 1;
    const updatedSheet = {
      ...currentSheet,
      assignmentNames: {
        ...currentSheet.assignmentNames,
        [nextIdx]: { name: `ระบุชื่องาน ${nextIdx}`, maxScore: 10 }
      }
    };
    setCurrentSheet(updatedSheet);
  };

  const removeAssignment = (idx: number) => {
    showAlert('ยืนยันการลบ', 'ข้อมูลคะแนนในงานนี้จะถูกลบออกจากทุกคนอย่างถาวร ต้องการลบหรือไม่?', 'confirm', () => {
      if (!currentSheet) return;
      const { [idx]: removed, ...rest } = currentSheet.assignmentNames;
      const updatedScores = currentSheet.scores.map(s => {
        const { [idx]: scoreRemoved, ...scoresRest } = s.collectScores;
        return { ...s, collectScores: scoresRest };
      });
      setCurrentSheet({ ...currentSheet, assignmentNames: rest, scores: updatedScores });
    });
  };

  const updateAssignmentConfig = (idx: number, field: 'name' | 'maxScore', value: any) => {
    if (!currentSheet) return;
    const updatedSheet = {
      ...currentSheet,
      assignmentNames: {
        ...currentSheet.assignmentNames,
        [idx]: { 
          ...currentSheet.assignmentNames[idx], 
          [field]: field === 'maxScore' ? (parseInt(value) || 0) : value 
        }
      }
    };
    setCurrentSheet(updatedSheet);
  };

  const saveSheet = async () => {
    if (!currentSheet) return;
    try {
      const updated = [...scoreSheets.filter(s => s.subjectCode !== currentSheet.subjectCode), currentSheet];
      await storageService.saveScores(updated);
      setScoreSheets(updated);
      showAlert('สำเร็จ', 'บันทึกข้อมูลคะแนนลงระบบคลาวด์เรียบร้อยแล้ว', 'success');
    } catch (e) {
      showAlert('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อ', 'error');
    }
  };

  const runAnalysis = async () => {
    if (!currentSheet || !selectedSubject) return;
    setIsAnalyzing(true);
    const subject = subjects.find(s => s.code === selectedSubject)!;
    const result = await geminiService.analyzePerformance(students, currentSheet.scores, subject.name);
    setAnalysisResult(result || '');
    setIsAnalyzing(false);
  };

  const subject = subjects.find(s => s.code === selectedSubject);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Modal 
        isOpen={modal.isOpen} 
        onClose={() => setModal({...modal, isOpen: false})} 
        onConfirm={modal.onConfirm}
        title={modal.title} 
        message={modal.message} 
        type={modal.type} 
      />

      {/* Header Controls */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full space-y-2">
          <label className="text-sm font-bold text-gray-700">เลือกวิชาบันทึกคะแนน</label>
          <select 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 bg-gray-50/50"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
          >
            <option value="">-- เลือกวิชา --</option>
            {subjects.map(sub => <option key={sub.id} value={sub.code}>{sub.code} - {sub.name} ({sub.grade})</option>)}
          </select>
        </div>
        
        {selectedSubject && (
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => setShowAssignModal(!showAssignModal)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-5 py-3 rounded-xl font-bold hover:bg-amber-100 transition-all"
            >
              <Settings2 size={20} />
              <span>ตั้งค่างาน</span>
            </button>
            <button 
              disabled={isAnalyzing}
              onClick={runAnalysis}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-purple-100 disabled:opacity-50"
            >
              <BrainCircuit size={20} />
              <span>AI วิเคราะห์</span>
            </button>
            <button 
              onClick={saveSheet}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700"
            >
              <Save size={20} />
              <span>บันทึกฐานข้อมูล</span>
            </button>
          </div>
        )}
      </div>

      {showAssignModal && currentSheet && (
        <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-amber-900 flex items-center gap-2">
              <Settings2 size={18} /> จัดการรายการงานและคะแนนเต็ม
            </h3>
            <button onClick={() => setShowAssignModal(false)} className="text-amber-400 hover:text-amber-600"><X size={20}/></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.entries(currentSheet.assignmentNames) as [string, { name: string; maxScore: number }][]).map(([idx, config]) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-amber-200 flex gap-3 items-center">
                <div className="flex-1 space-y-2">
                  <input 
                    className="w-full text-sm font-bold border-b border-gray-100 outline-none focus:border-amber-500"
                    value={config.name}
                    onChange={e => updateAssignmentConfig(parseInt(idx), 'name', e.target.value)}
                    placeholder="ชื่อเรียกงาน"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">เต็ม</span>
                    <input 
                      type="number"
                      className="w-16 text-sm font-bold text-amber-600 outline-none"
                      value={config.maxScore}
                      onChange={e => updateAssignmentConfig(parseInt(idx), 'maxScore', e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  onClick={() => removeAssignment(parseInt(idx))}
                  className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button 
              onClick={addAssignment}
              className="border-2 border-dashed border-amber-300 rounded-2xl flex flex-col items-center justify-center p-4 text-amber-600 hover:bg-amber-100/50 transition-all"
            >
              <Plus size={24} />
              <span className="text-xs font-bold mt-1">เพิ่มช่องคะแนนงาน</span>
            </button>
          </div>
          <div className="flex items-start gap-2 text-amber-700 text-xs bg-white/50 p-3 rounded-xl">
            <Info size={14} className="mt-0.5" />
            <p>คะแนนเก็บทั้งหมดจะถูกนำไปคำนวณถ่วงน้ำหนักให้เหลือ <b>{subject?.collectPercent}%</b> ตามโครงสร้างวิชาที่ตั้งไว้</p>
          </div>
        </div>
      )}

      {analysisResult && (
        <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 animate-in fade-in slide-in-from-bottom duration-500 relative">
          <button onClick={() => setAnalysisResult(null)} className="absolute top-4 right-4 text-purple-400 hover:text-purple-600">
            <X size={20} />
          </button>
          <div className="flex items-center gap-2 mb-4 text-purple-700 font-bold">
            <Sparkles size={20} />
            <span>AI สรุปผลการเรียนอัจฉริยะ</span>
          </div>
          <div className="text-purple-900 text-sm leading-relaxed whitespace-pre-wrap">
            {analysisResult}
          </div>
        </div>
      )}

      {!currentSheet ? (
        <div className="bg-indigo-50 py-20 rounded-[2.5rem] text-center text-indigo-900 border border-dashed border-indigo-200">
          <Sparkles size={32} className="mx-auto mb-4 text-indigo-400" />
          <p className="font-bold">เลือกวิชาเพื่อเปิดสมุดบันทึกคะแนน</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-5 text-left font-bold text-gray-500 uppercase min-w-[60px]">เลขที่</th>
                  <th className="px-4 py-5 text-left font-bold text-gray-500 uppercase min-w-[200px]">ชื่อ-นามสกุล</th>
                  {(Object.entries(currentSheet.assignmentNames) as [string, { name: string; maxScore: number }][]).map(([idx, config]) => (
                    <th key={idx} className="px-2 py-5 text-center min-w-[100px] border-l border-gray-100/50">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[80px]">{config.name}</span>
                        <span className="text-indigo-600 font-bold">เต็ม {config.maxScore}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-2 py-5 text-center min-w-[100px] bg-indigo-50/30 border-l border-gray-100">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-indigo-400 font-bold">กลางภาค</span>
                      <span className="text-indigo-600 font-bold">({subject?.midtermPercent}%)</span>
                    </div>
                  </th>
                  <th className="px-2 py-5 text-center min-w-[100px] bg-indigo-50/30">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-indigo-400 font-bold">ปลายภาค</span>
                      <span className="text-indigo-600 font-bold">({subject?.finalPercent}%)</span>
                    </div>
                  </th>
                  <th className="px-4 py-5 text-center font-bold text-indigo-900 uppercase min-w-[80px] bg-indigo-100/50">รวม</th>
                  <th className="px-4 py-5 text-center font-bold text-indigo-900 uppercase min-w-[80px] bg-indigo-100/50">เกรด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentSheet.scores.sort((a,b) => {
                  const stA = students.find(s => s.studentId === a.studentId);
                  const stB = students.find(s => s.studentId === b.studentId);
                  return (stA?.number || 0) - (stB?.number || 0);
                }).map(score => {
                  const student = students.find(s => s.studentId === score.studentId);
                  return (
                    <tr key={score.studentId} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-4 py-4 text-gray-400 font-bold text-center">{student?.number}</td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-gray-900">{student?.fullName}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{student?.studentId}</p>
                      </td>
                      {Object.keys(currentSheet.assignmentNames).map(idx => (
                        <td key={idx} className="px-2 py-4 border-l border-gray-100/30">
                          <input 
                            type="number" 
                            className="w-full px-2 py-2 rounded-xl bg-gray-50 border border-transparent focus:border-indigo-300 focus:bg-white text-center font-bold text-gray-800 outline-none transition-all" 
                            value={score.collectScores[parseInt(idx)] === 0 ? '' : (score.collectScores[parseInt(idx)] || '')} 
                            onChange={e => updateScore(score.studentId, '', e.target.value, parseInt(idx))}
                            placeholder="0"
                          />
                        </td>
                      ))}
                      <td className="px-2 py-4 bg-indigo-50/10 border-l border-gray-100">
                        <input 
                          type="number" 
                          className="w-full px-2 py-2 rounded-xl bg-white border border-indigo-100 text-center font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                          value={score.midterm === 0 ? '' : (score.midterm || '')} 
                          onChange={e => updateScore(score.studentId, 'midterm', e.target.value)}
                          placeholder="0"
                        />
                      </td>
                      <td className="px-2 py-4 bg-indigo-50/10">
                        <input 
                          type="number" 
                          className="w-full px-2 py-2 rounded-xl bg-white border border-indigo-100 text-center font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                          value={score.final === 0 ? '' : (score.final || '')} 
                          onChange={e => updateScore(score.studentId, 'final', e.target.value)}
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-4 text-center bg-indigo-100/20">
                        <span className="text-lg font-black text-gray-900">{score.totalScore}</span>
                      </td>
                      <td className="px-4 py-4 text-center bg-indigo-100/20">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-black shadow-sm ${
                          parseFloat(score.grade) >= 3 ? 'bg-emerald-500 text-white' : 
                          parseFloat(score.grade) >= 1 ? 'bg-indigo-500 text-white' : 
                          'bg-red-500 text-white'
                        }`}>
                          {score.grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scores;
