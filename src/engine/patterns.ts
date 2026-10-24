// Centralized pattern definitions and heuristic matchers for ZeroLeak Engine

export const DB_URI_REGEX =
  /\b((?:postgresql|postgres|mysql|mongodb(?:\+srv)?|redis|rediss):\/\/(?:([^:@\s]+)(?::([^@\s]+))?@)?([^:/\s]+)(?::(\d+))?(\/[^?\s"']*)?(\?[^\s"']*)?)/gi;

export const IPV4_STRICT_REGEX =
  /\b(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\b/g;

export const URL_WEB_REGEX =
  /\b(https?:\/\/[^\s"'<>\),]+)/gi;

// Clean International and domestic phone formats
// Matches +967-777-123-456, 00967771987654, +1-555-019-2834, etc. without leaving leading 0
export const PHONE_CLEAN_REGEX =
  /(?:(?:\+|00)\d{1,4}[-.\s]?(?:\(?\d{1,4}\)?[-.\s]?)*\d{3,4}\b|00\d{8,14}\b|\b(?:\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b)/g;

// Sensitive URL Query Parameters
export const SENSITIVE_QUERY_PARAM_REGEX =
  /([?&](?:token|key|secret|sig|signature|auth|apikey|access_token|password|pwd|api_secret)=)([^&"'\s#]+)/gi;

// App directory path in stack traces (e.g. /srv/horus-app/ or /var/www/alamal-pay/)
export const STACKTRACE_APP_DIR_REGEX =
  /((?:\/srv\/|\/var\/www\/|\/opt\/|\/app\/|\/home\/[a-zA-Z0-9_-]+\/)([a-zA-Z0-9_-]+(?:-app|-service|-core|-api|-backend|[a-zA-Z0-9_-]+))(?:\/))/g;

// Project/Codenames patterns (e.g. "Project_Horus", "Project Titan", "Al-Amal FinTech")
export const PROJECT_CODE_NAME_REGEX =
  /\b(?:Project[_-][A-Za-z0-9_-]+|Project\s+[A-Z][a-zA-Z0-9_-]+)\b/g;

// Company names with common corporate/tech markers
export const COMPANY_NAME_REGEX =
  /\b(?:[A-Z][A-Za-z0-9]*(?:-[A-Z][A-Za-z0-9]*)?\s+(?:FinTech|Technologies|Holdings|Solutions|Corp|Inc|LLC|Group|Bank|Pay|Security|Capital))\b|\b(?:Al-Amal\s+(?:FinTech|Pay|Bank)|ApexHoldings)\b/g;

// English contextual person triggers (e.g. "Reported by: Ahmed Hassan", "Client: Sara")
export const ENGLISH_PERSON_TRIGGER_REGEX =
  /(?:Reported by|Secondary reviewer|Lead Negotiator|Legal Counsel|Assignee|Author|User|Client|Developer|Engineer)\s*[:=]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g;

// Arabic contextual person triggers
// e.g. "العميل: أحمد منصور", "المستخدم: خالد", "زميله: سارة", or names inside parentheses
export const ARABIC_PERSON_TRIGGER_REGEX =
  /(?:العميل|المستخدم|زميله|المطور|المهندس|المسؤول|بواسطة|المحامي)\s*[:=]?\s*([ء-ي]{2,15}(?:\s+[ء-ي]{2,15}){1,2})/g;

export const ARABIC_NAMES_IN_PAREN_REGEX =
  /\(([\u0621-\u064A]{3,15}(?:\s+[\u0621-\u064A]{3,15}){0,2})\)/g;

export const ARABIC_PROMINENT_NAMES_REGEX =
  /\b(أحمد\s+منصور|خالد\s+العمري|سارة\s+المنصوري|محمد\s+العتيبي|فاطمة\s+الزهراء|عبد\s*الله\s+[ء-ي]+)\b/g;
