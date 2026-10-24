import { RawEntityMatch } from '../types';

// Shannon entropy calculation
export function calculateEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const frequencies: Record<string, number> = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

// Secret pattern definitions
const KNOWN_PATTERNS: { regex: RegExp; label: string; kind: string }[] = [
  // AWS Access Key ID
  {
    regex: /\b(AKIA[0-9A-Z]{16})\b/g,
    label: 'AWS Access Key',
    kind: 'aws_access_key',
  },
  // JWT Token: header.payload.signature
  {
    regex: /\b(eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})\b/g,
    label: 'JWT Token',
    kind: 'jwt',
  },
  // OpenAI Keys (legacy and new project keys)
  {
    regex: /\b(sk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{32,})\b/g,
    label: 'OpenAI API Key',
    kind: 'openai_key',
  },
  // Stripe API Keys
  {
    regex: /\b((?:sk|pk)_(?:live|test)_[a-zA-Z0-9]{24,})\b/g,
    label: 'Stripe API Key',
    kind: 'stripe_key',
  },
  // GitHub Personal Access Token
  {
    regex: /\b((?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,})\b/g,
    label: 'GitHub Token',
    kind: 'github_token',
  },
  // Google API Key
  {
    regex: /\b(AIza[0-9A-Za-z-_]{35})\b/g,
    label: 'Google API Key',
    kind: 'google_key',
  },
  // Slack Tokens
  {
    regex: /\b(xox[baprs]-[0-9a-zA-Z]{10,48})\b/g,
    label: 'Slack Token',
    kind: 'slack_token',
  },
  // Bearer Token in authorization headers
  {
    regex: /(?:Bearer\s+)([A-Za-z0-9_.\-~+/]{20,}={0,2})/gi,
    label: 'Bearer Token',
    kind: 'bearer_token',
  },
  // Generic UUID / GUID formatted keys when identified as secret/token
  {
    regex: /\b([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\b/g,
    label: 'UUID Secret',
    kind: 'uuid',
  },
  // High entropy 32/64 char hex hash (like MD5, SHA256 secrets)
  {
    regex: /\b([a-fA-F0-9]{32}|[a-fA-F0-9]{40}|[a-fA-F0-9]{64})\b/g,
    label: 'Cryptographic Hash/Key',
    kind: 'hex_hash',
  },
];

// .env and JSON Key-Value assignments
// Matches: KEY=value or "key": "value" where key contains SECRET, PASSWORD, TOKEN, KEY, API, AUTH, CREDENTIALS
const ENV_JSON_ASSIGNMENT_REGEX =
  /(?:^|[\n\r;,{]\s*)(?:export\s+)?(?:["']?([A-Za-z0-9_]*(?:SECRET|PASSWORD|PASS|TOKEN|KEY|APIKEY|AUTH|CREDENTIALS|PRIVATE|SIGNATURE)[A-Za-z0-9_]*)["']?)\s*(?:=|:)\s*(["']?)([^"'\r\n;,]+?)\2(?=[\r\n;,}]|$)/gi;

export function detectSecrets(text: string): RawEntityMatch[] {
  const matches: RawEntityMatch[] = [];

  // 1. Detect known specific secret patterns
  for (const { regex, label, kind } of KNOWN_PATTERNS) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      // If group 1 exists, use it; otherwise match[0]
      const val = match[1] || match[0];
      const offset = match[0].indexOf(val);
      const start = match.index + (offset >= 0 ? offset : 0);
      const end = start + val.length;

      // Filter out obvious false positives like regular english words or common uuid placeholders
      if (val.length < 8 && kind !== 'uuid') continue;

      matches.push({
        category: 'secret',
        original: val,
        startIndex: start,
        endIndex: end,
        label,
        metadata: { kind, entropy: calculateEntropy(val).toFixed(2) },
      });
    }
  }

  // 2. Detect Key-Value assignments in .env or JSON configs
  ENV_JSON_ASSIGNMENT_REGEX.lastIndex = 0;
  let envMatch: RegExpExecArray | null;
  while ((envMatch = ENV_JSON_ASSIGNMENT_REGEX.exec(text)) !== null) {
    const keyName = envMatch[1];
    const rawVal = envMatch[3]?.trim();

    if (!rawVal || rawVal.length < 4) continue;
    // Skip common non-sensitive placeholders
    if (['true', 'false', 'null', 'undefined', '0', '1', 'none', 'development', 'production', 'test'].includes(rawVal.toLowerCase())) {
      continue;
    }

    // Find position of the value in the full matched string
    const fullMatch = envMatch[0];
    const valueIndexInMatch = fullMatch.lastIndexOf(rawVal);
    if (valueIndexInMatch === -1) continue;

    const start = envMatch.index + valueIndexInMatch;
    const end = start + rawVal.length;

    matches.push({
      category: 'secret',
      original: rawVal,
      startIndex: start,
      endIndex: end,
      label: `Secret Config (${keyName})`,
      metadata: {
        kind: 'env_secret',
        keyName,
        entropy: calculateEntropy(rawVal).toFixed(2),
      },
    });
  }

  return matches;
}

