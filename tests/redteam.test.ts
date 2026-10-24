import { describe, it, expect } from 'vitest';
import { sanitizeText } from '../src/engine/sanitizer';
import { restoreText } from '../src/engine/restorer';
import { SessionAliasGenerator } from '../src/engine/aliasGenerator';
import { CustomRule, DetectorOptions } from '../src/engine/types';

function createOptions(customRules: CustomRule[] = []): DetectorOptions {
  return {
    mode: 'developer',
    enabledCategories: {
      db_uri: true,
      email: true,
      ipv4: true,
      secret: true,
      url: true,
      phone: true,
      person: true,
      project: true,
      company: true,
      custom: true,
    },
    customRules,
  };
}

describe('ZL-REDTEAM-2026-001: Security Hardening & Regression Specification', () => {

  // 1. Natural language sentences, debug statements, shell assignments, temporary access codes
  describe('1. Secrets in ordinary text and diverse syntaxes', () => {
    it('masks emergency password in natural language sentence', () => {
      const input = 'The emergency password is N0tARealSecret!!2026, documented in the incident notes.';
      const res = sanitizeText(input, createOptions(), new SessionAliasGenerator());
      expect(res.sanitizedText).not.toContain('N0tARealSecret!!2026');
      expect(res.sanitizedText).toContain('The emergency password is ');
    });

    it('masks debug statements with arrow separator => and quotes', () => {
      const input = 'An engineer accidentally printed db_password => "Hidden$Value_771" in a debug statement.';
      const res = sanitizeText(input, createOptions(), new SessionAliasGenerator());
      expect(res.sanitizedText).not.toContain('Hidden$Value_771');
      expect(res.sanitizedText).toMatch(/db_password => "(DB_PASS_\d+|SECRET_KEY_\d+)"/);
    });

    it('masks shell assignments with single quotes and export keyword', () => {
      const input = "The deployment script contains export INTERNAL_SIGNING_SECRET='Sign!Me_Test_44'.";
      const res = sanitizeText(input, createOptions(), new SessionAliasGenerator());
      expect(res.sanitizedText).not.toContain('Sign!Me_Test_44');
      expect(res.sanitizedText).toMatch(/export INTERNAL_SIGNING_SECRET='(DB_PASS_\d+|SECRET_KEY_\d+)'/);
    });

    it('masks temporary access codes from support tickets', () => {
      const input = 'The support ticket says: "Use the temporary access code TMP-ACCESS-73A9-QQ2 for the reproduction environment."';
      const res = sanitizeText(input, createOptions(), new SessionAliasGenerator());
      expect(res.sanitizedText).not.toContain('TMP-ACCESS-73A9-QQ2');
    });

    it('masks natural language authentication secret phrase', () => {
      const input = 'The value to use for authentication is SuperHiddenValue_2026!';
      const res = sanitizeText(input, createOptions(), new SessionAliasGenerator());
      expect(res.sanitizedText).not.toContain('SuperHiddenValue_2026!');
    });
  });

  // 2. URL query parameters and embedded credentials
  describe('2. URL query parameters and embedded credentials', () => {
    it('masks session parameter while preserving nonsensitive redirect parameter', () => {
      const input = 'https://internal-host-3.local/login?session=SESSION_TEST_99AABB&redirect=/dashboard';
      const res = sanitizeText(input, createOptions(), new SessionAliasGenerator());
      expect(res.sanitizedText).not.toContain('SESSION_TEST_99AABB');
      expect(res.sanitizedText).toContain('redirect=%2Fdashboard');
    });

    it('masks email parameter as email alias and code parameter as secret', () => {
      const input = 'https://internal-host-4.local/reset?email=ahmad.mansour@example.invalid&code=RESET-TEST-8392';
      const res = sanitizeText(input, createOptions(), new SessionAliasGenerator());
      expect(res.sanitizedText).not.toContain('ahmad.mansour@example.invalid');
      expect(res.sanitizedText).not.toContain('RESET-TEST-8392');
      expect(res.sanitizedText).toMatch(/email=user_\d+%40domain_\d+\.invalid/);
      expect(res.sanitizedText).toMatch(/code=SECRET_KEY_\d+/);
    });

    it('masks debug_secret on IP-based endpoints while preserving port and path', () => {
      const input = 'http://192.168.1.2:8080/health?debug_secret=DEBUG-ONLY-882';
      const res = sanitizeText(input, createOptions(), new SessionAliasGenerator());
      expect(res.sanitizedText).not.toContain('DEBUG-ONLY-882');
      expect(res.sanitizedText).toContain(':8080/health?');
      expect(res.sanitizedText).toMatch(/debug_secret=SECRET_KEY_\d+/);
    });
  });

  // 3. Arabic names and contextual personal information
  describe('3. Arabic names and contextual personal information', () => {
    it('preserves full role titles while cleanly masking names', () => {
      const input = `المهندس المسؤول عن قاعدة البيانات: أحمد منصور.
مديرة المشروع: سارة عبد الرحمن.
مسؤول البنية التحتية: محمد علي القحطاني.`;

      const res = sanitizeText(input, createOptions(), new SessionAliasGenerator());

      // Original names must be masked
      expect(res.sanitizedText).not.toContain('أحمد منصور');
      expect(res.sanitizedText).not.toContain('سارة عبد الرحمن');
      expect(res.sanitizedText).not.toContain('محمد علي القحطاني');

      // Role titles must NOT be corrupted
      expect(res.sanitizedText).toContain('المهندس المسؤول عن قاعدة البيانات: ');
      expect(res.sanitizedText).toContain('مديرة المشروع: ');
      expect(res.sanitizedText).toContain('مسؤول البنية التحتية: ');
    });

    it('assigns distinct aliases to distinct people sharing first name', () => {
      const input = `Lead: أحمد منصور
Secondary: أحمد علي`;
      const gen = new SessionAliasGenerator();
      const res = sanitizeText(input, createOptions(), gen);
      expect(res.sanitizedText).not.toContain('أحمد منصور');
      expect(res.sanitizedText).not.toContain('أحمد علي');
      // Must map to two different aliases (e.g. Person_1 and Person_2)
      const personMatches = res.detectedEntities.filter(e => e.category === 'person');
      expect(personMatches.length).toBe(2);
      expect(personMatches[0].alias).not.toBe(personMatches[1].alias);
    });
  });

  // 4. Custom masking terms
  describe('4. Custom masking terms with highest precedence', () => {
    it('masks designated custom terms in all occurrences without drops', () => {
      const input = `Project_Alpha uses database 10.0.0.3.
ALPHA-RESTRICTED is the internal release classification.
The Client Northstar account triggered CASE-778192.`;

      const customRules: CustomRule[] = [
        { id: '1', term: 'Project_Alpha', category: 'custom', enabled: true },
        { id: '2', term: 'ALPHA-RESTRICTED', category: 'custom', enabled: true },
        { id: '3', term: 'Client Northstar', category: 'custom', enabled: true },
        { id: '4', term: 'CASE-778192', category: 'custom', enabled: true },
      ];

      const res = sanitizeText(input, createOptions(customRules), new SessionAliasGenerator());
      expect(res.sanitizedText).not.toContain('Project_Alpha');
      expect(res.sanitizedText).not.toContain('ALPHA-RESTRICTED');
      expect(res.sanitizedText).not.toContain('Client Northstar');
      expect(res.sanitizedText).not.toContain('CASE-778192');
    });
  });

  // 5. Structural integrity of YAML, JSON, and dotenv
  describe('5. Structural integrity of YAML, JSON, and dotenv', () => {
    it('preserves YAML key-value structure without replacing keys', () => {
      const input = `service:
  auth:
    username: "amal_admin"
    password: "DB_PASS_6"
  headers:
    Authorization: "Bearer FAKE_BEARER_TOKEN_9999"`;

      const res = sanitizeText(input, createOptions(), new SessionAliasGenerator());

      // Field keys must remain intact
      expect(res.sanitizedText).toContain('username:');
      expect(res.sanitizedText).toContain('password:');
      expect(res.sanitizedText).toContain('Authorization: "Bearer ');
      expect(res.sanitizedText).not.toContain('SECRET_KEY_13 db_user_5');
      expect(res.sanitizedText).not.toContain('amal_admin');
      expect(res.sanitizedText).not.toContain('FAKE_BEARER_TOKEN_9999');
    });

    it('preserves valid JSON object structure', () => {
      const jsonInput = JSON.stringify({
        database_host: '10.20.30.40',
        db_password: 'SuperSecret_Password!99',
        admin_email: 'admin@company.internal',
      }, null, 2);

      const res = sanitizeText(jsonInput, createOptions(), new SessionAliasGenerator());
      // Must remain valid JSON
      const parsed = JSON.parse(res.sanitizedText);
      expect(parsed).toHaveProperty('database_host');
      expect(parsed).toHaveProperty('db_password');
      expect(parsed).toHaveProperty('admin_email');
      expect(parsed.db_password).not.toBe('SuperSecret_Password!99');
    });
  });

  // 6 & 7. Alias consistency and collision prevention & Round-trip integrity
  describe('6 & 7. Alias consistency, collision prevention, and round-trip restoration', () => {
    it('maps same database host to same alias everywhere', () => {
      const input = `DATABASE_URL=postgresql://db_user_2:DB_PASS_2@10.0.0.3:5432/db_name_2
DB_HOST=10.0.0.3
Host: 10.0.0.3`;

      const gen = new SessionAliasGenerator();
      const res = sanitizeText(input, createOptions(), gen);
      const hostAliases = res.detectedEntities.filter(e => e.original === '10.0.0.3');
      expect(hostAliases.length).toBeGreaterThan(0);
      const firstAlias = hostAliases[0].alias;
      for (const h of hostAliases) {
        expect(h.alias).toBe(firstAlias);
      }
    });

    it('avoids partial collision during restoration (e.g. user_1 inside user_10)', () => {
      const originalText = 'Assigned user_10 and user_1 to the ticket.';
      const mappings = [
        { id: '1', original: 'Johnathan Doe', alias: 'user_10', category: 'person' as const, count: 1, enabled: true, createdAt: 0 },
        { id: '2', original: 'John Doe', alias: 'user_1', category: 'person' as const, count: 1, enabled: true, createdAt: 0 },
      ];

      const restored = restoreText(originalText, mappings);
      expect(restored.restoredText).toBe('Assigned Johnathan Doe and John Doe to the ticket.');
      expect(restored.restoredCount).toBe(2);
    });

    it('performs 100% lossless round-trip restoration on complex prompt', () => {
      const originalText = `The emergency password is N0tARealSecret!!2026.
Contact admin=المهندس أحمد منصور phone=+967-777-123-456.
DATABASE_URL=postgresql://amal_admin:FakePass_9x!@10.20.30.40:5432/customer_prod`;

      const gen = new SessionAliasGenerator();
      const sanitized = sanitizeText(originalText, createOptions(), gen);
      const restored = restoreText(sanitized.sanitizedText, sanitized.mappings);

      expect(restored.restoredText).toBe(originalText);
    });
  });

  // 8. False positives and technical context preservation
  describe('8. Technical context preservation without false positives', () => {
    it('does not treat HTTP status codes, retry counts, or ports as secrets', () => {
      const input = `HTTP_STATUS=500
RETRY_COUNT=3
BUILD_VERSION=1.10.2026
SERVER_PORT=8080`;

      const res = sanitizeText(input, createOptions(), new SessionAliasGenerator());
      expect(res.sanitizedText).toContain('HTTP_STATUS=500');
      expect(res.sanitizedText).toContain('RETRY_COUNT=3');
      expect(res.sanitizedText).toContain('BUILD_VERSION=1.10.2026');
      expect(res.sanitizedText).toContain('SERVER_PORT=8080');
      expect(res.detectedEntities.length).toBe(0);
    });

    it('preserves public Google DNS 8.8.8.8 per Benchmark Task 6', () => {
      const input = 'PUBLIC_DNS=8.8.8.8';
      const res = sanitizeText(input, createOptions(), new SessionAliasGenerator());
      expect(res.sanitizedText).toContain('PUBLIC_DNS=8.8.8.8');
    });
  });
});

