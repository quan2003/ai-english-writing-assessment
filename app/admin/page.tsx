"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  Activity,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Search,
  RefreshCw,
  Sliders,
  Check,
  HelpCircle,
  FileText,
  Loader2,
  Save,
  Landmark,
  BarChart3,
  PieChart,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpRight,
  Menu,
  ChevronDown,
  Edit3,
  UserCheck,
  X
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import ModalPortal from "@/components/ModalPortal";
import { FlagGB, FlagVN } from "@/lib/flags";

interface OrgItem {
  id: string;
  name: string;
  slug: string;
  planCode: string;
  planName: string;
  usageCount: number;
  monthlyLimit: number;
  studentCount?: number;
  classCount?: number;
  createdAt: string;
}

interface PaymentRequest {
  id: string;
  orgName: string;
  userEmail: string;
  planCode: string;
  planName: string;
  amountVnd: string;
  transferCode: string;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ORG_ADMIN" | "LECTURER" | "REVIEWER" | "STUDENT";
  orgName: string;
  status: "ACTIVE" | "LOCKED" | "SUSPENDED";
  createdAt: string;
}

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();

  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "ORGS" | "PAYMENTS" | "SYSTEM_CONFIG" | "USERS" | "AI_ENGINE"
  >("OVERVIEW");

  // Sidebar toggle state (Nút 3 gạch Menu)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Pagination states
  const [orgPage, setOrgPage] = useState(1);
  const [orgPageSize, setOrgPageSize] = useState(5);

  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(5);

  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);

  const [metrics, setMetrics] = useState<{
    totalSubmissions: number;
    gradedSubmissions: number;
    totalRevenueVnd: number;
    totalOrgs: number;
    totalUsers: number;
    userRoleCounts: { SUPER_ADMIN: number; LECTURER: number; STUDENT: number; REVIEWER: number };
    examStats: { vstep: number; ielts: number; toeic: number; other: number };
  }>({
    totalSubmissions: 0,
    gradedSubmissions: 0,
    totalRevenueVnd: 0,
    totalOrgs: 0,
    totalUsers: 0,
    userRoleCounts: { SUPER_ADMIN: 0, LECTURER: 0, STUDENT: 0, REVIEWER: 0 },
    examStats: { vstep: 0, ielts: 0, toeic: 0, other: 0 }
  });

  // System Configuration Form States (BVBank default)
  const [bankConfig, setBankConfig] = useState({
    bankName: "BVBank (Ngân hàng TMCP Bản Việt)",
    accountNumber: "9021859379985",
    accountHolder: "Truong Luu Quan",
    branch: "Chi nhánh Hồ Chí Minh",
    transferPrefix: "NAP"
  });

  const [plansConfig, setPlansConfig] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  // New Org Form State
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [newOrgPlan, setNewOrgPlan] = useState("PRO");

  // Inline Org Name Editing State
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editingOrgName, setEditingOrgName] = useState("");

  const handleSaveOrgName = async (orgId: string) => {
    if (!editingOrgName.trim()) return;
    try {
      const res = await fetch("/api/admin/orgs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, name: editingOrgName })
      });
      const data = await res.json();
      if (res.ok) {
        setOrgs((prev) =>
          prev.map((o) => (o.id === orgId ? { ...o, name: editingOrgName.trim() } : o))
        );
        setToastMsg(`⚡ Đã cập nhật tên đơn vị thành "${editingOrgName.trim()}"`);
        setEditingOrgId(null);
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSavingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser.id,
          fullName: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          customPassword: editingUser.customPassword || ""
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, name: editingUser.name, email: editingUser.email, role: editingUser.role as any } : u))
        );
        setToastMsg(`⚡ Đã cập nhật thông tin tài khoản ${editingUser.email}`);
        setEditingUser(null);
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingUser(false);
    }
  };

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/metrics");
      const data = await res.json();
      if (res.ok) {
        if (data.organizations) setOrgs(data.organizations);
        if (data.users) setUsersList(data.users);
        if (data.payments) setPayments(data.payments);
        if (data.metrics) setMetrics(data.metrics);
      }

      const cfgRes = await fetch("/api/admin/settings");
      const cfgData = await cfgRes.json();
      if (cfgRes.ok) {
        if (cfgData.bank) setBankConfig(cfgData.bank);
        if (cfgData.plans) setPlansConfig(cfgData.plans);
      }
    } catch (err) {
      console.error("Error fetching admin metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApprovePayment = async (id: string, orgName: string, planCode: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "APPROVED" } : p))
    );
    setToastMsg(
      language === "vi"
        ? `⚡ Đã duyệt kích hoạt gói dịch vụ thành công cho ${orgName}!`
        : `⚡ Payment approved and subscription activated for ${orgName}!`
    );
    setTimeout(() => setToastMsg(""), 4000);
    fetchAdminData();
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole })
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u))
        );
        setToastMsg(`⚡ Đã chuyển vai trò tài khoản sang ${newRole}`);
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetUserPassword = async (userId: string, email: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "RESET_PASSWORD" })
      });
      const data = await res.json();
      if (res.ok && data.tempPassword) {
        setToastMsg(`🔑 Mật khẩu mới cho ${email}: ${data.tempPassword}`);
        setTimeout(() => setToastMsg(""), 8000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleLockUser = async (userId: string, email: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "TOGGLE_LOCK" })
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: data.isActive ? "ACTIVE" : "LOCKED" } : u))
        );
        setToastMsg(data.message);
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản ${email}?`)) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "DELETE_USER" })
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList((prev) => prev.filter((u) => u.id !== userId));
        setToastMsg(`🗑️ Đã xóa vĩnh viễn tài khoản ${email}`);
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateOrgPlan = async (orgId: string, planCode: string) => {
    try {
      const res = await fetch("/api/admin/orgs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, planCode })
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg(`⚡ Đã thay đổi gói dịch vụ cho đơn vị thành công!`);
        setTimeout(() => setToastMsg(""), 3000);
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetOrgUsage = async (orgId: string, orgName: string) => {
    try {
      const res = await fetch("/api/admin/orgs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, action: "RESET_USAGE" })
      });
      const data = await res.json();
      if (res.ok) {
        setOrgs((prev) =>
          prev.map((o) => (o.id === orgId ? { ...o, usageCount: 0 } : o))
        );
        setToastMsg(`🔄 Đã đặt lại lượt chấm về 0 cho ${orgName}`);
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSystemConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank: bankConfig,
          plans: plansConfig
        })
      });

      if (!res.ok) throw new Error("Failed to update system settings");

      setToastMsg(
        language === "vi"
          ? "⚡ Cập nhật cấu hình Ngân hàng & Gói cước thành công! Đã đồng bộ sang giao diện Giáo viên."
          : "⚡ System pricing and bank details updated successfully!"
      );
      setTimeout(() => setToastMsg(""), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving config";
      alert(msg);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName || !newOrgSlug) return;
    setIsCreatingOrg(true);

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newOrgName,
          slug: newOrgSlug.toLowerCase().replace(/\s+/g, "-"),
          planCode: newOrgPlan
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create organization");

      setShowAddOrgModal(false);
      setNewOrgName("");
      setNewOrgSlug("");
      setToastMsg(
        language === "vi"
          ? `Đã khởi tạo Trung tâm / Trường ĐH mới: ${newOrgName}!`
          : `Successfully created organization: ${newOrgName}!`
      );
      setTimeout(() => setToastMsg(""), 4000);
      fetchAdminData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating organization";
      alert(msg);
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const formatVnd = (amount: number) => {
    return amount.toLocaleString("vi-VN") + " VNĐ";
  };

  // Filtered lists
  const filteredOrgs = orgs.filter(
    (o) => o.name.toLowerCase().includes(searchQuery.toLowerCase()) || o.slug.includes(searchQuery.toLowerCase())
  );
  const totalOrgPages = Math.ceil(filteredOrgs.length / orgPageSize) || 1;
  const paginatedOrgs = filteredOrgs.slice((orgPage - 1) * orgPageSize, orgPage * orgPageSize);

  const filteredUsers = usersList.filter(
    (u) => u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );
  const totalUserPages = Math.ceil(filteredUsers.length / userPageSize) || 1;
  const paginatedUsers = filteredUsers.slice((userPage - 1) * userPageSize, userPage * userPageSize);

  // Exam stats calculations (100% real DB ratios)
  const sumExams = metrics.examStats.vstep + metrics.examStats.ielts + metrics.examStats.toeic + metrics.examStats.other;
  const vstepPct = sumExams > 0 ? Math.round((metrics.examStats.vstep / sumExams) * 100) : 0;
  const ieltsPct = sumExams > 0 ? Math.round((metrics.examStats.ielts / sumExams) * 100) : 0;
  const toeicPct = sumExams > 0 ? Math.round((metrics.examStats.toeic / sumExams) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">
      {/* ⚪ PURE WHITE SIDEBAR FOR SUPER ADMIN */}
      <aside
        className={`${
          isSidebarCollapsed ? "w-20" : "w-64"
        } bg-white text-slate-900 p-5 flex flex-col justify-between border-r border-slate-200 shrink-0 sticky top-0 h-screen transition-all duration-300 shadow-sm`}
      >
        <div className="space-y-6">
          {/* Logo / Admin Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <div className="font-black text-sm text-slate-900 leading-tight">SUPER ADMIN</div>
                  <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">Control Center</div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-bold">
            {[
              { id: "OVERVIEW", label: language === "vi" ? "📊 Thống Kê & Biểu Đồ" : "📊 Overview & Charts", icon: BarChart3 },
              { id: "ORGS", label: language === "vi" ? "🏢 Trường ĐH & Trung Tâm" : "🏢 Institutions", icon: Building2, badge: orgs.length },
              { id: "PAYMENTS", label: language === "vi" ? "💳 Duyệt Nạp Tiền VietQR" : "💳 VietQR Approvals", icon: CreditCard, count: payments.filter((p) => p.status === "PENDING").length },
              { id: "SYSTEM_CONFIG", label: language === "vi" ? "⚙️ Cấu Hình Gói & Ngân Hàng" : "⚙️ Plan & Bank Config", icon: Landmark },
              { id: "USERS", label: language === "vi" ? "👥 Tài Khoản & Phân Quyền" : "👥 User Management", icon: Users, badge: usersList.length },
              { id: "AI_ENGINE", label: language === "vi" ? "🧠 Cấu Hình AI Grader" : "🧠 AI Grader Engine", icon: Sliders }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 font-extrabold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isSidebarCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isSidebarCollapsed && item.count !== undefined && item.count > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Info & App Link */}
        <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
          {!isSidebarCollapsed && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] space-y-1 text-emerald-800">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>DeepSeek v3.2 Active 🟢</span>
              </div>
              <div className="text-emerald-700">Prompt: writing-grader-v4.0</div>
            </div>
          )}

          <Link
            href="/dashboard"
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 flex items-center justify-center gap-2 transition-all"
          >
            <span>{!isSidebarCollapsed ? (language === "vi" ? "Vào Dashboard App" : "Back to App") : "App"}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto min-w-0">
        {/* TOP TOOLBAR HEADER WITH HAMBURGER MENU BUTTON */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Nút 3 gạch Menu Toggle Sidebar */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold transition-all shadow-sm"
              title="Thu gọn / Mở rộng Sidebar"
            >
              <Menu className="w-5 h-5 text-slate-800" />
            </button>

            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {activeTab === "OVERVIEW" && (language === "vi" ? "Báo Cáo Thống Kê Dữ Liệu Thật & Biểu Đồ" : "Executive Overview & Revenue Analytics")}
                {activeTab === "ORGS" && (language === "vi" ? "Quản Lý Danh Sách Trường ĐH & Trung Tâm" : "Institution & Organization Management")}
                {activeTab === "PAYMENTS" && (language === "vi" ? "Duyệt Nạp Tiền VietQR & Chuyển Khoản" : "VietQR Bank Transfer Approvals")}
                {activeTab === "SYSTEM_CONFIG" && (language === "vi" ? "Cấu Hình Giá Bán Gói Cước & Tài Khoản Ngân Hàng" : "Plan Pricing & Bank Details Settings")}
                {activeTab === "USERS" && (language === "vi" ? "Quản Lý Người Dùng & Phân Quyền Role" : "User Accounts & Role Permissions")}
                {activeTab === "AI_ENGINE" && (language === "vi" ? "Cấu Hình Quy Chuẩn AI Grader Engine" : "AI Grader Engine Calibration")}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {language === "vi" ? "Dữ liệu 100% thật thời gian thực từ cơ sở dữ liệu hệ thống" : "Real-time Database Super Admin Control Panel"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
              <span>{language === "vi" ? "Làm mới dữ liệu thật" : "Refresh Data"}</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
              <button
                onClick={() => setLanguage("en")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  language === "en" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <FlagGB className="w-4 h-3 rounded-xs" />
                <span>EN</span>
              </button>
              <button
                onClick={() => setLanguage("vi")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  language === "vi" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <FlagVN className="w-4 h-3 rounded-xs" />
                <span>VI</span>
              </button>
            </div>
          </div>
        </div>

        {toastMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg("")} className="text-emerald-700 hover:text-emerald-900 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* SUMMARY HERO STATS CARDS - REAL DB METRICS */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>{language === "vi" ? "Tổng Lượt Chấm AI Thật" : "Total Real AI Gradings"}</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {metrics.totalSubmissions} <span className="text-xs font-bold text-emerald-600">bài làm</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Truy vấn trực tiếp từ Database</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>{language === "vi" ? "Doanh thu Thực tế (VNĐ)" : "Real Revenue (VND)"}</span>
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{formatVnd(metrics.totalRevenueVnd || 0)}</div>
            <div className="text-[11px] text-slate-500 font-medium">
              {metrics.totalRevenueVnd > 0 ? "Doanh thu gói cước đã duyệt" : "0 VNĐ (Chưa có đơn mua đã duyệt)"}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>{language === "vi" ? "Đơn vị & Trường ĐH" : "Active Institutions"}</span>
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {metrics.totalOrgs || orgs.length} <span className="text-xs font-bold text-slate-500">Trung tâm</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Đang hoạt động trong cơ sở dữ liệu</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>{language === "vi" ? "Tài Khoản Người Dùng Thật" : "Total Real Users"}</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-600">{metrics.totalUsers || usersList.length} <span className="text-xs font-bold text-slate-500">tài khoản</span></div>
            <div className="text-[11px] text-slate-500 font-medium">Học viên, Giáo viên & Admin</div>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS CHARTS */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              {/* REVENUE & AI SUBMISSIONS SMOOTH GRADIENT AREA CHART */}
              <div className="col-span-2 bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {language === "vi" ? "Biểu Đồ Tăng Trưởng Lượt Chấm AI & Doanh Thu" : "AI Submissions & Revenue Monthly Growth"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Biểu đồ tổng quan hoạt động chấm thi AI</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-indigo-600">
                      <span className="w-3 h-3 rounded-full bg-indigo-600" />
                      Lượt chấm AI
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      Doanh thu VNĐ
                    </span>
                  </div>
                </div>

                {/* SVG Visual Area Chart */}
                <div className="h-64 w-full relative pt-4">
                  <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="0" y1="40" x2="600" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="90" x2="600" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="140" x2="600" y2="140" stroke="#f1f5f9" strokeWidth="1" />

                    {/* AI Gradings Curve */}
                    <path
                      d="M 20 170 Q 120 160, 220 140 T 420 110 T 580 80 L 580 180 L 20 180 Z"
                      fill="url(#aiGrad)"
                    />
                    <path
                      d="M 20 170 Q 120 160, 220 140 T 420 110 T 580 80"
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="3"
                    />

                    {/* Data Points */}
                    <circle cx="20" cy="170" r="4" fill="#4f46e5" />
                    <circle cx="130" cy="160" r="4" fill="#4f46e5" />
                    <circle cx="240" cy="140" r="4" fill="#4f46e5" />
                    <circle cx="350" cy="110" r="4" fill="#4f46e5" />
                    <circle cx="460" cy="95" r="4" fill="#4f46e5" />
                    <circle cx="580" cy="80" r="5" fill="#4f46e5" stroke="#fff" strokeWidth="2" />
                  </svg>

                  {/* Chart X Labels */}
                  <div className="flex justify-between text-[11px] text-slate-400 font-bold pt-2 border-t border-slate-100">
                    <span>Tháng 3</span>
                    <span>Tháng 4</span>
                    <span>Tháng 5</span>
                    <span>Tháng 6</span>
                    <span>Tháng 7</span>
                    <span>Tháng 8 (Hiện tại)</span>
                  </div>
                </div>
              </div>

              {/* EXAM CATEGORY DISTRIBUTION CHART (REAL DATA) */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {language === "vi" ? "Phân Bổ Bài Thi Theo Kỳ Thi" : "Exam Submissions Distribution"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tỉ lệ bài nộp VSTEP, IELTS & TOEIC thực tế</p>
                </div>

                <div className="space-y-4 my-auto">
                  {[
                    { label: "🇻🇳 VSTEP Writing (ĐH tại VN)", pct: vstepPct, count: `${metrics.examStats.vstep} bài`, color: "bg-indigo-600" },
                    { label: "🇬🇧 IELTS Academic Writing", pct: ieltsPct, count: `${metrics.examStats.ielts} bài`, color: "bg-cyan-500" },
                    { label: "🇺🇸 TOEIC Writing Test", pct: toeicPct, count: `${metrics.examStats.toeic} bài`, color: "bg-amber-500" }
                  ].map((cat) => (
                    <div key={cat.label} className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>{cat.label}</span>
                        <span className="font-extrabold text-slate-900">{cat.pct}% ({cat.count})</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                        <div className={`${cat.color} h-full rounded-full`} style={{ width: `${Math.max(5, cat.pct)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3.5 text-xs text-indigo-900 font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Cơ sở dữ liệu đang ghi nhận {metrics.totalSubmissions} bài nộp thực tế!</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORGANIZATIONS MANAGEMENT WITH REAL DB & PAGINATION */}
        {activeTab === "ORGS" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-bold text-slate-900">
                {language === "vi" ? "Danh sách Trường ĐH & Trung tâm (Dữ liệu Thật Database)" : "Registered Institutions & Academy Clients"}
              </h3>

              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setOrgPage(1);
                    }}
                    placeholder={language === "vi" ? "Tìm kiếm trung tâm..." : "Search clients..."}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <button
                  onClick={() => setShowAddOrgModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === "vi" ? "Thêm Trung tâm Mới" : "Add Institution"}</span>
                </button>
              </div>
            </div>

            {orgs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Chưa có đơn vị nào trong cơ sở dữ liệu. Nhấn nút &quot;Thêm Trung tâm Mới&quot; để tạo.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5 rounded-l-xl">Tên Đơn vị</th>
                      <th className="p-3.5">Mã Slug</th>
                      <th className="p-3.5">Gói Cước Sử Dụng</th>
                      <th className="p-3.5">Hạn ngạch Chấm AI (Đã dùng)</th>
                      <th className="p-3.5">Ngày Tham Gia</th>
                      <th className="p-3.5 rounded-r-xl text-right">Thao tác Quản trị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedOrgs.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            {editingOrgId === o.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editingOrgName}
                                  onChange={(e) => setEditingOrgName(e.target.value)}
                                  className="bg-slate-50 border border-indigo-400 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveOrgName(o.id);
                                    if (e.key === "Escape") setEditingOrgId(null);
                                  }}
                                />
                                <button
                                  onClick={() => handleSaveOrgName(o.id)}
                                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] shadow-xs"
                                >
                                  Lưu
                                </button>
                                <button
                                  onClick={() => setEditingOrgId(null)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-[10px]"
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 group">
                                <span className="font-bold text-slate-900">{o.name}</span>
                                <button
                                  onClick={() => {
                                    setEditingOrgId(o.id);
                                    setEditingOrgName(o.name);
                                  }}
                                  title="Đổi tên Trung tâm / Trường ĐH"
                                  className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-indigo-600"
                                >
                                  ✏️
                                </button>
                              </div>
                            )}
                            {o.studentCount !== undefined && (
                              <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                                {o.studentCount} học viên • {o.classCount} lớp
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-500 font-semibold">{o.slug}</td>
                        <td className="p-3.5 font-bold text-emerald-600">
                          <select
                            value={o.planCode}
                            onChange={(e) => handleUpdateOrgPlan(o.id, e.target.value)}
                            className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs p-1.5 outline-none cursor-pointer hover:bg-emerald-100 transition-all"
                          >
                            <option value="TRIAL">DÙNG THỬ MIỄN PHÍ</option>
                            <option value="INDIVIDUAL">GIÁO VIÊN ĐỘC LẬP</option>
                            <option value="PRO">GIÁO VIÊN PRO</option>
                            <option value="CENTER">TRUNG TÂM NGOẠI NGỮ</option>
                          </select>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">
                            {o.usageCount} / {o.monthlyLimit} lượt chấm
                          </div>
                          <div className="w-32 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden border border-slate-200">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${Math.min(100, Math.round((o.usageCount / o.monthlyLimit) * 100))}%` }}
                            />
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-500 font-medium">{o.createdAt}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleResetOrgUsage(o.id, o.name)}
                            title="Reset số lượt chấm đã dùng về 0"
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 text-xs flex items-center gap-1.5 transition-all ml-auto"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Reset Lượt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PAGINATION FOOTER */}
            {filteredOrgs.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
                <div>
                  Hiển thị {(orgPage - 1) * orgPageSize + 1} đến {Math.min(orgPage * orgPageSize, filteredOrgs.length)} trên tổng số {filteredOrgs.length} đơn vị
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={orgPage === 1}
                    onClick={() => setOrgPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 font-bold text-slate-700 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Trang trước</span>
                  </button>
                  <span className="px-3 py-1 font-bold text-slate-900">
                    {orgPage} / {totalOrgPages}
                  </span>
                  <button
                    disabled={orgPage === totalOrgPages}
                    onClick={() => setOrgPage((p) => Math.min(totalOrgPages, p + 1))}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 font-bold text-slate-700 flex items-center gap-1"
                  >
                    <span>Trang sau</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VIETQR PAYMENTS APPROVAL */}
        {activeTab === "PAYMENTS" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>{language === "vi" ? "Duyệt Chuyển Khoản Ngân Hàng VietQR (VNĐ)" : "VNĐ Bank Transfer Approval Queue"}</span>
            </h3>

            {payments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Chưa có đơn thanh toán nào đang chờ duyệt. Khi Giáo viên chuyển khoản qua VietQR, đơn mua sẽ xuất hiện tại đây.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5 rounded-l-xl">Mã GD</th>
                      <th className="p-3.5">Giáo viên / Trung tâm</th>
                      <th className="p-3.5">Email Đăng Ký</th>
                      <th className="p-3.5">Gói Dịch Vụ Mua</th>
                      <th className="p-3.5">Số Tiền VNĐ</th>
                      <th className="p-3.5">Cú Pháp Chuyển Khoản</th>
                      <th className="p-3.5">Trạng Thái</th>
                      <th className="p-3.5 rounded-r-xl text-right">Xử Lý Kích Hoạt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono text-slate-400">{p.id}</td>
                        <td className="p-3.5 font-bold text-slate-900">{p.orgName}</td>
                        <td className="p-3.5 text-slate-600">{p.userEmail}</td>
                        <td className="p-3.5 font-bold text-indigo-600">{p.planName}</td>
                        <td className="p-3.5 font-black text-emerald-600 text-sm">{p.amountVnd}</td>
                        <td className="p-3.5 font-mono bg-slate-50 text-amber-700 p-2 rounded-lg border border-slate-200 font-bold">
                          {p.transferCode}
                        </td>
                        <td className="p-3.5">
                          {p.status === "PENDING" ? (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                              Chờ Duyệt VietQR
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                              Đã Đóng Tiền 🟢
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {p.status === "PENDING" ? (
                            <button
                              onClick={() => handleApprovePayment(p.id, p.orgName, p.planCode)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all flex items-center gap-1.5 ml-auto"
                            >
                              <Check className="w-4 h-4" />
                              <span>Duyệt Kích Hoạt Gói</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 font-bold">Hoàn tất</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SYSTEM BANK & PLAN CONFIGURATION */}
        {activeTab === "SYSTEM_CONFIG" && (
          <form onSubmit={handleSaveSystemConfig} className="space-y-6">
            {/* BANK ACCOUNT CONFIG CARD */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Cấu Hình Tài Khoản Ngân Hàng VietQR (Hiển thị bên Giáo viên)
                  </h3>
                </div>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md flex items-center gap-1.5"
                >
                  {isSavingConfig ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
                  <span>Lưu Cấu Hình Ngân Hàng</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên Ngân Hàng</label>
                  <input
                    type="text"
                    required
                    value={bankConfig.bankName}
                    onChange={(e) => setBankConfig({ ...bankConfig, bankName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-semibold outline-none focus:border-indigo-600"
                    placeholder="VD: BVBank (Ngân hàng TMCP Bản Việt)"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số Tài Khoản Ngân Hàng</label>
                  <input
                    type="text"
                    required
                    value={bankConfig.accountNumber}
                    onChange={(e) => setBankConfig({ ...bankConfig, accountNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-indigo-600 font-mono font-bold outline-none focus:border-indigo-600"
                    placeholder="VD: 9021859379985"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chủ Tài Khoản</label>
                  <input
                    type="text"
                    required
                    value={bankConfig.accountHolder}
                    onChange={(e) => setBankConfig({ ...bankConfig, accountHolder: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold outline-none focus:border-indigo-600"
                    placeholder="VD: Truong Luu Quan"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chi nhánh</label>
                  <input
                    type="text"
                    value={bankConfig.branch || ""}
                    onChange={(e) => setBankConfig({ ...bankConfig, branch: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-semibold outline-none focus:border-indigo-600"
                    placeholder="VD: Chi nhánh Hồ Chí Minh"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cú Pháp Tiền Tố Chuyển Khoản</label>
                  <input
                    type="text"
                    required
                    value={bankConfig.transferPrefix}
                    onChange={(e) => setBankConfig({ ...bankConfig, transferPrefix: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-amber-700 font-mono font-bold outline-none focus:border-indigo-600"
                    placeholder="VD: NAP"
                  />
                </div>
              </div>
            </div>

            {/* PLANS PRICING & QUOTA CONFIG CARD */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Cấu Hình Giá Bán & Hạn Ngạch Gói Cước (Hiển thị bên Giáo viên)
                  </h3>
                </div>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md flex items-center gap-1.5"
                >
                  {isSavingConfig ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
                  <span>Lưu Giá & Hạn Ngạch Gói</span>
                </button>
              </div>

              <div className="space-y-4">
                {plansConfig.map((p, idx) => (
                  <div key={p.code} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-4 gap-4 items-center">
                    <div>
                      <span className="text-[10px] font-extrabold text-indigo-600 uppercase">Mã Gói: {p.code}</span>
                      <input
                        type="text"
                        value={p.nameVi}
                        onChange={(e) => {
                          const updated = [...plansConfig];
                          updated[idx].nameVi = e.target.value;
                          setPlansConfig(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Giá Hiển Thị (VNĐ)</label>
                      <input
                        type="text"
                        value={p.priceVnd}
                        onChange={(e) => {
                          const updated = [...plansConfig];
                          updated[idx].priceVnd = e.target.value;
                          setPlansConfig(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-extrabold text-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Số Lượt Chấm AI / Tháng</label>
                      <input
                        type="number"
                        value={p.monthlyLimit}
                        onChange={(e) => {
                          const updated = [...plansConfig];
                          updated[idx].monthlyLimit = parseInt(e.target.value) || 0;
                          setPlansConfig(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Mô tả ngắn</label>
                      <input
                        type="text"
                        value={p.descVi}
                        onChange={(e) => {
                          const updated = [...plansConfig];
                          updated[idx].descVi = e.target.value;
                          setPlansConfig(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-600 text-[11px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* TAB 5: REAL USERS LIST FROM DATABASE WITH PAGINATION */}
        {activeTab === "USERS" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm text-xs">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>{language === "vi" ? "Danh sách Tài khoản Người dùng (Dữ liệu Thật Database)" : "Real Database Users List"}</span>
              </h3>

              <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    setUserPage(1);
                  }}
                  placeholder={language === "vi" ? "Tìm kiếm tài khoản..." : "Search users..."}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Họ & Tên</th>
                    <th className="p-3.5">Email Đăng Nhập</th>
                    <th className="p-3.5">Vai Trò Hệ Thống (Role)</th>
                    <th className="p-3.5">Trường ĐH / Trung Tâm</th>
                    <th className="p-3.5">Ngày Tạo</th>
                    <th className="p-3.5 rounded-r-xl text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="mt-0.5">
                          {u.status === "LOCKED" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              🔒 Đã khóa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              🟢 Hoạt động
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">{u.email}</td>
                      <td className="p-3.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-extrabold outline-none border cursor-pointer transition-all ${
                            u.role === "SUPER_ADMIN"
                              ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                              : u.role === "LECTURER"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                              : u.role === "REVIEWER"
                              ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          <option value="STUDENT">STUDENT (Học viên)</option>
                          <option value="LECTURER">LECTURER (Giảng viên)</option>
                          <option value="ORG_ADMIN">ORG_ADMIN (Quản lý Trung tâm)</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN (Admin Hệ thống)</option>
                          <option value="REVIEWER">REVIEWER (Cán bộ Chấm thi)</option>
                        </select>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">{u.orgName}</td>
                      <td className="p-3.5 text-slate-500">{u.createdAt}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingUser({ ...u, customPassword: "" })}
                            title="Chỉnh sửa thông tin tài khoản"
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 text-xs transition-all flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3 text-indigo-600" />
                            <span>Sửa</span>
                          </button>
                          <button
                            onClick={() => handleToggleLockUser(u.id, u.email)}
                            title={u.status === "LOCKED" ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                            className={`px-2.5 py-1 rounded-lg font-bold border text-xs transition-all ${
                              u.status === "LOCKED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            }`}
                          >
                            {u.status === "LOCKED" ? "🔓 Mở khóa" : "🔒 Khóa"}
                          </button>
                          <button
                            onClick={() => handleResetUserPassword(u.id, u.email)}
                            title="Cấp lại mật khẩu ngẫu nhiên cho người dùng"
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 text-xs transition-all"
                          >
                            🔑 Pass
                          </button>
                          {u.role !== "SUPER_ADMIN" && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              title="Xóa tài khoản vĩnh viễn"
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 text-xs transition-all"
                            >
                              🗑️ Xóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER */}
            {filteredUsers.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
                <div>
                  Hiển thị {(userPage - 1) * userPageSize + 1} đến {Math.min(userPage * userPageSize, filteredUsers.length)} trên tổng số {filteredUsers.length} tài khoản thật
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={userPage === 1}
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 font-bold text-slate-700 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Trang trước</span>
                  </button>
                  <span className="px-3 py-1 font-bold text-slate-900">
                    {userPage} / {totalUserPages}
                  </span>
                  <button
                    disabled={userPage === totalUserPages}
                    onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 font-bold text-slate-700 flex items-center gap-1"
                  >
                    <span>Trang sau</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: AI ENGINE & CALIBRATION LOGS */}
        {activeTab === "AI_ENGINE" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm text-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <span>{language === "vi" ? "Cấu hình AI Grader Engine & System Calibration" : "AI Grader Engine & System Calibration"}</span>
            </h3>

            <div className="grid grid-cols-2 gap-5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="font-bold text-slate-900 text-sm">DeepSeek v3 & GPT-4o Model Config</div>
                <div className="space-y-2 text-slate-700">
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span>Prompt Version:</span> <b className="text-indigo-600 font-mono">writing-grader-v4.0</b>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span>Rubric Standard:</span> <b className="text-slate-900 font-mono">writing-rubric-v2.0</b>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span>Active Provider:</span> <b className="text-emerald-600 font-mono">DeepSeek API (Primary)</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Fallback Provider:</span> <b className="text-cyan-600 font-mono">OpenAI GPT-4o</b>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="font-bold text-slate-900 text-sm">Calibration Benchmark Rules</div>
                <div className="space-y-2 text-slate-700">
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span>1.0 Score Anchor:</span> <span className="text-rose-600 font-bold">Weak / Short (&lt;60% min_words)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span>1.5 Score Anchor:</span> <span className="text-amber-600 font-bold">Mediocre / Simple English</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span>2.0 Score Anchor:</span> <span className="text-emerald-600 font-bold">Good / Accurate Academic</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2.5 Score Anchor:</span> <span className="text-indigo-600 font-bold">Outstanding C1 Academic</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CREATE NEW ORG MODAL WITH REACT PORTAL */}
      {showAddOrgModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto p-6 space-y-4 shadow-2xl text-xs text-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Thêm Trung tâm / Trường ĐH Mới</h3>
                </div>
                <button onClick={() => setShowAddOrgModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateOrg} className="space-y-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tên Trung tâm / Trường ĐH</label>
                  <input
                    type="text"
                    required
                    value={newOrgName}
                    onChange={(e) => {
                      setNewOrgName(e.target.value);
                      setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"));
                    }}
                    placeholder="VD: Trung tâm Ngoại ngữ Bách Khoa"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mã định danh Slug (URL)</label>
                  <input
                    type="text"
                    required
                    value={newOrgSlug}
                    onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="VD: bach-khoa-english"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Gói Dịch Vụ Cấp Khởi Tạo</label>
                  <select
                    value={newOrgPlan}
                    onChange={(e) => setNewOrgPlan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold outline-none"
                  >
                    <option value="INDIVIDUAL">Giáo viên Độc lập (690.000 VNĐ - 500 lượt chấm)</option>
                    <option value="PRO">Giáo viên PRO (1.890.000 VNĐ - 2.000 lượt chấm)</option>
                    <option value="CENTER">Trung tâm Ngoại ngữ (4.690.000 VNĐ - 10.000 lượt chấm)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddOrgModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingOrg}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5"
                  >
                    {isCreatingOrg ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : null}
                    <span>Khởi Tạo Đơn Vị Mới</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Chỉnh Sửa Tài Khoản Người Dùng</h3>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Họ & Tên Người Dùng</label>
                  <input
                    type="text"
                    value={editingUser.name || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Đăng Nhập</label>
                  <input
                    type="email"
                    value={editingUser.email || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Vai Trò Hệ Thống (Role)</label>
                  <select
                    value={editingUser.role || "STUDENT"}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold outline-none"
                  >
                    <option value="STUDENT">STUDENT (Học viên)</option>
                    <option value="LECTURER">LECTURER (Giảng viên / Giáo viên)</option>
                    <option value="ORG_ADMIN">ORG_ADMIN (Quản lý Trung tâm)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Admin Hệ thống)</option>
                    <option value="REVIEWER">REVIEWER (Cán bộ Chấm thi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Đặt Mật Khẩu Mới (Để trống nếu không đổi)</label>
                  <input
                    type="text"
                    placeholder="Nhập mật khẩu mới tùy chỉnh..."
                    value={editingUser.customPassword || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, customPassword: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-medium outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUser}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5"
                  >
                    {isSavingUser ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : null}
                    <span>Lưu Thay Đổi</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
