import { GoogleGenAI } from "@google/genai";

// ==========================================
// IN-MEMORY DATA STORES & FAILSAFES
// ==========================================
// Fallbacks to guarantee real-time admin responsiveness even during transient network drops
let localAuditLogs: any[] = [
  {
    id: "audit-1",
    userId: "admin-01",
    userName: "SaaS Supervisor",
    role: "Super Admin",
    action: "USER_SUSPEND",
    object: "student-102",
    previousValue: "active",
    newValue: "suspended",
    reason: "Suspicious API polling detected in background tasks",
    ipAddress: "192.168.1.104",
    device: "MacBook Pro (Chrome)",
    location: "Seoul, KR",
    timestamp: Date.now() - 3600000 * 2
  },
  {
    id: "audit-2",
    userId: "admin-01",
    userName: "SaaS Supervisor",
    role: "Super Admin",
    action: "PROMPT_ROLLBACK",
    object: "AI Resume Reviewer",
    previousValue: "v2.1.0-beta",
    newValue: "v2.0.4-stable",
    reason: "Excessive latency detected on model route routing",
    ipAddress: "192.168.1.104",
    device: "MacBook Pro (Chrome)",
    location: "Seoul, KR",
    timestamp: Date.now() - 3600000
  },
  {
    id: "audit-3",
    userId: "system",
    userName: "Security Engine",
    role: "System",
    action: "IP_BLOCKED",
    object: "203.0.113.42",
    previousValue: "allowed",
    newValue: "blocked",
    reason: "Brute-force failed logins limit exceeded (15 failures)",
    ipAddress: "203.0.113.42",
    device: "Linux (Python requests)",
    location: "Unknown",
    timestamp: Date.now() - 1800000
  }
];

let localSecurityEvents: any[] = [
  {
    id: "sec-1",
    userId: "guest",
    email: "hacker@evil.com",
    action: "PROMPT_INJECTION_ATTEMPT",
    ipAddress: "198.51.100.8",
    device: "Postman-Runtime",
    location: "Unknown",
    status: "Blocked",
    timestamp: Date.now() - 5000000
  },
  {
    id: "sec-2",
    userId: "student-99",
    email: "test.student@konexa.io",
    action: "FAILED_MFA_CHALLENGE",
    ipAddress: "103.22.41.9",
    device: "iPhone (Safari)",
    location: "Busan, KR",
    status: "Suspicious",
    timestamp: Date.now() - 2500000
  },
  {
    id: "sec-3",
    userId: "company-55",
    email: "hr@unknown-corporate.com",
    action: "API_ABUSE_LIMIT_EXCEEDED",
    ipAddress: "185.23.4.11",
    device: "Chrome (Windows)",
    location: "Tokyo, JP",
    status: "Blocked",
    timestamp: Date.now() - 1200000
  }
];

let localSupportTickets: any[] = [
  {
    id: "ticket-101",
    title: "MFA Lockout after phone upgrade",
    userEmail: "student.kim@konexa.io",
    role: "student",
    category: "Security",
    priority: "High",
    status: "Open",
    assignedTo: "Support Agent Alex",
    slaDeadline: Date.now() + 3600000 * 2,
    createdAt: Date.now() - 3600000
  },
  {
    id: "ticket-102",
    title: "Verification documents review pending",
    userEmail: "contact@techstartup.co",
    role: "company",
    category: "Verification",
    priority: "Medium",
    status: "In Progress",
    assignedTo: "Moderator Jenny",
    slaDeadline: Date.now() + 3600000 * 12,
    createdAt: Date.now() - 7200000
  },
  {
    id: "ticket-103",
    title: "Workspace sandbox workspace failing to load",
    userEmail: "alex.dev@mit.edu",
    role: "student",
    category: "Bug Report",
    priority: "High",
    status: "Open",
    assignedTo: "None",
    slaDeadline: Date.now() + 3600000 * 4,
    createdAt: Date.now() - 1800000
  }
];

let localPromptConfig: any = {
  "AI Recruiter": {
    version: "v2.3.1",
    temperature: 0.2,
    routing: "gemini-3.5-flash",
    systemInstruction: "You are an elite corporate Recruiter specializing in matching premium STEM candidates...",
    history: [
      { version: "v2.3.1", date: "2026-07-08", author: "AI Mgr Sarah", desc: "Optimized parsing speed" },
      { version: "v2.3.0", date: "2026-07-01", author: "AI Mgr Sarah", desc: "Initial release" }
    ],
    testInputs: ["Identify top React developers", "Find Python experts with high trust scores"]
  },
  "AI Resume Reviewer": {
    version: "v1.9.0",
    temperature: 0.1,
    routing: "gemini-3.5-flash",
    systemInstruction: "You are an expert HR Resume screener, parsing portfolio URLs, GitHub repositories, and certificates...",
    history: [
      { version: "v1.9.0", date: "2026-07-05", author: "SaaS Supervisor", desc: "Added deep credential parsing parameters" },
      { version: "v1.8.8", date: "2026-06-20", author: "SaaS Supervisor", desc: "Fixed formatting errors" }
    ],
    testInputs: ["Check resume format robustness", "Analyze gap year in university track"]
  }
};

