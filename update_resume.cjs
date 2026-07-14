const fs = require('fs');

let content = fs.readFileSync('src/components/student/ResumeBuilder.tsx', 'utf8');

// Insert new states for PDF Upload
const stateInsert = `
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);
  const [pdfAnalysis, setPdfAnalysis] = useState<any>(null);

  const handlePDFUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      info("PDF Required", "Please upload a valid PDF document.");
      return;
    }

    setIsUploadingPDF(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = (event.target?.result as string).split(',')[1];
        const res = await fetch("/api/gemini/analyze-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfBase64: base64, role: "student" })
        });
        
        if (!res.ok) throw new Error("Failed to analyze PDF");
        const analysis = await res.json();
        
        setPdfAnalysis(analysis);
        
        if (analysis.extractedSkills) {
          updateStudentProfile({ skills: Array.from(new Set([...(studentProfile?.skills || []), ...analysis.extractedSkills])) });
        }
        
        success("PDF Analyzed Successfully", "Your profile has been augmented with data from your resume.");
      } catch (err: any) {
        info("Analysis Failed", err.message);
      } finally {
        setIsUploadingPDF(false);
      }
    };
    reader.readAsDataURL(file);
  };
`;
content = content.replace('const [versions, setVersions] = useState<ResumeVersion[]>([', stateInsert + '\n  const [versions, setVersions] = useState<ResumeVersion[]>([');

// Insert an upload button near the "Template" or "Export" buttons.
const uploadButtonHTML = `
            <div className="relative">
              <input type="file" accept=".pdf" onChange={handlePDFUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <button disabled={isUploadingPDF} className="h-9 px-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-[10px] font-sans font-bold text-neutral-700 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors whitespace-nowrap overflow-hidden">
                <FileText className="w-3.5 h-3.5" />
                {isUploadingPDF ? "Analyzing PDF..." : "Upload Resume PDF"}
              </button>
            </div>
`;

content = content.replace(
  '<button \n              onClick={handleExportPDF}', 
  uploadButtonHTML + '\n            <button \n              onClick={handleExportPDF}'
);

content = content.replace(
  '<button onClick={handleExportPDF}', 
  uploadButtonHTML + '\n            <button onClick={handleExportPDF}'
);


// Insert UI for PDF analysis results
const analysisUI = `
          {pdfAnalysis && (
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-200/50 shadow-xs space-y-4">
              <h3 className="font-display font-bold text-sm text-emerald-900">PDF Insight Extraction</h3>
              <p className="text-[11px] text-emerald-800 leading-relaxed font-sans">{pdfAnalysis.recommendation}</p>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block">Extracted Skills</span>
                <div className="flex flex-wrap gap-1">
                  {pdfAnalysis.extractedSkills?.map((s: string, i: number) => (
                     <span key={i} className="text-[9px] font-semibold text-emerald-900 bg-emerald-200/50 px-2 py-0.5 rounded-md">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
`;
content = content.replace('{/* Version History logs */}', analysisUI + '\n          {/* Version History logs */}');

fs.writeFileSync('src/components/student/ResumeBuilder.tsx', content);
console.log('ResumeBuilder.tsx updated with PDF upload');
