import { GoogleGenAI } from "@google/genai";
import { db } from "../config/firebase";
import { collection, getDocs, addDoc, setDoc, doc, query, where, limit } from "firebase/firestore";

// ==========================================
// CORE DATA INTERFACES
// ==========================================
export interface ScoreVersion {
  id: string;
  engineName: string;
  version: string;
  weights: Record<string, number>;
  rules: string[];
  updatedAt: number;
  updatedBy: string;
}

export interface ScoreAuditRecord {
  id: string;
  userId: string;
  engineName: string;
  previousScore: number;
  newScore: number;
  reason: string;
  timestamp: number;
  version: string;
}

export interface TrustEvidence {
  id: string;
  userId: string;
  category: string; // "Attendance" | "Deadline" | "Task Quality" | "Communication" | "Document Verification" | "Identity Verification"
  description: string;
  scoreBonus: number;
  sourceId: string;
  timestamp: number;
  hash: string;
}

export interface TrustScoreProfile {
  userId: string;
  currentScore: number;
  confidence: number;
  historicalTrend: { date: string; score: number }[];
  evidenceTimeline: TrustEvidence[];
  positiveFactors: string[];
  negativeFactors: string[];
  aiExplanation: string;
  improvementSuggestions: string[];
  trustForecast: { date: string; score: number }[];
}

export interface PerformanceMetric {
  category: string;
  value: number;
  max: number;
  weight: number;
}

export interface PerformanceProfile {
  userId: string;
  currentScore: number;
  confidence: number;
  trend: { date: string; score: number }[];
  breakdown: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  performancePrediction: { date: string; score: number }[];
}

export interface MatchScoreProfile {
  studentId: string;
  projectId: string;
  matchScore: number;
  compatibilityScore: number;
  riskScore: number;
  growthPotential: number;
  recommendationConfidence: number;
  matchExplanation: string;
  breakdown: {
    skillsCompatibility: number;
    timezoneAlignment: number;
    cultureFit: number;
    careerGoalMatch: number;
  };
}

export interface RecommendationItem {
  id: string;
  type: "Project" | "Student" | "Company" | "Mentor" | "Course" | "Certificate" | "Skill" | "Learning Roadmap" | "Career Path" | "Hiring Strategy" | "Project Template";
  title: string;
  subtitle: string;
  confidence: number;
  why: string;
  evidence: string[];
  metadata: Record<string, any>;
}

export interface PredictionResult {
  userId: string;
  employmentProbability: number;
  projectSuccessProbability: number;
  learningSpeedPrediction: "Normal" | "Accelerated" | "Rapid" | "Exceptional";
  dropoutRisk: "Low" | "Medium" | "High";
  skillGrowthPrediction: { skill: string; monthsToMastery: number }[];
  companyHiringSuccess?: number;
  futureHiringDemand?: string[];
  platformRetentionRate?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  requirements: string[];
}

export interface BadgeHistoryRecord {
  id: string;
  userId: string;
  badgeId: string;
  badgeName: string;
  issuedAt: number;
  evidence: string;
  expirationDate?: number;
}

export interface WarningRecord {
  id: string;
  userId: string;
  type: string; // "LateSubmission" | "LowParticipation" | "PolicyViolation" | "TrustDecline" | "PerformanceDecline"
  severity: "Low" | "Medium" | "High" | "Critical";
  message: string;
  timestamp: number;
  status: "Active" | "Appealed" | "Resolved";
  appealNotes?: string;
  recommendedActions: string[];
}

export interface ApprovalWorkflow {
  id: string;
  type: "ProjectApproval" | "ProfileVerification" | "CompanyVerification" | "DeliverableApproval" | "CertificateVerification" | "TrustReview";
  title: string;
  targetId: string;
  requesterId: string;
  status: "Pending" | "Approved" | "Rejected";
  aiRecommendation: "Approve" | "Reject" | "ReviewNeeded";
  aiReasoning: string;
  overrideNotes?: string;
  audits: { status: string; actor: string; timestamp: number; notes?: string }[];
  createdAt: number;
}

