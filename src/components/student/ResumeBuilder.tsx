import React, { useState } from "react";
import { Download, FileText, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useToast } from "../ui/Toast";

interface ResumeReview {
  score: number;
  summary: string;
  strengths: string[];
  issues: string[];
  recommendedEdits: string[];
  model?: string;
}

interface PdfAnalysis {
  extractedSkills?: string[];
  experienceSummary?: string;
  education?: string;
  portfolioLinks?: string[];
  recommendation?: string;
  model?: string;
}

export default function ResumeBuilder() {
  const { studentProfile, applications, updateStudentProfile } = useApp();
  const { success, info, error } = useToast();
  const [targetRole, setTargetRole] = useState(studentProfile?.preferredJob || "");
  const [review, setReview] = useState<ResumeReview | null>(null);
  const [pdfAnalysis, setPdfAnalysis] = useState<PdfAnalysis | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const reviewedProjects = applications.filter((application) => application.status === "reviewed");

  const requestReview = async () => {
    setReviewing(true);
    try {
      const response = await fetch("/api/ai/resume-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "이력서 검토를 완료하지 못했습니다.");
      setReview(payload);
      success("AI 이력서 검토 완료", "현재 프로필에 등록된 근거만 사용했습니다.");
    } catch (cause) {
      error("AI 이력서 검토 오류", cause instanceof Error ? cause.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setReviewing(false);
    }
  };

  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      info("PDF 파일이 필요합니다", "PDF 형식의 이력서를 선택해 주세요.");
      return;
    }
    if (file.size > 7.5 * 1024 * 1024) {
      info("파일이 너무 큽니다", "7.5MB 이하의 PDF를 선택해 주세요.");
      event.target.value = "";
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const pdfBase64 = String(loadEvent.target?.result || "").split(",")[1];
        const response = await fetch("/api/gemini/analyze-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfBase64, role: "student" }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "PDF를 분석하지 못했습니다.");
        setPdfAnalysis(payload);
        if (Array.isArray(payload.extractedSkills) && payload.extractedSkills.length) {
          const skills = Array.from(new Set([...(studentProfile?.skills || []), ...payload.extractedSkills]));
          const saved = await updateStudentProfile({ skills });
          if (!saved) throw new Error("분석한 기술을 프로필에 저장하지 못했습니다.");
        }
        success("PDF 분석 완료", "추출된 기술을 확인하고 프로필에 반영했습니다.");
      } catch (cause) {
        error("PDF 분석 오류", cause instanceof Error ? cause.message : "잠시 후 다시 시도해 주세요.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">Evidence-based resume review</span><h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">AI 이력서 검토</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">등록된 학력, 기술, 자기소개와 검증된 프로젝트만 검토합니다. 특정 기업의 합격 가능성이나 근거 없는 ATS 점수는 표시하지 않습니다.</p></div>
          <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-800"><Download className="h-4 w-4" />현재 화면 인쇄</button>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <article className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm">
              <div className="border-b border-neutral-100 pb-5"><h2 className="text-2xl font-black text-neutral-950">{studentProfile?.name || "이름 미등록"}</h2><p className="mt-1 text-sm text-neutral-500">{studentProfile?.preferredJob || "희망 직무 미등록"} · {studentProfile?.currentCountry || "거주 국가 미등록"}</p></div>
              <div className="mt-6 space-y-6">
                <div><h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">자기소개</h3><p className="mt-2 text-sm leading-7 text-neutral-600">{studentProfile?.bio || "등록된 자기소개가 없습니다."}</p></div>
                <div><h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">학력</h3><p className="mt-2 text-sm font-bold text-neutral-800">{studentProfile?.university || "대학 미등록"}</p><p className="mt-1 text-sm text-neutral-500">{studentProfile?.degree || "학위 미등록"} · {studentProfile?.major || "전공 미등록"} · {studentProfile?.graduationYear || "졸업연도 미등록"}</p></div>
                <div><h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">등록 기술</h3><div className="mt-3 flex flex-wrap gap-2">{studentProfile?.skills?.length ? studentProfile.skills.map((skill) => <span key={skill} className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700">{skill}</span>) : <span className="text-sm text-neutral-400">등록된 기술이 없습니다.</span>}</div></div>
                <div><h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">검토 완료 프로젝트</h3><div className="mt-3 space-y-2">{reviewedProjects.length ? reviewedProjects.map((application) => <div key={application.id} className="rounded-xl bg-neutral-50 p-4"><b className="text-sm text-neutral-800">{application.projectTitle}</b><p className="mt-1 text-xs text-neutral-500">검토 점수 {application.score}/100</p></div>) : <p className="text-sm text-neutral-400">아직 검토 완료된 프로젝트가 없습니다.</p>}</div></div>
              </div>
            </article>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-black"><ShieldCheck className="h-4 w-4" />AI 근거 검토</h2>
              <label className="mt-5 block text-xs font-bold text-neutral-600" htmlFor="target-role">지원 목표 직무</label>
              <input id="target-role" value={targetRole} onChange={(event) => setTargetRole(event.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm outline-none focus:border-neutral-500" />
              <button onClick={requestReview} disabled={reviewing || !targetRole.trim()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"><Sparkles className="h-4 w-4" />{reviewing ? "검토 중" : "AI 검토 실행"}</button>
              {review && <div className="mt-5 border-t border-neutral-100 pt-5"><div className="flex items-end justify-between"><b className="text-sm">근거 충실도</b><span className="text-2xl font-black">{review.score}/100</span></div><p className="mt-3 text-sm leading-6 text-neutral-600">{review.summary}</p><h3 className="mt-5 text-xs font-black text-neutral-900">확인된 강점</h3><ul className="mt-2 space-y-2 text-xs leading-5 text-neutral-600">{review.strengths.map((item) => <li key={item} className="rounded-lg bg-emerald-50 p-2.5">{item}</li>)}</ul><h3 className="mt-5 text-xs font-black text-neutral-900">수정 제안</h3><ul className="mt-2 space-y-2 text-xs leading-5 text-neutral-600">{[...review.issues, ...review.recommendedEdits].map((item) => <li key={item} className="rounded-lg bg-neutral-50 p-2.5">{item}</li>)}</ul><p className="mt-4 text-[10px] text-neutral-400">{review.model}</p></div>}
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-black"><FileText className="h-4 w-4" />PDF 이력서 분석</h2><p className="mt-2 text-xs leading-5 text-neutral-500">PDF에서 기술, 학력, 경험과 링크를 추출합니다. 추출 결과는 반드시 직접 확인해 주세요.</p>
              <label className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-bold text-neutral-800"><Upload className="h-4 w-4" />{uploading ? "분석 중" : "PDF 선택"}<input type="file" accept="application/pdf" onChange={handlePdfUpload} disabled={uploading} className="hidden" /></label>
              {pdfAnalysis && <div className="mt-4 rounded-xl bg-neutral-50 p-4"><p className="text-xs leading-5 text-neutral-600">{pdfAnalysis.recommendation}</p><div className="mt-3 flex flex-wrap gap-1.5">{pdfAnalysis.extractedSkills?.map((skill) => <span key={skill} className="rounded-full bg-white px-2 py-1 text-[10px] font-bold">{skill}</span>)}</div><p className="mt-3 text-[10px] text-neutral-400">{pdfAnalysis.model}</p></div>}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
