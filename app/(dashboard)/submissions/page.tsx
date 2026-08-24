"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, FileEdit, CheckCircle2, ChevronRight, Edit3, Award, Sparkles, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function SubmissionsPage() {
  const { language } = useLanguage();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isBatchGrading, setIsBatchGrading] = useState(false);
  const [batchMsg, setBatchMsg] = useState("");

  const fetchSubmissions = () => {
    fetch("/api/submissions")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSubmissions(data);
      });
  };

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBatchAiGrading = async () => {
    setIsBatchGrading(true);
    setBatchMsg("");
    try {
      const res = await fetch("/api/grade/batch", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setBatchMsg(data.message || (language === "vi" ? "Đã hoàn tất chấm AI hàng loạt cho các bài nộp!" : "Batch grading complete!"));
        fetchSubmissions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBatchGrading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {language === "vi" ? "Hàng chờ Bài nộp & Chấm AI Hàng loạt" : "Submissions Queue & Batch AI Grading Studio"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === "vi"
              ? "Công cụ Giảng viên: Theo dõi bài luận của học viên, kích hoạt AI chấm hàng loạt và phê duyệt công bố điểm"
              : "Lecturer Studio: Monitor student submissions, run batch AI grading, and approve final scores"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBatchAiGrading}
            disabled={isBatchGrading || submissions.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
          >
            {isBatchGrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
            <span>{language === "vi" ? "⚡ AI Chấm Bài Hàng Loạt" : "Batch Grade All Essays"}</span>
          </button>

          <Link
            href="/submit"
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 transition-all"
          >
            <Layers className="w-4 h-4" />
            <span>{language === "vi" ? "Nộp Bài Luyện Mới" : "Submit Practice Essay"}</span>
          </Link>
        </div>
      </div>

      {batchMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{batchMsg}</span>
          </div>
          <button onClick={() => setBatchMsg("")} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs">
            ✕
          </button>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-bold">
            <FileEdit className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {language === "vi" ? "Chưa có Bài nộp nào trong Hàng chờ" : "No Submissions Found"}
          </h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            {language === "vi"
              ? "Khi học viên thực hành nộp bài, toàn bộ bài làm sẽ xuất hiện ở đây để Giảng viên chấm điểm bằng AI hoặc duyệt bài."
              : "When students submit essays, submissions appear here for lecturer review."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">{language === "vi" ? "Học viên & Mã SV" : "Student Name & ID"}</th>
                <th className="p-4">{language === "vi" ? "Đề bài Viết" : "Assessment Task"}</th>
                <th className="p-4">{language === "vi" ? "Số từ" : "Word Count"}</th>
                <th className="p-4">{language === "vi" ? "Điểm AI Gợi ý" : "AI Score"}</th>
                <th className="p-4">{language === "vi" ? "Trạng thái Duyệt" : "Review Status"}</th>
                <th className="p-4 text-right">{language === "vi" ? "Thao tác Giảng viên" : "Lecturer Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {submissions.map((sub) => {
                const ai = sub.aiAssessments?.[0];
                const finalGrade = sub.finalGrades?.[0];
                const isReleased = Boolean(finalGrade) || sub.status === "RELEASED" || sub.status === "APPROVED" || sub.status === "COMPLETED";

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      {sub.student?.fullName || "Học viên"}
                      <div className="text-xs font-normal text-slate-400">{sub.student?.studentIdCode || "STU-NEW"}</div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{sub.assessment?.title || "Bài luận thực hành"}</td>
                    <td className="p-4 text-slate-500">{sub.wordCount} {language === "vi" ? "từ" : "words"}</td>
                    <td className="p-4 font-extrabold text-indigo-700 text-sm">
                      {ai?.total !== undefined ? `${ai.total.toFixed(1)} / 10` : (language === "vi" ? "Chưa chấm AI" : "Pending AI")}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-md font-bold text-[10px] ${
                          isReleased
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : ai
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {isReleased
                          ? (language === "vi" ? "ĐÃ CÔNG BỐ KẾT QUẢ" : "RELEASED & APPROVED")
                          : ai
                          ? (language === "vi" ? "AI CHẤM XONG • CHỜ DUYỆT" : "AI GRADED • PENDING REVIEW")
                          : (language === "vi" ? "MỚI NỘP • CHỜ CHẤM AI" : "NEW SUBMISSION • PENDING AI")}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {isReleased ? (
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href="/results"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-xl text-xs border border-emerald-200 transition-colors inline-flex items-center gap-1"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>{language === "vi" ? "Xem Kết quả" : "View Results"}</span>
                          </Link>
                          <Link
                            href={`/review?submissionId=${sub.id}`}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{language === "vi" ? "Sửa Lại" : "Edit"}</span>
                          </Link>
                        </div>
                      ) : (
                        <Link
                          href={`/review?submissionId=${sub.id}`}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-200 inline-flex items-center gap-1"
                        >
                          <span>{language === "vi" ? "Phê duyệt & Duyệt điểm" : "Review Studio"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