// ==========================================
// CENTRALIZED INTEL DATA STORES
// ==========================================
class MemoryIntelStore {
  public scoreVersions: Map<string, ScoreVersion> = new Map();
  public scoreAudits: ScoreAuditRecord[] = [];
  public trustEvidence: TrustEvidence[] = [];
  public trustScores: Map<string, TrustScoreProfile> = new Map();
  public performanceScores: Map<string, PerformanceProfile> = new Map();
  public matchProfiles: MatchScoreProfile[] = [];
  public recommendations: RecommendationItem[] = [];
  public predictionResults: Map<string, PredictionResult> = new Map();
  public badgeHistory: BadgeHistoryRecord[] = [];
  public warnings: WarningRecord[] = [];
  public approvals: ApprovalWorkflow[] = [];

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    const now = Date.now();
    const mockStudentId = "usr_fndtn_konexa_99";
    const mockProjectId = "proj_core_performance_optimizer";

    // 1. Score Versions
    this.scoreVersions.set("trust_v1", {
      id: "trust_v1",
      engineName: "Trust Engine",
      version: "v1.0.0",
      weights: {
        projectCompletion: 0.25,
        deadlineCompliance: 0.20,
        attendance: 0.15,
        verification: 0.25,
        activity: 0.15
      },
      rules: [
        "Base score is 70",
        "Verification grants flat +10 trust",
        "Disputes subtract -15 trust",
        "Late submissions reduce compliance index"
      ],
      updatedAt: now,
      updatedBy: "System Architect"
    });

    this.scoreVersions.set("performance_v1", {
      id: "performance_v1",
      engineName: "Performance Engine",
      version: "v1.0.0",
      weights: {
        taskCompletion: 0.30,
        codeQuality: 0.25,
        complexity: 0.20,
        collaboration: 0.15,
        initiative: 0.10
      },
      rules: [
        "Evaluate code via Gemini reviewer",
        "Weight complex tasks higher than simple chores",
        "Decay older reviews exponentially over a 30-day half-life"
      ],
      updatedAt: now,
      updatedBy: "System Architect"
    });

    // 2. Trust Evidence Seed
    this.trustEvidence.push(
      {
        id: "ev_1",
        userId: mockStudentId,
        category: "Attendance",
        description: "Attended all sprint alignments with Horizon Labs",
        scoreBonus: 3,
        sourceId: "meet_101",
        timestamp: now - 3 * 24 * 3600 * 1000,
        hash: "sha256_82f01ac89b1d..."
      },
      {
        id: "ev_2",
        userId: mockStudentId,
        category: "Deadline Compliance",
        description: "Completed Vitals Profiler Hook challenge 4 hours before deadline",
        scoreBonus: 4,
        sourceId: "app_992",
        timestamp: now - 2 * 24 * 3600 * 1000,
        hash: "sha256_bb92a019483c..."
      },
      {
        id: "ev_3",
        userId: mockStudentId,
        category: "Identity Verification",
        description: "Passed real-time automated identity & passport audit",
        scoreBonus: 10,
        sourceId: "req_338",
        timestamp: now - 10 * 24 * 3600 * 1000,
        hash: "sha256_ffea39201948..."
      }
    );

    // 3. Trust Score Profile
    this.trustScores.set(mockStudentId, {
      userId: mockStudentId,
      currentScore: 82,
      confidence: 90,
      historicalTrend: [
        { date: "07/04", score: 70 },
        { date: "07/05", score: 73 },
        { date: "07/06", score: 76 },
        { date: "07/07", score: 76 },
        { date: "07/08", score: 82 }
      ],
      evidenceTimeline: [...this.trustEvidence],
      positiveFactors: [
        "Verifiable passport and credentials identity approved",
        "Consistently logs sprint check-ins within scheduled buffers",
        "Completed complex Vercel Performance sandbox early"
      ],
      negativeFactors: [
        "Short platform presence (account age under 30 days)"
      ],
      aiExplanation: "Alex Rivera exhibits high operational reliability. All milestone submissions correlate with positive git commits, and identity assertions remain fully cryptographic.",
      improvementSuggestions: [
        "Complete 2 additional advanced challenges to maximize trust reliability bounds",
        "Log a peer evaluation on the current team node"
      ],
      trustForecast: [
        { date: "Week 1", score: 82 },
        { date: "Week 2", score: 85 },
        { date: "Week 3", score: 89 },
        { date: "Week 4", score: 93 }
      ]
    });

