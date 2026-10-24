import { AliasMapping, RestoreResult, RestoredItem } from './types';

/**
 * Escapes string for usage in RegExp
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Restores original sensitive values in the LLM response text
 * by replacing aliases with their corresponding original values.
 *
 * Implements a SINGLE-PASS non-colliding replacement algorithm:
 * 1. Aliases are sorted by length descending so that 'SECRET_KEY_10' matches before 'SECRET_KEY_1'
 *    and 'user_10' matches before 'user_1'.
 * 2. Replacements are executed in a single pass using a combined regular expression.
 *    The returned original values are NEVER re-scanned for aliases, eliminating chained
 *    substitution bugs and accidental double-replacement.
 */
export function restoreText(
  llmResponse: string,
  mappings: AliasMapping[]
): RestoreResult {
  if (!llmResponse || mappings.length === 0) {
    return {
      restoredText: llmResponse || '',
      restoredCount: 0,
      items: [],
    };
  }

  // Filter only enabled mappings with valid alias & original
  const activeMappings = mappings.filter(
    (m) => m.enabled !== false && m.alias && m.original
  );

  if (activeMappings.length === 0) {
    return {
      restoredText: llmResponse,
      restoredCount: 0,
      items: [],
    };
  }

  // CRITICAL REQUIREMENT: Sort replacements by alias length descending
  // to prevent partial collisions (e.g., SECRET_KEY_10 before SECRET_KEY_1)
  const sortedMappings = [...activeMappings].sort(
    (a, b) => b.alias.length - a.alias.length
  );

  const aliasToMapping = new Map<string, AliasMapping>();
  for (const m of sortedMappings) {
    if (!aliasToMapping.has(m.alias)) {
      aliasToMapping.set(m.alias, m);
    }
  }

  // Build unified regex for all aliases
  const escapedAliases = Array.from(aliasToMapping.keys()).map((a) => escapeRegExp(a));
  const unifiedRegex = new RegExp(`(${escapedAliases.join('|')})`, 'g');

  const restoredCounts = new Map<string, number>();
  let totalRestoredCount = 0;

  // Single-pass replacement: never re-scans already replaced text!
  // Prevents chained substitutions and collision bugs completely.
  const restoredText = llmResponse.replace(unifiedRegex, (matchedAlias) => {
    const mapping = aliasToMapping.get(matchedAlias);
    if (mapping) {
      totalRestoredCount++;
      restoredCounts.set(matchedAlias, (restoredCounts.get(matchedAlias) || 0) + 1);
      return mapping.original;
    }
    return matchedAlias;
  });

  const restoredItems: RestoredItem[] = [];
  for (const [alias, count] of restoredCounts.entries()) {
    const mapping = aliasToMapping.get(alias)!;
    restoredItems.push({
      alias,
      original: mapping.original,
      count,
      category: mapping.category,
    });
  }

  return {
    restoredText,
    restoredCount: totalRestoredCount,
    items: restoredItems,
  };
}
