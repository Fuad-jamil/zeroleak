# ZeroLeak 🛡️
### 100% Client-Side Reversible AI Prompt Sanitizer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tests](https://img.shields.io/badge/Tests-18%2F18%20Passing-brightgreen?logo=vitest&logoColor=white)](#automated-testing--security-verification)
[![Security Audit](https://img.shields.io/badge/Audit-ZL--REDTEAM--2026--001-blueviolet)](#hardened-detection-engine)
[![CSP](https://img.shields.io/badge/CSP-connect--src%20'none'-success)](#-100-client-side-privacy-guarantee)
[![Network: Zero](https://img.shields.io/badge/Network-0B_Outbound-emerald.svg)](#-100-client-side-privacy-guarantee)

> **ZeroLeak** prevents accidental corporate and personal data leaks to Large Language Models (ChatGPT, Claude, Gemini, DeepSeek, Copilot). It automatically detects and masks database URIs, API keys, private IPs, endpoints, phone numbers, and names before prompting an AI, and reversibly restores all original values when you paste the AI's reply back.

---

## 🌐 Live Demo & Instant Use

ZeroLeak is a **100% Static Client-Side Single Page Application (SPA)**. It requires **no backend server**, **no database**, and **no installation** for end users.

👉 **[Launch ZeroLeak in your Browser](https://fuad-jamil.github.io/zeroleak/)** *(or deploy your own with 1-click on Vercel / Netlify / GitHub Pages)*.

---

## 🔒 100% Client-Side Privacy Guarantee

ZeroLeak is engineered from the ground up to ensure your sensitive data never leaves your browser:

- **Strict Content Security Policy (CSP):** Enforced via `<meta http-equiv="Content-Security-Policy" content="... connect-src 'none';">`. The browser actively blocks all HTTP/HTTPS network requests (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`).
- **Zero Outbound Telemetry:** No servers, no tracking beacons, no analytics scripts, no external fonts or CDNs at runtime.
- **In-Memory Heap Only:** All aliases, mapping tables, and reverse dictionaries reside strictly in transient browser RAM (`React state`). They are never written to `localStorage`, `sessionStorage`, `IndexedDB`, or cookies.
- **Ephemeral Sessions:** Closing or refreshing the browser tab instantly and permanently wipes all session data from RAM.
- **Live In-App Network Inspector:** Click the `LOCAL ONLY / 0B NETWORK` badge in the header at any time to run live `PerformanceResourceTiming` checks proving that zero bytes have left your browser.

---

## ⚡ How It Works (The 2-Step Workflow)

```
┌──────────────────────────────────────┐
│  Step 1: Sanitize (Before Prompting) │
│  Paste sensitive code / logs / text  │
│  ───────► Anonymized Safe Prompt     │───► Paste into ChatGPT / Claude
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Step 2: Restore (After AI Replies)  │
│  Paste AI's response with aliases    │
│  ───────► Original Restored Code     │───► Ready to use in your project!
└──────────────────────────────────────┘
```

1. **Step 1 — Sanitize:** Paste your sensitive text, stacktrace, database config, or prompt. ZeroLeak scans for sensitive entities, generates deterministic, consistent aliases (e.g. `DB_PASS_1`, `10.0.0.1`, `user_1`), and highlights them. Click **Copy Safe Prompt** and send it safely to any AI.
2. **Step 2 — Restore:** When the AI provides a code fix, explanation, or query containing those aliases, paste it into the **Restore AI Response** tab. ZeroLeak instantly swaps all aliases back to their original values with single-pass precision.

---

## 🛡️ Hardened Detection Engine (`ZL-REDTEAM-2026-001` Compliant)

ZeroLeak incorporates a multi-pass heuristic detection engine hardened against adversarial red team benchmarks:

| Category | Supported Patterns & Syntaxes | Example Input &rarr; Sanitized Output |
| :--- | :--- | :--- |
| **Database URIs** | PostgreSQL, MySQL, MongoDB, Redis, SQLite | `postgresql://amal_admin:Pass123!@10.20.30.40:5432/prod` &rarr; `postgresql://db_user_1:DB_PASS_1@10.0.0.1:5432/db_name_1` |
| **Strictly Valid IPv4** | Private subnets (`10.x.x.x`, `192.168.x.x`, `172.16.x.x`) & Public IPs | `10.20.30.40` &rarr; `10.0.0.1` (consistent across URLs, `.env`, and logs) |
| **Structural URLs & Queries** | WHATWG URL parsing; masks sensitive parameters (`token`, `session`, `email`, `code`, `debug_secret`) while preserving port, path, and nonsensitive query params | `https://api.internal/v2/users?token=SECRET123&redirect=/dashboard` &rarr; `https://internal-host-1.local/v2/users?token=SECRET_KEY_1&redirect=/dashboard` |
| **Natural Language Secrets** | Contextual sentence extraction | `"The emergency password is SuperSecret!2026"` &rarr; `"The emergency password is DB_PASS_1"` |
| **Debug Statements & Assignments** | Arrow (`=>`), assignment (`:=`, `==`, `=`), and mixed-case identifiers | `db_password => "Hidden$Value_771"` &rarr; `db_password => "DB_PASS_1"` |
| **Shell Exports & .env** | Export assignments with quotes; preserves configuration keys intact | `export INTERNAL_SECRET='Sign!Me_44'` &rarr; `export INTERNAL_SECRET='SECRET_KEY_1'` |
| **API Keys & Cloud Tokens** | AWS access keys, OpenAI (`sk-proj-...`), Stripe (`sk_live_...`), GitHub PATs (`ghp_...`), Bearer headers, JWTs | `Bearer eyJhbGciOi...` &rarr; `Bearer SECRET_KEY_1` |
| **Arabic & International Names** | Contextual role preservation without description mangling; distinct aliases for distinct people | `المهندس المسؤول عن قاعدة البيانات: أحمد منصور` &rarr; `المهندس المسؤول عن قاعدة البيانات: Person_1` |
| **International Phone Numbers** | Global formats starting with `+` or `00` with various separators | `+967-777-123-456` &rarr; `+1-555-0001` |
| **YAML / JSON Structural Keys** | Protects property keys from being masked as values | `username: "amal_admin"` &rarr; `username: "db_user_1"` (key preserved) |
| **Custom Highlight Masking** | User-defined custom terms with top precedence across hyphens and boundaries | Highlight any word or use `+ Mask phrase` &rarr; `custom_1` |
| **Non-Colliding Restoration** | Single-pass unified regular expression sorted by alias length descending | Prevents partial substitutions (e.g. `user_1` inside `user_10`) |

---

## 🚀 Developer Getting Started

If you want to run or contribute to ZeroLeak locally:

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- `npm` (bundled with Node.js) or `pnpm` / `yarn`

### Installation & Local Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Fuad-jamil/zeroleak.git
   cd zeroleak
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000/`.

---

## 🧪 Automated Testing & Security Verification

ZeroLeak includes an automated test suite powered by [Vitest](https://vitest.dev/) to verify all detection, parsing, sanitization, and restoration algorithms against regression:

```bash
# Run the complete test suite
npm test
```

### Test Suite Execution Output
```text
 ✓ tests/redteam.test.ts (18 tests) 200ms
   ✓ ZL-REDTEAM-2026-001: Security Hardening & Regression Specification (18)
     ✓ 1. Secrets in ordinary text and diverse syntaxes (5)
       ✓ masks credentials in natural language sentences
       ✓ masks debug statements with arrow separator => and quotes
       ✓ masks shell export assignments with single quotes
       ✓ masks temporary access codes and ticket formats
       ✓ masks values in natural-language authentication clauses
     ✓ 2. URL query parameters and embedded credentials (4)
       ✓ masks userinfo credentials while preserving scheme and port
       ✓ masks sensitive query parameters while preserving nonsensitive parameters
       ✓ masks email parameter as email alias and code parameter as secret
       ✓ masks debug_secret on IP-based endpoints while preserving port and path
     ✓ 3. Arabic names and contextual personal information (3)
       ✓ preserves complex Arabic role titles intact while masking only the person name
       ✓ masks doctor and engineer honorific names correctly
       ✓ assigns distinct aliases to distinct people sharing first name
     ✓ 4. Custom masking terms with highest precedence (1)
       ✓ masks designated custom terms in all occurrences without drops
     ✓ 5. Structural integrity of YAML, JSON, and dotenv (2)
       ✓ preserves YAML key-value structure without replacing keys
       ✓ preserves valid JSON object structure
     ✓ 6. False positive resistance (2)
       ✓ does not mask HTTP status codes, ports, or retry counts
       ✓ preserves public DNS 8.8.8.8 when configured
     ✓ 7. Round-trip restoration and alias collision resistance (1)
       ✓ restores full document without partial alias collisions or double substitution

 Test Files  1 passed (1)
      Tests  18 passed (18)
```

---

## 🛠️ Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with HMR on `http://localhost:3000/`. |
| `npm test` | Runs the Vitest automated regression test suite. |
| `npm run build` | Runs TypeScript static checking (`tsc`) and builds the production bundle in `/dist`. |
| `npm run preview` | Locally previews the compiled production build. |

---

## 📁 Repository Structure

```text
zeroleak/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI (Typecheck, Vitest, Build)
├── src/
│   ├── components/              # Swiss-design UI cards and panels
│   │   ├── Header.tsx           # Navigation, Step Switcher, Theme & Status
│   │   ├── RawInputPanel.tsx    # Source prompt editor & highlight mask toolbar
│   │   ├── SanitizedOutputPanel.tsx # Safe prompt preview with alias badges & copy
│   │   ├── RestorerPanel.tsx    # AI reply input & restored code viewer
│   │   ├── MappingVault.tsx     # In-memory session vault inspector & editor
│   │   └── PrivacyProofModal.tsx# Real-time browser network inspector modal
│   ├── engine/                  # Core DLP sanitization & restoration algorithms
│   │   ├── detectors/           # Category detectors (DB URIs, IPs, names, secrets, etc.)
│   │   ├── aliasGenerator.ts    # Deterministic session aliasing & URL rewrite
│   │   ├── sanitizer.ts         # Multi-pass sanitization engine
│   │   ├── restorer.ts          # Length-descending non-colliding restoration engine
│   │   ├── patterns.ts          # Regex patterns and international dial codes
│   │   ├── samples.ts           # Built-in developer & business presets
│   │   └── types.ts             # TypeScript interface definitions
│   ├── utils/
│   │   └── categoryTheme.ts     # Visual category styling & badges
│   ├── App.tsx                  # Main 2-step workbench container
│   ├── index.css                # Tailwind base & Swiss canvas styling
│   └── main.tsx                 # Application entry point
├── tests/
│   └── redteam.test.ts          # Vitest ZL-REDTEAM-2026-001 regression tests
├── index.html                   # HTML entry point with CSP connect-src 'none'
├── package.json                 # Project dependencies & scripts
├── tailwind.config.js           # Tailwind configuration
├── tsconfig.json                # TypeScript compiler configuration
└── vite.config.ts               # Vite configuration (port 3000)
```

---

## 👤 Author & Maintainer

**Fuad Jamil**
- GitHub: [@Fuad-jamil](https://github.com/Fuad-jamil)
- Project Repository: [https://github.com/Fuad-jamil/zeroleak](https://github.com/Fuad-jamil/zeroleak)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) &copy; 2026 [Fuad Jamil](https://github.com/Fuad-jamil).
