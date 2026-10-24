import { CustomRule, RawEntityMatch } from '../types';

export function detectCustomRules(
  text: string,
  rules: CustomRule[]
): RawEntityMatch[] {
  const matches: RawEntityMatch[] = [];

  for (const rule of rules) {
    if (!rule.enabled || !rule.term?.trim()) continue;

    const term = rule.term.trim();
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = rule.caseSensitive ? 'g' : 'gi';

    // Safe boundary assertion:
    // Only check word boundary if term starts/ends with alphanumeric/underscore.
    // Accurately handles hyphens ("ALPHA-RESTRICTED", "CASE-778192"), underscores, and multi-word phrases.
    const prefix = /^[a-zA-Z0-9_]/.test(term) ? '(?<![a-zA-Z0-9_])' : '';
    const suffix = /[a-zA-Z0-9_]$/.test(term) ? '(?![a-zA-Z0-9_])' : '';
    const regex = new RegExp(`${prefix}${escaped}${suffix}`, flags);

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
          isCustomRule: true,
          suggestedAlias: rule.alias?.trim() || undefined,
        },
      });
    }
  }

  return matches;
}