    // 4. Performance Profile
    this.performanceScores.set(mockStudentId, {
      userId: mockStudentId,
      currentScore: 88,
      confidence: 95,
      trend: [
        { date: "07/04", score: 80 },
        { date: "07/05", score: 82 },
        { date: "07/06", score: 85 },
        { date: "07/07", score: 86 },
        { date: "07/08", score: 88 }
      ],
      breakdown: {
        "Code Correctness": 92,
        "System Architecture": 85,
        "Task Velocity": 90,
        "Documentation": 80,
        "Complexity Adaptability": 95
      },
      strengths: [
        "Elite React concurrent layout and SVG coordinate mechanics",
        "Outstanding TypeScript type-safety bounds resolution",
        "Consistently fast code review iteration cycles"
      ],
      weaknesses: [
        "Requires deeper exposure to large scale Webpack/Vite deployment trees",
        "Incomplete automated end-to-end integration tests coverage"
      ],
      performancePrediction: [
        { date: "Sprint 1", score: 88 },
        { date: "Sprint 2", score: 90 },
        { date: "Sprint 3", score: 92 },
        { date: "Sprint 4", score: 95 }
      ]
    });

    // 5. Match Profiles
    this.matchProfiles.push({
      studentId: mockStudentId,
      projectId: mockProjectId,
      matchScore: 94,
      compatibilityScore: 96,
      riskScore: 12,
      growthPotential: 88,
      recommendationConfidence: 95,
      matchExplanation: "Alex possesses all core requirements including high-density React 19 timing optimizations, coupled with a reliable Trust Ledger history.",
      breakdown: {
        skillsCompatibility: 98,
        timezoneAlignment: 90,
        cultureFit: 92,
        careerGoalMatch: 95
      }
    });

    // 6. Recommendations list
    this.recommendations.push(
      {
        id: "rec_p1",
        type: "Project",
        title: "Sub-millisecond State Syncer for Collaborative Canvas",
        subtitle: "Framer Design Engine Team • Hard Difficulty",
        confidence: 94,
        why: "Direct correlation detected with your high-fidelity SVG matrix layout performance records.",
        evidence: ["Top performance in SVG tree visualizers", "Expert level Framer Motion metrics"],
        metadata: { reward: "$3,200", difficulty: "Hard" }
      },
      {
        id: "rec_c1",
        type: "Course",
        title: "Advanced React Concurrent Engine & Fibre Mechanics",
        subtitle: "Google Developer Core Registry • Recommended",
        confidence: 90,
        why: "Will bridge the structural gap identified in server-side React concurrent hydrations.",
        evidence: ["Minor concurrent hydration lag in sandbox", "Skill path target"],
        metadata: { provider: "React Core Team", duration: "12 hours" }
      },
      {
        id: "rec_m1",
        type: "Mentor",
        title: "Dr. Elena Rostova",
        subtitle: "Principal Architect, Vercel Core Engines",
        confidence: 88,
        why: "Matched with your focus in modular performance profilers and system timing trees.",
        evidence: ["Active in same engineering category", "Both target performance domains"],
        metadata: { alignment: "High-level profiling guidance" }
      }
    );

    // 7. Prediction Results
    this.predictionResults.set(mockStudentId, {
      userId: mockStudentId,
      employmentProbability: 94,
      projectSuccessProbability: 91,
      learningSpeedPrediction: "Exceptional",
      dropoutRisk: "Low",
      skillGrowthPrediction: [
        { skill: "Concurrent Hydration", monthsToMastery: 1.5 },
        { skill: "SVG Viewports Matrices", monthsToMastery: 0.8 },
        { skill: "WebSocket Event Loop", monthsToMastery: 2.1 }
      ],
      companyHiringSuccess: 96,
      futureHiringDemand: ["Next.js Hydration Architect", "Web Assembly Engine Specialist"],
      platformRetentionRate: 98
    });

    // 8. Badge History
    this.badgeHistory.push(
      {
        id: "bh_1",
        userId: mockStudentId,
        badgeId: "top_performer",
        badgeName: "Top Performer",
        issuedAt: now - 5 * 24 * 3600 * 1000,
        evidence: "Earned 95+ score on complex Vercel core evaluation suite",
        expirationDate: now + 365 * 24 * 3600 * 1000
      },
      {
        id: "bh_2",
        userId: mockStudentId,
        badgeId: "reliable_contributor",
        badgeName: "Reliable Contributor",
        issuedAt: now - 3 * 24 * 3600 * 1000,
        evidence: "Maintained 100% early deadline completions across all claimed sandboxes",
      }
    );

