import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { registerAiWorkforceRoutes } from "./src/lib/aiServerBackend";
import { registerIntelligenceRoutes } from "./src/lib/intelligenceBackend";
import { registerAdminRoutes } from "./src/lib/adminBackend";
import { registerBillingRoutes, registerStripeWebhook } from "./src/server/billing";
import { registerEmailRoutes, registerResendWebhook } from "./src/server/email";
import { requireAuth, requireRole, type AuthenticatedRequest } from "./src/server/security";
import { adminDb, FieldValue } from "./src/server/supabaseAdmin";

// Load environment variables
dotenv.config({ path: [".env.local", ".env"] });

// Lazy initialize Google Gen AI
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

function validateProductionConfiguration() {
  if (process.env.NODE_ENV !== "production") return;
  const required = [
    "APP_URL",
    "SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "GEMINI_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_PRO_MONTHLY",
    "RESEND_API_KEY",
    "RESEND_WEBHOOK_SECRET",
    "EMAIL_FROM",
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing production environment variables: ${missing.join(", ")}`);
  if (!process.env.APP_URL?.startsWith("https://")) throw new Error("APP_URL must use HTTPS in production");
  if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") && process.env.STRIPE_ALLOW_TEST_MODE !== "true") {
    throw new Error("A live Stripe key is required in production");
  }
}

async function startServer() {
  validateProductionConfiguration();
  const app = express();
  const PORT = Number.parseInt(process.env.PORT || "3000", 10);

  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error("PORT must be a valid TCP port number");
  }

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet({ contentSecurityPolicy: false }));

  // Signed webhooks must receive the unmodified raw request body.
  registerStripeWebhook(app);
  registerResendWebhook(app);

  app.use(express.json({ limit: "12mb" }));
  app.use("/api", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }));

  const aiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });

  app.use("/api/gemini", requireAuth, aiRateLimit);
  app.use("/api/ai", requireAuth, aiRateLimit);
  app.use("/api/intelligence", requireAuth);
  app.use("/api/billing", requireAuth, requireRole("company"));
  app.use("/api/email", requireAuth);
  app.use("/api/admin", requireAuth, requireRole("admin"));

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: Date.now(),
      configuration: {
        gemini: Boolean(process.env.GEMINI_API_KEY),
        stripe: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_PRICE_PRO_MONTHLY),
        email: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_WEBHOOK_SECRET && process.env.EMAIL_FROM),
      },
    });
  });

  // API Route: AI Code Evaluation
  app.post("/api/gemini/evaluate", async (req: AuthenticatedRequest, res) => {
    try {
      const { applicationId } = req.body;
      if (!applicationId || !req.user?.uid) {
        res.status(400).json({ error: "Application ID is required" });
        return;
      }

      const applicationRef = adminDb.collection("applications").doc(applicationId);
      const applicationSnapshot = await applicationRef.get();
      const application = applicationSnapshot.data();
      if (!applicationSnapshot.exists) {
        res.status(404).json({ error: "Application not found" });
        return;
      }
      if (application?.studentId !== req.user.uid && req.user.role !== "admin") {
        res.status(403).json({ error: "You cannot evaluate this application" });
        return;
      }

      const projectSnapshot = await adminDb.collection("projects").doc(application?.projectId).get();
      const requirements = projectSnapshot.data()?.requirements || ["Clean code", "Proper TypeScript types", "Scalable structure"];
      const code = application?.codeSubmission;
      const projectTitle = application?.projectTitle || projectSnapshot.data()?.title || "SaaS Component";
      if (!code) throw new Error("The application has no code submission");

      const client = getAIClient();
      const prompt = `
        You are an elite, world-class staff software engineer and code evaluator at KONEXA, a premium project-first hiring platform.
        Evaluate the following student's code submission for the project "${projectTitle || "SaaS Component"}".

        Project Requirements:
        ${JSON.stringify(requirements || ["Clean code", "Proper TypeScript types", "Scalable structure"])}

        Student Code Submission:
        \`\`\`typescript
        ${code}
        \`\`\`

        Provide a critical, fair, and encouraging code review. Your evaluation MUST be returned as a valid JSON object matching the following structure:
        {
          "score": number (an integer between 40 and 100 based on code quality, correctness, and adherence to requirements),
          "feedback": "string (a high-level professional summary of the submission, around 3-4 sentences)",
          "strengths": ["string", "string", ...],
          "improvements": ["string", "string", ...]
        }

        Do not wrap the response in markdown code blocks. Return ONLY the raw JSON.
      `;

      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini API");
      }

      const evaluation = JSON.parse(text);
      const feedback = `[KONEXA AI evaluation summary] ${evaluation.feedback}\n\n**Strengths:**\n${(evaluation.strengths || []).map((item: string) => `- ${item}`).join("\n")}\n\n**Recommended Improvements:**\n${(evaluation.improvements || []).map((item: string) => `- ${item}`).join("\n")}`;
      const score = Math.max(0, Math.min(100, Number(evaluation.score) || 0));
      const batch = adminDb.batch();
      batch.update(applicationRef, { status: "reviewed", score, feedback, evaluatedAt: FieldValue.serverTimestamp() });
      batch.set(adminDb.collection("student_profiles").doc(application.studentId), {
        trustScore: FieldValue.increment(Math.round(score / 10)),
        completedProjects: FieldValue.increment(1),
      }, { merge: true });
      await batch.commit();
      res.json(evaluation);
    } catch (error: any) {
      console.error("Gemini Evaluation Error:", error);
      res.status(500).json({
        error: "Failed to evaluate code submission",
        details: error.message || error
      });
    }
  });

  // API Route: AI Assistant Chat (Multi-turn)
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Messages array is required" });
        return;
      }

      const client = getAIClient();

      // Convert input messages to the format expected by the GoogleGenAI SDK
      // The content structure should map to the standard SDK chat structures
      const formattedContents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const systemInstruction = `
        You are KONEXA AI, the intelligent backbone of KONEXA, the world's most advanced project-first hiring platform.
        Your goal is to guide students on their coding journeys, explain software architecture, review technical specifications,
        and help companies draft robust project challenges.
        Be encouraging, deeply technical, precise, and professional. Use markdown formatting beautifully.
      `;

      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: systemInstruction
        }
      });

      const reply = response.text;
      res.json({ reply });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({
        error: "Failed to generate chat response",
        details: error.message || error
      });
    }
  });

  // API Route: AI Profile Analysis
  app.post("/api/gemini/analyze-profile", async (req, res) => {
    try {
      const { profile, role } = req.body;
      if (!profile) {
        res.status(400).json({ error: "Profile data is required" });
        return;
      }

      const client = getAIClient();
      let prompt = "";

      if (role === "student" || !role) {
        prompt = `
          You are the lead AI Recruiter and Growth Coach at KONEXA.
          Perform a high-integrity technical profile analysis of the following student profile:
          ${JSON.stringify(profile)}

          Review their academic background, listed technical skills, biography/pitch, and preferred job targets.
          You MUST respond with a valid JSON object matching this schema:
          {
            "strengthSummary": "string (2-3 sentences summarizing key strengths)",
            "weaknessSummary": "string (2-3 sentences outlining development areas)",
            "skillGap": ["string", "string", ...],
            "recommendedSkills": ["string", "string", ...],
            "recommendedProjects": ["string", "string", ...],
            "recommendedCompanies": ["string", "string", ...],
            "recommendedLearningPath": ["string", "string", ...],
            "careerReadiness": number (integer between 50 and 100),
            "employabilityScore": number (integer between 50 and 100)
          }

          Be critical but constructive. Ensure response is valid raw JSON only. Do not wrap in markdown blocks.
        `;
      } else {
        prompt = `
          You are the lead AI Recruiter and Growth Coach at KONEXA.
          Perform a high-integrity corporate talent acquisition strategy analysis of this company partner profile:
          ${JSON.stringify(profile)}

          Review their company description, target majors, required skills, and benefits.
          You MUST respond with a valid JSON object matching this schema:
          {
            "strengthSummary": "string (2-3 sentences summarizing partner talent advantages)",
            "weaknessSummary": "string (2-3 sentences outlining potential hiring challenges)",
            "skillGap": ["string", "string", ...],
            "recommendedSkills": ["string", "string", ...],
            "recommendedProjects": ["string", "string", ...],
            "recommendedCompanies": ["string", "string", ...],
            "recommendedLearningPath": ["string", "string", ...],
            "careerReadiness": number (integer between 50 and 100),
            "employabilityScore": number (integer between 50 and 100)
          }

          Be critical but constructive. Ensure response is valid raw JSON only. Do not wrap in markdown blocks.
        `;
      }

      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini API");
      }

      const analysis = JSON.parse(text);
      res.json(analysis);
    } catch (error: any) {
      console.error("Gemini Profile Analysis Error:", error);
      res.status(500).json({
        error: "Failed to analyze profile",
        details: error.message || error
      });
    }
  });

  registerBillingRoutes(app);
  registerEmailRoutes(app);

  app.post("/api/gemini/analyze-pdf", async (req, res) => {
    try {
      const { pdfBase64, role } = req.body;
      if (!pdfBase64) return res.status(400).json({ error: "PDF base64 required" });
      const client = getAIClient();
      const prompt = `Extract skills, experience, education, links from this document. Return ONLY valid JSON: {"extractedSkills":["str"],"experienceSummary":"str","education":"str","portfolioLinks":["str"],"recommendation":"str"}`;
      
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [
            { inlineData: { data: pdfBase64, mimeType: "application/pdf" } },
            { text: prompt }
          ]}
        ],
        config: { responseMimeType: "application/json" }
      });
      res.json(JSON.parse(response.text));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // Register AI Workforce platform routes
  registerAiWorkforceRoutes(app, getAIClient);

  // Register Core Intelligence Platform routes
  registerIntelligenceRoutes(app, getAIClient);

  // Register Enterprise Admin routes (Phase 9)
  registerAdminRoutes(app, getAIClient);

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[KONEXA Core Server] Running on http://localhost:${PORT}`);
    console.log(`[KONEXA Core Server] Mode: ${process.env.NODE_ENV || "development"}`);
  });

  const shutdown = (signal: string) => {
    console.log(`[KONEXA Core Server] ${signal} received. Shutting down...`);
    server.close((error) => {
      if (error) {
        console.error("Failed to close the HTTP server cleanly:", error);
        process.exit(1);
      }
      process.exit(0);
    });
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exitCode = 1;
});
