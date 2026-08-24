"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function AssessmentsPage() {
  const { language } = useLanguage();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newMinWords, setNewMinWords] = useState("150");
  const [newMaxWords, setNewMaxWords] = useState("300");

  const fetchAssessments = () => {
    fetch("/api/assessments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAssessments(data);
      });
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newTask) return;

    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          task: newTask,
          minWords: newMinWords ? parseInt(newMinWords) : undefined,
          maxWords: newMaxWords ? parseInt(newMaxWords) : undefined,
          status: "OPEN"
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewTitle("");
        setNewTask("");
        fetchAssessments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {language === "vi" ? "Đề thi & Bài tập Viết" : "Exams & Writing Assessments"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === "vi"
              ? "Quản lý đề bài viết, yêu cầu số từ và các thiết lập tiêu chí chấm"
              : "Manage writing prompts, word requirements, and rubric options"}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{language === "vi" ? "Tạo Bài tập / Đề thi" : "Create Assessment"}</span>
        </button>
      </div>

      {assessments.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">{language === "vi" ? "Tiêu đề & Đề bài Viết" : "Title & Writing Prompt"}</th>
                <th className="p-4">{language === "vi" ? "Giới hạn số từ" : "Word Limits"}</th>
                <th className="p-4">{language === "vi" ? "Phiên bản Rubric / Model" : "Rubric / Model Snapshot"}</th>
                <th className="p-4">{language === "vi" ? "Trạng thái" : "Status"}</th>
                <th className="p-4">{language === "vi" ? "Số bài nộp" : "Submissions"}</th>
                <th className="p-4 text-right">{language === "vi" ? "Thao tác" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {assessments.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                    <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.task}</div>
                  </td>
                  <td className="p-4 text-slate-600 font-medium">
                    {item.minWords || "150"} - {item.maxWords || "300"} {language === "vi" ? "từ" : "words"}
                  </td>
                  <td className="p-4 text-slate-500 font-mono text-[11px]">
                    writing-rubric-v2.0 / gpt-4o-2024-11-20
                  </td>
                  <td className="p-4">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[10px]">
                      {item.status === "OPEN" ? (language === "vi" ? "MỞ LÀM BÀI" : "OPEN") : item.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    {item._count?.submissions || 0} {language === "vi" ? "bài nộp" : "essays"}
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/submit?assessmentId=${item.id}`}
                      className="inline-block bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold px-3 py-1.5 rounded-lg text-xs transition-all"
                    >
                      {language === "vi" ? "Làm bài viết" : "Submit Writing"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs shadow-sm">
          <p className="font-bold text-slate-800 text-sm">
            {language === "vi" ? "Chưa có bài tập nào được tạo." : "No assessments created yet."}
          </p>
          <p className="mt-1 text-slate-400">
            {language === "vi"
              ? "Nhấp vào nút 'Tạo Bài tập' để định nghĩa đề bài viết mới cho học viên."
              : 'Click "Create Assessment" to define a new writing prompt for students.'}
          </p>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {language === "vi" ? "Tạo Đề thi / Bài tập Viết" : "Create Writing Assessment"}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssessment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === "vi" ? "Tiêu đề Bài tập" : "Assessment Title"}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={language === "vi" ? "VD: Bài luận Giữa kỳ: AI trong Giáo dục" : "e.g. Midterm Essay: AI in Higher Education"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none focus:border-indigo-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === "vi" ? "Đề bài Viết" : "Writing Task Prompt"}
                </label>
                <textarea
                  rows={3}
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder={language === "vi" ? "Nhập chi tiết yêu cầu đề bài..." : "Enter writing prompt instructions..."}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none focus:border-indigo-600 font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {language === "vi" ? "Số từ tối thiểu" : "Minimum Words"}
                  </label>
                  <input
                    type="number"
                    value={newMinWords}
                    onChange={(e) => setNewMinWords(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {language === "vi" ? "Số từ tối đa" : "Maximum Words"}
                  </label>
                  <input
                    type="number"
                    value={newMaxWords}
                    onChange={(e) => setNewMaxWords(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none focus:border-indigo-600 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
                >
                  {language === "vi" ? "Hủy bỏ" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200"
                >
                  {language === "vi" ? "Lưu Bài tập" : "Save Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
