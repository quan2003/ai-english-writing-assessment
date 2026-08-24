"use client";

import { useEffect, useState } from "react";
import { Plus, Users, Copy, Check, X } from "lucide-react";
import { EXAM_PROFILES, ExamType } from "@/lib/exam-profiles";
import { useLanguage } from "@/lib/LanguageContext";

export default function ClassesPage() {
  const { language } = useLanguage();
  const [classes, setClasses] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [examTarget, setExamTarget] = useState<ExamType>("IELTS");
  const [targetScore, setTargetScore] = useState("Band 6.5");
  const [description, setDescription] = useState("");

  const DEFAULT_TARGET_SCORES: Record<ExamType, string> = {
    IELTS: "Band 6.5",
    VSTEP: "VSTEP B2 (7.5/10)",
    TOEIC_WRITING: "160 / 200 Pts (Level 7)",
    GENERAL_ACADEMIC: "8.0 / 10"
  };

  const fetchClasses = () => {
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setClasses(data);
      });
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleExamTargetChange = (newTarget: ExamType) => {
    setExamTarget(newTarget);
    setTargetScore(DEFAULT_TARGET_SCORES[newTarget] || "6.5");
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, examTarget, targetScore, description })
      });

      if (res.ok) {
        setShowCreateModal(false);
        setName("");
        setDescription("");
        fetchClasses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {language === "vi" ? "Lớp học Luyện thi & Mã Tham gia" : "Exam Prep Classes & Join Codes"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === "vi"
              ? "Quản lý các lớp luyện thi VSTEP, IELTS, TOEIC Writing chuẩn cấu trúc và danh sách học viên"
              : "Manage VSTEP, IELTS, and TOEIC preparation classes with exam-specific score goals"}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{language === "vi" ? "Tạo Lớp học Mới" : "Create New Class"}</span>
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {language === "vi" ? "Chưa có Lớp học nào" : "No Classes Created Yet"}
          </h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            {language === "vi"
              ? "Bấm vào nút 'Tạo Lớp học Mới' để chọn kỳ thi (VSTEP, IELTS, TOEIC) và nhận mã tham gia cho học viên."
              : "Click 'Create New Class' to set up exam targets and share join code with your students."}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            <span>{language === "vi" ? "Tạo Lớp học Mới" : "Create New Class"}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {classes.map((cls) => {
            const profile = EXAM_PROFILES[cls.examTarget as ExamType] || EXAM_PROFILES.IELTS;

            return (
              <div key={cls.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-md font-extrabold text-[11px]">
                      {profile.displayName.split(" ")[0]} • {language === "vi" ? "Mục tiêu:" : "Target:"} {cls.targetScore || DEFAULT_TARGET_SCORES[cls.examTarget as ExamType] || "Band 6.5"}
                    </span>
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      {cls.students?.length || 0} {language === "vi" ? "học viên" : "students"}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{cls.name}</h3>
                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">
                      {cls.description || (language === "vi" ? profile.vietnameseName : profile.description)}
                    </p>
                  </div>

                  {/* Class Join Code Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        {language === "vi" ? "Mã Học viên Tham gia Lớp" : "Student Class Join Code"}
                      </span>
                      <span className="font-mono font-extrabold text-indigo-700 text-sm">{cls.classCode || "IELTS-WR-4A7F"}</span>
                    </div>

                    <button
                      onClick={() => handleCopyCode(cls.classCode || "IELTS-WR-4A7F")}
                      className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
                    >
                      {copiedCode === (cls.classCode || "IELTS-WR-4A7F") ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>
                        {copiedCode === (cls.classCode || "IELTS-WR-4A7F")
                          ? (language === "vi" ? "Đã chép" : "Copied")
                          : (language === "vi" ? "Sao chép" : "Copy")}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {language === "vi" ? "Tạo Lớp Luyện thi Mới" : "Create Exam Prep Class"}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === "vi" ? "Tên Lớp học" : "Class Name"}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    examTarget === "VSTEP"
                      ? "VD: Lớp VSTEP Writing Chuyên sâu B2/C1"
                      : examTarget === "TOEIC_WRITING"
                      ? "VD: Lớp TOEIC Writing Đạt 160+ Pts"
                      : "VD: Lớp IELTS Writing Intensive Band 7.0+"
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none focus:border-indigo-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {language === "vi" ? "Kỳ thi Mục tiêu" : "Exam Target"}
                  </label>
                  <select
                    value={examTarget}
                    onChange={(e) => handleExamTargetChange(e.target.value as ExamType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold outline-none"
                  >
                    <option value="IELTS">🎓 IELTS Academic (Band 0-9)</option>
                    <option value="VSTEP">🌐 VSTEP (B1 - B2 - C1 / Thang 10)</option>
                    <option value="TOEIC_WRITING">💼 TOEIC Writing (0 - 200 Pts)</option>
                    <option value="GENERAL_ACADEMIC">🎓 {language === "vi" ? "Viết Học thuật (Thang 10)" : "General Academic Writing (Score 10)"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {language === "vi" ? "Mục tiêu Điểm số" : "Target Score Goal"}
                  </label>
                  <input
                    type="text"
                    value={targetScore}
                    onChange={(e) => setTargetScore(e.target.value)}
                    placeholder={DEFAULT_TARGET_SCORES[examTarget]}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium outline-none"
                  />
                </div>
              </div>

              <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-xl text-[11px] text-indigo-900">
                <span className="font-bold">{language === "vi" ? "Thang điểm kỳ thi:" : "Exam Score Scale:"}</span>{" "}
                {EXAM_PROFILES[examTarget]?.scoreScale}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === "vi" ? "Mô tả chi tiết" : "Description"}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === "vi" ? "Lịch học, ghi chú đề thi..." : "Enter class schedule, syllabus notes..."}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold">
                  {language === "vi" ? "Hủy bỏ" : "Cancel"}
                </button>
                <button type="submit" className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200">
                  {language === "vi" ? "Tạo Lớp & Sinh Mã" : "Generate Class Code & Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
