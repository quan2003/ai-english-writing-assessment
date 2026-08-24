"use client";

import { useEffect, useState } from "react";
import { FolderGit2, Plus, Sparkles, Search, Clock, FileText, BookOpen, Loader2, CheckCircle2, Download, Send, X, Globe, Layers, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function QuestionBankPage() {
  const { language } = useLanguage();
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Real Exam Scraper Modal State
  const [showFetchModal, setShowFetchModal] = useState(false);
  const [fetchExamType, setFetchExamType] = useState("VSTEP");
  const [fetchTaskType, setFetchTaskType] = useState("ALL");
  const [fetchCount, setFetchCount] = useState(5);
  const [isFetchingReal, setIsFetchingReal] = useState(false);

  // AI Generator Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [genExamType, setGenExamType] = useState("VSTEP");
  const [genTaskType, setGenTaskType] = useState("TASK_2");
  const [genTopic, setGenTopic] = useState("Giáo dục & Công nghệ");
  const [genDifficulty, setGenDifficulty] = useState("MEDIUM");
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [newExamType, setNewExamType] = useState("VSTEP");
  const [newTaskType, setNewTaskType] = useState("TASK_2");
  const [newMinWords, setNewMinWords] = useState("250");
  const [newMaxWords, setNewMaxWords] = useState("350");
  const [newTimeLimit, setNewTimeLimit] = useState("40");

  // Assign to Class Modal State
  const [selectedQuestionForAssign, setSelectedQuestionForAssign] = useState<any | null>(null);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [assignClassId, setAssignClassId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const [toastMsg, setToastMsg] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchQuestions = () => {
    fetch(`/api/question-bank?examType=${activeTab}&search=${searchQuery}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setQuestions(data);
      });
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setClassesList(data);
          if (data.length > 0) setAssignClassId(data[0].id);
        }
      });
  }, []);

  const handleDeleteSingleQuestion = async (id: string, title: string) => {
    if (!confirm(language === "vi" ? `Bạn có chắc chắn muốn xóa đề thi '${title}' khỏi Ngân hàng?` : `Delete '${title}'?`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/question-bank?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setToastMsg(language === "vi" ? `Đã xóa đề thi '${title}' thành công!` : `Deleted topic '${title}'!`);
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllQuestions = async () => {
    const tabName = activeTab === "ALL" ? (language === "vi" ? "Tất cả Đề thi" : "all topics") : activeTab;
    if (!confirm(language === "vi" ? `Bạn có chắc chắn muốn XÓA TOÀN BỘ bộ đề (${tabName}) trong Ngân hàng?` : `Delete ALL ${tabName}?`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/question-bank?deleteAll=true&examType=${activeTab}`, { method: "DELETE" });
      if (res.ok) {
        setToastMsg(language === "vi" ? `Đã xóa sạch bộ đề thi (${tabName}) thành công!` : `Cleared all ${tabName}!`);
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFetchRealExamTopics = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFetchingReal(true);
    try {
      const res = await fetch("/api/question-bank/fetch-real", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examType: fetchExamType,
          taskType: fetchTaskType,
          count: fetchCount
        })
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg(data.message || (language === "vi" ? `Đã cào & nạp thành công đề thi thật ${fetchExamType}!` : "Fetched real topics!"));
        setShowFetchModal(false);
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingReal(false);
    }
  };

  const handleGenerateAiQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch("/api/question-bank/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examType: genExamType,
          taskType: genTaskType,
          topic: genTopic,
          difficulty: genDifficulty
        })
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg(language === "vi" ? `AI đã tạo thành công đề thi mới: ${data.title}!` : `Successfully generated question: ${data.title}!`);
        setShowAiModal(false);
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateManualQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/question-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          prompt: newPrompt,
          examType: newExamType,
          taskType: newTaskType,
          minWords: newMinWords,
          maxWords: newMaxWords,
          timeLimit: newTimeLimit
        })
      });
      if (res.ok) {
        setToastMsg(language === "vi" ? "Đã thêm đề thi mới vào Ngân hàng!" : "Added new question to bank!");
        setShowCreateModal(false);
        setNewTitle("");
        setNewPrompt("");
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignToClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestionForAssign || !assignClassId) return;
    setIsAssigning(true);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classGroupId: assignClassId,
          title: selectedQuestionForAssign.title,
          examType: selectedQuestionForAssign.examType,
          taskType: selectedQuestionForAssign.taskType,
          task: selectedQuestionForAssign.prompt,
          instructions: selectedQuestionForAssign.instructions || "Follow exam guidelines.",
          minWords: selectedQuestionForAssign.minWords,
          maxWords: selectedQuestionForAssign.maxWords,
          timeLimit: selectedQuestionForAssign.timeLimit
        })
      });
      if (res.ok) {
        setToastMsg(language === "vi" ? `Đã giao đề thi '${selectedQuestionForAssign.title}' cho lớp học thành công!` : "Assigned exam topic to class!");
        setSelectedQuestionForAssign(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {language === "vi" ? "Kho Ngân hàng Đề thi Viết" : "Essay Question Bank Studio"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === "vi"
              ? "Ngân hàng đề bài viết sẵn dùng chuẩn các kỳ thi VSTEP, IELTS, TOEIC Writing và Viết Học thuật"
              : "Repository of standardized essay topics for VSTEP, IELTS, TOEIC Writing, and Academic Writing"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {questions.length > 0 && (
            <button
              onClick={handleDeleteAllQuestions}
              disabled={isDeleting}
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-rose-200 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>{language === "vi" ? "Xóa Bộ Đề Thi" : "Delete All Topics"}</span>
            </button>
          )}

          <button
            onClick={() => setShowFetchModal(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>{language === "vi" ? "Bộ Đề Thi Thật" : "Fetch Real Exam Topics"}</span>
          </button>

          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{language === "vi" ? "AI Sinh Đề Tự Động" : "AI Prompt Generator"}</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-indigo-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{language === "vi" ? "Tạo Đề Thi Thủ Công" : "Add Custom Topic"}</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg("")} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          {[
            { id: "ALL", label: language === "vi" ? "Tất cả Đề thi" : "All Exams" },
            { id: "VSTEP", label: "VSTEP Writing Prep" },
            { id: "IELTS", label: "IELTS Academic Writing Prep" },
            { id: "TOEIC", label: "TOEIC Writing Prep" },
            { id: "GENERAL", label: "General Academic Writing" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === "vi" ? "Tìm kiếm đề bài hoặc chủ đề..." : "Search topics..."}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-medium outline-none focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Question Cards Grid */}
      {questions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-bold">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {language === "vi" ? "Chưa có Đề thi nào trong Danh mục" : "No Questions Found"}
          </h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            {language === "vi"
              ? "Bấm nút 'Bộ Đề Thi Thật' để chọn nạp đề thi VSTEP / IELTS / TOEIC hoặc bấm 'AI Sinh Đề Tự Động'."
              : "Click 'Fetch Real Exam Topics' or 'AI Prompt Generator' to populate topics."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {questions.map((q) => (
            <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded">
                      {q.examType} • {q.taskType}
                    </span>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                      {q.topic || "General"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{q.timeLimit} {language === "vi" ? "phút" : "mins"}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{q.title}</h3>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed font-medium">
                  {q.prompt}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs mt-4">
                <span className="text-slate-500 font-medium">
                  {language === "vi" ? "Số từ yêu cầu:" : "Required Words:"} <b className="text-slate-900 font-bold">{q.minWords} - {q.maxWords}</b>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteSingleQuestion(q.id, q.title)}
                    disabled={isDeleting}
                    title={language === "vi" ? "Xóa đề thi này" : "Delete topic"}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setSelectedQuestionForAssign(q)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-3.5 py-1.5 rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{language === "vi" ? "Giao cho Lớp học" : "Assign to Class"}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REAL EXAM FETCH / SCRAPER MODAL */}
      {showFetchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Globe className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {language === "vi" ? "Bộ Đề Thi Thật" : "Fetch Real Exam Topics"}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {language === "vi" ? "Trích xuất bộ đề thi thật từ kho dữ liệu VSTEP, IELTS & TOEIC" : "Extract official exam recalls from database"}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowFetchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFetchRealExamTopics} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === "vi" ? "1. Chọn Kỳ thi Muốn Nạp" : "1. Select Target Exam"}
                </label>
                <select
                  value={fetchExamType}
                  onChange={(e) => setFetchExamType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold outline-none"
                >
                  <option value="VSTEP">
                    {language === "vi"
                      ? "🌐 VSTEP Writing (Đề thi thật các trường ĐH tại VN)"
                      : "🌐 VSTEP Writing (Official VN University Exams)"}
                  </option>
                  <option value="IELTS">
                    {language === "vi"
                      ? "🎓 IELTS Academic Writing (Đề thi thật BC / IDP)"
                      : "🎓 IELTS Academic Writing (BC & IDP Official Recalls)"}
                  </option>
                  <option value="TOEIC">
                    {language === "vi"
                      ? "💼 TOEIC Writing Test (Đề thi thật ETS)"
                      : "💼 TOEIC Writing Test (ETS Official Exam Recalls)"}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === "vi" ? "2. Chọn Dạng bài (Task Type)" : "2. Select Task Type"}
                </label>
                <select
                  value={fetchTaskType}
                  onChange={(e) => setFetchTaskType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold outline-none"
                >
                  <option value="ALL">
                    {language === "vi" ? "📚 Tất cả Dạng bài (Task 1 & Task 2)" : "📚 All Task Types (Task 1 & Task 2)"}
                  </option>
                  <option value="TASK_1">
                    {language === "vi" ? "✉️ Chỉ Dạng Task 1 (Thư / Email / Biểu đồ)" : "✉️ Task 1 Only (Letters / Emails / Charts)"}
                  </option>
                  <option value="TASK_2">
                    {language === "vi" ? "📝 Chỉ Dạng Task 2 (Bài luận Essay)" : "📝 Task 2 Only (Academic Essay)"}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === "vi" ? "3. Số lượng Đề thi muốn nạp" : "3. Number of Topics to Import"}
                </label>
                <select
                  value={fetchCount}
                  onChange={(e) => setFetchCount(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold outline-none"
                >
                  <option value={3}>
                    {language === "vi" ? "📦 Nạp 3 đề thi" : "📦 Import 3 topics"}
                  </option>
                  <option value={5}>
                    {language === "vi" ? "⚡ Nạp 5 đề thi (Khuyến nghị)" : "⚡ Import 5 topics (Recommended)"}
                  </option>
                  <option value={10}>
                    {language === "vi" ? "🔥 Nạp 10 đề thi toàn diện" : "🔥 Import 10 topics (Full set)"}
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowFetchModal(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold">
                  {language === "vi" ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isFetchingReal}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md shadow-slate-300 disabled:opacity-50 flex items-center gap-2"
                >
                  {isFetchingReal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4 text-cyan-400" />}
                  <span>{language === "vi" ? "⚡ Nạp Bộ Đề Thi Thật Ngay" : "Fetch Real Topics Now"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI GENERATOR MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === "vi" ? "AI Sinh Đề Thi Viết Chuẩn" : "AI Essay Prompt Generator"}
                </h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateAiQuestion} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === "vi" ? "Chọn Kỳ thi Mục tiêu" : "Select Target Exam"}
                </label>
                <select
                  value={genExamType}
                  onChange={(e) => setGenExamType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold outline-none"
                >
                  <option value="VSTEP">
                    {language === "vi" ? "🌐 VSTEP Writing (B1 / B2 / C1)" : "🌐 VSTEP Writing (B1 / B2 / C1)"}
                  </option>
                  <option value="IELTS">
                    {language === "vi" ? "🎓 IELTS Academic Writing" : "🎓 IELTS Academic Writing"}
                  </option>
                  <option value="TOEIC">
                    {language === "vi" ? "💼 TOEIC Writing Test" : "💼 TOEIC Writing Test"}
                  </option>
                  <option value="GENERAL">
                    {language === "vi" ? "🎓 Viết Học thuật Tổng quát" : "🎓 General Academic Writing"}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === "vi" ? "Dạng bài (Task Type)" : "Task Type"}
                </label>
                <select
                  value={genTaskType}
                  onChange={(e) => setGenTaskType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold outline-none"
                >
                  {genExamType === "VSTEP" && (
                    <>
                      <option value="TASK_1">
                        {language === "vi" ? "✉️ Task 1: Viết Thư / Email (120 - 180 từ)" : "✉️ Task 1: Letter / Email Writing (120 - 180 words)"}
                      </option>
                      <option value="TASK_2">
                        {language === "vi" ? "📝 Task 2: Bài luận Thảo luận / Ý kiến (250 - 350 từ)" : "📝 Task 2: Discussion / Opinion Essay (250 - 350 words)"}
                      </option>
                    </>
                  )}
                  {genExamType === "IELTS" && (
                    <>
                      <option value="TASK_1">
                        {language === "vi" ? "📊 Task 1: Mô tả Biểu đồ / Quy trình (150 từ)" : "📊 Task 1: Chart / Diagram Report (150 words)"}
                      </option>
                      <option value="TASK_2">
                        {language === "vi" ? "📝 Task 2: Academic Essay (250 - 350 từ)" : "📝 Task 2: Academic Essay (250 - 350 words)"}
                      </option>
                    </>
                  )}
                  {genExamType === "TOEIC" && (
                    <>
                      <option value="TASK_2">
                        {language === "vi" ? "✉️ Task 2: Hồi đáp Email Công việc (150 từ)" : "✉️ Task 2: Business Email Response (150 words)"}
                      </option>
                      <option value="TASK_3">
                        {language === "vi" ? "📝 Task 3: Bài luận Ý kiến Doanh nghiệp (300 từ)" : "📝 Task 3: Business Opinion Essay (300 words)"}
                      </option>
                    </>
                  )}
                  {genExamType === "GENERAL" && (
                    <option value="TASK_2">
                      {language === "vi" ? "🎓 Academic Argumentative Essay (250 từ)" : "🎓 Academic Argumentative Essay (250 words)"}
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === "vi" ? "Chủ đề Đề bài" : "Topic Area"}
                </label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="VD: Giáo dục, Công nghệ, Môi trường, Y tế..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === "vi" ? "Mức độ Khó" : "Difficulty Level"}
                </label>
                <select
                  value={genDifficulty}
                  onChange={(e) => setGenDifficulty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold outline-none"
                >
                  <option value="EASY">
                    {language === "vi" ? "🟢 Dễ (B1 / Band 5.0)" : "🟢 Easy (B1 / Band 5.0)"}
                  </option>
                  <option value="MEDIUM">
                    {language === "vi" ? "🟡 Trung bình (B2 / Band 6.5)" : "🟡 Medium (B2 / Band 6.5)"}
                  </option>
                  <option value="HARD">
                    {language === "vi" ? "🔴 Nâng cao (C1 / Band 8.0)" : "🔴 Advanced (C1 / Band 8.0)"}
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAiModal(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold">
                  {language === "vi" ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold shadow-md shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                  <span>{language === "vi" ? "⚡ Tạo Đề Thi Bằng AI" : "Generate Prompt"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN TO CLASS MODAL */}
      {selectedQuestionForAssign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Send className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === "vi" ? "Giao Đề Thi Cho Lớp Học" : "Assign Topic to Class"}
                </h3>
              </div>
              <button onClick={() => setSelectedQuestionForAssign(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-indigo-600 font-extrabold uppercase">
                {selectedQuestionForAssign.examType} • {selectedQuestionForAssign.taskType}
              </span>
              <div className="font-bold text-slate-900">{selectedQuestionForAssign.title}</div>
            </div>

            <form onSubmit={handleAssignToClass} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === "vi" ? "Chọn Lớp học Nhận Đề thi" : "Select Target Class Group"}
                </label>
                {classesList.length > 0 ? (
                  <select
                    value={assignClassId}
                    onChange={(e) => setAssignClassId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold outline-none"
                  >
                    {classesList.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.classCode})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-slate-500 italic">
                    {language === "vi" ? "Chưa có Lớp học nào. Vui lòng tạo lớp học ở mục 'Lớp học' trước." : "No classes found."}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedQuestionForAssign(null)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold">
                  {language === "vi" ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || classesList.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{language === "vi" ? "Giao Bài Tập Cho Lớp" : "Assign to Class"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MANUAL QUESTION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {language === "vi" ? "Thêm Đề Thi Mới Thủ Công" : "Create New Custom Exam Topic"}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualQuestion} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === "vi" ? "Tiêu đề Đề bài" : "Topic Title"}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: VSTEP Task 2: Work-Life Balance"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {language === "vi" ? "Kỳ thi" : "Exam Type"}
                  </label>
                  <select
                    value={newExamType}
                    onChange={(e) => setNewExamType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold outline-none"
                  >
                    <option value="VSTEP">🌐 VSTEP Writing</option>
                    <option value="IELTS">🎓 IELTS Academic</option>
                    <option value="TOEIC">💼 TOEIC Writing</option>
                    <option value="GENERAL">🎓 General Academic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {language === "vi" ? "Dạng bài" : "Task Type"}
                  </label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold outline-none"
                  >
                    <option value="TASK_1">✉️ Task 1</option>
                    <option value="TASK_2">📝 Task 2</option>
                    <option value="TASK_3">📑 Task 3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === "vi" ? "Nội dung Chi tiết Đề bài" : "Full Prompt Content"}
                </label>
                <textarea
                  rows={4}
                  required
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="Nhập chi tiết yêu cầu đề thi bài luận..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {language === "vi" ? "Số từ tối thiểu" : "Min Words"}
                  </label>
                  <input
                    type="number"
                    value={newMinWords}
                    onChange={(e) => setNewMinWords(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {language === "vi" ? "Số từ tối đa" : "Max Words"}
                  </label>
                  <input
                    type="number"
                    value={newMaxWords}
                    onChange={(e) => setNewMaxWords(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {language === "vi" ? "Thời gian (phút)" : "Time Limit"}
                  </label>
                  <input
                    type="number"
                    value={newTimeLimit}
                    onChange={(e) => setNewTimeLimit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold">
                  {language === "vi" ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200"
                >
                  {language === "vi" ? "Lưu Vào Ngân Hàng" : "Save Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
