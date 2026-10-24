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
 * Replacements are strictly sorted by alias length descending to avoid
 * partial token collisions (e.g. replacing 'user_1' inside 'user_10').
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

  // CRITICAL REQUIREMENT: Sort replacements by alias length descending
  // to prevent partial collisions (e.g., user_1 replacing inside user_12)
  const sortedMappings = [...activeMappings].sort(
    (a, b) => b.alias.length - a.alias.length
  );

  let resultText = llmResponse;
  let totalRestoredCount = 0;
  const restoredItems: RestoredItem[] = [];

  for (const mapping of sortedMappings) {
    const escapedAlias = escapeRegExp(mapping.alias);
    const regex = new RegExp(escapedAlias, 'g');

    // Count occurrences
    const matches = resultText.match(regex);
    const matchCount = matches ? matches.length : 0;

    if (matchCount > 0) {
      resultText = resultText.replace(regex, mapping.original);
      totalRestoredCount += matchCount;
      restoredItems.push({
        alias: mapping.alias,
        original: mapping.original,
        count: matchCount,
        category: mapping.category,
      });
    }
  }

  return {
    restoredText: resultText,
    restoredCount: totalRestoredCount,
    items: restoredItems,
  };
}

