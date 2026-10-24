# ZeroLeak 🛡️
### 100% Client-Side Reversible AI Prompt Sanitizer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Network: Zero](https://img.shields.io/badge/Network-0B_Outbound-emerald.svg)](#privacy-guarantee)

> **ZeroLeak** prevents accidental data leaks to Large Language Models (ChatGPT, Claude, Gemini, DeepSeek, Copilot). It automatically detects and masks database URIs, API keys, private IPs, endpoints, phone numbers, and names before prompting an AI, and reversibly restores all original values when you paste the AI's reply back.

---

## 🔒 100% Client-Side Privacy Guarantee

- **Zero Outbound Telemetry**: No servers, no APIs, no tracking beacons, no analytics.
- **In-Memory Heap Only**: Aliases and mapping tables are stored in transient browser RAM (`React state`). They are never persisted to `localStorage`, `IndexedDB`, or cookies.
- **Ephemeral Sessions**: Closing or refreshing the tab completely wipes all session data from RAM.
- **Built-in Network Probe**: Click the `LOCAL ONLY / 0B NETWORK` badge in the header to run live `PerformanceResourceTiming` checks proving 0 outbound requests.

---

## ✨ Key Features & Engine Capabilities

| Feature | Detection Engine | Alias Mapping Example |
| :--- | :--- | :--- |
| **Database URIs** | PostgreSQL, MySQL, MongoDB, Redis | `postgresql://usr:pwd@10.0.0.45:5432/db` &rarr; `postgresql://db_user_1:DB_PASS_1@10.0.0.1:5432/db_name_1` |
| **Strictly Valid IPv4** | Private subnets (`10.x.x.x`, `192.168.x.x`, `172.16.x.x`) | `10.0.0.45` &rarr; `10.0.0.1` (preserves same alias inside DB URI and logs) |
| **Internal Endpoints & URLs** | Preserves host consistency & sanitizes query secrets | `https://webhook.alamal.com/v2?token=secret123` &rarr; `https://internal-host-1.local/v2?token=SECRET_KEY_1` |
| **Secrets & Keys** | AWS keys, JWTs, Bearer tokens, `.env` high-entropy secrets | `AKIAIOSFODNN7EXAMPLE` &rarr; `SECRET_KEY_1` |
| **International Phones** | Global formats starting with `+` or `00` | `+967-777-123-456` &rarr; `+1-555-0101` |
| **Names (Arabic & English)** | Contextual role and title patterns | `المهندس: أحمد منصور` &rarr; `user_1` |
| **Custom Highlight Masking** | Highlight any word or use `+ Mask phrase...` | Custom terms map to `custom_1`, `project_1`, etc. |
| **Exact Reversal (Restore)** | Length-descending token substitution | Replaces all aliases back to real credentials without collision |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- `npm` (comes with Node.js) or `pnpm` / `yarn`

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Fuad-jamil/zeroleak.git
   cd zeroleak
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000/`.

---

## 🛠️ Available Scripts

- `npm run dev`: Starts the local Vite development server on port 3000 with Hot Module Replacement (HMR).
- `npm run build`: Runs TypeScript static type checking (`tsc`) and compiles the production bundle into `/dist`.
- `npm run preview`: Locally previews the production build.

---

## 📁 Project Structure

```text
zeroleak/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI workflow
├── src/
│   ├── components/              # UI Components (Swiss typography & floating cards)
│   │   ├── Header.tsx           # Navigation bar, Step Switcher, Theme & Status
│   │   ├── RawInputPanel.tsx    # Source prompt editor & highlight mask toolbar
│   │   ├── SanitizedOutputPanel.tsx # Safe prompt preview with alias badges & copy
│   │   ├── RestorerPanel.tsx    # AI reply input & restored code viewer
│   │   ├── MappingVault.tsx     # In-memory session vault inspector & editor
│   │   └── PrivacyProofModal.tsx# Real-time browser network inspector modal
│   ├── engine/                  # Pure sanitization & restoration core
│   │   ├── detectors/           # Category detectors (DB URIs, IPs, names, etc.)
│   │   ├── aliasGenerator.ts    # Deterministic session aliasing
│   │   ├── sanitizer.ts         # Multi-pass sanitization engine
│   │   ├── restorer.ts          # Length-descending restoration engine
│   │   ├── patterns.ts          # Regex patterns and international dial codes
│   │   ├── samples.ts           # Built-in developer & business presets
│   │   └── types.ts             # TypeScript definitions
│   ├── utils/
│   │   └── categoryTheme.ts     # Visual category styling & badges
│   ├── App.tsx                  # Main 2-step workbench container
│   ├── index.css                # Tailwind base & Swiss canvas styling
│   └── main.tsx                 # Application entry point
├── index.html                   # HTML entry point with zero external scripts
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

This project is licensed under the [MIT License](LICENSE) — created by [Fuad Jamil](https://github.com/Fuad-jamil).
