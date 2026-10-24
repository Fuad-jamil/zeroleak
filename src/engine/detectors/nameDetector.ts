import { RawEntityMatch } from '../types';
import {
  PROJECT_CODE_NAME_REGEX,
  STACKTRACE_APP_DIR_REGEX,
  COMPANY_NAME_REGEX,
  CONFIDENTIAL_ID_REGEX,
} from '../patterns';

// Contextual Role Patterns before Colon/Equals
// Matches:
// - "المهندس المسؤول عن قاعدة البيانات: أحمد منصور."
// - "مديرة المشروع: سارة عبد الرحمن."
// - "مسؤول البنية التحتية: محمد علي القحطاني."
// - "OWNER: المهندس أحمد منصور"
// - "BACKUP OWNER: د. سارة عبدالله"
// - "VIP Customer: خالد محمد العريقي"
// - "Reported by: Ahmed Hassan"
const CONTEXTUAL_ROLE_NAME_REGEX =
  /(?:المهندس\s+المسؤول(?:\s+عن\s+[\u0621-\u064A]+(?:\s+[\u0621-\u064A]+)?)?|مديرة?\s+المشروع|مسؤول\s+البنية\s+التحتية|مسؤول\s+الأنظمة|مسؤول\s+الأمن|المسؤول\s+عن\s+[\u0621-\u064A]+|مدير\s+[\u0621-\u064A]+|العميل|المستخدم|المطور|المشرف|المحامي|المالك|OWNER|BACKUP OWNER|ADMIN|VIP Customer|CUSTOMER|CLIENT|AUTHOR|CONTACT|SECOND CONTACT|LEAD|SECONDARY|BACKUP|CO-LEAD|DELEGATE|MANAGER|DIRECTOR|OFFICER|CONTRIBUTOR|REVIEWER|Reported by|Secondary reviewer|Lead Negotiator|Legal Counsel|Assignee|Author|User|Client|Developer|Engineer)\s*[:=]\s*(?:(?:د\.|دكتور|دكتورة|أ\.|أستاذ|أستاذة|المهندس|المهندسة|الشيخ|السيد|السيدة|Dr\.|Eng\.|Mr\.|Mrs\.|Ms\.)\s+)?([\u0621-\u064A]{2,15}(?:\s+[\u0621-\u064A]{2,15}){1,3}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/gi;

// Standalone Arabic prominent / parenthesized names
const ARABIC_PAREN_REGEX =
  /\(([\u0621-\u064A]{3,15}(?:\s+[\u0621-\u064A]{3,15}){1,2})\)/g;

// Standalone prominent full names (must be at least 2 words)
const ARABIC_PROMINENT_FULL_NAMES_REGEX =
  /\b(أحمد\s+منصور|أحمد\s+علي|خالد\s+العمري|سارة\s+المنصوري|محمد\s+العتيبي|فاطمة\s+الزهراء|عبد\s*الله\s+[\u0621-\u064A]+|محمد\s+علي\s+القحطاني|سارة\s+عبد\s+الرحمن)\b/g;

// General Arabic two-word human name pattern for common first names
const ARABIC_COMMON_FULL_NAME_REGEX =
  /(?<![\u0621-\u064A])(أحمد|محمد|علي|خالد|سارة|فاطمة|مريم|عبد\s*الله|عبد\s*الرحمن|عبد\s*العزيز|عمر|عثمان|يوسف|إبراهيم|حسن|حسين|طارق|سالم|زيد|منى|هدى|نورة|ريم|ياسر|محمود|مصطفى|بدر|سعد|فيصل|سعود|سلطان)\s+([\u0621-\u064A]{2,15}(?:\s+[\u0621-\u064A]{2,15}){0,2})(?![\u0621-\u064A])/g;

export function detectNamesAndProjects(text: string): RawEntityMatch[] {
  const matches: RawEntityMatch[] = [];

  // 1. App directories in stacktraces (e.g. /srv/horus-app/)
  STACKTRACE_APP_DIR_REGEX.lastIndex = 0;
  let appMatch: RegExpExecArray | null;
  while ((appMatch = STACKTRACE_APP_DIR_REGEX.exec(text)) !== null) {
    const fullPath = appMatch[1];

    matches.push({
      category: 'project',
      original: fullPath,
      startIndex: appMatch.index,
      endIndex: appMatch.index + fullPath.length,
      label: 'App Path Directory',
      metadata: {
        isAppDir: true,
      },
    });
  }

  // 2. Project & Operation Code Names (e.g. "Project Night Falcon", "Operation Sandstorm-47")
  PROJECT_CODE_NAME_REGEX.lastIndex = 0;
  let projMatch: RegExpExecArray | null;
  while ((projMatch = PROJECT_CODE_NAME_REGEX.exec(text)) !== null) {
    const val = projMatch[0].trim();
    matches.push({
      category: 'project',
      original: val,
      startIndex: projMatch.index,
      endIndex: projMatch.index + val.length,
      label: 'Project/Operation Codename',
    });
  }

  // 3. Company / Entity Names (e.g. "Al-Amal FinTech", "ApexHoldings")
  COMPANY_NAME_REGEX.lastIndex = 0;
  let compMatch: RegExpExecArray | null;
  while ((compMatch = COMPANY_NAME_REGEX.exec(text)) !== null) {
    const val = compMatch[0].trim();
    matches.push({
      category: 'company',
      original: val,
      startIndex: compMatch.index,
      endIndex: compMatch.index + val.length,
      label: 'Company Name',
    });
  }

  // 4. Confidential Contract IDs & Case Identifiers
  CONFIDENTIAL_ID_REGEX.lastIndex = 0;
  let confMatch: RegExpExecArray | null;
  while ((confMatch = CONFIDENTIAL_ID_REGEX.exec(text)) !== null) {
    const code = confMatch[1]?.trim();
    if (code && code.length >= 3) {
      const offset = confMatch[0].lastIndexOf(code);
      const start = confMatch.index + offset;
      matches.push({
        category: 'custom',
        original: code,
        startIndex: start,
        endIndex: start + code.length,
        label: 'Confidential Identifier',
      });
    }
  }

  // 5. Contextual Person Names (Only extracts the person name AFTER the role title)
  // Ensures role descriptions like "المهندس المسؤول عن قاعدة البيانات:" are preserved intact!
  CONTEXTUAL_ROLE_NAME_REGEX.lastIndex = 0;
  let roleMatch: RegExpExecArray | null;
  while ((roleMatch = CONTEXTUAL_ROLE_NAME_REGEX.exec(text)) !== null) {
    let personName = roleMatch[1]?.trim();
    if (!personName || personName.length < 3) continue;

    // Strip trailing punctuation like . or ,
    personName = personName.replace(/[.,;:]$/, '').trim();

    // Find exact location of personName in the matched string
    const offset = roleMatch[0].lastIndexOf(personName);
    const start = roleMatch.index + offset;

    matches.push({
      category: 'person',
      original: personName,
      startIndex: start,
      endIndex: start + personName.length,
      label: 'Person Name',
      metadata: {
        isContextualPerson: true,
      },
    });
  }

  // 6. Arabic Names inside parentheses: (خالد العمري)
  ARABIC_PAREN_REGEX.lastIndex = 0;
  let parenMatch: RegExpExecArray | null;
  while ((parenMatch = ARABIC_PAREN_REGEX.exec(text)) !== null) {
    const name = parenMatch[1]?.trim();
    if (!name || name.length < 3) continue;
    const offset = parenMatch[0].indexOf(name);
    const start = parenMatch.index + offset;

    matches.push({
      category: 'person',
      original: name,
      startIndex: start,
      endIndex: start + name.length,
      label: 'Person Name (Arabic)',
    });
  }

  // 7. Prominent Multi-word Arabic Names
  ARABIC_PROMINENT_FULL_NAMES_REGEX.lastIndex = 0;
  let promMatch: RegExpExecArray | null;
  while ((promMatch = ARABIC_PROMINENT_FULL_NAMES_REGEX.exec(text)) !== null) {
    const name = promMatch[1]?.trim();
    if (!name) continue;
    matches.push({
      category: 'person',
      original: name,
      startIndex: promMatch.index,
      endIndex: promMatch.index + name.length,
      label: 'Person Name (Arabic)',
    });
  }

  // 8. General Arabic Person Names (Common First Names + Surnames)
  ARABIC_COMMON_FULL_NAME_REGEX.lastIndex = 0;
  let comMatch: RegExpExecArray | null;
  while ((comMatch = ARABIC_COMMON_FULL_NAME_REGEX.exec(text)) !== null) {
    const name = comMatch[0]?.trim();
    if (!name || name.length < 5) continue;
    matches.push({
      category: 'person',
      original: name,
      startIndex: comMatch.index,
      endIndex: comMatch.index + name.length,
      label: 'Person Name (Arabic)',
    });
  }

  return matches;
}
