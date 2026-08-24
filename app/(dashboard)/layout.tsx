"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  Layers,
  Edit3,
  Award,
  Users,
  LogOut,
  BookOpen,
  HelpCircle,
  X,
  TrendingUp,
  FolderGit2,
  UserCheck,
  PlusCircle,
  CheckCircle2,
  ChevronDown,
  ShieldCheck
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { FlagGB, FlagVN } from "@/lib/flags";
import GlobalLoading from "../loading";

type Role = "SUPER_ADMIN" | "ORG_ADMIN" | "LECTURER" | "REVIEWER" | "STUDENT";

type Organization = {
  id: string;
  name: string;
  slug: string;
  subscription?: {
    plan: { name: string; monthlyGradingLimit: number };
    usageCount: number;
  };
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();

  const [session, setSession] = useState<any>(null);
  const [activeOrgId, setActiveOrgId] = useState<string>("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Student Joined Classes State
  const [studentClasses, setStudentClasses] = useState<any[]>([]);
  const [activeStudentClass, setActiveStudentClass] = useState<any | null>(null);
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  // Join Class Modal State for Students
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinMsg, setJoinMsg] = useState("");
  const [joinErr, setJoinErr] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const fetchStudentClasses = () => {
    fetch("/api/students/me/classes")
      .then((res) => res.json())
      .then((data) => {
        if (data.joinedClasses) {
          setStudentClasses(data.joinedClasses);
          if (data.activeClass) {
            setActiveStudentClass(data.activeClass);
          }
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.session) {
          setSession(data.session);
          if (data.session.organizationId) {
            setActiveOrgId(data.session.organizationId);
          }
          if (data.session.orgRole === "STUDENT" || data.session.globalRole === "STUDENT") {
            fetchStudentClasses();
          }
        }
        setIsLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });

    fetch("/api/organizations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setOrganizations(data);
          if (!activeOrgId) setActiveOrgId(data[0].id);
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/me", { method: "DELETE" });
    router.push("/login");
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput) return;
    setIsJoining(true);
    setJoinMsg("");
    setJoinErr("");

    try {
      const res = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classCode: joinCodeInput })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Join class failed");

      setJoinMsg(data.message || (language === "vi" ? "Tham gia lớp thành công!" : "Joined class successfully!"));
      if (data.activeClass) {
        setActiveStudentClass(data.activeClass);
        fetchStudentClasses();
      }

      setTimeout(() => {
        setShowJoinModal(false);
        setJoinCodeInput("");
        setJoinMsg("");
        router.push("/submit");
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error joining class";
      setJoinErr(msg);
    } finally {
      setIsJoining(false);
    }
  };

  const handleSelectClass = (cls: any) => {
    setActiveStudentClass(cls);
    setShowClassDropdown(false);
    router.push("/submit");
  };

  const activeRole: Role = session?.orgRole || session?.globalRole || "LECTURER";
  const activeOrg = organizations.find((o) => o.id === activeOrgId) || organizations[0];

  if (isLoading) {
    return <GlobalLoading />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Header Navbar - Dark Premium Theme */}
      <header className="bg-slate-900 border-b border-slate-800 text-white shadow-md px-6 py-3.5 flex items-center justify-between z-30 shrink-0 relative">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white leading-none">{t("appTitle")}</h1>
              <p className="text-[11px] text-indigo-400 font-bold mt-1">{t("appSubtitle")}</p>
            </div>
          </Link>
        </div>

        {/* Authenticated User Profile Badge, Language Switcher & Class Switcher */}
        <div className="flex items-center gap-4">
          {activeRole === "STUDENT" && (
            <div className="relative">
              {activeStudentClass ? (
                <button
                  onClick={() => setShowClassDropdown(!showClassDropdown)}
                  className="flex items-center gap-2 bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-200 border border-indigo-700/50 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>
                    {language === "vi" ? "Lớp:" : "Class:"} <b className="text-white">{activeStudentClass.name}</b> ({activeStudentClass.classCode})
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                </button>
              ) : (
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{language === "vi" ? "Tham gia Lớp bằng Mã" : "Join Class with Code"}</span>
                </button>
              )}

              {/* Student Class Switcher Dropdown */}
              {showClassDropdown && activeStudentClass && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 text-xs space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    {language === "vi" ? "Danh sách Lớp học Đã Tham gia" : "Joined Classes Roster"}
                  </div>
                  {studentClasses.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => handleSelectClass(cls)}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all ${
                        activeStudentClass.id === cls.id
                          ? "bg-indigo-50 text-indigo-900 font-bold border border-indigo-200"
                          : "hover:bg-slate-50 text-slate-700 font-medium"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{cls.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{cls.classCode} • {cls.organizationName}</div>
                      </div>
                      {activeStudentClass.id === cls.id && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setShowClassDropdown(false);
                      setShowJoinModal(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-indigo-600 hover:bg-indigo-50 font-bold flex items-center gap-2 border-t border-slate-100 mt-1"
                  >
                    <PlusCircle className="w-4 h-4 text-indigo-600" />
                    <span>{language === "vi" ? "Tham gia Lớp mới bằng Mã..." : "Join another class with code..."}</span>
                  </button>
                </div>
              )}
            </div>
          )}



          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>{language === "en" ? "Guide" : "Hướng dẫn"}</span>
          </button>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 text-xs">
            <button
              onClick={() => setLanguage("en")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${
                language === "en" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FlagGB className="w-4 h-3 rounded-xs" />
              <span>EN</span>
            </button>
            <button
              onClick={() => setLanguage("vi")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${
                language === "vi" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FlagVN className="w-4 h-3 rounded-xs" />
              <span>VI</span>
            </button>
          </div>

          <Link href="/settings/account" className="flex items-center gap-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs transition-all">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
              {session?.fullName ? session.fullName.substring(0, 2).toUpperCase() : "US"}
            </div>
            <div>
              <div className="font-bold text-white leading-none">{session?.fullName || "Authenticated User"}</div>
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">
                {language === "vi"
                  ? activeRole === "LECTURER"
                    ? "GIÁO VIÊN / GIẢNG VIÊN"
                    : activeRole === "STUDENT"
                    ? "HỌC VIÊN"
                    : activeRole === "ORG_ADMIN" || activeRole === "SUPER_ADMIN"
                    ? "QUẢN LÝ TRUNG TÂM"
                    : activeRole
                  : activeRole.replace("_", " ")}
              </div>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            title={t("signOut")}
            className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all border border-slate-700"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main SaaS Workspace */}
      <div className="flex flex-1 overflow-hidden relative z-0">
        {/* Left Navigation Sidebar */}
        <aside className="w-64 bg-slate-50/90 border-r border-slate-200 text-slate-700 p-4 flex flex-col gap-4 shadow-sm">
          {/* SECTION 1: OVERVIEW */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("overview")}</div>
            <Link
              href="/dashboard"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                pathname === "/dashboard"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-500" />
              {t("dashboard")}
            </Link>
          </div>

          {/* SECTION 2: STUDENT PORTAL (If Role === STUDENT) */}
          {activeRole === "STUDENT" ? (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold text-amber-600 uppercase tracking-wider">{t("studentPortal")}</div>

              {activeStudentClass ? (
                <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 text-xs space-y-1 mb-2">
                  <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    {language === "vi" ? "Lớp đang tham gia:" : "Active Class:"}
                  </div>
                  <div className="font-extrabold text-slate-900 text-sm truncate">{activeStudentClass.name}</div>
                  <div className="text-[10px] font-mono text-indigo-700 font-bold">Mã: {activeStudentClass.classCode}</div>
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="text-[10px] text-indigo-600 hover:underline font-bold block pt-1"
                  >
                    + {language === "vi" ? "Tham gia thêm lớp khác..." : "Join another class..."}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all text-left mb-1"
                >
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  <span>{language === "vi" ? "Tham gia Lớp bằng Mã" : "Join Class with Code"}</span>
                </button>
              )}

              <Link
                href="/submit"
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  pathname === "/submit"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <Edit3 className="w-4 h-4 text-amber-500" />
                {t("submitWriting")}
              </Link>
              <Link
                href="/results"
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  pathname === "/results"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <Award className="w-4 h-4 text-emerald-500" />
                {t("myReleasedResults")}
              </Link>
              <Link
                href="/progress-reports"
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  pathname === "/progress-reports"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <TrendingUp className="w-4 h-4 text-cyan-500" />
                {t("myProgress")}
              </Link>
              <Link
                href="/settings/account"
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  pathname === "/settings/account"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <UserCheck className="w-4 h-4 text-indigo-500" />
                {language === "vi" ? "Cài đặt Tài khoản" : "Account Settings"}
              </Link>
            </div>
          ) : (
            <>
              {/* SECTION 3: TEACHING */}
              <div className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("teachingSection")}</div>
                <Link
                  href="/classes"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === "/classes"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  {t("classes")}
                </Link>
                <Link
                  href="/assessments"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === "/assessments"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                  }`}
                >
                  <FileText className="w-4 h-4 text-indigo-500" />
                  {t("assignments")}
                </Link>
                <Link
                  href="/question-bank"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === "/question-bank"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                  }`}
                >
                  <FolderGit2 className="w-4 h-4 text-indigo-500" />
                  {t("questionBank")}
                </Link>
              </div>

              {/* SECTION 4: GRADING */}
              <div className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("gradingSection")}</div>
                <Link
                  href="/submissions"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === "/submissions"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                  }`}
                >
                  <Layers className="w-4 h-4 text-cyan-600" />
                  {t("submissionsQueue")}
                </Link>
                <Link
                  href="/review"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname.startsWith("/review")
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                  }`}
                >
                  <Edit3 className="w-4 h-4 text-amber-600" />
                  {t("reviewQueueStudio")}
                </Link>
                <Link
                  href="/results"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === "/results"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                  }`}
                >
                  <Award className="w-4 h-4 text-emerald-600" />
                  {t("releasedResults")}
                </Link>
              </div>

              {/* SECTION 5: PROGRESS */}
              <div className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("progressSection")}</div>
                <Link
                  href="/students"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === "/students"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                  }`}
                >
                  <Users className="w-4 h-4 text-indigo-500" />
                  {t("studentsRoster")}
                </Link>
                <Link
                  href="/progress-reports"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === "/progress-reports"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                  }`}
                >
                  <TrendingUp className="w-4 h-4 text-cyan-600" />
                  {t("progressReports")}
                </Link>
              </div>

              {/* SECTION 6: ACCOUNT & BILLING */}
              <div className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("accountSection")}</div>
                <Link
                  href="/settings/plan"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === "/settings/plan"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                  }`}
                >
                  <Award className="w-4 h-4 text-indigo-500" />
                  {t("usagePlan")}
                </Link>
                <Link
                  href="/settings/account"
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === "/settings/account"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-indigo-500" />
                  {language === "vi" ? "Cài đặt Tài khoản" : "Account Settings"}
                </Link>
              </div>
            </>
          )}

          {/* Quota Meter Footer Card */}
          <div className="mt-auto pt-3 border-t border-slate-200">
            <div className="bg-slate-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>{language === "vi" ? "Hạn ngạch Chấm AI Tháng" : "Monthly AI Practice Quota"}</span>
                <span className="text-indigo-600 font-mono">
                  {activeOrg?.subscription?.usageCount || 0} / {activeOrg?.subscription?.plan?.monthlyGradingLimit || 50}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      ((activeOrg?.subscription?.usageCount || 0) / (activeOrg?.subscription?.plan?.monthlyGradingLimit || 50)) * 100
                    )}%`
                  }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Dynamic Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">{children}</main>
      </div>

      {/* STUDENT JOIN CLASS MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === "vi" ? "Tham gia Lớp học của Giáo viên" : "Join Teacher's Class"}
                </h3>
              </div>
              <button onClick={() => setShowJoinModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinClass} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === "vi" ? "Nhập Mã Tham Gia Lớp (Join Code)" : "Enter Class Join Code"}
                </label>
                <input
                  type="text"
                  required
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="VD: IELTS-WR-4A7F hoặc TOEIC-WR-SNDK"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono font-extrabold text-sm uppercase outline-none focus:border-indigo-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === "vi"
                    ? "Mã lớp được giáo viên cung cấp (VD: IELTS-WR-4A7F, TOEIC-WR-SNDK)."
                    : "Ask your teacher for the class join code."}
                </p>
              </div>

              {joinMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{joinMsg}</span>
                </div>
              )}

              {joinErr && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl font-bold flex items-center gap-2">
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{joinErr}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowJoinModal(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold">
                  {language === "vi" ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isJoining || !joinCodeInput}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
                >
                  <span>{language === "vi" ? "Tham gia Lớp" : "Join Class"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BEGINNER QUICK START GUIDE MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t("quickStartTitle")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("quickStartSubtitle")}</p>
              </div>
              <button onClick={() => setShowGuideModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-1">
                <h4 className="font-bold text-indigo-900 text-sm">{t("step1Title")}</h4>
                <p className="text-slate-600 leading-relaxed">{t("step1Desc")}</p>
              </div>

              <div className="bg-cyan-50/60 border border-cyan-100 rounded-2xl p-4 space-y-1">
                <h4 className="font-bold text-cyan-900 text-sm">{t("step2Title")}</h4>
                <p className="text-slate-600 leading-relaxed">{t("step2Desc")}</p>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 space-y-1">
                <h4 className="font-bold text-emerald-900 text-sm">{t("step3Title")}</h4>
                <p className="text-slate-600 leading-relaxed">{t("step3Desc")}</p>
              </div>

              <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 space-y-1">
                <h4 className="font-bold text-amber-900 text-sm">{t("step4Title")}</h4>
                <p className="text-slate-600 leading-relaxed">{t("step4Desc")}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowGuideModal(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-indigo-200"
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
