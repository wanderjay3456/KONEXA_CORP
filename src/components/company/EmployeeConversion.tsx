import React from "react";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, FileSignature, ShieldCheck } from "lucide-react";
import { feePolicy, providerPlan } from "../../config/compliancePolicy";

interface EmployeeConversionProps {
  onNavigate: (tabId: string) => void;
}

export default function EmployeeConversion({ onNavigate }: EmployeeConversionProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div className="rounded-3xl border border-neutral-200 bg-neutral-950 p-7 text-white">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-400"><BriefcaseBusiness className="h-4 w-4" /> Direct Hire Conversion</div>
        <h1 className="mt-2 text-3xl font-black tracking-tight">프로젝트 인재 직접채용</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-300">채용 제안은 숨기지 않고 플랫폼 안에서 연봉·직무·근무지·소개요금·E-7 사전 적합성·계약 상태를 함께 기록합니다. 이 화면에는 모의 서명이나 가짜 채용 완료 기능이 없습니다.</p>
        <button onClick={() => onNavigate("trust-operations")} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black text-neutral-950">채용 제안 작성하기 <ArrowRight className="h-4 w-4" /></button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5"><ShieldCheck className="h-5 w-5" /><h2 className="mt-3 font-black">E-7 사전 검토</h2><p className="mt-2 text-xs leading-5 text-neutral-500">직무·전공 적합성만 사전 점검합니다. 비자 발급을 보장하지 않으며 행정사·출입국 전문가의 최종 검토가 필요합니다.</p></div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-5"><FileSignature className="h-5 w-5" /><h2 className="mt-3 font-black">실제 계약 기록</h2><p className="mt-2 text-xs leading-5 text-neutral-500">현재 플랫폼 확인서명을 저장하며, 운영 활성화 시 {providerPlan.electronicSignature}의 문서 상태와 서명 완료 웹훅을 연결합니다.</p></div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-5"><CheckCircle2 className="h-5 w-5" /><h2 className="mt-3 font-black">90일 보증정책</h2><p className="mt-2 text-xs leading-5 text-neutral-500">30일 이내 1회 무료 재추천, 31~60일 70%, 61~90일 40% 크레딧. 기업의 임금체불·조건변경·괴롭힘이 원인이면 제외합니다.</p></div>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white p-6">
        <h2 className="font-black">소개요금 계산 원칙</h2>
        <div className="mt-4 grid gap-3 text-xs md:grid-cols-3">
          <div className="rounded-2xl bg-neutral-50 p-4"><div className="text-neutral-400">직접채용</div><b className="mt-1 block text-lg">연봉의 {feePolicy.directHireRate * 100}%</b></div>
          <div className="rounded-2xl bg-neutral-50 p-4"><div className="text-neutral-400">프로젝트 할인</div><b className="mt-1 block text-lg">관리수수료의 50%</b><span className="text-neutral-400">최대 100만원</span></div>
          <div className="rounded-2xl bg-neutral-50 p-4"><div className="text-neutral-400">적용기간</div><b className="mt-1 block text-lg">소개 후 12개월</b><span className="text-neutral-400">기존 인연 증빙·독립 공개채용 예외 검토</span></div>
        </div>
      </div>
    </div>
  );
}
