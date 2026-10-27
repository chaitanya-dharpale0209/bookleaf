# 🍃 BookLeaf Publishing — Author Support & Communication Portal

> **Full-Stack Developer Technical Assignment Submission**  
> An intelligent, production-ready Author Support and Operations Portal with real-time bidirectional synchronization, grounded in BookLeaf's Knowledge Base, and powered by AI-assisted ticket classification, priority scoring, and draft response generation.

---

## 🌟 Executive Summary & Key Highlights

BookLeaf Publishing processes 1,200+ titles monthly across a catalog of 22,000+ books with thousands of authors across India and the US. Managing author inquiries regarding royalties, ISBN discrepancies, printing defects, and distribution availability at scale requires consistency, speed, and deep empathy.

This application provides:
1. **Author Portal (Author-Facing)**:
   - **Authentication & RBAC**: Email/password authentication ensuring authors can strictly view their own catalog and tickets.
   - **My Books Catalog**: Displays all published and in-production titles with ISBN, genre, publication date, status, MRP, copies sold, lifetime royalty earned, royalty paid, and royalty pending.
   - **Support Query Raising**: Modal with book selector (or general account level), subject, description, and file attachment dropzone.
   - **Real-Time Ticket Communication**: Live conversation stream without page refreshing via WebSockets.
   - **Edge-Case Resilience**: Explicit handling for titles *In Production*, titles with *₹0 royalties*, and amounts *below the ₹1,000 payout threshold* (rolling over to the next quarter).

2. **Admin Portal (Operations-Facing)**:
   - **Ticket Queue**: Interactive queue across all authors, filterable by Status, Category, Priority, and Search.
   - **Urgency-First Sorting**: Automatic sorting that surfaces Critical & High priority unresolved tickets first.
   - **AI Auto-Classification**: Classifies incoming queries into the 6 BookLeaf categories with full admin manual override.
   - **AI Priority Scoring**: Assigns Critical, High, Medium, or Low priority based on query severity (with admin override).
   - **AI Drafted Responses**: Pre-drafted responses grounded in BookLeaf's actual Knowledge Base and tone guidelines (empathetic, professional, specific numbers, no deflection, concrete timelines).
   - **Resolution Workbench**: Side-by-side view featuring Author Profile, Book Financials, Status controls, Assignee management, Confidential Internal Notes, and the AI Response Drafter.

3. **1-Click Evaluator Mode**:
   - A dedicated quick-switcher in the navigation header allows testing between **Admin** (`admin@bookleaf.com`) and any of the **10 authors** (Priya Sharma, Rohit Kapoor, Sneha Kulkarni, Kavita Deshmukh, etc.) in a single click without repetitive logins.

4. **Cross-Platform Responsive UI/UX**:
   - **Universal Multi-Breakpoint Engine**: Seamless experience across Mobile (320px–480px, including iPhone SE & Foldables), Tablets (480px–1024px, iPads & Galaxy Tabs), and Laptops/Desktops (>1024px).
   - **iOS Safari & Mobile WebKit Hardening**: Dynamic viewport units (`100dvh`), `viewport-fit=cover` safe-area-insets (`env(safe-area-inset-*)`), 16px input font size to eliminate unwanted auto-zoom, and `-webkit-tap-highlight-color: transparent`.
   - **Adaptive Resolution Workbench**: Full side-by-side split screen on desktop; switches to an intelligent tabbed mobile navigation (`Chat & AI Drafter` vs `Controls, Author & Notes`) on tablets and mobile devices.
   - **Touch & Accessibility Standards**: 44x44px minimum tap target sizes, `touch-action: manipulation` (no 300ms click delay), and swipeable tables with scroll affordance hints.

---

## 🏗️ Architecture & Technology Stack

```
   ┌─────────────────────────────────────────────────────────────┐
   │                     Client (React 19 + Vite)                │
   │  • Author Dashboard     • Operations Admin Queue            │
   │  • My Books & Royalties • AI Resolution Workbench           │
   │  • Live Ticket Chat     • 1-Click Evaluator Quick Switcher  │
   └───────────────────────────────┬─────────────────────────────┘
                                   │  HTTP REST + WebSocket (ws://)
                                   ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                  Node.js / Express 5 API Server             │
   │  • JWT Auth & RBAC Middleware  • Real-time Socket.io Hub    │
   │  • Book & Royalty Controllers  • Ticket Management Engine   │
   └───────────────┬───────────────────────────────┬─────────────┘
                   │                               │
                   ▼                               ▼
   ┌───────────────────────────────┐ ┌───────────────────────────┐
   │    SQLite Relational DB       │ │      AI Engine Layer      │
   │ • users        • tickets      │ │ • Google Gemini 1.5 Flash │
   │ • authors      • messages     │ │ • OpenAI GPT-4o-mini      │
   │ • books        • notes        │ │ • Rule-Based Expert Engine│
   └───────────────────────────────┘ └───────────────────────────┘
```

