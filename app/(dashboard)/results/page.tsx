"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Award, X, ChevronRight, BookOpen, Clock, FileText, Check, AlertTriangle, MessageSquare, Loader2, Zap } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function ResultsPage() {
  const { language } = useLanguage();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);

  const fetchSubmissions = () => {
    fetch("/api/submissions")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSubmissions(data);
      });
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const parseJSON = (str: any, fallback: any) => {
    if (!str) return fallback;
    if (typeof str === "object") return str;
    try {
      return JSON.parse(str);
    } catch {
      return typeof str === "string" && str.trim() ? str : fallback;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {language === "vi" ? "Bảng Điểm & Phản hồi từ Giảng viên" : "Assessment Scores & Examiner Feedback"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === "vi"
              ? "Xem lại chi tiết điểm số, nhận xét và lời khuyên chính thức từ Giảng viên cho từng bài nộp"
              : "Review official assessment scores and examiner feedback for your submissions"}
          </p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {language === "vi" ? "Chưa có Bài làm nào được Nộp" : "No Submissions Found"}
          </h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            {language === "vi"
              ? "Hãy thực hiện nộp bài luận ở mục 'Luyện bài Viết mới', kết quả và phản hồi của Giảng viên sẽ hiển thị tại đây."
              : "Submit practice essays in 'Practice Editor' to receive examiner feedback."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">{language === "vi" ? "Học viên" : "Student"}</th>
                <th className="p-4">{language === "vi" ? "Tiêu đề Đề bài" : "Assessment Title"}</th>
                <th className="p-4">{language === "vi" ? "Điểm Đánh Giá" : "Evaluation Score"}</th>
                <th className="p-4">{language === "vi" ? "Điểm Chốt Giảng viên" : "Official Score"}</th>
                <th className="p-4">{language === "vi" ? "Trạng thái" : "Status"}</th>
                <th className="p-4 text-right">{language === "vi" ? "Thao tác" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {submissions.map((sub) => {
                const finalGrade = sub.finalGrades?.[0];
                const ai = sub.aiAssessments?.[0];
                const hasAiResult = Boolean(ai);
                const isReleased = Boolean(finalGrade) || sub.status === "RELEASED" || sub.status === "APPROVED" || sub.status === "COMPLETED";

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      {sub.student?.fullName || "Học viên"}
                      <div className="text-xs font-normal text-slate-400">
                        {language === "vi" ? `Lần nộp ${sub.attemptNumber || 1}` : `Attempt ${sub.attemptNumber || 1}`}
                      </div>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      {sub.assessment?.title || "Bài luận thực hành"}
                      <div className="text-[10px] text-slate-400">
                        {sub.assessment?.examType || "PRACTICE"} • {sub.wordCount} {language === "vi" ? "từ" : "words"}
                      </div>
                    </td>
                    <td className="p-4 font-extrabold text-indigo-700">
                      {ai ? `${ai.total?.toFixed(1)} / 10` : (language === "vi" ? "Đang chờ chấm" : "Pending")}
                    </td>
                    <td className="p-4 font-extrabold text-emerald-700 text-sm">
                      {finalGrade ? `${finalGrade.finalTotal?.toFixed(1)} / 10` : (language === "vi" ? "Chưa chốt" : "Pending")}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          isReleased
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {isReleased
                          ? (language === "vi" ? "ĐÃ CÔNG BỐ KẾT QUẢ" : "RELEASED & APPROVED")
                          : (language === "vi" ? "ĐANG CHỜ GIẢNG VIÊN DUYỆT" : "PENDING LECTURER APPROVAL")}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {hasAiResult ? (
                        <button
                          onClick={() => setSelectedSub(sub)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors shadow-sm inline-flex items-center gap-1"
                        >
                          <span>{language === "vi" ? "Xem Chi Tiết" : "View Feedback"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">{language === "vi" ? "Đang xử lý..." : "Processing..."}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* RESULT MODAL POPUP */}
      {selectedSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-xs">
            {/* STICKY MODAL HEADER */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">
                    {selectedSub.assessment?.examType || "PRACTICE"} • {selectedSub.student?.fullName}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug mt-0.5">{selectedSub.assessment?.title}</h3>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{language === "vi" ? "Điểm Chính Thức" : "Official Grade"}</span>
                  <div className="text-2xl font-black text-indigo-700 font-mono">
                    {selectedSub.finalGrades?.[0]?.finalTotal?.toFixed(1) || selectedSub.aiAssessments?.[0]?.total?.toFixed(1) || "8.0"}
                    <span className="text-xs text-slate-400 font-normal"> / 10.0</span>
                  </div>
                </div>
                <button onClick={() => setSelectedSub(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* SCROLLABLE MODAL BODY */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Teacher Comment Box */}
              {selectedSub.lecturerReviews?.[0]?.comment && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1.5">
                  <span className="text-emerald-800 font-extrabold text-[11px] uppercase tracking-wider block flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    {language === "vi" ? "Lời khuyên & Ghi chú từ Giảng viên:" : "Official Examiner Feedback:"}
                  </span>
                  <p className="text-slate-800 font-medium text-xs leading-relaxed">{selectedSub.lecturerReviews[0].comment}</p>
                </div>
              )}

              {/* 4 Criteria Scores */}
              {selectedSub.aiAssessments?.[0] && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    {language === "vi" ? "Đánh giá theo 4 Tiêu chí Chuyên môn" : "Detailed Criteria Assessment"}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { title: language === "vi" ? "Yêu cầu Đề bài (Task Fulfillment)" : "Task Fulfillment", score: selectedSub.aiAssessments[0].taskFulfillmentScore, data: parseJSON(selectedSub.aiAssessments[0].taskFulfillmentData, {}) },
                      { title: language === "vi" ? "Mạch lạc & Bố cục (Organization)" : "Organization", score: selectedSub.aiAssessments[0].organizationScore, data: parseJSON(selectedSub.aiAssessments[0].organizationData, {}) },
                      { title: language === "vi" ? "Vốn Từ vựng (Vocabulary)" : "Vocabulary", score: selectedSub.aiAssessments[0].vocabularyScore, data: parseJSON(selectedSub.aiAssessments[0].vocabularyData, {}) },
                      { title: language === "vi" ? "Ngữ pháp & Cấu trúc (Grammar)" : "Grammar", score: selectedSub.aiAssessments[0].grammarScore, data: parseJSON(selectedSub.aiAssessments[0].grammarData, {}) }
                    ].map((c) => (
                      <div key={c.title} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                          <span className="font-bold text-slate-900 text-xs">{c.title}</span>
                          <span className="font-extrabold text-indigo-700 font-mono text-sm">{c.score?.toFixed(1) || "2.0"} / 2.5</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{c.data?.rationale || "Evaluated under standard grading rubric."}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Essay Content */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  {language === "vi" ? `Bài làm của Học viên (${selectedSub.wordCount} từ)` : `Student Submitted Essay (${selectedSub.wordCount} words)`}
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-800 leading-relaxed font-medium whitespace-pre-wrap text-xs">
                  {selectedSub.essayText}
                </div>
              </div>
            </div>

            {/* STICKY FOOTER */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-end">
              <button
                onClick={() => setSelectedSub(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
              >
                {language === "vi" ? "Đóng" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
