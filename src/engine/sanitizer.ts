import {
  AliasMapping,
  DetectedEntity,
  DetectorOptions,
  EntityCategory,
  RawEntityMatch,
  SanitizeResult,
} from './types';
import { detectDbUris } from './detectors/dbUriDetector';
import { detectEmails } from './detectors/emailDetector';
import { detectIps } from './detectors/ipDetector';
import { detectSecrets, calculateEntropy } from './detectors/secretDetector';
import { detectUrls } from './detectors/urlDetector';
import { detectPhoneNumbers } from './detectors/phoneDetector';
import { detectNamesAndProjects } from './detectors/nameDetector';
import { detectCustomRules } from './detectors/customDetector';
import { SessionAliasGenerator } from './aliasGenerator';

export function sanitizeText(
  inputText: string,
  options: DetectorOptions,
  aliasGenerator: SessionAliasGenerator,
  existingMappings?: AliasMapping[]
): SanitizeResult {
  if (!inputText || inputText.trim() === '') {
    return {
      sanitizedText: '',
      mappings: [],
      detectedEntities: [],
      stats: {
        totalMasked: 0,
        categoryCounts: {
          email: 0,
          ipv4: 0,
          secret: 0,
          url: 0,
          phone: 0,
          db_uri: 0,
          person: 0,
          project: 0,
          company: 0,
          custom: 0,
        },
      },
    };
  }

  const rawMatches: RawEntityMatch[] = [];

  // 1. Database Connection Strings (High priority: preserves schema, credentials, host, db)
  if (options.enabledCategories.db_uri) {
    rawMatches.push(...detectDbUris(inputText));
  }

  // 2. Emails
  if (options.enabledCategories.email) {
    rawMatches.push(...detectEmails(inputText));
  }

  // 3. URLs
  if (options.enabledCategories.url) {
    rawMatches.push(...detectUrls(inputText));
  }

  // 4. Phone Numbers (Clean international + domestic)
  if (options.enabledCategories.phone) {
    rawMatches.push(...detectPhoneNumbers(inputText));
  }

  // 5. Names, Projects & Companies (Arabic & English)
  if (
    options.enabledCategories.person ||
    options.enabledCategories.project ||
    options.enabledCategories.company
  ) {
    const nameMatches = detectNamesAndProjects(inputText);
    for (const m of nameMatches) {
      if (options.enabledCategories[m.category]) {
        rawMatches.push(m);
      }
    }
  }

  // 6. IPv4 Addresses (Strictly valid octets)
  if (options.enabledCategories.ipv4) {
    rawMatches.push(...detectIps(inputText));
  }

  // 7. Secrets, API keys, tokens, high-entropy values
  if (options.enabledCategories.secret) {
    rawMatches.push(...detectSecrets(inputText));
  }

  // 8. Custom user manual rules
  if (options.enabledCategories.custom && options.customRules.length > 0) {
    rawMatches.push(...detectCustomRules(inputText, options.customRules));
  }

  // Overlap Resolution:
  // Sort priority: DB_URI and Custom rules first, then longest match
  rawMatches.sort((a, b) => {
    // Custom rules and DB_URI take priority over generic substrings
    const isPriorityA = a.category === 'custom' || a.category === 'db_uri';
    const isPriorityB = b.category === 'custom' || b.category === 'db_uri';
    if (isPriorityA && !isPriorityB) return -1;
    if (!isPriorityA && isPriorityB) return 1;

    const lenA = a.endIndex - a.startIndex;
    const lenB = b.endIndex - b.startIndex;
    if (lenB !== lenA) return lenB - lenA;
    return a.startIndex - b.startIndex;
  });

  const nonOverlappingMatches: RawEntityMatch[] = [];
  const occupied = new Uint8Array(inputText.length);

  for (const match of rawMatches) {
    let hasOverlap = false;
    for (let i = match.startIndex; i < match.endIndex; i++) {
      if (occupied[i] === 1) {
        hasOverlap = true;
        break;
      }
    }
    if (!hasOverlap) {
      nonOverlappingMatches.push(match);
      for (let i = match.startIndex; i < match.endIndex; i++) {
        occupied[i] = 1;
      }
    }
  }

  nonOverlappingMatches.sort((a, b) => a.startIndex - b.startIndex);

  // Pre-seed disabled map and custom alias overrides
  const existingDisabledMap = new Map<string, boolean>();
  if (existingMappings) {
    for (const m of existingMappings) {
      existingDisabledMap.set(m.original, m.enabled === false);
      if (m.alias) {
        aliasGenerator.setCustomMapping(m.original, m.alias);
      }
    }
  }

  const detectedEntities: DetectedEntity[] = [];
  const countsByOriginal = new Map<string, number>();

  for (const raw of nonOverlappingMatches) {
    const alias = aliasGenerator.generateOrGetAlias(raw);
    const isExplicitlyDisabled = existingDisabledMap.get(raw.original) === true;

    detectedEntities.push({
      ...raw,
      id: `${raw.category}-${raw.startIndex}-${raw.endIndex}`,
      alias,
      enabled: !isExplicitlyDisabled,
    });

    countsByOriginal.set(raw.original, (countsByOriginal.get(raw.original) || 0) + 1);
  }

  // Build the list of active AliasMappings for the vault table
  const mappingsMap = new Map<string, AliasMapping>();
  for (const entity of detectedEntities) {
    if (!mappingsMap.has(entity.original)) {
      mappingsMap.set(entity.original, {
        id: `map-${entity.category}-${entity.original.slice(0, 16)}`,
        original: entity.original,
        alias: entity.alias,
        category: entity.category,
        count: countsByOriginal.get(entity.original) || 1,
        enabled: entity.enabled,
        isCustom: entity.category === 'custom',
        label: entity.label,
        createdAt: Date.now(),
        metadata: entity.metadata,
      });
    }
  }

  // Also include standalone sub-mappings registered by generators (e.g. DB pass, host, db name)
  for (const item of aliasGenerator.getAllMappings()) {
    if (!mappingsMap.has(item.original)) {
      mappingsMap.set(item.original, {
        id: `map-sub-${item.alias.slice(0, 12)}`,
        original: item.original,
        alias: item.alias,
        category: item.alias.startsWith('DB_PASS') || item.alias.startsWith('SECRET')
          ? 'secret'
          : item.alias.startsWith('10.') || item.alias.startsWith('192.')
          ? 'ipv4'
          : 'custom',
        count: 1,
        enabled: true,
        label: 'Sub-Component Mapping',
        createdAt: Date.now(),
      });
    }
  }

  // Build sanitized text from back to front
  const sortedEntitiesBackwards = [...detectedEntities].sort(
    (a, b) => b.startIndex - a.startIndex
  );

  let sanitizedText = inputText;
  let totalMaskedCount = 0;
  const categoryCounts: Record<EntityCategory, number> = {
    email: 0,
    ipv4: 0,
    secret: 0,
    url: 0,
    phone: 0,
    db_uri: 0,
    person: 0,
    project: 0,
    company: 0,
    custom: 0,
  };

  for (const entity of sortedEntitiesBackwards) {
    if (entity.enabled) {
      sanitizedText =
        sanitizedText.slice(0, entity.startIndex) +
        entity.alias +
        sanitizedText.slice(entity.endIndex);

      totalMaskedCount++;
      categoryCounts[entity.category] = (categoryCounts[entity.category] || 0) + 1;
    }
  }

  return {
    sanitizedText,
    mappings: Array.from(mappingsMap.values()),
    detectedEntities,
    stats: {
      totalMasked: totalMaskedCount,
      categoryCounts,
      entropyLevel: `${calculateEntropy(sanitizedText).toFixed(2)} bits/char`,
    },
  };
}
