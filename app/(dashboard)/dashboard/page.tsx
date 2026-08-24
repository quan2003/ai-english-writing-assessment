"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Clock, Sparkles, BadgeCheck, BookOpen, Users, TrendingUp } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function DashboardPage() {
  const { language, t } = useLanguage();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [classesCount, setClassesCount] = useState<number>(0);
  const [assessmentsCount, setAssessmentsCount] = useState<number>(0);
  const [studentsCount, setStudentsCount] = useState<number>(0);
  const [subscription, setSubscription] = useState<any>({ usageCount: 0, limit: 50 });

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((data) => setAnalyticsData(data))
      .catch(console.error);

    fetch("/api/submissions")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSubmissions(data);
      })
      .catch(console.error);

    fetch("/api/classes")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setClassesCount(data.length);
      })
      .catch(console.error);

    fetch("/api/assessments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAssessmentsCount(data.length);
      })
      .catch(console.error);

    fetch("/api/students")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setStudentsCount(data.length);
      })
      .catch(console.error);

    fetch("/api/organizations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data[0]?.subscription) {
          const sub = data[0].subscription;
          setSubscription({
            usageCount: sub.usageCount || 0,
            limit: sub.plan?.monthlyGradingLimit || 50
          });
        }
      })
      .catch(console.error);
  }, []);

  const pendingCount = submissions.filter((s) => s.status !== "COMPLETED" && s.status !== "RELEASED").length;
  const completedCount = submissions.filter((s) => s.status === "COMPLETED" || s.status === "RELEASED").length;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t("overviewAnalytics")}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === "vi" ? "Thống kê thời gian thực về lớp học, bài viết và tiến bộ học viên" : "VSTEP • IELTS • TOEIC Writing exam prep and student progress analytics"}
          </p>
        </div>

        <a
          href="/api/exports"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all"
        >
          <Download className="w-4 h-4" />
          {t("exportCsv")}
        </a>
      </div>

      {/* Main Teacher Cards Grid */}
      <div className="grid grid-cols-4 gap-5 text-xs">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">
              {language === "vi" ? "Lớp học đang mở" : "Active Classes"}
            </span>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{classesCount}</div>
          <p className="text-slate-500 font-medium text-[11px]">
            {language === "vi" ? "Lớp luyện thi VSTEP / IELTS / TOEIC" : "Enrolled exam prep classes"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">
              {language === "vi" ? "Bài tập đang giao" : "Active Assignments"}
            </span>
            <div className="p-2 bg-cyan-50 rounded-lg text-cyan-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{assessmentsCount}</div>
          <p className="text-slate-500 font-medium text-[11px]">
            {language === "vi" ? "Đề thi & bài tập đang mở" : "VSTEP / IELTS / TOEIC tasks"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">{t("awaitingReview")}</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{pendingCount}</div>
          <p className="text-slate-500 font-medium text-[11px]">{t("pendingLecturer")}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">
              {language === "vi" ? "Bài đã công bố" : "Completed Submissions"}
            </span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <BadgeCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{completedCount}</div>
          <p className="text-slate-500 font-medium text-[11px]">
            {language === "vi" ? "Giáo viên duyệt & gửi học viên" : "Teacher approved & released"}
          </p>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">
              {language === "vi" ? "Học viên tham gia" : "Enrolled Students"}
            </span>
            <span className="text-xl font-bold text-slate-900">
              {studentsCount} {language === "vi" ? "Học viên" : "Students"}
            </span>
          </div>
          <Users className="w-5 h-5 text-indigo-500" />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">
              {language === "vi" ? "Lượt chấm AI đã dùng" : "AI Grading Quota Used"}
            </span>
            <span className="text-xl font-bold text-indigo-700">
              {subscription.usageCount} / {subscription.limit}
            </span>
          </div>
          <Sparkles className="w-5 h-5 text-cyan-500" />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">
              {language === "vi" ? "Điểm gợi ý AI TB" : "Avg Student Score"}
            </span>
            <span className="text-xl font-bold text-emerald-600">
              {analyticsData?.meanFinalTotal ? `${analyticsData.meanFinalTotal} / 10` : "— / 10"}
            </span>
          </div>
          <BadgeCheck className="w-5 h-5 text-emerald-500" />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">
              {language === "vi" ? "Tiến bộ trung bình" : "Avg Rewrite Improvement"}
            </span>
            <span className="text-xl font-bold text-amber-600">
              {analyticsData?.meanDelta ? `+${analyticsData.meanDelta} Band` : "— Band"}
            </span>
          </div>
          <TrendingUp className="w-5 h-5 text-amber-500" />
        </div>
      </div>

      {/* Criteria Performance Breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{t("criteriaBreakdown")}</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              name: language === "vi" ? "Hoàn thành Yêu cầu (Task)" : "Task Fulfillment / Achievement",
              score: analyticsData?.criterionAverages?.taskFulfillment || null
            },
            {
              name: language === "vi" ? "Mạch lạc & Bố cục" : "Coherence & Organization",
              score: analyticsData?.criterionAverages?.organization || null
            },
            {
              name: language === "vi" ? "Vốn từ vựng" : "Vocabulary & Lexical Resource",
              score: analyticsData?.criterionAverages?.vocabulary || null
            },
            {
              name: language === "vi" ? "Ngữ pháp & Độ chính xác" : "Grammatical Range & Accuracy",
              score: analyticsData?.criterionAverages?.grammar || null
            }
          ].map((c) => (
            <div key={c.name} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-semibold text-slate-500 block mb-1">{c.name}</span>
              <div className="text-xl font-extrabold text-indigo-700">
                {c.score ? `${c.score}` : "—"} <span className="text-xs font-normal text-slate-400">/ 2.5</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all"
                  style={{ width: `${c.score ? (parseFloat(c.score as string) / 2.5) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
