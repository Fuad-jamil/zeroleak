import { RawEntityMatch } from '../types';
import { PHONE_CLEAN_REGEX } from '../patterns';

export function detectPhoneNumbers(text: string): RawEntityMatch[] {
  const matches: RawEntityMatch[] = [];
  let match: RegExpExecArray | null;

  PHONE_CLEAN_REGEX.lastIndex = 0;
  while ((match = PHONE_CLEAN_REGEX.exec(text)) !== null) {
    const raw = match[0].trim();

    // Strictly reject any match containing or spanning newlines
    if (/[\r\n]/.test(raw)) continue;

    // Exclude date patterns like 2026-10-23
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) continue;

    // Check minimum digits (standard E.164 phones are 8 to 15 digits)
    const digitsOnly = raw.replace(/\D/g, '');
    if (digitsOnly.length < 8 || digitsOnly.length > 16) continue;

    matches.push({
      category: 'phone',
      original: raw,
      startIndex: match.index,
      endIndex: match.index + raw.length,
      label: 'International Phone',
      metadata: {
        digits: digitsOnly,
      },
    });
  }

  return matches;
}
