export type EntityCategory =
  | 'email'
  | 'ipv4'
  | 'secret'
  | 'url'
  | 'phone'
  | 'db_uri'
  | 'person'
  | 'project'
  | 'company'
  | 'custom';

export type PresetMode = 'developer' | 'business';

export interface RawEntityMatch {
  category: EntityCategory;
  original: string;
  startIndex: number;
  endIndex: number;
  label?: string;
  metadata?: Record<string, string | number | boolean | undefined>;
}

export interface AliasMapping {
  id: string;
  original: string;
  alias: string;
  category: EntityCategory;
  count: number;
  enabled: boolean;
  isCustom?: boolean;
  label?: string;
  createdAt: number;
  metadata?: Record<string, string | number | boolean | undefined>;
}

export interface DetectedEntity extends RawEntityMatch {
  id: string;
  alias: string;
  enabled: boolean;
}

export interface CustomRule {
  id: string;
  term: string;
  alias?: string;
  category: EntityCategory;
  caseSensitive: boolean;
  enabled: boolean;
}

export interface SanitizeResult {
  sanitizedText: string;
  mappings: AliasMapping[];
  detectedEntities: DetectedEntity[];
  stats: {
    totalMasked: number;
    categoryCounts: Record<EntityCategory, number>;
    entropyLevel?: string;
  };
}

export interface RestoredItem {
  alias: string;
  original: string;
  count: number;
  category: EntityCategory;
}

export interface RestoreResult {
  restoredText: string;
  restoredCount: number;
  items: RestoredItem[];
}

export interface DetectorOptions {
  mode: PresetMode;
  enabledCategories: Record<EntityCategory, boolean>;
  customRules: CustomRule[];
}