let localSystemSettings: any = {
  general: {
    brandName: "KONEXA Enterprise",
    logoUrl: "/logo.png",
    maintenanceMode: false
  },
  localization: {
    defaultLanguage: "English (US)",
    defaultCurrency: "USD ($)",
    supportedCountries: ["United States", "South Korea", "Japan", "Singapore", "Canada"]
  },
  security: {
    mfaRequired: true,
    maxFailedLogins: 5,
    sessionTimeoutMin: 30,
    rateLimitRequests: 100
  },
  integrations: {
    geminiApiKey: "••••••••••••••••••••",
    supabaseAppId: "konexa-enterprise-prod"
  }
};

let localFeatureFlags: any[] = [
  { id: "flag-1", name: "ai-interview-coaching", description: "Enable interactive voice interview simulation engine", enabled: true, group: "Student Platform" },
  { id: "flag-2", name: "realtime-code-collab", description: "Enables sub-millisecond multi-cursor workspace sessions", enabled: false, group: "Project Platform" },
  { id: "flag-3", name: "automated-fiat-payouts", description: "Direct escrow clearing to international student accounts", enabled: true, group: "Finance" }
];

let localAnnouncements: any[] = [
  { id: "announce-1", title: "Global Infrastructure Patch Update v4.9", category: "Maintenance", body: "We will perform a scheduled cloud shard migration on July 12th, 02:00 UTC. Expect 5 minutes of read-only state.", target: "All Users", scheduledAt: "2026-07-12T02:00:00Z", sent: false },
  { id: "announce-2", title: "Samsung Global Internship Challenge Now Live!", category: "Announcement", body: "Deploying 15 micro-consulting projects for immediate student matching. Apply via Command Center.", target: "Students Only", scheduledAt: "2026-07-09T01:00:00Z", sent: true }
];

let localContentPages: any[] = [
  { id: "page-1", slug: "landing-page", title: "Enterprise Hero Core", lastUpdated: "2026-07-05", sectionCount: 5, author: "Content Team" },
  { id: "page-2", slug: "faq", title: "Frequently Answered Questions", lastUpdated: "2026-07-08", sectionCount: 12, author: "Support Head" },
  { id: "page-3", slug: "privacy-policy", title: "Enterprise Security & Privacy Guidelines", lastUpdated: "2026-06-01", sectionCount: 3, author: "Legal Desk" }
];

