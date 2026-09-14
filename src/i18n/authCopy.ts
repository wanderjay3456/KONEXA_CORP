import type { Locale } from "./LocaleContext";

const en = {
  loginTitle: "Welcome back to KONEXA", loginLead: "Sign in to continue your projects and applications.",
  forgotTitle: "Reset your password", forgotLead: "Enter the email address you used to sign up.",
  recoveryTitle: "Choose a new password", recoveryLead: "Use at least 8 characters for your new password.",
  student: "Talent", company: "Company", admin: "Admin", roleLabel: "Account type",
  adminNote: "Admin access is available only to accounts approved by KONEXA.",
  google: "Continue with Google", divider: "or use email", email: "Email address", password: "Password",
  forgot: "Forgot password?", submit: "Log in", busy: "Please wait…", close: "Close sign-in window",
  firstTime: "New to KONEXA?", studentJoin: "Create a talent account", companyJoin: "Create a company account",
  sessionNote: "Using a shared computer? Remember to log out when you are finished.",
  back: "Back to log in", send: "Send reset link", newPassword: "New password", confirmPassword: "Confirm new password",
  update: "Save new password", updatedBody: "Your password has been updated. You can now sign in with your new password.",
  resetSent: "If this address has an account, a reset link will arrive shortly. Please also check your spam folder.",
  invalidPassword: "Use at least 8 characters and make sure both passwords match.",
  invalidCredentials: "The email or password is incorrect. Please check both and try again.",
  unconfirmed: "Please confirm your email before signing in. Check your inbox and spam folder.",
  rateLimited: "Too many attempts. Please wait a moment before trying again.",
  networkError: "We could not connect. Check your internet connection and try again.",
  expired: "This reset link has expired or has already been used. Request a new one.",
  accessDenied: "This account cannot access the selected area. Contact konexa.corp@gmail.com for help.",
  genericError: "We could not complete this request. Try again, or contact konexa.corp@gmail.com.",
  loginSuccess: "You are signed in", loginSuccessBody: "Your workspace is ready.",
  googleError: "Google sign-in could not be completed", resetError: "Could not send the reset link",
};

