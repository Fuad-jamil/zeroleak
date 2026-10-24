import { RawEntityMatch } from '../types';
import {
  ARABIC_PERSON_TRIGGER_REGEX,
  ARABIC_NAMES_IN_PAREN_REGEX,
  ARABIC_PROMINENT_NAMES_REGEX,
  ENGLISH_PERSON_TRIGGER_REGEX,
  PROJECT_CODE_NAME_REGEX,
  STACKTRACE_APP_DIR_REGEX,
  COMPANY_NAME_REGEX,
} from '../patterns';

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

  // 2. Project Code Names (e.g. "Project_Horus", "Project Titan")
  PROJECT_CODE_NAME_REGEX.lastIndex = 0;
  let projMatch: RegExpExecArray | null;
  while ((projMatch = PROJECT_CODE_NAME_REGEX.exec(text)) !== null) {
    const val = projMatch[0];
    matches.push({
      category: 'project',
      original: val,
      startIndex: projMatch.index,
      endIndex: projMatch.index + val.length,
      label: 'Project Codename',
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

  // 4. English Person Names with contextual triggers
  ENGLISH_PERSON_TRIGGER_REGEX.lastIndex = 0;
  let engMatch: RegExpExecArray | null;
  while ((engMatch = ENGLISH_PERSON_TRIGGER_REGEX.exec(text)) !== null) {
    const personName = engMatch[1].trim();
    const offset = engMatch[0].indexOf(personName);
    const start = engMatch.index + offset;

    matches.push({
      category: 'person',
      original: personName,
      startIndex: start,
      endIndex: start + personName.length,
      label: 'Person Name (English)',
    });
  }

  // 5. Arabic Person Names with contextual triggers (العميل: أحمد منصور, زميله: سارة)
  ARABIC_PERSON_TRIGGER_REGEX.lastIndex = 0;
  let arMatch: RegExpExecArray | null;
  while ((arMatch = ARABIC_PERSON_TRIGGER_REGEX.exec(text)) !== null) {
    const personName = arMatch[1].trim();
    const offset = arMatch[0].indexOf(personName);
    const start = arMatch.index + offset;

    matches.push({
      category: 'person',
      original: personName,
      startIndex: start,
      endIndex: start + personName.length,
      label: 'Person Name (Arabic)',
    });
  }

  // 6. Arabic Names inside parentheses: (خالد), (أحمد منصور)
  ARABIC_NAMES_IN_PAREN_REGEX.lastIndex = 0;
  let parenMatch: RegExpExecArray | null;
  while ((parenMatch = ARABIC_NAMES_IN_PAREN_REGEX.exec(text)) !== null) {
    const name = parenMatch[1].trim();
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

  // 7. Prominent Arabic Names
  ARABIC_PROMINENT_NAMES_REGEX.lastIndex = 0;
  let promMatch: RegExpExecArray | null;
  while ((promMatch = ARABIC_PROMINENT_NAMES_REGEX.exec(text)) !== null) {
    const name = promMatch[1].trim();
    matches.push({
      category: 'person',
      original: name,
      startIndex: promMatch.index,
      endIndex: promMatch.index + name.length,
      label: 'Person Name (Arabic)',
    });
  }

  return matches;
}

