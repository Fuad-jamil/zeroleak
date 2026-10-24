import { RawEntityMatch } from '../types';
import { RECOVERY_MNEMONIC_PHRASE_REGEX } from '../patterns';

// Common stop words and protocol keywords that must never be considered secrets
export const COMMON_SECRET_STOPWORDS = new Set([
  'bearer',
  'basic',
  'token',
  'secret',
  'password',
  'passwd',
  'key',
  'apikey',
  'auth',
  'authorization',
  'true',
  'false',
  'null',
  'none',
  'undefined',
  'http',
  'https',
  'post',
  'get',
  'put',
  'delete',
  'patch',
  'head',
  'options',
  'development',
  'production',
  'staging',
  'test',
]);

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
  // Bearer Token in authorization headers (extracts the actual token, leaving Bearer keyword intact)
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

// Key-Value pairs in logs and application text: e.g. host=... user=amal_admin password=FakePass_9x!
const LOG_KV_SECRET_REGEX =
  /\b(password|passwd|pwd|pass|token|api_key|apiKey|api-key|secret|client_secret|auth_token)\s*[:=]\s*(["']?)([^\s"';,]+)\2/gi;

const LOG_KV_USER_REGEX =
  /\b(user|username|user_name|db_user|dbuser)\s*[:=]\s*(["']?)([a-zA-Z0-9_.-]{3,30})\2/gi;

// .env and JSON Key-Value assignments
const ENV_JSON_ASSIGNMENT_REGEX =
  /(?:^|[\n\r;,{]\s*|\s+)(?:export\s+)?(?:["']?([A-Za-z0-9_]*(?:SECRET|PASSWORD|PASS|TOKEN|KEY|APIKEY|AUTH|CREDENTIALS|PRIVATE|SIGNATURE)[A-Za-z0-9_]*)["']?)\s*(?:=|:)\s*(["']?)([^"'\r\n;,]+?)\2(?=[\r\n;,}\s]|$)/gi;

export function detectSecrets(text: string): RawEntityMatch[] {
  const matches: RawEntityMatch[] = [];

  // 1. Detect known specific secret patterns
  for (const { regex, label, kind } of KNOWN_PATTERNS) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const val = match[1] || match[0];
      const offset = match[0].indexOf(val);
      const start = match.index + (offset >= 0 ? offset : 0);
      const end = start + val.length;

      if (val.length < 8 && kind !== 'uuid') continue;
      if (COMMON_SECRET_STOPWORDS.has(val.toLowerCase())) continue;

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

  // 2. Recovery Mnemonic Phrases (BIP-39 seed phrases)
  RECOVERY_MNEMONIC_PHRASE_REGEX.lastIndex = 0;
  let recMatch: RegExpExecArray | null;
  while ((recMatch = RECOVERY_MNEMONIC_PHRASE_REGEX.exec(text)) !== null) {
    const phrase = recMatch[1]?.trim();
    if (phrase && phrase.length >= 10) {
      const offset = recMatch[0].lastIndexOf(phrase);
      const start = recMatch.index + offset;
      matches.push({
        category: 'secret',
        original: phrase,
        startIndex: start,
        endIndex: start + phrase.length,
        label: 'Recovery Seed Phrase',
        metadata: { kind: 'seed_phrase' },
      });
    }
  }

  // 3. Log Key-Value Secrets (e.g. password=FakePass_9x! in logs)
  LOG_KV_SECRET_REGEX.lastIndex = 0;
  let logKvMatch: RegExpExecArray | null;
  while ((logKvMatch = LOG_KV_SECRET_REGEX.exec(text)) !== null) {
    const keyName = logKvMatch[1];
    let rawVal = logKvMatch[3]?.trim();

    if (!rawVal || rawVal.length < 3) continue;
    if (COMMON_SECRET_STOPWORDS.has(rawVal.toLowerCase())) continue;

    const offset = logKvMatch[0].lastIndexOf(rawVal);
    const start = logKvMatch.index + offset;

    matches.push({
      category: 'secret',
      original: rawVal,
      startIndex: start,
      endIndex: start + rawVal.length,
      label: `Log Credential (${keyName})`,
      metadata: { kind: 'log_credential', keyName, isLogCred: true },
    });
  }

  // 4. Log Key-Value Usernames (e.g. user=amal_admin in logs)
  LOG_KV_USER_REGEX.lastIndex = 0;
  let logUserMatch: RegExpExecArray | null;
  while ((logUserMatch = LOG_KV_USER_REGEX.exec(text)) !== null) {
    const keyName = logUserMatch[1];
    const rawVal = logUserMatch[3]?.trim();

    if (!rawVal || rawVal.length < 3) continue;
    if (COMMON_SECRET_STOPWORDS.has(rawVal.toLowerCase())) continue;

    const offset = logUserMatch[0].lastIndexOf(rawVal);
    const start = logUserMatch.index + offset;

    matches.push({
      category: 'person',
      original: rawVal,
      startIndex: start,
      endIndex: start + rawVal.length,
      label: `User/Admin (${keyName})`,
      metadata: { kind: 'db_user', keyName, isDbUser: true },
    });
  }

  // 5. Detect Key-Value assignments in .env or JSON configs
  ENV_JSON_ASSIGNMENT_REGEX.lastIndex = 0;
  let envMatch: RegExpExecArray | null;
  while ((envMatch = ENV_JSON_ASSIGNMENT_REGEX.exec(text)) !== null) {
    const keyName = envMatch[1];
    let rawVal = envMatch[3]?.trim();

    if (!rawVal || rawVal.length < 3) continue;

    // Handle Bearer <token> in AUTH_HEADER: strip 'Bearer ' and only mask the actual token
    if (/^Bearer\s+/i.test(rawVal)) {
      rawVal = rawVal.replace(/^Bearer\s+/i, '').trim();
    }

    if (COMMON_SECRET_STOPWORDS.has(rawVal.toLowerCase())) {
      continue;
    }

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
