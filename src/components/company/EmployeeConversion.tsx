import React from "react";
import { ArrowRight } from "lucide-react";

interface EmployeeConversionProps {
  onNavigate: (tabId: string) => void;
}

export default function EmployeeConversion({ onNavigate }: EmployeeConversionProps) {
  // A hiring agreement and any lawful introduction fee require a separate quote.
  return <section className="mx-auto max-w-4xl space-y-6 pb-12"><h1 className="text-3xl font-semibold tracking-tight">프로젝트 이후의 협업</h1><p className="text-base leading-8 text-neutral-600">프로젝트를 마친 뒤 협업 연장이나 채용을 논의할 수 있습니다. 채용·소개 업무를 적법하게 제공할 수 있는지 먼저 확인하고, 당사자와 비용·역할·조건을 서면으로 합의합니다. 고정 전환 수수료와 90일 보증은 현재 제공 조건이 아닙니다.</p><a href="/project-terms" className="inline-flex min-h-12 items-center text-blue-700 underline">계약·결제·환불 조건 읽기</a><button type="button" onClick={() => onNavigate("trust-operations")} className="flex min-h-12 items-center gap-3 rounded bg-neutral-950 px-5 py-3 text-white">프로젝트 기록 확인<ArrowRight aria-hidden="true" className="h-4 w-4"/></button></section>;
}