    // 9. Warnings list
    this.warnings.push({
      id: "wn_1",
      userId: "usr_mock_slack_88",
      type: "LowParticipation",
      severity: "Low",
      message: "No project synchronization commits detected for 5 days.",
      timestamp: now - 2 * 24 * 3600 * 1000,
      status: "Resolved",
      appealNotes: "Student logged core updates on localized git tree.",
      recommendedActions: [
        "Push immediate local workspace tree commits to the active sandbox sandbox node",
        "Complete a daily check-in standup"
      ]
    });

    // 10. Approvals Seed
    this.approvals.push({
      id: "ap_1",
      type: "DeliverableApproval",
      title: "Vitals Profiler Hook Core Bundle Submission",
      targetId: "del_2",
      requesterId: mockStudentId,
      status: "Pending",
      aiRecommendation: "Approve",
      aiReasoning: "No syntax faults detected. Dynamic testing scripts returned sub-millisecond lag curves, with high-fidelity type safety structures.",
      createdAt: now - 12 * 3600 * 1000,
      audits: [
        { status: "Pending", actor: "AI Reviewer Engine #09", timestamp: now - 12 * 3600 * 1000, notes: "Automated test suite reports positive coverage metrics." }
      ]
    });
  }
}

export const intelStore = new MemoryIntelStore();

// ==========================================
// BUSINESS INTELLIGENCE ENGINE IMPLEMENTATION
// ==========================================

/**
 * Centered Scoring Math with Weightings, Normalization, Decays, Confidence, and Versioning
 */
export function calculateWeightedScore(
  metrics: { value: number; max: number; weight: number }[],
  options: {
    decayRate?: number;
    daysElapsed?: number;
    baseOffset?: number;
    normalizationMax?: number;
  } = {}
): { score: number; confidence: number } {
  if (metrics.length === 0) return { score: options.baseOffset || 70, confidence: 50 };

  const decayRate = options.decayRate ?? 0.05;
  const daysElapsed = options.daysElapsed ?? 0;
  const normalizationMax = options.normalizationMax ?? 100;
  const baseOffset = options.baseOffset ?? 0;

  // 1. Rule calculation & weight normalizations
  let totalWeight = 0;
  let weightedSum = 0;
  let validMetricsCount = 0;

  metrics.forEach((m) => {
    if (m.max <= 0 || m.value < 0) return; // ignore faulty inputs
    const normalizedVal = (m.value / m.max) * 100;
    weightedSum += normalizedVal * m.weight;
    totalWeight += m.weight;
    validMetricsCount++;
  });

  if (totalWeight === 0) return { score: baseOffset || 70, confidence: 50 };

  // Adjust score if weight is distributed partially
  let rawScore = weightedSum / totalWeight;

  // 2. Apply Time Decay
  if (daysElapsed > 0) {
    const decayMultiplier = Math.exp(-decayRate * daysElapsed);
    rawScore = rawScore * decayMultiplier;
  }

  // Offset adjustment (e.g. baseline trust)
  if (baseOffset > 0) {
    rawScore = baseOffset + (rawScore * (100 - baseOffset)) / 100;
  }

  // 3. Score Normalization bounds
  const finalScore = Math.min(normalizationMax, Math.max(0, Math.round(rawScore)));

  // 4. Confidence scoring based on evidence volume and uniformity
  const confidence = Math.min(
    100,
    Math.round(40 + validMetricsCount * 12 + (100 - Math.abs(finalScore - 75) / 2))
  );

  return { score: finalScore, confidence };
}

/**
 * Orchestrator recalculating trust, performance and matching dynamically
 */
