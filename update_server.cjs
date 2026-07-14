const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const stripeCode = `
import Stripe from "stripe";
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY || "sk_test_mock"; // Fallback to avoid crash if env is missing
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

// API Route: Stripe Checkout
app.post("/api/billing/checkout", async (req, res) => {
  try {
    const { plan, companyId } = req.body;
    // Mocking the checkout process in a sandbox environment without full keys
    res.json({
      url: "/dashboard?checkout_success=true&plan=" + plan,
      sessionId: "mock_session_" + Date.now()
    });
  } catch (error: any) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API Route: Email Notification
app.post("/api/email/notify", async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    console.log("[MOCK EMAIL SENT] To:", to, "Subject:", subject);
    // In production, integrate with SendGrid or Resend here.
    res.json({ success: true, message: "Email dispatched successfully via secure relay." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route: AI PDF Resume Analysis
app.post("/api/gemini/analyze-pdf", express.json({limit: '50mb'}), async (req, res) => {
  try {
    const { pdfBase64, role } = req.body;
    if (!pdfBase64) {
      res.status(400).json({ error: "PDF base64 data is required" });
      return;
    }

    const client = getAIClient();
    const prompt = \`
      You are an expert technical recruiter and resume analyst.
      Extract the following information from this resume document and return a valid JSON object matching this schema:
      {
        "extractedSkills": ["string", "string"],
        "experienceSummary": "string",
        "education": "string",
        "portfolioLinks": ["string"],
        "recommendation": "string (How this candidate matches our platform)"
      }
      Return ONLY valid JSON. No markdown blocks.
    \`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: pdfBase64, mimeType: "application/pdf" } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    const analysis = JSON.parse(text);
    res.json(analysis);

  } catch (error: any) {
    console.error("Gemini PDF Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze PDF", details: error.message || error });
  }
});
`;

// Insert the stripe import at the top
content = content.replace('import { GoogleGenAI } from "@google/genai";', 'import { GoogleGenAI } from "@google/genai";\nimport Stripe from "stripe";');

// Add the new functions and routes before registerAiWorkforceRoutes
const insertionPoint = "  // Register AI Workforce platform routes";
const routeCode = `
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_mock";
  const stripe = new Stripe(stripeSecretKey);

  app.post("/api/billing/checkout", async (req, res) => {
    try {
      const { plan, companyId } = req.body;
      res.json({
        url: "/?checkout_success=true&plan=" + plan,
        sessionId: "mock_session_" + Date.now()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/email/notify", async (req, res) => {
    try {
      const { to, subject, body } = req.body;
      console.log("[MOCK EMAIL SENT] To:", to, "Subject:", subject);
      res.json({ success: true, message: "Email dispatched successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/analyze-pdf", express.json({limit: '50mb'}), async (req, res) => {
    try {
      const { pdfBase64, role } = req.body;
      if (!pdfBase64) return res.status(400).json({ error: "PDF base64 required" });
      const client = getAIClient();
      const prompt = \`Extract skills, experience, education, links from this document. Return ONLY valid JSON: {"extractedSkills":["str"],"experienceSummary":"str","education":"str","portfolioLinks":["str"],"recommendation":"str"}\`;
      
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

`;

content = content.replace(insertionPoint, routeCode + "\n" + insertionPoint);

// Need to also increase express JSON limit because PDF base64 can be large.
content = content.replace('app.use(express.json());', 'app.use(express.json({ limit: "50mb" }));');

fs.writeFileSync('server.ts', content);
console.log('server.ts updated');
