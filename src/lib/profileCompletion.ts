import type { CompanyProfile, StudentProfile } from "../types";

export type ProfileValidationErrors = Record<string, string>;

function required(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function validUrl(value: unknown) {
  if (!required(value)) return false;
  try {
    const url = new URL(String(value));
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function validEmail(value: unknown) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function getStudentCompletionErrors(profile: Partial<StudentProfile>): ProfileValidationErrors {
  const errors: ProfileValidationErrors = {};
  if (!required(profile.name)) errors.name = "법적 이름을 입력해 주세요.";
  if (!required(profile.nationality)) errors.nationality = "국적을 입력해 주세요.";
  if (!required(profile.currentCountry)) errors.currentCountry = "현재 거주 국가를 입력해 주세요.";
  if (!required(profile.timezone)) errors.timezone = "시간대를 입력해 주세요.";
  if (!required(profile.university)) errors.university = "대학교를 입력해 주세요.";
  if (!required(profile.degree)) errors.degree = "학위 과정을 선택해 주세요.";
  if (!required(profile.major)) errors.major = "전공을 입력해 주세요.";
  if (!required(profile.graduationYear)) errors.graduationYear = "졸업 예정 연도를 입력해 주세요.";
  if (!required(profile.englishLevel)) errors.englishLevel = "영어 수준을 선택해 주세요.";
  if (!profile.skills?.length) errors.skills = "보유 기술을 하나 이상 입력해 주세요.";
  if (!validUrl(profile.github) && !validUrl(profile.portfolio)) {
    errors.github = "GitHub 또는 포트폴리오 URL을 하나 이상 입력해 주세요.";
  }
  if (!required(profile.preferredJob)) errors.preferredJob = "희망 직무를 입력해 주세요.";
  if (!required(profile.availability)) errors.availability = "업무 가능 시점을 입력해 주세요.";
  if (!Number.isFinite(profile.preferredWeeklyPayKrw) || Number(profile.preferredWeeklyPayKrw) <= 0) {
    errors.preferredWeeklyPayKrw = "희망 주급을 원 단위로 입력해 주세요.";
  }
  if (!required(profile.bio)) errors.bio = "자기소개를 입력해 주세요.";
  if (!required(profile.identityDocumentPath)) errors.identityDocumentPath = "재학증명서 또는 학생증을 업로드해 주세요.";
  if (!required(profile.resumeUrl)) errors.resumeUrl = "PDF 이력서를 업로드해 주세요.";
  return errors;
}

export function getCompanyCompletionErrors(profile: Partial<CompanyProfile>): ProfileValidationErrors {
  const errors: ProfileValidationErrors = {};
  if (!required(profile.companyName)) errors.companyName = "법인 또는 사업체명을 입력해 주세요.";
  if (!required(profile.businessRegistrationNumber)) errors.businessRegistrationNumber = "사업자등록번호를 입력해 주세요.";
  if (!required(profile.country)) errors.country = "본사 국가를 입력해 주세요.";
  if (!required(profile.industry)) errors.industry = "업종을 입력해 주세요.";
  if (!required(profile.companySize)) errors.companySize = "기업 규모를 선택해 주세요.";
  if (!validUrl(profile.website)) errors.website = "유효한 회사 웹사이트 URL을 입력해 주세요.";
  if (!required(profile.officeLocation)) errors.officeLocation = "사업장 소재지를 입력해 주세요.";
  if (!required(profile.contactPerson)) errors.contactPerson = "담당자 이름을 입력해 주세요.";
  if (!required(profile.position)) errors.position = "담당자 직책을 입력해 주세요.";
  if (!validEmail(profile.corporateEmail)) errors.corporateEmail = "유효한 기업 이메일을 입력해 주세요.";
  if (!required(profile.phoneNumber)) errors.phoneNumber = "담당자 전화번호를 입력해 주세요.";
  if (!required(profile.companyIntroduction)) errors.companyIntroduction = "회사 소개를 입력해 주세요.";
  if (!profile.requiredSkills?.length) errors.requiredSkills = "필요 기술을 하나 이상 입력해 주세요.";
  if (!required(profile.businessRegistrationDocumentPath)) {
    errors.businessRegistrationDocumentPath = "사업자등록증을 업로드해 주세요.";
  }
  return errors;
}

export function firstValidationMessage(errors: ProfileValidationErrors) {
  return Object.values(errors)[0] || "필수정보를 확인해 주세요.";
}
