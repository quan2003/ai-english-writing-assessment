"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { FlagGB, FlagVN } from "@/lib/flags";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  const [email, setEmail] = useState("admin@saasplatform.edu");
  const [password, setPassword] = useState("Password123!");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Super Admin credentials invalid");
      }

      if (data.session?.globalRole !== "SUPER_ADMIN") {
        throw new Error("Access Denied: Account does not have Super Admin platform privileges.");
      }

      router.push("/health");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Operator authentication failed";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-20 flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs shadow-sm">
        <button
          onClick={() => setLanguage("en")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${
            language === "en" ? "bg-purple-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <FlagGB className="w-4 h-3 rounded-xs" />
          <span>EN</span>
        </button>
        <button
          onClick={() => setLanguage("vi")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${
            language === "vi" ? "bg-purple-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <FlagVN className="w-4 h-3 rounded-xs" />
          <span>VI</span>
        </button>
      </div>

      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-8 z-10">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t("backToUnivLogin")}
        </Link>

        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-xl shadow-purple-200 ring-4 ring-purple-50">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t("superAdminTitle")}</h1>
          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
            {t("superAdminSubtitle")}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
          <form onSubmit={handleAdminLogin} className="space-y-5 text-xs">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider text-[10px]">{t("operatorEmail")}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@saasplatform.edu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:bg-white font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider text-[10px]">{t("securityPassword")}</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-purple-600 focus:bg-white font-medium transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-200 transition-all text-xs"
            >
              {isLoading ? "Authenticating Operator..." : t("authOperatorBtn")}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
