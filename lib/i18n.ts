export type Language = "en" | "vi";

export const translations = {
  en: {
    // Header & Brand
    appTitle: "AI Writing Assessment & Practice Platform",
    appSubtitle: "VSTEP • IELTS • TOEIC Writing",
    appDescription: "For Lecturers, Language Centers, and English Learners",
    institutionalSignIn: "Sign In",
    academicUsers: "Exam Prep Workspace",
    emailLabel: "Email Address",
    passwordLabel: "Password",
    signInBtn: "Sign In",
    quickDemoTitle: "Role Selection",
    deanRole: "Center Admin",
    lecturerRole: "Teacher / Lecturer",
    studentRole: "Student",
    signOut: "Sign Out",
    
    // Teacher Sidebar Sections
    overview: "OVERVIEW",
    dashboard: "Dashboard",
    teachingSection: "TEACHING",
    classes: "Classes",
    assignments: "Assignments",
    questionBank: "Question Bank",
    
    gradingSection: "GRADING",
    submissionsQueue: "Submissions Queue",
    reviewQueueStudio: "Review Queue Studio",
    releasedResults: "Results & Released Feedback",
    
    progressSection: "PROGRESS",
    studentsRoster: "Students",
    classAnalytics: "Class Analytics",
    progressReports: "Progress Reports",
    
    accountSection: "ACCOUNT",
    usagePlan: "Usage & Plan",
    settings: "Settings",
    auditLogs: "Audit Logs",
    superAdminOperator: "Platform Operator",
    systemTelemetry: "System Telemetry & Health",
    
    // Student Sidebar
    studentPortal: "STUDENT PRACTICE",
    submitWriting: "Practice Essay Task",
    myReleasedResults: "My Results & Rewrites",
    myProgress: "My Score Progress",
    joinClass: "Join Class with Code",
    monthlyQuota: "Monthly AI Practice Quota",

    // Beginner Guide
    quickStartTitle: "Quick Start Guide for Teachers & Students",
    quickStartSubtitle: "Follow these simple steps to prepare for VSTEP, IELTS, and TOEIC Writing exams",
    step1Title: "1. Create Class & Share Code",
    step1Desc: "Teacher creates a class (e.g. IELTS 6.5+) and shares unique join code (e.g. IELTS-WR-4A7F) with students.",
    step2Title: "2. Student Essay Practice",
    step2Desc: "Students write essays with live word count, timer, and autosave draft protection.",
    step3Title: "3. AI Assessment & Evidence",
    step3Desc: "Frozen engine evaluates Task, Organization, Vocabulary, and Grammar with verified evidence excerpts.",
    step4Title: "4. Teacher Review & Rewrite Attempts",
    step4Desc: "Teacher reviews scores, adds comments, or requests rewrites to track attempt-over-attempt progress.",
    gotItBtn: "Got it! Start Exploring",

    // Dashboard
    overviewAnalytics: "Class Overview & Exam Prep Performance",
    realtimeMetrics: "Realtime writing assessment and student improvement analytics",
    exportCsv: "Export Grade Sheet (CSV)",
    totalSubmissions: "Total Submissions",
    submittedEssays: "Practice essays submitted",
    awaitingReview: "Awaiting Teacher Review",
    pendingLecturer: "Pending teacher feedback",
    meanAiScore: "AI Suggested Score Avg",
    aiSuggestedAvg: "AI estimated practice average",
    meanFinalScore: "Teacher Approved Score Avg",
    lecturerApprovedAvg: "Final teacher approved average",
    criteriaBreakdown: "Criteria Performance Breakdown (Scale 0 - 2.5)",

    // Super Admin Operator
    superAdminTitle: "Platform Super Admin Operator Portal",
    superAdminSubtitle: "Restricted Access for SaaS Platform Operators & System Telemetry",
    operatorEmail: "Operator Email Address",
    securityPassword: "Security Password",
    authOperatorBtn: "Authenticate Platform Super Admin",
    backToUnivLogin: "Back to Main Login"
  },
  vi: {
    // Header & Brand
    appTitle: "Nền tảng Chấm & Luyện Writing bằng AI",
    appSubtitle: "VSTEP • IELTS • TOEIC Writing",
    appDescription: "Dành cho Giảng viên, Trung tâm ngoại ngữ và Người học",
    institutionalSignIn: "Đăng nhập",
    academicUsers: "Luyện thi Writing",
    emailLabel: "Địa chỉ Email",
    passwordLabel: "Mật khẩu",
    signInBtn: "Đăng nhập",
    quickDemoTitle: "Chọn Vai trò Đăng nhập",
    deanRole: "Quản lý Trung tâm",
    lecturerRole: "Giảng viên / Giáo viên",
    studentRole: "Học viên",
    signOut: "Đăng xuất",

    // Teacher Sidebar Sections
    overview: "TỔNG QUAN",
    dashboard: "Bảng điều khiển",
    teachingSection: "GIẢNG DẠY",
    classes: "Lớp học",
    assignments: "Bài tập & Đề thi",
    questionBank: "Ngân hàng Đề thi",
    
    gradingSection: "CHẤM BÀI",
    submissionsQueue: "Hàng chờ Bài nộp",
    reviewQueueStudio: "Phòng Duyệt điểm Giáo viên",
    releasedResults: "Kết quả & Phản hồi",
    
    progressSection: "TIẾN BỘ",
    studentsRoster: "Học viên",
    classAnalytics: "Thống kê Lớp học",
    progressReports: "Báo cáo Tiến bộ",
    
    accountSection: "TÀI KHOẢN",
    usagePlan: "Hạn ngạch & Gói cước",
    settings: "Cài đặt",
    auditLogs: "Nhật ký Hệ thống",
    superAdminOperator: "Quản trị Nền tảng",
    systemTelemetry: "Giám sát System & Health",

    // Student Sidebar
    studentPortal: "LUYỆN TẬP BÀI VIẾT",
    submitWriting: "Luyện bài Viết mới",
    myReleasedResults: "Kết quả & Viết lại",
    myProgress: "Tiến bộ Điểm số của tôi",
    joinClass: "Tham gia Lớp bằng Mã",
    monthlyQuota: "Hạn ngạch Chấm AI Tháng",

    // Beginner Guide
    quickStartTitle: "Hướng dẫn Nhanh dành cho Giáo viên & Học viên",
    quickStartSubtitle: "Các bước đơn giản để luyện thi VSTEP, IELTS và TOEIC Writing hiệu quả",
    step1Title: "1. Tạo Lớp & Chia sẻ Mã Lớp",
    step1Desc: "Giáo viên tạo lớp học (VD: IELTS 6.5+) và gửi mã lớp (VD: IELTS-WR-4A7F) cho học viên.",
    step2Title: "2. Học viên Luyện viết",
    step2Desc: "Học viên làm bài với bộ đếm từ realtime, đồng hồ bấm giờ và tự động lưu bản nháp.",
    step3Title: "3. AI Chấm & Trích dẫn Chứng cứ",
    step3Desc: "Hệ thống AI chấm 4 tiêu chí (Task, Organization, Vocabulary, Grammar) kèm đoạn văn chứng cứ.",
    step4Title: "4. Giáo viên Duyệt & Yêu cầu Viết lại",
    step4Desc: "Giáo viên xem lại bài, ghi nhận xét hoặc yêu cầu viết lại (Attempt 2, Attempt 3) để đo tiến bộ.",
    gotItBtn: "Đã hiểu! Bắt đầu trải nghiệm",

    // Dashboard
    overviewAnalytics: "Tổng quan Lớp học & Hiệu suất Luyện thi",
    realtimeMetrics: "Chỉ số đánh giá bài viết và tiến bộ học viên thời gian thực",
    exportCsv: "Xuất Bảng điểm (CSV)",
    totalSubmissions: "Tổng số Bài nộp",
    submittedEssays: "Bài luận luyện tập đã nộp",
    awaitingReview: "Chờ Giáo viên Phê duyệt",
    pendingLecturer: "Bài nộp chờ nhận xét",
    meanAiScore: "Điểm AI Gợi ý Trung bình",
    aiSuggestedAvg: "Điểm ước lượng AI trung bình",
    meanFinalScore: "Điểm Giáo viên Duyệt",
    lecturerApprovedAvg: "Điểm chính thức giáo viên duyệt",
    criteriaBreakdown: "Phân tích 4 Tiêu chí Chấm bài (Thang 0 - 2.5)",

    // Super Admin Operator
    superAdminTitle: "Cổng Quản trị Nền tảng Super Admin",
    superAdminSubtitle: "Quyền truy cập dành riêng cho Chủ vận hành SaaS & Telemetry",
    operatorEmail: "Email Nhà vận hành",
    securityPassword: "Mật khẩu Bảo mật",
    authOperatorBtn: "Xác thực Super Admin Operator",
    backToUnivLogin: "Quay lại Trang Đăng nhập"
  }
};
