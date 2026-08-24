"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Pause,
  Play,
  RefreshCw,
  AlertTriangle,
  Lock,
  Rocket,
  Eye,
  FileCheck
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function SubmitPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [studentEssayText, setStudentEssayText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);

  // Exam Start & Live Timer Countdown State
  const [isExamStarted, setIsExamStarted] = useState<boolean>(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/assessments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAssessments(data);
          if (!selectedAssessmentId && data.length > 0) {
            setSelectedAssessmentId(data[0].id);
          }
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId);

  // When selected assessment changes, reset exam start & timer states
  useEffect(() => {
    if (selectedAssessment) {
      const mins = selectedAssessment.timeLimit || 40;
      setTimeLeftSeconds(mins * 60);
      setIsExamStarted(false);
      setIsTimerRunning(false);
      setSubmissionSuccess(false);
    }
  }, [selectedAssessmentId, selectedAssessment?.timeLimit]);

  // Timer Interval Effect
  useEffect(() => {
    if (timeLeftSeconds === null || !isTimerRunning || timeLeftSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeftSeconds]);

  // Autosave draft locally
  useEffect(() => {
    if (!selectedAssessmentId) return;
    const savedDraft = localStorage.getItem(`essay_draft_${selectedAssessmentId}`);
    if (savedDraft && !studentEssayText) {
      setStudentEssayText(savedDraft);
    }
  }, [selectedAssessmentId]);

  const handleStartExam = () => {
    setIsExamStarted(true);
    setIsTimerRunning(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleEssayChange = (val: string) => {
    setStudentEssayText(val);
    if (selectedAssessmentId) {
      localStorage.setItem(`essay_draft_${selectedAssessmentId}`, val);
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    }
  };

  const wordCount = studentEssayText.trim().split(/\s+/).filter(Boolean).length;

  const formatTimerDisplay = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleResetTimer = () => {
    const mins = selectedAssessment?.timeLimit || 40;
    setTimeLeftSeconds(mins * 60);
    setIsTimerRunning(true);
  };

  const handleSubmit = async () => {
    if (!selectedAssessmentId || !studentEssayText.trim()) return;

    setIsSubmitting(true);
    setSubmitError("");
    setSubmissionSuccess(false);
    setIsTimerRunning(false);

    try {
      const subRes = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: selectedAssessmentId,
          essayText: studentEssayText
        })
      });

      const subData = await subRes.json();
      if (!subRes.ok) throw new Error(subData.error || "Failed to submit essay");

      // Successfully submitted to teacher queue!
      setSubmissionSuccess(true);
      localStorage.removeItem(`essay_draft_${selectedAssessmentId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission error";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForAnotherSubmission = () => {
    setSubmissionSuccess(false);
    setStudentEssayText("");
    setIsExamStarted(false);
    setIsTimerRunning(false);
    handleResetTimer();
  };

  const timeLimitMins = selectedAssessment?.timeLimit || 40;
  const isTimeUp = timeLeftSeconds === 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {language === "vi" ? "Trình soạn thảo & Nộp bài Luyện viết" : "Student Essay Practice Editor"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === "vi"
              ? "Soạn thảo bài luận thực hành và nộp bài để Giảng viên thẩm định & phê duyệt điểm"
              : "Draft practice essays and submit for lecturer evaluation and grade release"}
          </p>
        </div>

        {draftSaved && (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{language === "vi" ? "Đã lưu Nháp" : "Draft Autosaved"}</span>
          </span>
        )}
      </div>

      {submissionSuccess ? (
        <div className="bg-white border border-emerald-200 rounded-3xl p-8 shadow-xl text-center space-y-5 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center font-bold">
            <FileCheck className="w-8 h-8 text-emerald-600" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider block">
              {language === "vi" ? "Nộp bài thành công!" : "Submission Successful!"}
            </span>
            <h3 className="text-xl font-bold text-slate-900">
              {language === "vi" ? "Bài luận của bạn đã vào Hàng chờ Chấm" : "Your Essay Has Been Queued"}
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              {language === "vi"
                ? "Bài làm của bạn đã được lưu an toàn vào hệ thống. Giảng viên sẽ thẩm định, chấm điểm và công bố kết quả phản hồi chính thức cho bạn."
                : "Your submission has been safely saved. Your lecturer will evaluate, grade, and release official feedback."}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-3">
            <button
              onClick={handleResetForAnotherSubmission}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-3 rounded-xl transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{language === "vi" ? "Nộp bài luận khác" : "Submit Another Essay"}</span>
            </button>

            <button
              onClick={() => router.push("/results")}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md shadow-indigo-200 transition-all"
            >
              <span>{language === "vi" ? "Xem Trang Trạng thái Kết quả" : "View Results Status Page"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <div>
            <label className="block text-slate-700 font-bold mb-1 text-xs">
              {language === "vi" ? "Chọn Bài tập / Đề thi Viết" : "Select Practice Task / Exam Topic"}
            </label>
            <select
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-xs outline-none focus:border-indigo-600"
            >
              {assessments.length === 0 && <option value="">-- {language === "vi" ? "Chưa có Đề thi Viết" : "No Exams Available"} --</option>}
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.examType === "VSTEP" ? "🌐" : a.examType === "IELTS" ? "🎓" : a.examType === "TOEIC" ? "💼" : "📝"} [{a.examType || "PRACTICE"}] {a.title} ({a.minWords || 150} - {a.maxWords || 300} {language === "vi" ? "từ" : "words"}) • {a.timeLimit || 40} {language === "vi" ? "phút" : "mins"}
                </option>
              ))}
            </select>
          </div>

          {selectedAssessment && (
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-5 space-y-4 text-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="bg-indigo-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-md uppercase">
                  {selectedAssessment.examType || "GENERAL"} • {selectedAssessment.taskType || "TASK 2"}
                </span>

                {/* LIVE TIMER COUNTDOWN WIDGET */}
                <div className="flex items-center gap-2">
                  <div
                    className={`px-3 py-1.5 rounded-xl font-mono font-bold text-xs flex items-center gap-1.5 border transition-all ${
                      isTimeUp
                        ? "bg-rose-100 text-rose-700 border-rose-300 animate-pulse"
                        : (timeLeftSeconds || 0) < 300 && isExamStarted
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : "bg-white text-indigo-700 border-indigo-200 shadow-sm"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {language === "vi" ? "Thời gian còn lại:" : "Time Left:"}{" "}
                      <b className="text-sm font-black">{timeLeftSeconds !== null ? formatTimerDisplay(timeLeftSeconds) : `${timeLimitMins}:00`}</b>
                      <span className="text-[10px] font-normal text-slate-400"> / {timeLimitMins} phút</span>
                    </span>
                  </div>

                  {isExamStarted && (
                    <>
                      <button
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        title={isTimerRunning ? "Tạm dừng đồng hồ" : "Tiếp tục chạy đồng hồ"}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
                      >
                        {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>

                      <button
                        onClick={handleResetTimer}
                        title="Đặt lại đồng hồ từ đầu"
                        className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* IF NOT STARTED: SHOW EXAM SETUP CARD & START BUTTON */}
              {!isExamStarted ? (
                <div className="bg-white border border-indigo-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-bold">
                    <Lock className="w-6 h-6 text-indigo-600" />
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">
                      {language === "vi" ? "Chế độ Thi & Luyện Viết Chuẩn" : "Official Exam Mode Ready"}
                    </h4>
                    <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
                      {language === "vi"
                        ? `Đề thi này yêu cầu làm trong ${timeLimitMins} phút. Bấm nút 'Bắt Đầu Làm Bài' bên dưới để mở đề thi và kích hoạt đồng hồ đếm ngược!`
                        : `Time limit: ${timeLimitMins} mins. Click 'Start Exam' to reveal prompt and start the live timer.`}
                    </p>
                  </div>

                  <button
                    onClick={handleStartExam}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:scale-105"
                  >
                    <Rocket className="w-4 h-4 text-amber-300" />
                    <span>{language === "vi" ? "🚀 Bắt Đầu Làm Bài & Bấm Giờ" : "🚀 Start Exam & Run Timer"}</span>
                  </button>
                </div>
              ) : (
                /* IF STARTED: REVEAL PROMPT TEXT */
                <div className="space-y-2 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <span className="text-[10px] text-emerald-600 font-extrabold uppercase flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {language === "vi" ? "Đang mở Đề thi & Bấm giờ" : "Exam Active & Timer Running"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {language === "vi" ? "Số từ yêu cầu:" : "Required Words:"} <b>{selectedAssessment.minWords || 150} - {selectedAssessment.maxWords || 300}</b>
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{selectedAssessment.task}</h4>
                  {selectedAssessment.instructions && (
                    <p className="text-slate-600 text-[11px] leading-relaxed">{selectedAssessment.instructions}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {isTimeUp && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {language === "vi"
                  ? `⚠️ Đã hết thời gian làm bài quy định (${timeLimitMins} phút)! Vui lòng bấm Nộp bài bên dưới để gửi cho Giảng viên.`
                  : `⚠️ Practice time limit reached (${timeLimitMins} mins)! Please click Submit below.`}
              </span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1 text-xs">
              {language === "vi" ? "Nội dung Bài luận Thực hành" : "Student Essay Text Content"}
            </label>
            <textarea
              ref={textareaRef}
              rows={12}
              value={studentEssayText}
              onChange={(e) => handleEssayChange(e.target.value)}
              disabled={isSubmitting || !isExamStarted}
              placeholder={
                !isExamStarted
                  ? (language === "vi" ? "🔒 Vui lòng bấm nút 'Bắt Đầu Làm Bài' ở trên để mở khung nhập liệu..." : "🔒 Please click 'Start Exam' above to unlock typing...")
                  : (language === "vi" ? "Nhập nội dung bài luận của bạn tại đây... Bản nháp sẽ được tự động lưu trên trình duyệt." : "Type your essay response here...")
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 font-normal text-xs leading-relaxed outline-none focus:border-indigo-600 focus:bg-white transition-all disabled:opacity-60 disabled:bg-slate-100"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500">
              {language === "vi" ? "Số từ thời gian thực:" : "Realtime Word Count:"}{" "}
              <span className={`font-mono font-bold ${wordCount < (selectedAssessment?.minWords || 150) ? "text-amber-600" : "text-emerald-600"}`}>
                {wordCount} {language === "vi" ? "từ" : "words"}
              </span>{" "}
              {selectedAssessment?.minWords && (
                <span className="text-slate-400 font-normal">
                  ({language === "vi" ? "Yêu cầu:" : "Required:"} {selectedAssessment.minWords} - {selectedAssessment.maxWords || 300} từ)
                </span>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || wordCount < 20 || !selectedAssessmentId || !isExamStarted}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md shadow-indigo-200 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{language === "vi" ? "Đang Nộp Bài..." : "Submitting..."}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{language === "vi" ? "Nộp Bài Luận Cho Giảng Viên" : "Submit Essay to Lecturer"}</span>
                </>
              )}
            </button>
          </div>

          {submitError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