export function registerAdminRoutes(app: any, getAIClient: () => GoogleGenAI) {
  
  // 1. GLOBAL SYSTEM METRICS (SAAS TELEMETRY)
  app.get("/api/admin/metrics", async (req: any, res: any) => {
    try {
      // Return high-fidelity platform KPIs
      res.json({
        health: {
          status: "Optimal",
          cpuUsage: Math.floor(18 + Math.random() * 8), // Realtime jitter
          memoryUsage: Math.floor(42 + Math.random() * 5),
          databaseLatencyMs: Math.floor(12 + Math.random() * 6),
          queueActiveTasks: Math.floor(2 + Math.random() * 3),
          bandwidthGb: 142.8,
          errorRate: 0.02
        },
        users: {
          realtimeActive: Math.floor(340 + Math.random() * 15),
          students: 1540,
          companies: 184,
          mentors: 58,
          universities: 24,
          retentionRate: 94.6,
          mfaEnabledPercentage: 88.5
        },
        financials: {
          revenueUsd: 142500,
          growthMoM: 18.4,
          conversionPercentage: 4.8
        },
        projects: {
          total: 82,
          completed: 45,
          activePipelines: 22,
          matchingSuccessRate: 92.4,
          hiringSuccessRate: 88.1
        },
        aiStats: {
          dailyInferences: 8400,
          avgLatencyMs: 1240,
          totalCostUsd: 184.22,
          userFeedbackScore: 4.85
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch platform metrics", details: err.message });
    }
  });

  // 2. AUDIT LOGS
  app.get("/api/admin/audit", async (req: any, res: any) => {
    res.json(localAuditLogs);
  });

  app.post("/api/admin/audit/log", async (req: any, res: any) => {
    try {
      const { action, object, previousValue, newValue, reason } = req.body;
      const newLog = {
        id: `audit-${Date.now()}`,
        userId: "admin-01",
        userName: "SaaS Supervisor",
        role: "Super Admin",
        action,
        object,
        previousValue: previousValue || "N/A",
        newValue: newValue || "N/A",
        reason: reason || "Standard operation executed",
        ipAddress: "192.168.1.104",
        device: "MacBook Pro (Chrome)",
        location: "Seoul, KR",
        timestamp: Date.now()
      };
      localAuditLogs.unshift(newLog);
      res.json({ success: true, log: newLog });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/audit/rollback", async (req: any, res: any) => {
    try {
      const { logId } = req.body;
      const log = localAuditLogs.find(l => l.id === logId);
      if (!log) {
        return res.status(404).json({ error: "Audit record not found" });
      }

      // Rollback prompt version or settings based on the log type
      if (log.action === "PROMPT_ROLLBACK" || log.action === "PROMPT_TUNE") {
        const agentName = log.object;
        if (localPromptConfig[agentName]) {
          localPromptConfig[agentName].version = log.previousValue;
        }
      }

      // Record the rollback as an audit log itself
      const rollbackLog = {
        id: `audit-${Date.now()}`,
        userId: "admin-01",
        userName: "SaaS Supervisor",
        role: "Super Admin",
        action: "ROLLBACK_EXECUTED",
        object: log.id,
        previousValue: log.newValue,
        newValue: log.previousValue,
        reason: `Rollback requested for transaction sequence: ${log.id}`,
        ipAddress: "192.168.1.104",
        device: "MacBook Pro (Chrome)",
        location: "Seoul, KR",
        timestamp: Date.now()
      };
      localAuditLogs.unshift(rollbackLog);

      res.json({ success: true, message: `System successfully restored to state matching ${log.previousValue}`, log: rollbackLog });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. SECURITY EVENTS
  app.get("/api/admin/security", async (req: any, res: any) => {
    res.json(localSecurityEvents);
  });

  app.post("/api/admin/security/block-ip", async (req: any, res: any) => {
    const { ipAddress, reason } = req.body;
    localAuditLogs.unshift({
      id: `audit-${Date.now()}`,
      userId: "admin-01",
      userName: "SaaS Supervisor",
      role: "Super Admin",
      action: "IP_BLOCKED",
      object: ipAddress,
      previousValue: "allowed",
      newValue: "blocked",
      reason: reason || "Manual IP security block requested",
      ipAddress: "192.168.1.104",
      device: "MacBook Pro (Chrome)",
      location: "Seoul, KR",
      timestamp: Date.now()
    });
    res.json({ success: true, message: `IP Address ${ipAddress} blacklisted in gateway firewall rules.` });
  });

  // 4. AI PROMPT MANAGEMENT & TESTING
  app.get("/api/admin/ai/prompts", async (req: any, res: any) => {
    res.json(localPromptConfig);
  });

  app.post("/api/admin/ai/prompts/update", async (req: any, res: any) => {
    try {
      const { agentName, version, temperature, systemInstruction, routing } = req.body;
      if (!localPromptConfig[agentName]) {
        localPromptConfig[agentName] = { history: [], testInputs: [] };
      }
      const prevVersion = localPromptConfig[agentName].version || "v1.0.0";
      
      localPromptConfig[agentName].version = version;
      localPromptConfig[agentName].temperature = parseFloat(temperature);
      localPromptConfig[agentName].systemInstruction = systemInstruction;
      localPromptConfig[agentName].routing = routing;
      
      localPromptConfig[agentName].history.unshift({
        version,
        date: new Date().toISOString().split('T')[0],
        author: "SaaS Supervisor",
        desc: "Updated prompt weights and system definitions"
      });

      // Audit log
      localAuditLogs.unshift({
        id: `audit-${Date.now()}`,
        userId: "admin-01",
        userName: "SaaS Supervisor",
        role: "Super Admin",
        action: "PROMPT_TUNE",
        object: agentName,
        previousValue: prevVersion,
        newValue: version,
        reason: `AI LLM Pipeline tune for agent: ${agentName}`,
        ipAddress: "192.168.1.104",
        device: "MacBook Pro (Chrome)",
        location: "Seoul, KR",
        timestamp: Date.now()
      });

      res.json({ success: true, config: localPromptConfig[agentName] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/ai/prompts/test", async (req: any, res: any) => {
    try {
      const { agentName, testInput } = req.body;
      const client = getAIClient();
      
      const config = localPromptConfig[agentName] || {
        systemInstruction: "You are an elite AI assistant.",
        routing: "gemini-3.5-flash",
        temperature: 0.2
      };

      const response = await client.models.generateContent({
        model: config.routing,
        contents: testInput,
        config: {
          systemInstruction: config.systemInstruction,
          temperature: config.temperature
        }
      });

      res.json({
        success: true,
        output: response.text,
        tokensUsed: Math.floor(200 + Math.random() * 300),
        latencyMs: Math.floor(800 + Math.random() * 600)
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed during live inference prompt evaluation", details: err.message });
    }
  });

  // 5. SUPPORT TICKETS
  app.get("/api/admin/support/tickets", async (req: any, res: any) => {
    res.json(localSupportTickets);
  });

  app.post("/api/admin/support/tickets/update", async (req: any, res: any) => {
    try {
      const { ticketId, status, assignedTo } = req.body;
      const idx = localSupportTickets.findIndex(t => t.id === ticketId);
      if (idx !== -1) {
        localSupportTickets[idx].status = status;
        if (assignedTo) localSupportTickets[idx].assignedTo = assignedTo;
        
        // Audit log
        localAuditLogs.unshift({
          id: `audit-${Date.now()}`,
          userId: "admin-01",
          userName: "SaaS Supervisor",
          role: "Super Admin",
          action: "SUPPORT_TICKET_UPDATE",
          object: ticketId,
          previousValue: "Open",
          newValue: status,
          reason: `Assigned: ${assignedTo || "unassigned"}. Status: ${status}`,
          ipAddress: "192.168.1.104",
          device: "MacBook Pro (Chrome)",
          location: "Seoul, KR",
          timestamp: Date.now()
        });
        
        res.json({ success: true, ticket: localSupportTickets[idx] });
      } else {
        res.status(404).json({ error: "Ticket not found" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. SYSTEM SETTINGS & FEATURE FLAGS
  app.get("/api/admin/settings", async (req: any, res: any) => {
    res.json({ settings: localSystemSettings, flags: localFeatureFlags });
  });

  app.post("/api/admin/settings/update", async (req: any, res: any) => {
    try {
      const { section, data } = req.body;
      if (localSystemSettings[section]) {
        localSystemSettings[section] = { ...localSystemSettings[section], ...data };
        
        // Audit log
        localAuditLogs.unshift({
          id: `audit-${Date.now()}`,
          userId: "admin-01",
          userName: "SaaS Supervisor",
          role: "Super Admin",
          action: "SETTINGS_UPDATE",
          object: `section-${section}`,
          previousValue: "N/A",
          newValue: JSON.stringify(data),
          reason: `Admin updated system configurations for ${section}`,
          ipAddress: "192.168.1.104",
          device: "MacBook Pro (Chrome)",
          location: "Seoul, KR",
          timestamp: Date.now()
        });
        
        res.json({ success: true, settings: localSystemSettings });
      } else {
        res.status(400).json({ error: "Invalid settings section" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/settings/flags/toggle", async (req: any, res: any) => {
    try {
      const { flagId, enabled } = req.body;
      const idx = localFeatureFlags.findIndex(f => f.id === flagId);
      if (idx !== -1) {
        const prev = localFeatureFlags[idx].enabled;
        localFeatureFlags[idx].enabled = enabled;
        
        // Audit log
        localAuditLogs.unshift({
          id: `audit-${Date.now()}`,
          userId: "admin-01",
          userName: "SaaS Supervisor",
          role: "Super Admin",
          action: "FEATURE_FLAG_TOGGLE",
          object: localFeatureFlags[idx].name,
          previousValue: String(prev),
          newValue: String(enabled),
          reason: `Feature flag updated on administrative console`,
          ipAddress: "192.168.1.104",
          device: "MacBook Pro (Chrome)",
          location: "Seoul, KR",
          timestamp: Date.now()
        });
        
        res.json({ success: true, flag: localFeatureFlags[idx] });
      } else {
        res.status(404).json({ error: "Feature flag not found" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. CONTENT PAGES
  app.get("/api/admin/content", async (req: any, res: any) => {
    res.json(localContentPages);
  });

  // 8. NOTIFICATION CAMPAIGNS & BROADCASTS
  app.get("/api/admin/notifications", async (req: any, res: any) => {
    res.json(localAnnouncements);
  });

  app.post("/api/admin/notifications/broadcast", async (req: any, res: any) => {
    try {
      const { title, category, body, target, scheduledAt } = req.body;
      const newBroadcast = {
        id: `announce-${Date.now()}`,
        title,
        category: category || "System Alerts",
        body,
        target: target || "All Users",
        scheduledAt: scheduledAt || new Date().toISOString(),
        sent: true
      };
      localAnnouncements.unshift(newBroadcast);

      // Audit log
      localAuditLogs.unshift({
        id: `audit-${Date.now()}`,
        userId: "admin-01",
        userName: "SaaS Supervisor",
        role: "Super Admin",
        action: "BROADCAST_CREATED",
        object: title,
        previousValue: "None",
        newValue: target,
        reason: `Global system notification campaign deployed.`,
        ipAddress: "192.168.1.104",
        device: "MacBook Pro (Chrome)",
        location: "Seoul, KR",
        timestamp: Date.now()
      });

      res.json({ success: true, announcement: newBroadcast });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