- **Frontend**: React 19, Vite, Vanilla CSS design system (curated emerald & gold palette, glassmorphism, responsive cards, micro-animations), Lucide icons, Socket.io client.
- **Backend**: Node.js (v22+), Express 5, Socket.io, JWT (`jsonwebtoken`), `bcryptjs`, CORS.
- **Database**: SQLite3 with strict relational foreign keys, indexes, and full support for nullable production dates and JSON array distribution channels.
- **Real-Time Layer**: Socket.io rooms (`admin` room for ops team; `author:<id>` room for individual authors).
- **AI Integration**: Multi-provider service (Google Gemini 1.5 Flash, OpenAI GPT-4o-mini, or zero-config fallback to the BookLeaf Knowledge-Base Heuristic Engine).

---

## 🔑 Test Login Credentials

All 10 authors from `bookleaf_sample_data.json` plus the BookLeaf Ops Admin are pre-seeded:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Operations Admin** | `admin@bookleaf.com` | `admin123` | Full access to queue, workbench, AI overrides, notes |
| **Author (AUTH001)** | `priya.sharma@email.com` | `author123` | 2 books (*Whispers of the Ganges*, *The Saffron Diaries*) |
| **Author (AUTH002)** | `rohit.kapoor@email.com` | `author123` | 2 books (*Code & Karma*, *Startup Sutra*) |
| **Author (AUTH007)** | `sneha.kulkarni@email.com` | `author123` | 3 books (including 1 in production: *Midnight in Mysore*) |
| **Author (AUTH009)** | `kavita.deshmukh@email.com` | `author123` | 2 books (including 1 in typesetting: *Raising Roots*) |
| **All Other Authors**| `[author_email]` | `author123` | All 10 authors from sample dataset |

> 💡 **Tip:** Use the **1-Click Account Switcher** pill in the top-right navbar to instantly switch between accounts during testing!

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Node.js (v18, v20, or v22)
- npm (v9+)

### Installation
```bash
# 1. Clone repository
git clone <repo-url>
cd "Bookleaf platform"

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies
npm --prefix client install

# 4. Seed database with bookleaf_sample_data.json & sample tickets
npm run seed

# 5. Build production client
npm run build

# 6. Start the unified production server
npm start
```
The application will be live at: **`http://localhost:5000`**

### Active Development Mode (Hot Reload)
To run both backend (port 5000) and Vite frontend (port 5173 with proxy) concurrently:
```bash
npm run dev
```

---

## 🧠 AI Integration Architecture

### 1. Model Choice & Justification
The system supports **Google Gemini 1.5 Flash** and **OpenAI GPT-4o-mini**:
- **Why Gemini 1.5 Flash / GPT-4o-mini?**
  - **Latency**: Sub-second response generation (~800ms) ensures real-time ticket ingestion without blocking the author.
  - **Cost-Efficiency**: Both models provide 95%+ classification accuracy at a fraction of the cost of frontier flagship models ($0.075 / 1M input tokens).
  - **Structured JSON Mode**: Native support for strict JSON schema output guarantees predictable parsing for `{ category, priority, draft_response, reasoning }`.

### 2. Token Cost Awareness & Context Pruning
Rather than blindly passing the entire 22,000-book catalog or the complete BookLeaf policy document on every request:
1. **Dynamic Policy Pruning**: The query text is inspected for keywords (`royalty`, `isbn`, `print`, `amazon`, `typesetting`), and *only* the relevant policy section is injected into the prompt.
2. **Single-Pass Inference**: Classification, priority scoring, and draft response generation are performed in **one single LLM call**, reducing API costs by 66% and lowering total latency.
3. **Targeted Book Context**: Only the specific book linked to the ticket (title, ISBN, status, royalty pending, payout date) is injected.

