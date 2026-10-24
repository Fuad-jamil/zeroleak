import { RawEntityMatch } from '../types';
import { RECOVERY_MNEMONIC_PHRASE_REGEX } from '../patterns';

// Protocol keywords, boolean flags, and common field names that must NEVER be considered secrets
export const COMMON_SECRET_STOPWORDS = new Set([
  'bearer',
  'basic',
  'token',
  'secret',
  'password',
  'passwd',
  'pwd',
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
  'username',
  'user',
  'admin',
  'service',
  'headers',
  'status',
  'code',
  'database',
  'host',
  'port',
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
  // Temporary access codes & ticket codes (e.g. TMP-ACCESS-73A9-QQ2, RESET-TEST-8392)
  {
    regex: /\b([A-Z0-9]{3,8}-[A-Z0-9]{4,8}-[A-Z0-9]{3,8}(?:-[A-Z0-9]{2,8})?)\b/g,
    label: 'Temporary Access / Verification Code',
    kind: 'temp_code',
  },
];

// Natural language credential sentences:
// e.g. "The emergency password is N0tARealSecret!!2026, documented in the incident notes."
// e.g. "The value to use for authentication is SuperHiddenValue_2026!"
const NATURAL_LANGUAGE_CREDENTIAL_REGEX =
  /(?:(?:emergency|temporary|database|admin|root|master|user|default|current|initial|production|staging|backup)?\s*(?:password|passcode|passphrase|secret|token|credentials?|access\s+code)\s+(?:is|was|will be|to use is|set to|configured as)|value to use for (?:authentication|auth|access|login) is)\s*(["']?)([^\s"';,]+?)\1(?=[\s,;.!)]|$)/gi;

// Debug statements with assignment separators (=>, ->, :=, ==, =):
// e.g. db_password => "Hidden$Value_771" or internalKey := "Secret123"
const DEBUG_STATEMENT_SECRET_REGEX =
  /\b([a-zA-Z0-9_]*(?:secret|password|passwd|pass|token|key|apikey|api_key|auth|credential|signature)[a-zA-Z0-9_]*)\s*(?:=>|->|:=|==|=)\s*(["']?)([^\s"';,\r\n]+)\2/gi;

// Shell export assignments with quotes:
// e.g. export INTERNAL_SIGNING_SECRET='Sign!Me_Test_44'
const SHELL_EXPORT_SECRET_REGEX =
  /(?:export\s+)?([A-Za-z0-9_]*(?:SECRET|PASSWORD|PASS|TOKEN|KEY|APIKEY|AUTH|SIGNATURE)[A-Za-z0-9_]*)\s*=\s*(["'])([^"'\r\n]+)\2/gi;

// Key-Value pairs in logs and application text: e.g. host=... user=amal_admin password=FakePass_9x!
const LOG_KV_SECRET_REGEX =
  /\b(password|passwd|pwd|pass|token|api_key|apiKey|api-key|secret|client_secret|auth_token)\s*[:=]\s*(["']?)([^\s"';,]+)\2/gi;

// Technical usernames in logs (e.g. user=amal_admin)
const LOG_KV_USER_REGEX =
  /\b(user|username|user_name|db_user|dbuser)\s*[:=]\s*(["']?)([a-zA-Z0-9_.-]{3,30})\2/gi;

// .env and JSON Key-Value assignments (strictly horizontal whitespace to avoid consuming multiline structure)
const ENV_JSON_ASSIGNMENT_REGEX =
  /(?:^|[\n\r;,{]\s*|\s+)(?:export\s+)?(?:["']?([A-Za-z0-9_]*(?:SECRET|PASSWORD|PASS|TOKEN|KEY|APIKEY|CREDENTIALS|PRIVATE|SIGNATURE)[A-Za-z0-9_]*)["']?)[ \t]*(?:=|:)[ \t]*(["']?)([^\r\n"';,}]+?)\2(?=[\r\n;,}\s]|$)/gi;

export function detectSecrets(text: string): RawEntityMatch[] {
  const matches: RawEntityMatch[] = [];

  // Helper to safely add match
  const addMatch = (val: string, startIndex: number, label: string, kind: string, keyName?: string) => {
    let cleanVal = val.trim();
    if (!cleanVal || cleanVal.length < 3) return;

    // Reject structural keywords from ever being detected as secret values
    if (['username', 'user', 'password', 'passwd', 'auth', 'headers', 'service', 'database'].includes(cleanVal.toLowerCase())) {
      return;
    }

    // Handle Bearer <token>
    if (/^Bearer\s+/i.test(cleanVal)) {
      cleanVal = cleanVal.replace(/^Bearer\s+/i, '').trim();
    }

    // Exclude stop words
    if (COMMON_SECRET_STOPWORDS.has(cleanVal.toLowerCase())) return;

    // Exclude pure numbers like 500, 8080, 3 (ports, retry counts, HTTP status codes)
    if (/^\d+$/.test(cleanVal) && cleanVal.length < 6) return;

    // Exclude version strings like 1.10.2026
    if (/^\d+(\.\d+)+$/.test(cleanVal)) return;

    matches.push({
      category: 'secret',
      original: cleanVal,
      startIndex,
      endIndex: startIndex + cleanVal.length,
      label,
      metadata: { kind, keyName, entropy: calculateEntropy(cleanVal).toFixed(2) },
    });
  };

  // 1. Detect known specific secret patterns
  for (const { regex, label, kind } of KNOWN_PATTERNS) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const val = match[1] || match[0];
      const offset = match[0].indexOf(val);
      const start = match.index + (offset >= 0 ? offset : 0);

      if (val.length < 6 && kind !== 'uuid') continue;
      addMatch(val, start, label, kind);
    }
  }

  // 2. Recovery Mnemonic Phrases (BIP-39 seed phrases)
  RECOVERY_MNEMONIC_PHRASE_REGEX.lastIndex = 0;
  let recMatch: RegExpExecArray | null;
  while ((recMatch = RECOVERY_MNEMONIC_PHRASE_REGEX.exec(text)) !== null) {
    const phrase = recMatch[1]?.trim();
    if (phrase && phrase.length >= 10) {
      const offset = recMatch[0].lastIndexOf(phrase);
      addMatch(phrase, recMatch.index + offset, 'Recovery Seed Phrase', 'seed_phrase');
    }
  }

  // 3. Natural Language Credential Sentences
  NATURAL_LANGUAGE_CREDENTIAL_REGEX.lastIndex = 0;
  let nlMatch: RegExpExecArray | null;
  while ((nlMatch = NATURAL_LANGUAGE_CREDENTIAL_REGEX.exec(text)) !== null) {
    const secretVal = nlMatch[2]?.trim();
    if (secretVal && secretVal.length >= 4) {
      const offset = nlMatch[0].lastIndexOf(secretVal);
      addMatch(secretVal, nlMatch.index + offset, 'Natural Language Credential', 'natural_secret');
    }
  }

  // 4. Debug Statements with unusual separators (=>, ->, :=, ==)
  DEBUG_STATEMENT_SECRET_REGEX.lastIndex = 0;
  let dbgMatch: RegExpExecArray | null;
  while ((dbgMatch = DEBUG_STATEMENT_SECRET_REGEX.exec(text)) !== null) {
    const key = dbgMatch[1];
    const val = dbgMatch[3]?.trim();
    if (val && val.length >= 3) {
      const offset = dbgMatch[0].lastIndexOf(val);
      addMatch(val, dbgMatch.index + offset, `Debug Statement Secret (${key})`, 'debug_secret', key);
    }
  }

  // 5. Shell Export Assignments with Quotes
  SHELL_EXPORT_SECRET_REGEX.lastIndex = 0;
  let shMatch: RegExpExecArray | null;
  while ((shMatch = SHELL_EXPORT_SECRET_REGEX.exec(text)) !== null) {
    const key = shMatch[1];
    const val = shMatch[3]?.trim();
    if (val && val.length >= 3) {
      const offset = shMatch[0].lastIndexOf(val);
      addMatch(val, shMatch.index + offset, `Shell Export Secret (${key})`, 'shell_secret', key);
    }
  }

  // 6. Log Key-Value Secrets (e.g. password=FakePass_9x! in logs)
  LOG_KV_SECRET_REGEX.lastIndex = 0;
  let logKvMatch: RegExpExecArray | null;
  while ((logKvMatch = LOG_KV_SECRET_REGEX.exec(text)) !== null) {
    const keyName = logKvMatch[1];
    const rawVal = logKvMatch[3]?.trim();
    if (rawVal && rawVal.length >= 3) {
      const offset = logKvMatch[0].lastIndexOf(rawVal);
      addMatch(rawVal, logKvMatch.index + offset, `Log Credential (${keyName})`, 'log_credential', keyName);
    }
  }

  // 7. Log Key-Value Technical Usernames (e.g. user=amal_admin in logs)
  LOG_KV_USER_REGEX.lastIndex = 0;
  let logUserMatch: RegExpExecArray | null;
  while ((logUserMatch = LOG_KV_USER_REGEX.exec(text)) !== null) {
    const keyName = logUserMatch[1];
    const rawVal = logUserMatch[3]?.trim();
    if (rawVal && rawVal.length >= 3 && !COMMON_SECRET_STOPWORDS.has(rawVal.toLowerCase())) {
      const offset = logUserMatch[0].lastIndexOf(rawVal);
      matches.push({
        category: 'person',
        original: rawVal,
        startIndex: logUserMatch.index + offset,
        endIndex: logUserMatch.index + offset + rawVal.length,
        label: `User/Admin (${keyName})`,
        metadata: { kind: 'db_user', keyName, isDbUser: true },
      });
    }
  }

  // 8. .env and JSON Key-Value assignments
  ENV_JSON_ASSIGNMENT_REGEX.lastIndex = 0;
  let envMatch: RegExpExecArray | null;
  while ((envMatch = ENV_JSON_ASSIGNMENT_REGEX.exec(text)) !== null) {
    const keyName = envMatch[1];
    let rawVal = envMatch[3]?.trim();

    if (!rawVal || rawVal.length < 3) continue;

    if (/^Bearer\s+/i.test(rawVal)) {
      rawVal = rawVal.replace(/^Bearer\s+/i, '').trim();
    }

    if (COMMON_SECRET_STOPWORDS.has(rawVal.toLowerCase())) continue;

    const fullMatch = envMatch[0];
    const valueIndexInMatch = fullMatch.lastIndexOf(rawVal);
    if (valueIndexInMatch === -1) continue;

    const start = envMatch.index + valueIndexInMatch;
    addMatch(rawVal, start, `Secret Config (${keyName})`, 'env_secret', keyName);
  }

  return matches;
}
