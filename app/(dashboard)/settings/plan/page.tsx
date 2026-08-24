"use client";

import { useEffect, useState } from "react";
import { Check, AlertTriangle, Zap, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import ModalPortal from "@/components/ModalPortal";

export default function UsagePlanPage() {
  const { language } = useLanguage();
  const [activeOrg, setActiveOrg] = useState<any>(null);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [bankConfig, setBankConfig] = useState<any>({
    bankName: "BVBank (Ngân hàng TMCP Bản Việt)",
    accountNumber: "9021859379985",
    accountHolder: "Truong Luu Quan",
    branch: "Chi nhánh Hồ Chí Minh",
    transferPrefix: "NAP"
  });

  const [dynamicPlans, setDynamicPlans] = useState<any[]>([]);

  const fetchOrgData = () => {
    fetch("/api/organizations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setActiveOrg(data[0]);
        }
      })
      .catch(console.error);

    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((cfg) => {
        if (cfg.bank) setBankConfig(cfg.bank);
        if (cfg.plans) setDynamicPlans(cfg.plans);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchOrgData();
  }, []);

  const handleUpgradePlan = async (planCode: string) => {
    setUpgradingPlan(planCode);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/organizations/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upgrade subscription plan");
      }

      setSuccessMsg(
        language === "vi"
          ? `Nâng cấp thành công sang ${data.subscription?.plan?.name || planCode}! Hệ thống đã cập nhật lượt chấm AI.`
          : `Successfully upgraded to ${data.subscription?.plan?.name || planCode}!`
      );
      fetchOrgData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error upgrading plan";
      setErrorMsg(msg);
    } finally {
      setUpgradingPlan(null);
    }
  };

  const handleOpenPaymentModal = (plan: any) => {
    setSelectedPlanForPayment(plan);
    setShowPaymentModal(true);
  };

  const handleConfirmBankTransfer = async () => {
    if (!selectedPlanForPayment) return;
    setShowPaymentModal(false);
    await handleUpgradePlan(selectedPlanForPayment.code);
  };

  const usageCount = activeOrg?.subscription?.usageCount ?? 0;
  const currentPlanCode = activeOrg?.subscription?.plan?.code || "TRIAL";
  const matchedConfigPlan = dynamicPlans.find((p) => p.code === currentPlanCode);
  const monthlyLimit = matchedConfigPlan?.monthlyLimit ?? (currentPlanCode === "TRIAL" ? 5 : activeOrg?.subscription?.plan?.monthlyGradingLimit ?? 500);
  const currentPlanName = activeOrg?.subscription?.plan?.name || (language === "vi" ? "Gói Dùng Thử" : "Free Trial");
  const usagePercentage = Math.round((usageCount / monthlyLimit) * 100);

  const defaultPlansList = [
    { code: "TRIAL", nameVi: "DÙNG THỬ MIỄN PHÍ", nameEn: "FREE TRIAL", priceVnd: "0 VNĐ", monthlyLimit: 5, descVi: "Dành cho giáo viên mới trải nghiệm AI", descEn: "For new teachers testing AI practice", popular: false },
    { code: "INDIVIDUAL", nameVi: "GIÁO VIÊN ĐỘC LẬP", nameEn: "INDIVIDUAL TEACHER", priceVnd: "690.000 VNĐ", monthlyLimit: 100, descVi: "Dành cho giáo viên dạy tự do", descEn: "For independent exam prep tutors", popular: false },
    { code: "PRO", nameVi: "GIÁO VIÊN PRO", nameEn: "TEACHER PRO", priceVnd: "1.890.000 VNĐ", monthlyLimit: 2000, descVi: "Dành cho giáo viên mở nhiều lớp", descEn: "For teachers running multiple classes", popular: true },
    { code: "CENTER", nameVi: "TRUNG TÂM NGOẠI NGỮ", nameEn: "LANGUAGE CENTER", priceVnd: "4.690.000 VNĐ", monthlyLimit: 10000, descVi: "Dành cho trung tâm & học viện", descEn: "For language centers & academies", popular: false }
  ];

  const sourcePlans = dynamicPlans.length > 0 ? dynamicPlans : defaultPlansList;

  const plans = sourcePlans.map((p) => {
    const limitNum = p.monthlyLimit !== undefined ? p.monthlyLimit : (p.code === "TRIAL" ? 5 : p.code === "INDIVIDUAL" ? 100 : p.code === "PRO" ? 2000 : 10000);
    const limitStr = limitNum.toLocaleString("vi-VN");
    return {
      code: p.code,
      nameVi: p.nameVi || p.code,
      nameEn: p.nameEn || p.code,
      priceVi: p.priceVnd || "0 VNĐ",
      priceEn: p.priceVnd || "0 VND",
      descVi: p.descVi || "",
      descEn: p.descEn || "",
      featuresVi: [
        `${limitStr} lượt chấm AI / tháng`,
        p.code === "TRIAL" ? "1 Lớp học" : p.code === "INDIVIDUAL" ? "5 Lớp học" : "Không giới hạn Lớp học",
        p.code === "CENTER" ? "Quản lý nhiều Giáo viên" : "Đề thi VSTEP & IELTS"
      ],
      featuresEn: [
        `${limitStr} AI Gradings / month`,
        p.code === "TRIAL" ? "1 Class Group" : p.code === "INDIVIDUAL" ? "5 Classes" : "Unlimited Classes",
        p.code === "CENTER" ? "Multi-teacher Management" : "VSTEP & IELTS Prompts"
      ],
      popular: p.popular || false
    };
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {language === "vi" ? "Hạn ngạch Chấm AI & Gói dịch vụ" : "Teacher Quota Usage & Subscription Plan"}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {language === "vi"
            ? "Theo dõi hạn ngạch chấm bài AI hàng tháng, số lượt làm bài còn lại và các gói dịch vụ"
            : "Monitor monthly AI practice grading quota, remaining submissions, and billing options"}
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quota Usage Gauge Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {language === "vi" ? "Hạn ngạch Chấm AI Hàng Tháng" : "Monthly AI Practice Quota"}
            </span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {usageCount} <span className="text-sm font-normal text-slate-500">/ {monthlyLimit} {language === "vi" ? "lượt chấm" : "submissions"}</span>
            </div>
          </div>

          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{currentPlanName} • {language === "vi" ? "Đang hoạt động" : "Active"}</span>
          </span>
        </div>

        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
          <div
            className="bg-gradient-to-r from-indigo-600 to-cyan-500 h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, usagePercentage)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>{language === "vi" ? `Đã sử dụng: ${usagePercentage}%` : `Usage: ${usagePercentage}% consumed`}</span>
          <span>{language === "vi" ? "Hạn ngạch sẽ tự động làm mới vào ngày 1 hàng tháng" : "Quota resets on 1st of next month"}</span>
        </div>

        {usagePercentage >= 80 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>
              {language === "vi"
                ? `Cảnh báo: Bạn đã dùng ${usagePercentage}% hạn ngạch chấm AI tháng này.`
                : `Warning: You have consumed ${usagePercentage}% of your monthly AI practice quota.`}
            </span>
          </div>
        )}
      </div>

      {/* Teacher-First Subscription Plans Grid - VNĐ Pricing */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          {language === "vi" ? "Các Gói Dịch vụ Luyện thi Writing (Thanh toán VNĐ)" : "Teacher & Center Subscription Plans (VND Pricing)"}
        </h3>

        <div className="grid grid-cols-4 gap-4 text-xs items-stretch">
          {plans.map((p) => {
            const isCurrent = currentPlanCode === p.code || (currentPlanCode === "FREE_TRIAL" && p.code === "TRIAL");
            const isUpgrading = upgradingPlan === p.code;

            return (
              <div
                key={p.code}
                className={`bg-white border rounded-3xl p-5 flex flex-col justify-between relative transition-all shadow-sm ${
                  p.popular
                    ? "border-2 border-indigo-600 shadow-md ring-4 ring-indigo-50"
                    : isCurrent
                    ? "border-2 border-emerald-500"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Header Badge */}
                <div className="min-h-[22px] flex items-center justify-between mb-2">
                  {p.popular ? (
                    <span className="bg-indigo-600 text-white font-bold text-[9px] uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                      {language === "vi" ? "PHỔ BIẾN NHẤT" : "MOST POPULAR"}
                    </span>
                  ) : (
                    <span />
                  )}

                  {isCurrent && (
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase px-2 py-0.5 rounded-full">
                      {language === "vi" ? "ĐANG DÙNG" : "CURRENT"}
                    </span>
                  )}
                </div>

                <div className="space-y-3 flex-1">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                      {language === "vi" ? p.nameVi : p.nameEn}
                    </span>
                    <h4 className="text-lg font-extrabold text-slate-900 mt-1">
                      {language === "vi" ? p.priceVi : p.priceEn} <span className="text-xs font-normal text-slate-500">/ {language === "vi" ? "tháng" : "month"}</span>
                    </h4>
                    <p className="text-slate-500 text-[11px] mt-1 font-medium min-h-[32px]">
                      {language === "vi" ? p.descVi : p.descEn}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <ul className="space-y-2 text-slate-600 font-medium">
                      {(language === "vi" ? p.featuresVi : p.featuresEn).map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-[11px]">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Subscription Action Button */}
                <div className="pt-5 mt-4 border-t border-slate-100">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center gap-1.5 cursor-default"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{language === "vi" ? "Đang sử dụng" : "Active Plan"}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenPaymentModal(p)}
                      disabled={isUpgrading}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                        p.popular
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                          : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200"
                      }`}
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>{language === "vi" ? "Đang nâng cấp..." : "Upgrading..."}</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                          <span>{language === "vi" ? "Nâng cấp ngay" : "Upgrade Now"}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VIETQR BANK TRANSFER MODAL - 2-COLUMN NO SCROLL DESIGN WITH REACT PORTAL */}
      {showPaymentModal && selectedPlanForPayment && (
        <ModalPortal>
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 space-y-4 shadow-2xl text-xs">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Zap className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                      {language === "vi" ? "Thanh Toán VietQR & Chuyển Khoản" : "VietQR & Bank Transfer Payment"}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {language === "vi" ? `Nâng cấp gói ${selectedPlanForPayment.nameVi}` : `Upgrade to ${selectedPlanForPayment.nameEn}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 font-bold flex items-center justify-center transition-all"
                >
                  ✕
                </button>
              </div>

              {/* 2-Column Content Grid */}
              <div className="grid grid-cols-2 gap-5 items-center bg-slate-50 border border-slate-200 rounded-2xl p-4">
                {/* LEFT COLUMN: OFFICIAL VIETQR SCAN CODE */}
                {(() => {
                  const cleanSlug = (activeOrg?.slug || "quan-9788").replace(/tr--ng-l-u-qu-n-9788/g, "quan-9788").replace(/--+/g, "-");
                  const transferMemo = `${bankConfig.transferPrefix || "NAP"} ${selectedPlanForPayment.code} ${cleanSlug}`;
                  const amount = selectedPlanForPayment.code === "INDIVIDUAL" ? 690000 : selectedPlanForPayment.code === "PRO" ? 1890000 : 4690000;
                  const qrUrl = `https://img.vietqr.io/image/970454-${bankConfig.accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(bankConfig.accountHolder)}`;

                  return (
                    <div className="flex flex-col items-center justify-center space-y-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="w-44 h-44 relative bg-slate-50 p-1 rounded-xl border border-slate-100 flex items-center justify-center">
                        <img
                          src={qrUrl}
                          alt="VietQR Scan Code"
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://img.vietqr.io/image/vietcapitalbank-${bankConfig.accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(bankConfig.accountHolder)}`;
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-indigo-700 font-bold text-center bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                        📱 Mở App Banking quét mã QR
                      </span>
                    </div>
                  );
                })()}

                {/* RIGHT COLUMN: BANK DETAILS & TRANSFER MEMO */}
                <div className="space-y-3">
                  <div className="bg-indigo-600 text-white rounded-xl p-3 text-center shadow-sm">
                    <div className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">Số tiền cần thanh toán</div>
                    <div className="text-xl font-black text-white mt-0.5">
                      {language === "vi" ? selectedPlanForPayment.priceVi : selectedPlanForPayment.priceEn}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 text-[11px] text-slate-700">
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-400 font-medium">Ngân hàng:</span>
                      <span className="font-bold text-slate-900 text-right">{bankConfig.bankName}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                      <span className="text-slate-400 font-medium">Số tài khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-indigo-600 font-mono text-xs">{bankConfig.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(bankConfig.accountNumber);
                            setSuccessMsg("Đã sao chép Số tài khoản!");
                            setTimeout(() => setSuccessMsg(""), 3000);
                          }}
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-400 font-medium">Chủ tài khoản:</span>
                      <span className="font-bold text-slate-900 uppercase text-right">{bankConfig.accountHolder}</span>
                    </div>

                    {bankConfig.branch && (
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-400 font-medium">Chi nhánh:</span>
                        <span className="font-bold text-slate-700">{bankConfig.branch}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-0.5">
                      <span className="text-slate-400 font-medium">Cú pháp CK:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                          {bankConfig.transferPrefix || "NAP"} {selectedPlanForPayment.code} {(activeOrg?.slug || "quan-9788").replace(/tr--ng-l-u-qu-n-9788/g, "quan-9788")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const memo = `${bankConfig.transferPrefix || "NAP"} ${selectedPlanForPayment.code} ${(activeOrg?.slug || "quan-9788").replace(/tr--ng-l-u-qu-n-9788/g, "quan-9788")}`;
                            navigator.clipboard.writeText(memo);
                            setSuccessMsg("Đã sao chép Cú pháp chuyển khoản!");
                            setTimeout(() => setSuccessMsg(""), 3000);
                          }}
                          className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
                >
                  {language === "vi" ? "Hủy" : "Cancel"}
                </button>
                <button
                  onClick={handleConfirmBankTransfer}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>{language === "vi" ? "⚡ Tôi đã Chuyển Khoản Thành Công" : "Confirm Payment"}</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