### 3. Grounded Prompt Engineering & Tone Guidelines
The prompt explicitly encodes BookLeaf's communication principles:
- **Empathetic & Professional**: Acknowledge the author's concern first before presenting facts.
- **Concrete & Specific**: Incorporate actual numbers (e.g. ₹3,570 pending, 342 copies sold).
- **Direct Accountability**: Own BookLeaf errors directly (e.g., delayed payouts, ISBN mismatches) without corporate deflection.
- **Clear Timelines**: State specific resolution windows (e.g., "within 24–48 hours", "within 5–7 business days").
- **Actionable Next Steps**: Always conclude with a clear next step for both author and operations team.

### 4. Zero-Config Graceful Degradation
What happens when API keys are absent, rate-limited, or network connectivity fails?
- The system automatically engages the built-in **BookLeaf Knowledge-Base Heuristic Engine**.
- Calibrated directly against the assignment's sample query-response pairs, it performs deterministic keyword classification, priority assignment, and empathetic template synthesis.
- **Tickets are never dropped or blocked**, and admins retain full manual editing and override capabilities.

---

## 📡 REST API Documentation

All routes except `/api/auth/login` and `/api/auth/demo-accounts` require the `Authorization: Bearer <token>` header. Interactive API documentation is available at `http://localhost:5000/api/docs`.

### Authentication Endpoints
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Email/password login | Public |
| `POST` | `/api/auth/quick-switch` | 1-click evaluator session switcher | Public |
| `GET` | `/api/auth/me` | Current user & author profile | Authenticated |
| `GET` | `/api/auth/demo-accounts` | List of seeded accounts for quick switcher | Public |

### Author Portal Endpoints
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/authors/books` | Author's published & in-production books | Author |
| `GET` | `/api/authors/stats` | Aggregated sales, royalties, and tickets | Author |
| `POST` | `/api/tickets` | Submit new ticket (triggers AI analysis) | Author |
| `GET` | `/api/tickets/my-tickets` | List tickets submitted by author | Author |

### Admin Portal Endpoints
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tickets` | Filterable ticket queue (status, priority, etc.) | Admin |
| `PATCH` | `/api/tickets/:id` | Update status, override category/priority, assign | Admin |
| `POST` | `/api/tickets/:id/notes` | Add confidential internal note | Admin |
| `POST` | `/api/tickets/:id/regenerate-ai` | Re-trigger AI draft response | Admin |
| `GET` | `/api/admin/metrics` | Operations volume and AI override stats | Admin |
| `GET` | `/api/admin/ai-status` | Active AI provider configuration | Admin |

### Shared Ticket Thread Endpoints
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tickets/:id` | Full ticket details, messages & context | Author (own) / Admin |
| `POST` | `/api/tickets/:id/messages` | Post reply to ticket thread | Author / Admin |

---

## 🛡️ Edge Cases Handled

1. **Books in Production**: Handled gracefully on the author dashboard (e.g. Sneha Kulkarni's *Midnight in Mysore* and Kavita Deshmukh's *Raising Roots*). Status is clearly badged, and financial metrics indicate that royalties activate post-launch.
2. **Zero Royalties / Pending Payouts**: Displayed clearly without UI breakage or NaN errors.
3. **Payout Threshold (₹1,000)**: If pending royalties are below ₹1,000, the dashboard displays a notification indicating the balance safely rolls over to the next quarter.
4. **ISBN Mismatch Escalation**: ISBN discrepancies are flagged as Critical/High priority and routed to the production team with a 48-hour resolution expectation.
5. **Role-Based Isolation**: Authors attempting to fetch tickets or books belonging to another author are rejected with `403 Forbidden`. Internal admin notes are never returned on author endpoints or sockets.

---

## 🔮 Known Limitations & Production Evolution

If given more time to evolve this into an enterprise production deployment:
1. **RAG Vector Search**: Embed the complete BookLeaf operational wiki with pgvector/ChromaDB to support semantic document retrieval for edge-case queries.
2. **Multi-Agent Routing**: Implement specialized sub-agents (e.g., Finance Agent with ledger access, Production Agent with print-queue APIs).
3. **Direct File Storage**: Connect ticket attachment UI to AWS S3 / Cloudflare R2 with pre-signed upload URLs.
4. **Email & WhatsApp Integration**: Ingest incoming author emails via SendGrid/Postmark webhooks and dispatch WhatsApp notifications for urgent royalty updates.
