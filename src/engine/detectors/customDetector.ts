import { CustomRule, RawEntityMatch } from '../types';

export function detectCustomRules(
  text: string,
  rules: CustomRule[]
): RawEntityMatch[] {
  const matches: RawEntityMatch[] = [];

  for (const rule of rules) {
    if (!rule.enabled || !rule.term.trim()) continue;

    // Escape regex special characters if searching plain string
    const escaped = rule.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = rule.caseSensitive ? 'g' : 'gi';

    // Match either word boundaries or literal exact token
    const regex = new RegExp(`\\b${escaped}\\b`, flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        category: rule.category || 'custom',
        original: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        label: `Custom: "${rule.term}"`,
        metadata: {
          ruleId: rule.id,
          suggestedAlias: rule.alias ?? '',
        },
      });
    }
  }

  return matches;
}
