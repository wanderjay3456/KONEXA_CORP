# KONEXA Architecture & System Design Blueprint (Phase 1)

This master architecture document serves as the absolute blueprint and single source of truth for **KONEXA**, the Project-Based Global Hiring Operating System. It defines the foundation for database schemas, Information Architecture (IA), standard design tokens, API patterns, event-driven orchestration, development standards, and AI processing engines.

---

## 1. Information Architecture (IA)

KONEXA has a structured, intuitive route hierarchy where URL paths mirror user scope and permission hierarchies.

```
/ (Landing Page)
├── /about (Our Mission & Philosophy)
├── /features (Operating System Capabilities)
├── /pricing (Enterprise SaaS Tiers)
├── /faq (Frequently Asked Questions)
├── /blog (Insights on Global Hiring & Skill Verification)
├── /contact (Get in Touch)
├── /legal (Privacy Policy, Terms of Service, Security Rules)
├── /auth (Unified Auth Entry)
│   ├── /student (Student Signup/Login)
│   ├── /company (Sponsor Partner Signup/Login)
│   └── /admin (Internal System Administration)
└── /dashboard (Secure Authenticated Portals)
    ├── /student (Portfolio, Real-time Trust Engine, Project Board)
    ├── /company (Project Workspace, Candidate Matcher, Evaluations)
    ├── /admin (Platform Logs, Auditing, Verification Approvals)
    └── /ai-workspace (Interactive Copilot Playground & Agentic Workspace)
```

---

## 2. Enterprise Database Architecture

### Relational Schema (Normalized to 3NF)

Below is the production-grade entity relational structure planned for KONEXA's scalable cloud storage.

```sql
-- 1. Unified Users Master Table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'company', 'admin', 'ai')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 2. Student Profiles
CREATE TABLE students (
    id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    preferred_name VARCHAR(255),
    profile_photo TEXT,
    nationality VARCHAR(100),
    current_country VARCHAR(100),
    university VARCHAR(255),
    degree VARCHAR(100),
    major VARCHAR(255),
    graduation_year VARCHAR(10),
    github_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    resume_url TEXT,
    bio TEXT,
    trust_score INT DEFAULT 80 CHECK (trust_score BETWEEN 0 AND 100),
    completed_projects_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Company / Sponsor Profiles
CREATE TABLE companies (
    id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    website_url VARCHAR(255),
    company_logo TEXT,
    business_reg_number VARCHAR(100),
    country VARCHAR(100),
    industry VARCHAR(150),
    description TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_status VARCHAR(50) DEFAULT 'Pending' CHECK (verified_status IN ('Pending', 'Verified', 'Rejected', 'Suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Projects Master
CREATE TABLE projects (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    company_id VARCHAR(255) REFERENCES companies(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    reward VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'filled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Applications / Submissions
CREATE TABLE applications (
    id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
    student_id VARCHAR(255) REFERENCES students(id) ON DELETE CASCADE,
    code_submission TEXT NOT NULL,
    feedback TEXT,
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'approved', 'rejected')),
    score INT DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. System Logs (Audit trail)
CREATE TABLE logs (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Database Performance & Security Indexes
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_applications_project ON applications(project_id);
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_students_trust_score ON students(trust_score DESC);
```

---

## 3. API Architecture (REST + Realtime Event Sync)

KONEXA conforms to a strict API response format ensuring uniform data transfer.

