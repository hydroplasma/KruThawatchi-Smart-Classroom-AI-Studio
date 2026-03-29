
import { GoogleGenAI } from "@google/genai";
import { Score, Student } from "../types";

export const geminiService = {
  analyzePerformance: async (students: Student[], scores: Score[], subjectName: string) => {
    // Correctly initializing GoogleGenAI with the API key from process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const performanceContext = scores.map(s => {
      const student = students.find(st => st.studentId === s.studentId);
      return `${student?.fullName}: Score ${s.totalScore}, Grade ${s.grade}`;
    }).join('\n');

    const prompt = `
      You are an expert pedagogical analyst. Analyze the following student performance data for the subject "${subjectName}".
      Provide a brief summary (max 200 words) in Thai language.
      Identify:
      1. Overall class performance (Average).
      2. Students who might need extra help (Score < 50).
      3. Students who are excelling.
      4. One actionable advice for the teacher to improve learning outcomes.
      
      Data:
      ${performanceContext}
    `;

    try {
      // Fix: Using gemini-3.1-pro-preview for advanced reasoning tasks such as pedagogical analysis
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });
      // Correct usage: Access the .text property of the GenerateContentResponse object
      return response.text;
    } catch (error) {
      console.error("AI Analysis failed:", error);
      return "ไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้";
    }
  }
};