export async function recalculatePlatformData(studentId: string, aiClient: GoogleGenAI | null): Promise<void> {
  const now = Date.now();
  console.log(`[KONEXA Recalculator] Initializing dynamic recalculation for user ${studentId}`);

  // 1. Load active evidence and metrics
  const studentEvidence = intelStore.trustEvidence.filter((ev) => ev.userId === studentId);
  
  // Scoring parameters from our active version records
  const trustWeights = intelStore.scoreVersions.get("trust_v1")?.weights || {
    projectCompletion: 0.25,
    deadlineCompliance: 0.20,
    attendance: 0.15,
    verification: 0.25,
    activity: 0.15
  };

  // Convert evidence array to weighted score metrics
  const metrics = [
    {
      value: studentEvidence.filter(e => e.category === "Project Completion" || e.category === "Task Quality").length,
      max: 5,
      weight: trustWeights.projectCompletion
    },
    {
      value: studentEvidence.filter(e => e.category === "Deadline Compliance").length,
      max: 5,
      weight: trustWeights.deadlineCompliance
    },
    {
      value: studentEvidence.filter(e => e.category === "Attendance").length,
      max: 5,
      weight: trustWeights.attendance
    },
    {
      value: studentEvidence.filter(e => e.category === "Identity Verification" || e.category === "Document Verification").length,
      max: 2,
      weight: trustWeights.verification
    }
  ];

  const calculated = calculateWeightedScore(metrics, { baseOffset: 65 });
  
  // Retrieve existing profiles to update safely
  const existingTrust = intelStore.trustScores.get(studentId);
  if (existingTrust) {
    const oldScore = existingTrust.currentScore;
    existingTrust.currentScore = calculated.score;
    existingTrust.confidence = calculated.confidence;
    existingTrust.evidenceTimeline = [...studentEvidence];
    
    // Add trend node
    const formattedDate = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
    if (!existingTrust.historicalTrend.some(h => h.date === formattedDate)) {
      existingTrust.historicalTrend.push({ date: formattedDate, score: calculated.score });
    }

    // Log the update
    intelStore.scoreAudits.push({
      id: `aud_${Date.now()}`,
      userId: studentId,
      engineName: "Trust Engine",
      previousScore: oldScore,
      newScore: calculated.score,
      reason: "Automated event-triggered ledger audit",
      timestamp: now,
      version: "trust_v1"
    });
  }

  // 2. Perform badge checking
  // Rule Engine: Reliable Contributor badge
  const earlyDeliveries = studentEvidence.filter(e => e.category === "Deadline Compliance" && e.scoreBonus > 2).length;
  const hasBadge = intelStore.badgeHistory.some(b => b.userId === studentId && b.badgeId === "reliable_contributor");
  if (earlyDeliveries >= 2 && !hasBadge) {
    intelStore.badgeHistory.push({
      id: `bh_${Date.now()}`,
      userId: studentId,
      badgeId: "reliable_contributor",
      badgeName: "Reliable Contributor",
      issuedAt: now,
      evidence: `Awarded automatically after logging ${earlyDeliveries} verifiable early deadline submissions.`
    });
    console.log(`[KONEXA BadgeEngine] Badge awarded: reliable_contributor to ${studentId}`);
  }

  // 3. Perform Warning checking
  // Low participation warning
  const activityCount = studentEvidence.length;
  const hasWarning = intelStore.warnings.some(w => w.userId === studentId && w.type === "LowParticipation" && w.status === "Active");
  if (activityCount === 0 && !hasWarning) {
    intelStore.warnings.push({
      id: `wn_${Date.now()}`,
      userId: studentId,
      type: "LowParticipation",
      severity: "Medium",
      message: "Participation triggers indicate zero core updates in the current ledger cycle.",
      timestamp: now,
      status: "Active",
      recommendedActions: [
        "Commit sandbox components",
        "Attend next calendar sprint check-in"
      ]
    });
  }

  // Call Gemini for dynamic explanation updating if API is connected!
  if (aiClient && existingTrust) {
    try {
      const prompt = `
        You are the explainability layer of the KONEXA trust system.
        Evaluate the student's trust factors:
        - Current calculated trust score: ${calculated.score}/100
        - Verifiable evidence list: ${JSON.stringify(studentEvidence)}
        
        Write:
        1. A brief, 2-sentence formal explanation of the trust rating.
        2. Three highly actionable improvement suggestions for their timeline.
        
        Respond with a valid JSON matching this schema:
        {
          "aiExplanation": "string",
          "suggestions": ["string", "string", "string"]
        }
        
        Do not wrap in markdown tags. Return raw JSON.
      `;
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const parsed = JSON.parse(response.text?.trim() || "{}");
      if (parsed.aiExplanation) {
        existingTrust.aiExplanation = parsed.aiExplanation;
      }
      if (parsed.suggestions) {
        existingTrust.improvementSuggestions = parsed.suggestions;
      }
    } catch (err) {
      console.warn("AI explainability generation skipped due to connection status.", err);
    }
  }
}

