# Privacy Policy for ZeroLeak

**Effective Date:** October 25, 2026  
**Developer:** Fuad Jamil ([@Fuad-jamil](https://github.com/Fuad-jamil))  
**Project Repository:** [https://github.com/Fuad-jamil/zeroleak](https://github.com/Fuad-jamil/zeroleak)

---

## 1. Zero Data Collection Guarantee

ZeroLeak is engineered as a **100% client-side data loss prevention (DLP) tool**. We believe privacy is a fundamental human right, especially when working with sensitive intellectual property, source code, and credentials.

- **Zero Outbound Telemetry:** ZeroLeak does not connect to any remote server, backend API, analytics platform, or tracking service.
- **Zero Personal Data Stored:** We do not collect, store, sell, or transmit names, emails, phone numbers, IP addresses, database credentials, or prompt contents.
- **Zero Third-Party Trackers:** There are no third-party SDKs, tracking pixels, advertising scripts, or telemetry libraries embedded in the application.

---

## 2. Browser Storage & Memory Boundary

- **In-Memory Heap Only:** All original inputs, generated aliases, and mapping tables exist exclusively in transient browser RAM (React application state).
- **No Persistent Storage:** Sensitive data is never saved to `localStorage`, `sessionStorage`, `IndexedDB`, or browser cookies.
- **Immediate Memory Purge:** Closing or refreshing the extension popup, side panel, or browser tab permanently and irrevocably purges all session mappings from memory.

---

## 3. Browser Extension Permissions (Manifest V3)

ZeroLeak requests only the minimum required permissions to perform its core functions:
- `storage`: Used solely to pass temporary selected text from the right-click context menu into the prompt editor. This data is deleted immediately upon loading.
- `sidePanel`: Used solely to provide a persistent side-by-side workspace within Chrome/Edge while interacting with LLM interfaces (ChatGPT, Claude, etc.).
- `contextMenus`: Used solely to provide the right-click shortcut *"Sanitize selection with ZeroLeak"*.

ZeroLeak does **not** inject scripts into other tabs, does **not** read your browsing history, and does **not** access your web traffic.

---

## 4. Network Security & Content Security Policy (CSP)

ZeroLeak enforces a strict Content Security Policy:
```
connect-src 'none';
```
This policy is enforced at the browser engine level, blocking any outgoing HTTP/HTTPS, WebSocket, or WebRTC connection attempt.

---

## 5. Contact & Questions

If you have questions about ZeroLeak's privacy architecture or wish to audit the open-source codebase:
- **Author:** Fuad Jamil
- **GitHub:** [https://github.com/Fuad-jamil/zeroleak](https://github.com/Fuad-jamil/zeroleak)
- **Issues & Audit:** [https://github.com/Fuad-jamil/zeroleak/issues](https://github.com/Fuad-jamil/zeroleak/issues)
