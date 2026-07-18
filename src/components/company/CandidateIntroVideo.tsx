import React, { useState } from "react";
import { Film, LoaderCircle, LockKeyhole, X } from "lucide-react";
import { ApplicationStatus, type Application } from "../../types";

export default function CandidateIntroVideo({ application }: { application: Application }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (application.status !== ApplicationStatus.APPROVED) {
    return <div className="mt-4 flex items-center gap-2 rounded-xl bg-neutral-50 px-4 py-3 text-xs font-semibold text-neutral-500"><LockKeyhole className="h-4 w-4" />Approve the application to view this student's one-minute introduction.</div>;
  }

  const load = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/talent-videos/${application.studentId}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "The video could not be loaded.");
      setUrl(payload.url || "");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "The video could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      {url ? (
        <div>
          <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-bold text-neutral-800"><Film className="h-4 w-4" />Approved candidate introduction</div><button type="button" onClick={() => setUrl("")} aria-label="Close video" className="rounded-lg p-2 text-neutral-500 hover:bg-white"><X className="h-4 w-4" /></button></div>
          <video key={url} src={url} controls playsInline preload="metadata" className="aspect-video w-full rounded-xl bg-black object-contain" />
          <p className="mt-2 text-[11px] leading-5 text-neutral-500">The secure playback link expires after five minutes. Reopen the video to continue after it expires.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="flex items-center gap-2 text-xs font-bold text-neutral-800"><Film className="h-4 w-4" />One-minute introduction</div><p className="mt-1 text-xs text-neutral-500">{message || "If the student uploaded a video, you can view it here."}</p></div>
          <button type="button" disabled={loading} onClick={load} className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-xs font-bold text-white disabled:opacity-50">{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}View video</button>
        </div>
      )}
    </div>
  );
}
