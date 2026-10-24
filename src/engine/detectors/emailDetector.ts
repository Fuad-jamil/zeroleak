import { RawEntityMatch } from '../types';

// RFC 5322 compatible pragmatic email regex
const EMAIL_REGEX = /\b([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;

export function detectEmails(text: string): RawEntityMatch[] {
  const matches: RawEntityMatch[] = [];
  let match: RegExpExecArray | null;

  EMAIL_REGEX.lastIndex = 0;
  while ((match = EMAIL_REGEX.exec(text)) !== null) {
    const fullEmail = match[0];
    const username = match[1];
    const domain = match[2].toLowerCase();

    matches.push({
      category: 'email',
      original: fullEmail,
      startIndex: match.index,
      endIndex: match.index + fullEmail.length,
      label: 'Email Address',
      metadata: {
        username,
        domain,
      },
    });
  }

  return matches;
}

