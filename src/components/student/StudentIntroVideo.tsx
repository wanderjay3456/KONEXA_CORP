import React, { useEffect, useRef, useState } from "react";
import { Award, Camera, CheckCircle2, LoaderCircle, Play, ShieldCheck, Trash2, Upload } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { supabase } from "../../config/supabase";
import { uploadPrivateFile } from "../../lib/privateStorage";
import { useToast } from "../ui/Toast";

const MAX_BYTES = 100 * 1024 * 1024;
const MAX_SECONDS = 60;
const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

async function readDuration(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise<number>((resolve, reject) => {
      const video = document.createElement("video");
      const timeout = window.setTimeout(() => reject(new Error("The video duration could not be read.")), 12_000);
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.clearTimeout(timeout);
        const duration = Number(video.duration);
        if (!Number.isFinite(duration)) reject(new Error("The video duration could not be read."));
        else resolve(duration);
      };
      video.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error("Choose a video file that can be played in your browser."));
      };
      video.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function StudentIntroVideo() {
  const { currentUser, studentProfile, updateStudentProfile } = useApp();
  const { success, error } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(studentProfile?.introVideoPath));
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!currentUser?.uid || !studentProfile?.introVideoPath) {
      setVideoUrl("");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetch(`/api/talent-videos/${currentUser.uid}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "The video could not be loaded.");
        if (active) setVideoUrl(payload.url || "");
      })
      .catch((reason) => {
        if (active) {
          setVideoUrl("");
          console.warn("Introduction video preview failed:", reason);
        }
      })
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [currentUser?.uid, studentProfile?.introVideoPath, studentProfile?.introVideoUpdatedAt]);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !currentUser?.uid) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      error("Unsupported format", "Choose an MP4, WebM, or MOV video.");
      return;
    }
    if (file.size > MAX_BYTES) {
      error("Video is too large", "Your introduction video must be 100MB or less.");
      return;
    }

    setIsUploading(true);
    let uploadedPath = "";
    try {
      const duration = await readDuration(file);
      if (duration > MAX_SECONDS + 0.25) {
        throw new Error("Your introduction video must be 60 seconds or less.");
      }
      uploadedPath = await uploadPrivateFile("student-intro-videos", currentUser.uid, file);
      const previousPath = studentProfile?.introVideoPath || "";
      const saved = await updateStudentProfile({
        introVideoPath: uploadedPath,
        introVideoDurationSeconds: Math.round(duration * 10) / 10,
        introVideoMimeType: file.type,
        introVideoFileName: file.name,
        introVideoUpdatedAt: Date.now(),
      });
      if (!saved) throw new Error("The video information was not saved to your profile.");
      if (previousPath && previousPath !== uploadedPath) {
        const { error: removeError } = await supabase.storage.from("student-intro-videos").remove([previousPath]);
        if (removeError) console.warn("Previous introduction video cleanup failed:", removeError);
      }
      success("Introduction video saved", "Only approved matching companies can view this video.");
    } catch (reason) {
      if (uploadedPath) {
        await supabase.storage.from("student-intro-videos").remove([uploadedPath]);
      }
      error("Video upload failed", reason instanceof Error ? reason.message : "The video could not be saved.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeVideo = async () => {
    const path = studentProfile?.introVideoPath;
    if (!path) return;
    setIsDeleting(true);
    try {
      const saved = await updateStudentProfile({
        introVideoPath: null,
        introVideoDurationSeconds: null,
        introVideoMimeType: null,
        introVideoFileName: null,
        introVideoUpdatedAt: Date.now(),
      });
      if (!saved) throw new Error("The video was not removed from your profile.");
      const { error: removeError } = await supabase.storage.from("student-intro-videos").remove([path]);
      if (removeError) throw removeError;
      setVideoUrl("");
      success("Video removed", "The previous introduction video was deleted.");
    } catch (reason) {
      error("Video removal failed", reason instanceof Error ? reason.message : "The video could not be removed.");
    } finally {
      setIsDeleting(false);
    }
  };

  const busy = isUploading || isDeleting;

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-teal-700"><Camera className="h-4 w-4" />One-minute introduction</div>
          <h2 className="mt-2 text-xl font-black text-neutral-950">Show your strengths in your own words</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">Upload an MP4, WebM, or MOV file up to 60 seconds. It stays private and is available only to KONEXA administrators and companies that approve your application.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800"><ShieldCheck className="h-4 w-4" />Private storage</div>
      </div>

      <div className={`mt-6 rounded-2xl border p-4 text-xs leading-5 ${studentProfile?.earlyPioneerEligible ? "border-amber-200 bg-amber-50 text-amber-900" : "border-indigo-200 bg-indigo-50 text-indigo-900"}`}>
        <div className="flex items-start gap-2">
          <Award className="mt-0.5 h-4 w-4 shrink-0" />
          <div><b className="block">{studentProfile?.earlyPioneerEligible ? "Early Pioneer 자격이 기록되었습니다" : "8월 5일 얼리버드 조건"}</b><span>{studentProfile?.earlyPioneerEligible ? "첫 구직 완료 전까지 우선 노출, 이력서 컨설팅 1회, 첫 매칭 4주 수수료 페이백 대상입니다." : studentProfile?.resumeUrl ? "1분 영상을 업로드하면 두 가지 필수 조건을 모두 충족합니다." : "이력서 100% 등록과 1분 영상 업로드를 모두 완료해야 합니다."}</span></div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950">
        {isLoading ? <div className="flex aspect-video items-center justify-center text-white"><LoaderCircle className="h-6 w-6 animate-spin" /></div>
          : videoUrl ? <video key={videoUrl} controls playsInline preload="metadata" className="aspect-video w-full bg-black object-contain" src={videoUrl} />
          : <div className="flex aspect-video flex-col items-center justify-center gap-3 text-neutral-400"><Play className="h-8 w-8" /><span className="text-sm font-semibold">No introduction video yet</span></div>}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs leading-5 text-neutral-500">{studentProfile?.introVideoPath ? <span className="inline-flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" />{studentProfile.introVideoFileName || "Video saved"} / {studentProfile.introVideoDurationSeconds || 0}s</span> : "Maximum 100MB / 60 seconds"}</div>
        <div className="flex gap-2">
          {studentProfile?.introVideoPath && <button type="button" disabled={busy} onClick={removeVideo} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-3 text-xs font-bold text-rose-700 disabled:opacity-50"><Trash2 className="h-4 w-4" />Remove</button>}
          <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime,.mov" className="hidden" onChange={handleFile} />
          <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-xs font-bold text-white disabled:opacity-50">{isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{studentProfile?.introVideoPath ? "Replace video" : "Upload video"}</button>
        </div>
      </div>
    </section>
  );
}
