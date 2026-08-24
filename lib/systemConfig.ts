import fs from "fs";
import path from "path";

export interface BankConfig {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  transferPrefix: string;
  branch?: string;
}

export interface PlanConfig {
  code: string;
  nameVi: string;
  nameEn: string;
  priceVnd: string;
  priceNumber: number;
  monthlyLimit: number;
  descVi: string;
  descEn: string;
  popular?: boolean;
}

export interface SystemConfig {
  bank: BankConfig;
  plans: PlanConfig[];
}

const CONFIG_FILE_PATH = path.join(process.cwd(), "system_config.json");

const DEFAULT_CONFIG: SystemConfig = {
  bank: {
    bankName: "BVBank (Ngân hàng TMCP Bản Việt)",
    accountNumber: "9021859379985",
    accountHolder: "Truong Luu Quan",
    transferPrefix: "NAP",
    branch: "Chi nhánh Hồ Chí Minh"
  },
  plans: [
    {
      code: "TRIAL",
      nameVi: "DÙNG THỬ MIỄN PHÍ",
      nameEn: "FREE TRIAL",
      priceVnd: "0 VNĐ",
      priceNumber: 0,
      monthlyLimit: 50,
      descVi: "Dành cho giáo viên mới trải nghiệm AI",
      descEn: "For new teachers testing AI practice",
      popular: false
    },
    {
      code: "INDIVIDUAL",
      nameVi: "GIÁO VIÊN ĐỘC LẬP",
      nameEn: "INDIVIDUAL TEACHER",
      priceVnd: "690.000 VNĐ",
      priceNumber: 690000,
      monthlyLimit: 500,
      descVi: "Dành cho giáo viên dạy tự do",
      descEn: "For independent exam prep tutors",
      popular: false
    },
    {
      code: "PRO",
      nameVi: "GIÁO VIÊN PRO",
      nameEn: "TEACHER PRO",
      priceVnd: "1.890.000 VNĐ",
      priceNumber: 1890000,
      monthlyLimit: 2000,
      descVi: "Dành cho giáo viên mở nhiều lớp",
      descEn: "For teachers running multiple classes",
      popular: true
    },
    {
      code: "CENTER",
      nameVi: "TRUNG TÂM NGOẠI NGỮ",
      nameEn: "LANGUAGE CENTER",
      priceVnd: "4.690.000 VNĐ",
      priceNumber: 4690000,
      monthlyLimit: 10000,
      descVi: "Dành cho trung tâm & học viện",
      descEn: "For language centers & academies",
      popular: false
    }
  ]
};

export function getSystemConfig(): SystemConfig {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error("Error reading system config:", err);
  }
  return DEFAULT_CONFIG;
}

export function saveSystemConfig(newConfig: Partial<SystemConfig>): SystemConfig {
  try {
    const currentConfig = getSystemConfig();
    const updated = {
      ...currentConfig,
      ...newConfig,
      bank: { ...currentConfig.bank, ...(newConfig.bank || {}) },
      plans: newConfig.plans || currentConfig.plans
    };
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  } catch (err) {
    console.error("Error saving system config:", err);
    return getSystemConfig();
  }
}
