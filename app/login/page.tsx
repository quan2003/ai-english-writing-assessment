"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, Mail, User, ArrowRight, HelpCircle, X, UserPlus, LogIn, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { FlagGB, FlagVN } from "@/lib/flags";

export default function LoginPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"LECTURER" | "STUDENT">("LECTURER");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const endpoint = mode === "login" ? "/api/auth/me" : "/api/auth/register";
    const payload = mode === "login"
      ? { email, password }
      : { fullName, email, password, role };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (mode === "register") {
        setSuccessMsg(language === "vi" ? "Đăng ký thành công! Đang chuyển hướng..." : "Registration successful! Redirecting...");
      }

      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication error";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Top Bar for Language Switcher & Beginner Guide */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <button
          onClick={() => setShowGuideModal(true)}
          className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
        >
          <HelpCircle className="w-4 h-4" />
          <span>{language === "en" ? "Guide" : "Hướng dẫn"}</span>
        </button>

        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs shadow-sm">
          <button
            onClick={() => setLanguage("en")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${
              language === "en" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <FlagGB className="w-4 h-3 rounded-xs" />
            <span>EN</span>
          </button>
          <button
            onClick={() => setLanguage("vi")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${
              language === "vi" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <FlagVN className="w-4 h-3 rounded-xs" />
            <span>VI</span>
          </button>
        </div>
      </div>

      {/* Decorative Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-6 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-xl shadow-indigo-200 ring-4 ring-indigo-50">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t("appTitle")}</h1>
          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
            {t("appSubtitle")}
          </p>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold border border-slate-200">
            <button
              onClick={() => { setMode("login"); setErrorMsg(""); setSuccessMsg(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
                mode === "login" ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>{language === "vi" ? "Đăng nhập" : "Sign In"}</span>
            </button>

            <button
              onClick={() => { setMode("register"); setErrorMsg(""); setSuccessMsg(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
                mode === "register" ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === "vi" ? "Đăng ký tài khoản" : "Sign Up"}</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl font-medium">
                {successMsg}
              </div>
            )}

            {mode === "register" && (
              <>
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                    {language === "vi" ? "Họ và tên" : "Full Name"}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={language === "vi" ? "Nguyễn Văn A" : "Alex Rivera"}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-600 focus:bg-white font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                    {language === "vi" ? "Vai trò người dùng" : "User Role"}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("LECTURER")}
                      className={`p-3 rounded-xl border font-bold text-center transition-all ${
                        role === "LECTURER" ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      {language === "vi" ? "Giáo viên / Giảng viên" : "Teacher / Lecturer"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("STUDENT")}
                      className={`p-3 rounded-xl border font-bold text-center transition-all ${
                        role === "STUDENT" ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      {language === "vi" ? "Học viên" : "Student"}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider text-[10px]">{t("emailLabel")}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-600 focus:bg-white font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider text-[10px]">{t("passwordLabel")}</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-600 focus:bg-white font-medium transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all text-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{mode === "login" ? (language === "vi" ? "Đang xác thực..." : "Authenticating...") : (language === "vi" ? "Đang tạo tài khoản..." : "Creating Account...")}</span>
                </>
              ) : (
                <>
                  <span>{mode === "login" ? (language === "vi" ? "Đăng nhập" : "Sign In") : (language === "vi" ? "Tạo tài khoản mới" : "Create Account")}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Beginner Quick Start Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{t("quickStartTitle")}</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">{t("quickStartSubtitle")}</p>
              </div>
              <button onClick={() => setShowGuideModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-2xl space-y-1">
                <div className="font-bold text-amber-800">{t("step1Title")}</div>
                <p className="text-slate-700 leading-relaxed text-[11px]">{t("step1Desc")}</p>
              </div>

              <div className="bg-indigo-50/60 border border-indigo-200 p-3.5 rounded-2xl space-y-1">
                <div className="font-bold text-indigo-800">{t("step2Title")}</div>
                <p className="text-slate-700 leading-relaxed text-[11px]">{t("step2Desc")}</p>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-2xl space-y-1">
                <div className="font-bold text-emerald-800">{t("step3Title")}</div>
                <p className="text-slate-700 leading-relaxed text-[11px]">{t("step3Desc")}</p>
              </div>

              <div className="bg-cyan-50/60 border border-cyan-200 p-3.5 rounded-2xl space-y-1">
                <div className="font-bold text-cyan-800">{t("step4Title")}</div>
                <p className="text-slate-700 leading-relaxed text-[11px]">{t("step4Desc")}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowGuideModal(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-200"
              >
                {t("gotItBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
