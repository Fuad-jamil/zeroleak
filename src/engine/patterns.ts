// Centralized pattern definitions and heuristic matchers for ZeroLeak Engine

export const DB_URI_REGEX =
  /\b((?:postgresql|postgres|mysql|mongodb(?:\+srv)?|redis|rediss):\/\/(?:([^:@\s]+)(?::([^@\s]+))?@)?([^:/\s]+)(?::(\d+))?(\/[^?\s"']*)?(\?[^\s"']*)?)/gi;

export const IPV4_STRICT_REGEX =
  /\b(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\b/g;

export const URL_WEB_REGEX =
  /\b(https?:\/\/[^\s"'<>\),]+)/gi;

// Clean International and domestic phone formats strictly on the same line (never crossing newlines)
// Matches +967-777-123-456, 00967 711 222 333, +1-555-019-2834, etc.
export const PHONE_CLEAN_REGEX =
  /(?:(?:\+|00)\d{1,4}[ \t.-]?(?:\(?\d{1,4}\)?[ \t.-]?)*\d{3,4}\b|00\d{8,14}\b|\b(?:\(?\d{3}\)?[ \t.-]?\d{3}[ \t.-]?\d{4})\b)/g;

// Sensitive URL Query Parameters (including snake_case and camelCase variants like api_key)
export const SENSITIVE_QUERY_PARAM_REGEX =
  /([?&](?:token|key|api_key|apiKey|api-key|secret|sig|signature|auth|apikey|access_token|password|pwd|api_secret|client_secret|access_key)=)([^&"'\s#]+)/gi;

// App directory path in stack traces (e.g. /srv/horus-app/ or /var/www/alamal-pay/)
export const STACKTRACE_APP_DIR_REGEX =
  /((?:\/srv\/|\/var\/www\/|\/opt\/|\/app\/|\/home\/[a-zA-Z0-9_-]+\/)([a-zA-Z0-9_-]+(?:-app|-service|-core|-api|-backend|[a-zA-Z0-9_-]+))(?:\/))/g;

// Project & Operation codename patterns strictly on single line (e.g. "Project Night Falcon", "Operation Sandstorm-47")
export const PROJECT_CODE_NAME_REGEX =
  /\b(?:(?:Project|Operation)[_ -][A-Z0-9][a-zA-Z0-9_-]*(?:[ \t]+[A-Z0-9][a-zA-Z0-9_-]*){0,2})\b/g;

// Company names with common corporate/tech markers
export const COMPANY_NAME_REGEX =
  /\b(?:[A-Z][A-Za-z0-9]*(?:-[A-Z][A-Za-z0-9]*)?\s+(?:FinTech|Technologies|Holdings|Solutions|Corp|Inc|LLC|Group|Bank|Pay|Security|Capital))\b|\b(?:Al-Amal\s+(?:FinTech|Pay|Bank)|ApexHoldings)\b/g;

// Unified Person Trigger Regex (cross-lingual English & Arabic role triggers + optional honorific titles + names)
// Supports: "OWNER: المهندس أحمد منصور", "BACKUP OWNER: د. سارة عبدالله", "VIP Customer: خالد محمد العريقي", "Reported by: Ahmed Hassan"
export const UNIFIED_PERSON_TRIGGER_REGEX =
  /(?:OWNER|BACKUP OWNER|ADMIN|USER|VIP Customer|CUSTOMER|CLIENT|AUTHOR|CONTACT|LEAD|REVIEWER|Reported by|Secondary reviewer|Lead Negotiator|Legal Counsel|Assignee|Author|User|Client|Developer|Engineer|العميل|المستخدم|زميله|المطور|المهندس|المهندسة|المسؤول|بواسطة|المحامي|المالك)\s*[:=][ \t]*(?:(?:د\.|دكتور|دكتورة|أ\.|أستاذ|أستاذة|المهندس|المهندسة|الشيخ|السيد|السيدة|Dr\.|Eng\.|Mr\.|Mrs\.|Ms\.)[ \t]+)?([\u0621-\u064A]{2,15}(?:[ \t]+[\u0621-\u064A]{2,15}){1,3}|[A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+){1,2})/gi;

// Legacy / standalone Arabic triggers without explicit role prefixes
export const ARABIC_PERSON_TRIGGER_REGEX =
  /(?:العميل|المستخدم|زميله|المطور|المهندس|المهندسة|المسؤول|بواسطة|المحامي)\s*[:=]?[ \t]*(?:(?:د\.|دكتور|دكتورة|أ\.|أستاذ|الشيخ)[ \t]+)?([ء-ي]{2,15}(?:[ \t]+[ء-ي]{2,15}){1,2})/g;

export const ARABIC_NAMES_IN_PAREN_REGEX =
  /\(([\u0621-\u064A]{3,15}(?:[ \t]+[\u0621-\u064A]{3,15}){0,2})\)/g;

export const ARABIC_PROMINENT_NAMES_REGEX =
  /\b(أحمد\s+منصور|خالد\s+العمري|سارة\s+المنصوري|محمد\s+العتيبي|فاطمة\s+الزهراء|عبد\s*الله\s+[ء-ي]+)\b/g;

// BIP-39 mnemonic wallet / recovery seed phrases strictly on a single line (e.g. "maple river copper velvet amber lunar")
export const RECOVERY_MNEMONIC_PHRASE_REGEX =
  /(?:Recovery Phrase|Seed Phrase|Mnemonic Phrase|Passphrase)\s*[:=][ \t]*([a-z]+(?:[ \t]+[a-z]+){3,23})(?=$|[\r\n])/gi;

// Confidential contract codes and case identifiers (e.g. "Confidential Contract: AL-AMAL-77821")
export const CONFIDENTIAL_ID_REGEX =
  /(?:Confidential\s+[A-Za-z]+|Contract(?:\s+Code)?|Case ID|Ticket)\s*[:=][ \t]*([A-Za-z0-9_-]+)/gi;
