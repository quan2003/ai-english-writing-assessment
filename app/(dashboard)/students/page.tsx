"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheet, X, Users } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

type ImportRow = {
  rowNumber: number;
  studentIdCode: string;
  fullName: string;
  email: string;
  isValid: boolean;
  errors: string[];
};

export default function StudentsPage() {
  const { language } = useLanguage();
  const [students, setStudents] = useState<any[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importPreviewRows, setImportPreviewRows] = useState<ImportRow[]>([]);
  const [isValidatingCsv, setIsValidatingCsv] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState("");

  const fetchStudents = () => {
    fetch("/api/students")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setStudents(data);
      });
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleValidateCsv = async () => {
    if (!csvText) return;
    setIsValidatingCsv(true);

    const lines = csvText.trim().split("\n");
    const parsedRows = lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      return {
        studentIdCode: cols[0] || "",
        fullName: cols[1] || "",
        email: cols[2] || ""
      };
    });

    try {
      const res = await fetch("/api/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows, commit: false })
      });

      const data = await res.json();
      if (data.validatedRows) {
        setImportPreviewRows(data.validatedRows);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsValidatingCsv(false);
    }
  };

  const handleCommitImport = async () => {
    const validRows = importPreviewRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    try {
      const res = await fetch("/api/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows, commit: true })
      });

      if (res.ok) {
        const data = await res.json();
        setImportSuccessMsg(
          language === "vi"
            ? `Nhập thành công ${data.importedCount} hồ sơ học viên!`
            : `Successfully imported ${data.importedCount} student records!`
        );
        fetchStudents();
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
            {language === "vi" ? "Danh sách Học viên & Nhập dữ liệu CSV" : "Student Roster & CSV Import"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === "vi"
              ? "Quản lý hồ sơ học viên tham gia và nhập danh sách từ file CSV"
              : "Manage enrolled student profiles and import CSV data with per-row validation"}
          </p>
        </div>

        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{language === "vi" ? "Nhập Học viên từ CSV" : "Bulk Import Students (CSV)"}</span>
        </button>
      </div>

      {students.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {language === "vi" ? "Chưa có Học viên nào trong Lớp" : "No Students Enrolled Yet"}
          </h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            {language === "vi"
              ? "Học viên có thể tự nhập Mã lớp để tham gia hoặc giáo viên bấm 'Nhập Học viên từ CSV' để thêm danh sách lớp."
              : "Students can join using your class code, or click 'Bulk Import Students' to upload a CSV roster."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">{language === "vi" ? "Mã Học viên" : "Student ID"}</th>
                <th className="p-4">{language === "vi" ? "Họ và tên" : "Full Name"}</th>
                <th className="p-4">{language === "vi" ? "Địa chỉ Email" : "Email Address"}</th>
                <th className="p-4">{language === "vi" ? "Số bài đã nộp" : "Submissions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-bold text-indigo-700">{s.studentIdCode}</td>
                  <td className="p-4 font-bold text-slate-900">{s.fullName}</td>
                  <td className="p-4 text-slate-500">{s.email}</td>
                  <td className="p-4 font-medium text-slate-700">
                    {s._count?.submissions || 0} {language === "vi" ? "bài nộp" : "submissions"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {language === "vi" ? "Nhập Danh sách Học viên từ File CSV" : "Bulk CSV Student Import"}
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === "vi"
                    ? "Dán nội dung CSV (Dòng đầu: student_id, full_name, email)"
                    : "Paste CSV Content (Header: student_id, full_name, email)"}
                </label>
                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="STU-2026-002, Sarah Conner, sarah@univ.edu&#10;STU-2026-003, John Smith, john@univ.edu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-[11px] outline-none"
                />
              </div>

              <button
                onClick={handleValidateCsv}
                disabled={isValidatingCsv || !csvText}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl font-bold"
              >
                {isValidatingCsv
                  ? (language === "vi" ? "Đang kiểm tra dòng..." : "Validating Rows...")
                  : (language === "vi" ? "Kiểm tra Dữ liệu Nhập" : "Validate Preview")}
              </button>

              {importPreviewRows.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-2">{language === "vi" ? "Dòng" : "Row"}</th>
                        <th className="p-2">{language === "vi" ? "Mã SV" : "ID"}</th>
                        <th className="p-2">{language === "vi" ? "Họ tên" : "Name"}</th>
                        <th className="p-2">{language === "vi" ? "Trạng thái" : "Status"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importPreviewRows.map((r) => (
                        <tr key={r.rowNumber} className={r.isValid ? "text-slate-800" : "bg-rose-50 text-rose-700"}>
                          <td className="p-2 font-mono">{r.rowNumber}</td>
                          <td className="p-2 font-bold">{r.studentIdCode}</td>
                          <td className="p-2">{r.fullName}</td>
                          <td className="p-2 font-bold">
                            {r.isValid ? (language === "vi" ? "Hợp lệ" : "Valid Row") : r.errors.join("; ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {importSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl font-bold">
                  {importSuccessMsg}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold">
                {language === "vi" ? "Đóng" : "Close"}
              </button>
              <button
                onClick={handleCommitImport}
                disabled={importPreviewRows.filter((r) => r.isValid).length === 0}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200 disabled:opacity-50"
              >
                {language === "vi"
                  ? `Xác nhận Nhập (${importPreviewRows.filter((r) => r.isValid).length})`
                  : `Commit Import (${importPreviewRows.filter((r) => r.isValid).length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