### Standard JSON Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "metadata": {
    "page": 1,
    "limit": 10,
    "totalCount": 24,
    "hasMore": true,
    "timestamp": 1783584801955
  }
}
```

### API Endpoints Catalog

#### 🔹 Authentication & User Profiles
* `POST /api/auth/register` — Standard register (requires custom Student / Partner data).
* `POST /api/auth/login` — Session creation & authentication hook.
* `PUT /api/student/profile` — Update candidate metrics, CV links, or GitHub metadata.
* `PUT /api/company/profile` — Refine partner introductory profiles and benefits.

#### 🔹 Project & Collaboration Actions
* `GET /api/projects` — Fetch verified challenges. Supports `difficulty` filtering & page parameters.
* `POST /api/projects` — Establish a new company challenge.
* `POST /api/projects/:id/apply` — Standardized candidate codebase submit route.

#### 🔹 Evaluations & Meet Video Integrations
* `POST /api/gemini/evaluate` — Standard POST route evaluating student code directly via server-hidden Gemini API.
* `POST /api/google/meet` — Connects to Meet V2 APIs, registering secure room links on behalf of sponsors and candidate devs.

---

## 4. Event-Driven Architecture (EDA)

Every high-value transaction in KONEXA fires a decoupled event, keeping real-time engines perfectly synchronized.

### Core Domain Events

| Event Identifier | Publisher Component | Core Subscribers | Side-Effects & Actions |
| :--- | :--- | :--- | :--- |
| `StudentCreated` | Auth Service / Onboarding | Trust Engine, Analytics | Initializes the Trust Score baseline to **80** |
| `ProjectCreated` | Company Dashboard | Project Feed, Notification System | Notifies students matching the project's tags |
| `ApplicationSubmitted` | Student Workspace | Gemini AI, Auditing Engine | Evaluates code metrics via Gemini, updates logs |
| `AIAnalysisCompleted` | Gemini API service | Trust Score Engine, Partner Feed | Auto-updates Application score & increases Trust Score |
| `GitHubConnected` | Integration Manager | Trust Engine, Profile Builder | Scrapes student public repos to calculate skill weightings |

---

## 5. AI System & Copilot Architecture

The AI layer in KONEXA uses Google Gemini to verify, assist, and optimize without compromising human trust.

```
                                  [ Gemini API Key (Server-Side) ]
                                                │
                                                ▼
     [ API Proxy Layer ] ──► [ Model Provider: gemini-2.5-flash / gemini-2.5-pro ]
              │                                 │
              ▼                                 ▼
   [ AI Resume Parser ]             [ AI Code Evaluator ]             [ AI Matching Engine ]
   - Analyzes PDF formats           - Reviews code submissions         - Matches developers
   - Extract skills / scores        - Validates project criteria        - Weighs Trust scores
```

* **Model Provider**: `gemini-2.5-flash` for high-throughput, low-latency evaluation; `gemini-2.5-pro` for deep code analysis and contextual matching.
* **Embedding Layer**: Text embeddings for matching company project descriptions with student portfolios.
* **Prompt Management**: Centralized prompt templates in code variables to ensure consistent evaluation output structure.

---

## 6. Design Tokens (The Design System)

Central design values defined in `/src/config/designTokens.ts` are bound to standard CSS variables:

* **Colors**: Pure Contrast Slate (`#000000`, `#0A0A0A`, `#171717`) paired with soft minimalist neutral borders (`#E5E5E5`, `#F5F5F5`) and **Emerald Accent** (`#10B981`) representing trust.
* **Typography**: Primary interface text using **Inter**; technical stats and system actions use **JetBrains Mono**; main titles use **Space Grotesk**.
* **Spacing**: Consistent 4px grid progression, utilizing spacing variables `0.5` through `16` to form perfect layouts.
* **Transitions**: Smooth duration values (`150ms`, `250ms`, `350ms`) with ease timing curves (`cubic-bezier(0.4, 0, 0.2, 1)`) for micro-interactions.

---

## 7. Development Standards

* **Naming Conventions**:
  * Files and Directories: PascalCase for React Components (e.g., `StudentDashboard.tsx`), camelCase for utility code (e.g., `eventSystem.ts`).
  * Database: lower_snake_case for Postgres schema structures and columns.
* **Accessibility (a11y)**: Focus rings on active tabs, minimum 4.5:1 text-to-background contrast, clean hover/active feedback, and proper `aria-labels` on form elements.
* **Security & Sandboxing**: All third-party secrets and API keys are kept strictly on the backend proxy server (`server.ts`). Iframe API limitations are bypassed with clear browser link integrations and secure standard popup instructions.

---

*This blueprint establishes a production-ready, highly reliable standard that paves the way for KONEXA's enterprise scaling.*
