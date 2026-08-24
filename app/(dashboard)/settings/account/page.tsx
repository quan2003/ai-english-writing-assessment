"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Shield, Building, Calendar, Trash2, AlertTriangle, X, CheckCircle2, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load user profile");
        return res.json();
      })
      .then((data) => {
        setUserData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const handleDeleteAccount = async () => {
    if (confirmText.toLowerCase() !== "delete" && confirmText.toLowerCase() !== "xóa") {
      setErrorMsg(language === "vi" ? "Vui lòng nhập từ 'XÓA' để xác nhận" : "Please type 'DELETE' to confirm");
      return;
    }

    setIsDeleting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account");
      }

      router.push("/login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting account";
      setErrorMsg(msg);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 text-xs font-bold gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
        <span>{language === "vi" ? "Đang tải thông tin tài khoản..." : "Loading account settings..."}</span>
      </div>
    );
  }

  const roleBadge = userData?.globalRole === "STUDENT"
    ? (language === "vi" ? "Học viên" : "Student")
    : (language === "vi" ? "Giáo viên / Giảng viên" : "Teacher / Lecturer");

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {language === "vi" ? "Quản lý Tài khoản & Hồ sơ" : "Account & Profile Settings"}
        </h2>
        <p className="text-slate-500 text-xs mt-1 font-medium">
          {language === "vi" ? "Xem thông tin cá nhân và quản lý tài khoản của bạn" : "Manage your personal profile and account credentials"}
        </p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            {userData?.fullName ? userData.fullName.substring(0, 2).toUpperCase() : "US"}
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">{userData?.fullName || "User Account"}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                {roleBadge}
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-500 text-xs font-medium">{userData?.email}</span>
            </div>
          </div>
        </div>

        {/* Profile Attributes Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === "vi" ? "Họ và tên" : "Full Name"}</span>
            </div>
            <div className="font-extrabold text-slate-900 text-sm">{userData?.fullName}</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === "vi" ? "Địa chỉ Email" : "Email Address"}</span>
            </div>
            <div className="font-extrabold text-slate-900 text-sm">{userData?.email}</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === "vi" ? "Workspace hiện tại" : "Current Workspace"}</span>
            </div>
            <div className="font-extrabold text-slate-900 text-sm">
              {userData?.memberships?.[0]?.organization?.name || "Personal Workspace"}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === "vi" ? "Ngày tạo tài khoản" : "Member Since"}</span>
            </div>
            <div className="font-extrabold text-slate-900 text-sm">
              {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString("vi-VN") : "Recent"}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="bg-rose-50/60 border border-rose-200 rounded-3xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{language === "vi" ? "Vùng nguy hiểm: Xóa tài khoản" : "Danger Zone: Delete Account"}</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed max-w-xl">
              {language === "vi"
                ? "Hành động này sẽ xóa vĩnh viễn tài khoản của bạn khỏi hệ thống cơ sở dữ liệu SQLite. Toàn bộ thông tin cá nhân và cài đặt sẽ bị xóa không thể khôi phục."
                : "This action will permanently delete your account from the SQLite database. All personal data will be unrecoverable."}
            </p>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-rose-200 transition-all shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>{language === "vi" ? "Xóa tài khoản" : "Delete Account"}</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700 font-extrabold text-base">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>{language === "vi" ? "Xác nhận xóa tài khoản?" : "Confirm Account Deletion?"}</span>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed font-medium">
              {language === "vi"
                ? `Bạn đang chuẩn bị xóa tài khoản "${userData?.email}". Vui lòng nhập từ "XÓA" vào ô bên dưới để xác nhận.`
                : `You are about to delete account "${userData?.email}". Please type "DELETE" below to confirm.`}
            </p>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={language === "vi" ? "Nhập 'XÓA'..." : "Type 'DELETE'..."}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-rose-600 font-bold"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
              >
                {language === "vi" ? "Hủy bỏ" : "Cancel"}
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl shadow-md shadow-rose-200 transition-all"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{language === "vi" ? "Đang xóa..." : "Deleting..."}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{language === "vi" ? "Xác nhận Xóa" : "Confirm Delete"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
