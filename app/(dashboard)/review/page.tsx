"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Edit3, Flag, Award, RefreshCw, Sparkles, AlertCircle, X, Save, Check } from "lucide-react";
import type { LecturerDecisionStatus } from "@/lib/grading-types";
import { getExamProfile } from "@/lib/exam-profiles";
import { useLanguage } from "@/lib/LanguageContext";

export default function TeacherReviewPage() {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const querySubmissionId = searchParams.get("submissionId");

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  // Edit Score Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [customFinalScore, setCustomFinalScore] = useState<string>("");
  const [customTFScore, setCustomTFScore] = useState<string>("");
  const [customOrgScore, setCustomOrgScore] = useState<string>("");
  const [customVocScore, setCustomVocScore] = useState<string>("");
  const [customGraScore, setCustomGraScore] = useState<string>("");
  const [lecturerComment, setLecturerComment] = useState("");

  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isReleasingResults, setIsReleasingResults] = useState(false);
  const [releaseMessage, setReleaseMessage] = useState("");

  const fetchSubmissions = () => {
    fetch("/api/submissions")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSubmissions(data);
          if (querySubmissionId) {
            const target = data.find((s) => s.id === querySubmissionId);
            if (target) setSelectedSubmission(target);
          } else if (data.length > 0) {
            setSelectedSubmission((prev: any) => {
              if (!prev) return data[0];
              const updated = data.find((s) => s.id === prev.id);
              return updated || data[0];
            });
          }
        }
      });
  };

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [querySubmissionId]);

  const activeAiResult = useMemo(() => {
    if (!selectedSubmission?.aiAssessments?.[0]) return null;
    const raw = selectedSubmission.aiAssessments[0];

    const parseJSON = (str: string, fallback: any) => {
      if (!str) return fallback;
      try {
        return typeof str === "string" ? JSON.parse(str) : str;
      } catch {
        return typeof str === "string" && str.trim() ? { score: fallback.score || 1.5, rationale: str, evidence: [] } : fallback;
      }
    };

    return {
      ...raw,
      taskFulfillment: parseJSON(raw.taskFulfillmentData, {
        score: raw.taskFulfillmentScore ?? 1.5,
        rationale: "Addresses task requirements.",
        evidence: []
      }),
      organization: parseJSON(raw.organizationData, {
        score: raw.organizationScore ?? 1.5,
        rationale: "Logical organization and progression.",
        evidence: []
      }),
      vocabulary: parseJSON(raw.vocabularyData, {
        score: raw.vocabularyScore ?? 1.5,
        rationale: "Appropriate vocabulary usage.",
        evidence: []
      }),
      grammar: parseJSON(raw.grammarData, {
        score: raw.grammarScore ?? 1.5,
        rationale: "Clear grammatical structures.",
        evidence: []
      }),
      evidenceList: parseJSON(raw.evidence, [])
    };
  }, [selectedSubmission]);

  const examProfile = getExamProfile(selectedSubmission?.assessment?.examType);

  const openModifyScoreModal = () => {
    if (!activeAiResult) return;
    setCustomFinalScore(selectedSubmission.finalGrades?.[0]?.finalTotal?.toString() || activeAiResult.total?.toString() || "8.0");
    setCustomTFScore(activeAiResult.taskFulfillmentScore?.toString() || "2.0");
    setCustomOrgScore(activeAiResult.organizationScore?.toString() || "2.0");
    setCustomVocScore(activeAiResult.vocabularyScore?.toString() || "2.0");
    setCustomGraScore(activeAiResult.grammarScore?.toString() || "2.0");
    setLecturerComment(selectedSubmission.lecturerReviews?.[0]?.comment || "");
    setShowEditModal(true);
  };

  const handleSaveLecturerReview = async (decisionStatus: LecturerDecisionStatus | "rewrite_requested") => {
    if (!selectedSubmission || !selectedSubmission.aiAssessments?.[0]) return;
    setIsSubmittingReview(true);

    const ai = selectedSubmission.aiAssessments[0];
    const finalScoreToSave =
      decisionStatus === "modified" && customFinalScore
        ? parseFloat(customFinalScore)
        : ai.total;

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          aiAssessmentId: ai.id,
          status: decisionStatus.toUpperCase(),
          finalTaskFulfillment: customTFScore ? parseFloat(customTFScore) : ai.taskFulfillmentScore,
          finalOrganization: customOrgScore ? parseFloat(customOrgScore) : ai.organizationScore,
          finalVocabulary: customVocScore ? parseFloat(customVocScore) : ai.vocabularyScore,
          finalGrammar: customGraScore ? parseFloat(customGraScore) : ai.grammarScore,
          finalTotal: finalScoreToSave,
          comment: lecturerComment
        })
      });

      if (res.ok) {
        setReleaseMessage(
          language === "vi"
            ? `Đã lưu & phê duyệt điểm Giáo viên (${finalScoreToSave} / 10) thành công!`
            : `Successfully approved lecturer score (${finalScoreToSave} / 10)!`
        );
        setShowEditModal(false);
        fetchSubmissions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleReleaseResults = async () => {
    setIsReleasingResults(true);
    setReleaseMessage("");
    try {
      const res = await fetch("/api/reviews/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionIds: selectedSubmission ? [selectedSubmission.id] : submissions.map((s) => s.id)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReleaseMessage(
          language === "vi"
            ? `Đã công bố thành công ${data.releasedCount || 0} bài nộp kết quả cho học viên!`
            : `Successfully released ${data.releasedCount || 0} practice score results to students!`
        );
        fetchSubmissions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReleasingResults(false);
    }
  };

  const currentFinalGrade = selectedSubmission?.finalGrades?.[0];
  const isAlreadyReviewed = Boolean(currentFinalGrade || selectedSubmission?.status === "RELEASED" || selectedSubmission?.status === "APPROVED");

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {language === "vi" ? "Phòng Duyệt điểm & Nhận xét của Giáo viên" : "Review Queue & Teacher Feedback Studio"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === "vi"
              ? "Thẩm định điểm gợi ý AI, đối soát trích dẫn bằng chứng, thêm lời khuyên hoặc yêu cầu học viên làm lại bài"
              : "Audit AI suggested assessment, inspect verified evidence quotes, add feedback, or request student rewrite"}
          </p>
        </div>

        <button
          onClick={handleReleaseResults}
          disabled={isReleasingResults || submissions.length === 0}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-200 transition-all disabled:opacity-50"
        >
          <Award className="w-4 h-4" />
          <span>{language === "vi" ? "Công bố Kết quả & Phản hồi" : "Release Selected Grades & Feedback"}</span>
        </button>
      </div>

      {releaseMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{releaseMessage}</span>
        </div>
      )}

      {/* Queue Selector Bar */}
      {submissions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3 overflow-x-auto text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px] shrink-0">
            {language === "vi" ? "Hàng chờ Bài nộp:" : "Submissions Queue:"}
          </span>
          {submissions.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubmission(sub)}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 border transition-all ${
                selectedSubmission?.id === sub.id
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {sub.student?.fullName || "Học viên"} ({language === "vi" ? `Lần ${sub.attemptNumber || 1}` : `Attempt ${sub.attemptNumber || 1}`})
            </button>
          ))}
        </div>
      )}

      {selectedSubmission && activeAiResult ? (
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: AI Suggested Assessment Cards */}
          <div className="col-span-8 space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded">
                    {selectedSubmission.assessment?.examType || "IELTS"} • {language === "vi" ? `Lần nộp ${selectedSubmission.attemptNumber || 1}` : `Attempt ${selectedSubmission.attemptNumber || 1}`}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">{selectedSubmission.assessment?.title}</h3>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-indigo-700">{activeAiResult.total?.toFixed(1) || "6.5"} <span className="text-xs text-slate-400 font-normal">/ 10</span></div>
                  <span className="text-xs font-semibold text-emerald-600">
                    {language === "vi" ? "Độ tin cậy AI:" : "Consistency:"} {activeAiResult.assessmentConsistency || "high"}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 font-medium">
                {language === "vi" ? "Lưu ý quy đổi điểm:" : "Score Disclaimer:"} <i>{examProfile.disclaimer}</i>
              </div>

              <div className="grid grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-semibold">{language === "vi" ? "Yêu cầu Đề bài" : "Task Fulfillment"}</span>
                  <span className="font-extrabold text-slate-900 text-base">{activeAiResult.taskFulfillmentScore?.toFixed(1) || activeAiResult.taskFulfillment?.score || 1.5} / 2.5</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-semibold">{language === "vi" ? "Mạch lạc & Bố cục" : "Organization"}</span>
                  <span className="font-extrabold text-slate-900 text-base">{activeAiResult.organizationScore?.toFixed(1) || activeAiResult.organization?.score || 1.5} / 2.5</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-semibold">{language === "vi" ? "Từ vựng" : "Vocabulary"}</span>
                  <span className="font-extrabold text-slate-900 text-base">{activeAiResult.vocabularyScore?.toFixed(1) || activeAiResult.vocabulary?.score || 2.0} / 2.5</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-semibold">{language === "vi" ? "Ngữ pháp" : "Grammar"}</span>
                  <span className="font-extrabold text-slate-900 text-base">{activeAiResult.grammarScore?.toFixed(1) || activeAiResult.grammar?.score || 1.5} / 2.5</span>
                </div>
              </div>
            </div>

            {/* Criteria Cards */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              {[
                { title: language === "vi" ? "Yêu cầu Đề bài (Task)" : "Task Fulfillment", data: activeAiResult.taskFulfillment },
                { title: language === "vi" ? "Mạch lạc & Bố cục" : "Organization", data: activeAiResult.organization },
                { title: language === "vi" ? "Từ vựng" : "Vocabulary", data: activeAiResult.vocabulary },
                { title: language === "vi" ? "Ngữ pháp" : "Grammar", data: activeAiResult.grammar }
              ].map((item) => (
                <div key={item.title} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900">{item.title}</span>
                    <span className="font-bold text-indigo-700">{item.data?.score || 1.5} / 2.5</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs">{item.data?.rationale || "Evaluated under standard criteria rubric."}</p>
                  {item.data?.evidence && item.data.evidence.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                        {language === "vi" ? "Trích dẫn bằng chứng đối soát:" : "Verified Evidence Excerpts:"}
                      </span>
                      {item.data.evidence.map((quote: string, idx: number) => (
                        <div key={idx} className="bg-indigo-50/70 border-l-2 border-indigo-600 text-indigo-900 p-2 text-[11px] rounded-lg italic mb-1.5">
                          &quot;{quote}&quot;
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Student Essay Content */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {language === "vi" ? `Nội dung Bài luận (${selectedSubmission.wordCount} từ)` : `Submitted Essay Text (${selectedSubmission.wordCount} words)`}
              </h4>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                {selectedSubmission.essayText}
              </div>
            </div>
          </div>

          {/* Right Column: Teacher Review Action Panel */}
          <div className="col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm sticky top-20">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
                    {language === "vi" ? "Quyết định của Giáo viên" : "Teacher Final Decision"}
                  </span>
                  {isAlreadyReviewed && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-extrabold text-[10px]">
                      {language === "vi" ? `✓ ĐÃ CHỐT ${currentFinalGrade?.finalTotal || activeAiResult.total}` : `APPROVED ${currentFinalGrade?.finalTotal || activeAiResult.total}`}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {language === "vi" ? "Bảng Duyệt điểm & Phê duyệt" : "Review & Feedback Panel"}
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <button
                  onClick={() => handleSaveLecturerReview("approved")}
                  disabled={isSubmittingReview}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-emerald-200"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === "vi" ? `Duyệt Điểm AI (${activeAiResult.total})` : `Approve Score (${activeAiResult.total})`}</span>
                </button>

                <button
                  onClick={openModifyScoreModal}
                  disabled={isSubmittingReview}
                  className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-amber-200"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{language === "vi" ? "Sửa Điểm Tổng & Tiêu Chí..." : "Modify Scores..."}</span>
                </button>

                <button
                  onClick={() => handleSaveLecturerReview("rewrite_requested")}
                  disabled={isSubmittingReview}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-indigo-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{language === "vi" ? "Yêu cầu Viết lại (Lần 2)" : "Request Student Rewrite (Attempt 2)"}</span>
                </button>

                <button
                  onClick={() => handleSaveLecturerReview("flagged")}
                  disabled={isSubmittingReview}
                  className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-rose-200"
                >
                  <Flag className="w-4 h-4" />
                  <span>{language === "vi" ? "Ghi chú Bất thường" : "Flag Unusual Result"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs shadow-sm space-y-2">
          <p>
            {language === "vi"
              ? "Chọn bài nộp từ hàng chờ bên trên để xem nhận xét AI và phê duyệt điểm."
              : "Select a submission from the queue to view AI suggested rationale and finalize grading."}
          </p>
        </div>
      )}

      {/* POPUP MODAL CHỈNH SỬA ĐIỂM GIÁO VIÊN */}
      {showEditModal && activeAiResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {language === "vi" ? "Bảng Điều chỉnh Điểm của Giáo viên" : "Modify Teacher Final Scores"}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {selectedSubmission?.student?.fullName} • {selectedSubmission?.assessment?.title}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Score Input Box */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
                <label className="block text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                  {language === "vi" ? "Điểm Tổng Chốt Chính Thức (Thang điểm 0 - 10)" : "Official Final Score (0 - 10 Scale)"}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={customFinalScore}
                    onChange={(e) => setCustomFinalScore(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl p-3 text-slate-900 font-black text-2xl font-mono outline-none shadow-sm focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-slate-400 font-bold text-sm shrink-0">/ 10.0</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  {language === "vi"
                    ? `Điểm AI gợi ý ban đầu là ${activeAiResult.total?.toFixed(1)}. Nhập điểm mới và lưu.`
                    : `Original AI score was ${activeAiResult.total?.toFixed(1)}. Enter your revised grade.`}
                </p>
              </div>

              {/* 4 Criteria Scores */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                    {language === "vi" ? "Yêu cầu Đề bài (0 - 2.5)" : "Task (0 - 2.5)"}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={customTFScore}
                    onChange={(e) => setCustomTFScore(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                    {language === "vi" ? "Mạch lạc & Bố cục (0 - 2.5)" : "Organization (0 - 2.5)"}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={customOrgScore}
                    onChange={(e) => setCustomOrgScore(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                    {language === "vi" ? "Từ vựng (0 - 2.5)" : "Vocabulary (0 - 2.5)"}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={customVocScore}
                    onChange={(e) => setCustomVocScore(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                    {language === "vi" ? "Ngữ pháp (0 - 2.5)" : "Grammar (0 - 2.5)"}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={customGraScore}
                    onChange={(e) => setCustomGraScore(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold outline-none"
                  />
                </div>
              </div>

              {/* Feedback Note Textarea */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === "vi" ? "Nhận xét & Lời khuyên của Giáo viên" : "Teacher Feedback & Comments"}
                </label>
                <textarea
                  rows={3}
                  value={lecturerComment}
                  onChange={(e) => setLecturerComment(e.target.value)}
                  placeholder={language === "vi" ? "Nhập Lời khuyên/Ghi chú thêm gửi trực tiếp cho học viên..." : "Add feedback notes for the student..."}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium outline-none resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                {language === "vi" ? "Hủy" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => handleSaveLecturerReview("modified")}
                disabled={isSubmittingReview || !customFinalScore}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-200 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{language === "vi" ? "Lưu Điểm Điều Chỉnh" : "Save Revised Score"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