type AuthCopy = { [Key in keyof typeof en]: string };
export const authCopy: Record<Locale, AuthCopy> = {
  en,
  ko: {
    loginTitle: "KONEXA 로그인", loginLead: "프로젝트와 지원 현황을 한곳에서 확인하세요.",
    forgotTitle: "비밀번호 재설정", forgotLead: "회원가입에 사용한 이메일을 입력해 주세요.",
    recoveryTitle: "새 비밀번호 설정", recoveryLead: "8자 이상의 새 비밀번호를 입력해 주세요.",
    student: "학생·인재", company: "기업", admin: "관리자", roleLabel: "계정 유형",
    adminNote: "관리자 로그인은 KONEXA가 권한을 부여한 계정만 이용할 수 있습니다.",
    google: "Google로 계속하기", divider: "또는 이메일로 로그인", email: "이메일", password: "비밀번호",
    forgot: "비밀번호를 잊으셨나요?", submit: "로그인", busy: "처리 중…", close: "로그인 창 닫기",
    firstTime: "KONEXA가 처음이신가요?", studentJoin: "학생·인재로 가입하기", companyJoin: "기업으로 가입하기",
    sessionNote: "공용 컴퓨터에서는 이용을 마친 후 반드시 로그아웃해 주세요.",
    back: "로그인으로 돌아가기", send: "재설정 링크 받기", newPassword: "새 비밀번호", confirmPassword: "새 비밀번호 확인",
    update: "새 비밀번호 저장", updatedBody: "비밀번호가 변경되었습니다. 새 비밀번호로 로그인할 수 있습니다.",
    resetSent: "가입된 이메일이라면 잠시 후 재설정 링크가 도착합니다. 스팸 메일함도 확인해 주세요.",
    invalidPassword: "비밀번호를 8자 이상 입력하고 두 항목이 같은지 확인해 주세요.",
    invalidCredentials: "이메일 또는 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.",
    unconfirmed: "이메일 인증을 완료한 후 로그인해 주세요. 받은 편지함과 스팸 메일함을 확인해 주세요.",
    rateLimited: "요청이 많습니다. 잠시 기다린 후 다시 시도해 주세요.",
    networkError: "연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.",
    expired: "재설정 링크가 만료되었거나 이미 사용되었습니다. 새 링크를 요청해 주세요.",
    accessDenied: "이 계정으로는 선택한 화면에 접근할 수 없습니다. konexa.corp@gmail.com으로 문의해 주세요.",
    genericError: "요청을 완료하지 못했습니다. 다시 시도하거나 konexa.corp@gmail.com으로 문의해 주세요.",
    loginSuccess: "로그인되었습니다", loginSuccessBody: "내 작업 공간에서 이어서 진행하세요.",
    googleError: "Google 로그인을 완료하지 못했습니다", resetError: "재설정 링크를 보내지 못했습니다",
  },
  vi: {
    loginTitle: "Chào mừng bạn trở lại KONEXA", loginLead: "Đăng nhập để tiếp tục dự án và theo dõi hồ sơ ứng tuyển.",
    forgotTitle: "Đặt lại mật khẩu", forgotLead: "Nhập địa chỉ email bạn đã dùng để đăng ký.",
    recoveryTitle: "Tạo mật khẩu mới", recoveryLead: "Mật khẩu mới cần có ít nhất 8 ký tự.",
    student: "Ứng viên", company: "Doanh nghiệp", admin: "Quản trị", roleLabel: "Loại tài khoản",
    adminNote: "Chỉ tài khoản được KONEXA cấp quyền mới có thể truy cập trang quản trị.",
    google: "Tiếp tục với Google", divider: "hoặc đăng nhập bằng email", email: "Địa chỉ email", password: "Mật khẩu",
    forgot: "Quên mật khẩu?", submit: "Đăng nhập", busy: "Đang xử lý…", close: "Đóng cửa sổ đăng nhập",
    firstTime: "Bạn mới biết đến KONEXA?", studentJoin: "Tạo tài khoản ứng viên", companyJoin: "Tạo tài khoản doanh nghiệp",
    sessionNote: "Nếu dùng máy tính chung, hãy đăng xuất sau khi sử dụng.",
    back: "Quay lại đăng nhập", send: "Gửi liên kết đặt lại", newPassword: "Mật khẩu mới", confirmPassword: "Xác nhận mật khẩu mới",
    update: "Lưu mật khẩu mới", updatedBody: "Đã đổi mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.",
    resetSent: "Nếu email này đã được đăng ký, bạn sẽ sớm nhận được liên kết đặt lại mật khẩu. Vui lòng kiểm tra cả thư rác.",
    invalidPassword: "Nhập ít nhất 8 ký tự và đảm bảo hai mật khẩu giống nhau.",
    invalidCredentials: "Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra và thử lại.",
    unconfirmed: "Vui lòng xác nhận email trước khi đăng nhập. Kiểm tra hộp thư đến và thư rác.",
    rateLimited: "Bạn đã thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại.",
    networkError: "Không thể kết nối. Vui lòng kiểm tra kết nối internet và thử lại.",
    expired: "Liên kết đã hết hạn hoặc đã được sử dụng. Vui lòng yêu cầu liên kết mới.",
    accessDenied: "Tài khoản này không có quyền truy cập mục đã chọn. Liên hệ konexa.corp@gmail.com để được hỗ trợ.",
    genericError: "Không thể hoàn tất yêu cầu. Hãy thử lại hoặc liên hệ konexa.corp@gmail.com.",
    loginSuccess: "Đã đăng nhập", loginSuccessBody: "Không gian làm việc của bạn đã sẵn sàng.",
    googleError: "Không thể đăng nhập bằng Google", resetError: "Không thể gửi liên kết đặt lại mật khẩu",
  },
};

/** Do not expose provider internals, database details or tokens in public auth errors. */
export function authErrorMessage(cause: unknown, locale: Locale): string {
  const t = authCopy[locale];
  const message = cause instanceof Error ? cause.message : typeof cause === "string" ? cause : "";
  if (/invalid.*(credentials|password)|invalid login|wrong.password/i.test(message)) return t.invalidCredentials;
  if (/email.not.confirmed|email.*confirm/i.test(message)) return t.unconfirmed;
  if (/rate.limit|too many|429/i.test(message)) return t.rateLimited;
  if (/fetch|network|timeout|timed out/i.test(message)) return t.networkError;
  if (/expired|invalid.*(token|link)|otp_expired/i.test(message)) return t.expired;
  if (/admin|suspend|권한|승인된 관리자|이용.*제한/i.test(message)) return t.accessDenied;
  return t.genericError;
}