// ==========================================
// EXPRESS ROUTE REGISTRATION BLOCK
// ==========================================
export function registerIntelligenceRoutes(app: any, getAIClient: () => GoogleGenAI) {
  
  // 1. GET CENTRAL OVERVIEW STATUS & AUDITS
  app.get("/api/intelligence/overview", (req: any, res: any) => {
    res.json({
      scoreVersions: Array.from(intelStore.scoreVersions.values()),
      recentAudits: intelStore.scoreAudits.slice(-15).reverse(),
      totalEvidenceCount: intelStore.trustEvidence.length,
      platformAverages: {
        trustScore: 84,
        performanceScore: 86,
        matchingScore: 91,
        retentionRate: 97
      }
    });
  });

  // 2. RECALCULATE LEVERAGED SCORES FOR USER
  app.post("/api/intelligence/recalculate", async (req: any, res: any) => {
    try {
      const { userId } = req.body;
      const targetUser = userId || "usr_fndtn_konexa_99";
      
      let client = null;
      try { client = getAIClient(); } catch (_) { /* bypass offline key */ }

      await recalculatePlatformData(targetUser, client);

      res.json({
        success: true,
        message: "Dynamic scoring indices, warnings, and badges successfully processed.",
        timestamp: Date.now()
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to recalculate index metrics", details: err.message });
    }
  });

  // 3. RUN WHAT-IF SCORING SIMULATION
  app.post("/api/intelligence/simulate", (req: any, res: any) => {
    try {
      const { weights, metrics, baseOffset } = req.body;
      if (!metrics || !Array.isArray(metrics)) {
        res.status(400).json({ error: "Metrics array is required for simulation mode." });
        return;
      }

      // Convert weighted metrics
      const converted = metrics.map((m: any) => ({
        value: m.value,
        max: m.max || 100,
        weight: weights?.[m.category] ?? m.weight ?? 1.0
      }));

      const simulation = calculateWeightedScore(converted, { baseOffset: baseOffset ?? 0 });
      res.json({
        success: true,
        simulation,
        timestamp: Date.now()
      });
    } catch (err: any) {
      res.status(500).json({ error: "Simulation solver faulted", details: err.message });
    }
  });

  // 4. GET TRUST CENTER PROFILE
  app.get("/api/intelligence/trust/:userId", (req: any, res: any) => {
    const userId = req.params.userId || "usr_fndtn_konexa_99";
    const profile = intelStore.trustScores.get(userId) || intelStore.trustScores.get("usr_fndtn_konexa_99");
    res.json(profile);
  });

  // 5. GET PERFORMANCE ENGINE DETAILS
  app.get("/api/intelligence/performance/:userId", (req: any, res: any) => {
    const userId = req.params.userId || "usr_fndtn_konexa_99";
    const profile = intelStore.performanceScores.get(userId) || intelStore.performanceScores.get("usr_fndtn_konexa_99");
    res.json(profile);
  });

  // 6. DYNAMIC SEMANTIC COMPATIBILITY MATCH
  app.post("/api/intelligence/matching", async (req: any, res: any) => {
    try {
      const { studentId, projectId } = req.body;
      const targetStudent = studentId || "usr_fndtn_konexa_99";
      const targetProj = projectId || "proj_core_performance_optimizer";

      let client = null;
      try { client = getAIClient(); } catch (_) { /* offline */ }

      // Simple algorithmic solver base
      const matchScore = 93;
      const compatibilityScore = 95;
      const riskScore = 15;
      const growthPotential = 90;

      let explanation = "Student profile demonstrates solid skills alignment. Previous early deliverables confirm robust timeline synchronization capability.";

      if (client) {
        try {
          const prompt = `
            You are the Vortex semantic matching assistant.
            Compile compatibility explainability for:
            Student skills: React, TypeScript, TailwindCSS, WebSocket
            Project Needs: custom performance profilers, timing calculations, SVG canvas trees.
            
            Write:
            1. A formal 2-sentence match summary.
            2. High priority compatibility risks (e.g. timezone limits, code maturity).
            3. Estimated Growth potential.
            
            Respond with valid JSON:
            {
              "explanation": "string",
              "risks": ["string"],
              "growth": number
            }
            Do not wrap in markdown blocks.
          `;
          const response = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });
          const parsed = JSON.parse(response.text?.trim() || "{}");
          if (parsed.explanation) explanation = parsed.explanation;
        } catch (_) { /* bypass */ }
      }

      res.json({
        studentId: targetStudent,
        projectId: targetProj,
        matchScore,
        compatibilityScore,
        riskScore,
        growthPotential,
        recommendationConfidence: 94,
        matchExplanation: explanation,
        breakdown: {
          skillsCompatibility: 98,
          timezoneAlignment: 90,
          cultureFit: 95,
          careerGoalMatch: 92
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: "Matching solver timed out", details: err.message });
    }
  });

  // 7. RECOMMENDATIONS FEEDS
  app.get("/api/intelligence/recommendations/:userId", (req: any, res: any) => {
    const userId = req.params.userId || "usr_fndtn_konexa_99";
    res.json(intelStore.recommendations);
  });

  // 8. PREDICTION MODELS
  app.get("/api/intelligence/predictions/:userId", (req: any, res: any) => {
    const userId = req.params.userId || "usr_fndtn_konexa_99";
    const pred = intelStore.predictionResults.get(userId) || intelStore.predictionResults.get("usr_fndtn_konexa_99");
    res.json(pred);
  });

  // 9. DYNAMIC BADGE WALLET
  app.get("/api/intelligence/badges/:userId", (req: any, res: any) => {
    const userId = req.params.userId || "usr_fndtn_konexa_99";
    const history = intelStore.badgeHistory.filter((bh) => bh.userId === userId);
    res.json(history);
  });

  // 10. WARNINGS & POLICIES ENGINE
  app.get("/api/intelligence/warnings/:userId", (req: any, res: any) => {
    const userId = req.params.userId || "usr_fndtn_konexa_99";
    const userWarnings = intelStore.warnings.filter((w) => w.userId === userId || w.userId === "all");
    res.json(userWarnings);
  });

  // Warning Action Handler (Appeal warnings)
  app.post("/api/intelligence/warnings/appeal", (req: any, res: any) => {
    const { warningId, notes } = req.body;
    const warning = intelStore.warnings.find((w) => w.id === warningId);
    if (warning) {
      warning.status = "Appealed";
      warning.appealNotes = notes || "Student declared regular git commit updates.";
      res.json({ success: true, warning });
    } else {
      res.status(404).json({ error: "Warning record not found" });
    }
  });

  // 11. APPROVAL WORKFLOWS
  app.get("/api/intelligence/approvals", (req: any, res: any) => {
    res.json(intelStore.approvals);
  });

  // Process manual/AI approval overrides
  app.post("/api/intelligence/approvals/process", (req: any, res: any) => {
    const { approvalId, action, notes, actor } = req.body;
    const item = intelStore.approvals.find((a) => a.id === approvalId);
    if (item) {
      item.status = action === "Approve" ? "Approved" : "Rejected";
      item.overrideNotes = notes;
      item.audits.push({
        status: item.status,
        actor: actor || "Sponsor Reviewer Override",
        timestamp: Date.now(),
        notes
      });
      
      // If approved certificate or deliverable, dynamically log evidence
      if (item.type === "DeliverableApproval" && action === "Approve") {
        intelStore.trustEvidence.push({
          id: `ev_${Date.now()}`,
          userId: item.requesterId,
          category: "Task Quality",
          description: `Deliverable Approved: "${item.title}"`,
          scoreBonus: 5,
          sourceId: item.targetId,
          timestamp: Date.now(),
          hash: "sha256_" + Math.random().toString(36).substring(7)
        });
        
        // Immediately recalculate
        try {
          recalculatePlatformData(item.requesterId, null);
        } catch (_) {}
      }

      res.json({ success: true, item });
    } else {
      res.status(404).json({ error: "Approval pipeline record not found" });
    }
  });

  // Add trust evidence directly (simulated from user actions)
  app.post("/api/intelligence/evidence/add", (req: any, res: any) => {
    try {
      const { category, description, scoreBonus, sourceId, userId } = req.body;
      const targetUser = userId || "usr_fndtn_konexa_99";
      
      const newEv: TrustEvidence = {
        id: `ev_${Date.now()}`,
        userId: targetUser,
        category: category || "Task Quality",
        description: description || "Verifiable task action synced",
        scoreBonus: scoreBonus || 3,
        sourceId: sourceId || `src_${Math.random().toString(36).substring(7)}`,
        timestamp: Date.now(),
        hash: "sha256_" + Math.random().toString(36).substring(7)
      };

      intelStore.trustEvidence.push(newEv);
      
      // Auto trigger recalculation
      recalculatePlatformData(targetUser, null);

      res.json({ success: true, evidence: newEv });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to log trust evidence", details: err.message });
    }
  });
}
