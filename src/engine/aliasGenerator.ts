import { RawEntityMatch } from './types';

export class SessionAliasGenerator {
  // Global mappings
  private originalToAliasMap: Map<string, string> = new Map();
  private aliasToOriginalMap: Map<string, string> = new Map();

  // Relational mappings
  private emailDomainMap: Map<string, string> = new Map(); // e.g. "company.com" -> "domain_1.com"
  private emailUserMap: Map<string, string> = new Map();   // e.g. "ahmed" -> "user_1"
  private hostnameMap: Map<string, string> = new Map();    // e.g. "webhook.internal.alamal-pay.com" -> "internal-host-1.local"

  // Subnet counters for strictly valid IPv4 octets
  private subnet10Counter = 0;
  private subnet192Counter = 0;
  private subnet172Counter = 0;
  private subnetPublicCounter = 0;

  // Counters
  private domainCounter = 0;
  private userCounter = 0;
  private hostCounter = 0;
  private secretCounter = 0;
  private awsKeyCounter = 0;
  private jwtCounter = 0;
  private dbPassCounter = 0;
  private dbUserCounter = 0;
  private dbNameCounter = 0;
  private phoneCounter = 0;
  private personCounter = 0;
  private projectCounter = 0;
  private appDirCounter = 0;
  private companyCounter = 0;
  private customCounter = 0;

  constructor() {
    this.reset();
  }

  public reset() {
    this.originalToAliasMap.clear();
    this.aliasToOriginalMap.clear();
    this.emailDomainMap.clear();
    this.emailUserMap.clear();
    this.hostnameMap.clear();

    this.subnet10Counter = 0;
    this.subnet192Counter = 0;
    this.subnet172Counter = 0;
    this.subnetPublicCounter = 0;

    this.domainCounter = 0;
    this.userCounter = 0;
    this.hostCounter = 0;
    this.secretCounter = 0;
    this.awsKeyCounter = 0;
    this.jwtCounter = 0;
    this.dbPassCounter = 0;
    this.dbUserCounter = 0;
    this.dbNameCounter = 0;
    this.phoneCounter = 0;
    this.personCounter = 0;
    this.projectCounter = 0;
    this.appDirCounter = 0;
    this.companyCounter = 0;
    this.customCounter = 0;
  }

  public setCustomMapping(original: string, alias: string) {
    this.originalToAliasMap.set(original, alias);
    this.aliasToOriginalMap.set(alias, original);
  }

  public removeMapping(original: string) {
    const alias = this.originalToAliasMap.get(original);
    if (alias) {
      this.aliasToOriginalMap.delete(alias);
      this.originalToAliasMap.delete(original);
    }
  }

  public getAlias(original: string): string | undefined {
    return this.originalToAliasMap.get(original);
  }

  public getOriginal(alias: string): string | undefined {
    return this.aliasToOriginalMap.get(alias);
  }

  public getOrCreateHostAlias(hostname: string): string {
    const cleanHost = hostname.toLowerCase().trim();
    if (this.originalToAliasMap.has(cleanHost)) {
      return this.originalToAliasMap.get(cleanHost)!;
    }
    if (this.hostnameMap.has(cleanHost)) {
      return this.hostnameMap.get(cleanHost)!;
    }

    this.hostCounter++;
    const alias = `internal-host-${this.hostCounter}.local`;
    this.hostnameMap.set(cleanHost, alias);
    this.originalToAliasMap.set(cleanHost, alias);
    this.aliasToOriginalMap.set(alias, cleanHost);
    return alias;
  }

  /**
   * Generates or retrieves a consistent, deterministic alias for the given entity match.
   */
  public generateOrGetAlias(match: RawEntityMatch): string {
    const original = match.original;

    if (this.originalToAliasMap.has(original)) {
      return this.originalToAliasMap.get(original)!;
    }

    let alias = '';

    if (match.metadata?.suggestedAlias) {
      alias = String(match.metadata.suggestedAlias);
    } else {
      switch (match.category) {
        case 'email':
          alias = this.generateEmailAlias(match);
          break;
        case 'ipv4':
          alias = this.generateValidIpv4Alias(original);
          break;
        case 'secret':
          alias = this.generateSecretAlias(match);
          break;
        case 'url':
          alias = this.generateUrlAlias(match);
          break;
        case 'phone':
          alias = this.generatePhoneAlias();
          break;
        case 'person':
          alias = this.generatePersonAlias(match);
          break;
        case 'project':
          alias = this.generateProjectAlias(match);
          break;
        case 'company':
          alias = this.generateCompanyAlias();
          break;
        case 'db_uri':
          alias = this.generateDbUriAlias(match);
          break;
        case 'custom':
        default:
          alias = this.generateCustomAlias();
          break;
      }
    }

    // Ensure uniqueness across originals
    let uniqueAlias = alias;
    let collisionCount = 1;
    while (
      this.aliasToOriginalMap.has(uniqueAlias) &&
      this.aliasToOriginalMap.get(uniqueAlias) !== original
    ) {
      collisionCount++;
      uniqueAlias = `${alias}_${collisionCount}`;
    }

    this.originalToAliasMap.set(original, uniqueAlias);
    this.aliasToOriginalMap.set(uniqueAlias, original);

    return uniqueAlias;
  }

  /**
   * Strictly Valid IPv4 Aliases (NO letter 'X')
   * 10.x.x.x   -> 10.0.0.1, 10.0.0.2, etc.
   * 192.168.x  -> 192.168.1.1, 192.168.1.2, etc.
   * 172.16-31  -> 172.16.1.1, 172.16.1.2, etc.
   * Public     -> 203.0.113.1, 203.0.113.2, etc.
   */
  public generateValidIpv4Alias(originalIp: string): string {
    if (this.originalToAliasMap.has(originalIp)) {
      return this.originalToAliasMap.get(originalIp)!;
    }

    let alias = '';
    if (originalIp.startsWith('10.')) {
      this.subnet10Counter++;
      alias = `10.0.0.${this.subnet10Counter}`;
    } else if (originalIp.startsWith('192.168.')) {
      this.subnet192Counter++;
      alias = `192.168.1.${this.subnet192Counter}`;
    } else if (originalIp.startsWith('172.')) {
      this.subnet172Counter++;
      alias = `172.16.1.${this.subnet172Counter}`;
    } else {
      this.subnetPublicCounter++;
      alias = `203.0.113.${this.subnetPublicCounter}`;
    }

    this.originalToAliasMap.set(originalIp, alias);
    this.aliasToOriginalMap.set(alias, originalIp);
    return alias;
  }

  private generateEmailAlias(match: RawEntityMatch): string {
    const username = (match.metadata?.username as string) || 'user';
    const domain = (match.metadata?.domain as string) || 'domain.com';

    // Preserve original top-level domain if present (e.g. invalid, com, org, net)
    const tldMatch = domain.match(/\.([a-zA-Z]{2,10})$/);
    const tld = tldMatch ? tldMatch[1] : 'com';

    if (!this.emailDomainMap.has(domain)) {
      this.domainCounter++;
      this.emailDomainMap.set(domain, `domain_${this.domainCounter}.${tld}`);
    }
    const domainAlias = this.emailDomainMap.get(domain)!;

    const userKey = username.toLowerCase();
    if (!this.emailUserMap.has(userKey)) {
      this.userCounter++;
      this.emailUserMap.set(userKey, `user_${this.userCounter}`);
    }
    const userAlias = this.emailUserMap.get(userKey)!;

    return `${userAlias}@${domainAlias}`;
  }

  private generateSecretAlias(match: RawEntityMatch): string {
    const kind = match.metadata?.kind as string;

    if (kind === 'aws_access_key') {
      this.awsKeyCounter++;
      return `AWS_KEY_${this.awsKeyCounter}`;
    }
    if (kind === 'jwt') {
      this.jwtCounter++;
      return `JWT_TOKEN_${this.jwtCounter}`;
    }
    if (kind === 'db_pass') {
      this.dbPassCounter++;
      return `DB_PASS_${this.dbPassCounter}`;
    }
    if (kind === 'log_credential') {
      const keyName = (match.metadata?.keyName as string || '').toLowerCase();
      if (keyName.includes('pass') || keyName.includes('pwd')) {
        this.dbPassCounter++;
        return `DB_PASS_${this.dbPassCounter}`;
      }
      this.secretCounter++;
      return `SECRET_KEY_${this.secretCounter}`;
    }

    this.secretCounter++;
    return `SECRET_KEY_${this.secretCounter}`;
  }

  /**
   * URLs: Structural parsing and reconstruction.
   * - Preserves scheme, host port, paths, fragment, and nonsensitive query parameters.
   * - Sanitizes embedded user-info credentials (user:pass@host).
   * - Sanitizes sensitive query parameters (token, session, code, secret, password, api_key, etc.).
   * - Sanitizes email parameters (e.g. email=ahmad.mansour@example.invalid).
   * - Preserves nonsensitive parameters (redirect=/dashboard, region, v, etc.).
   */
  private generateUrlAlias(match: RawEntityMatch): string {
    const rawUrl = match.original;
    try {
      const parsed = new URL(rawUrl);

      // 1. Embedded credentials in user-info: https://admin:password@host/
      let authPart = '';
      if (parsed.username || parsed.password) {
        let userAlias = '';
        let passAlias = '';
        if (parsed.username) {
          if (this.originalToAliasMap.has(parsed.username)) {
            userAlias = this.originalToAliasMap.get(parsed.username)!;
          } else {
            this.dbUserCounter++;
            userAlias = `db_user_${this.dbUserCounter}`;
            this.originalToAliasMap.set(parsed.username, userAlias);
            this.aliasToOriginalMap.set(userAlias, parsed.username);
          }
        }
        if (parsed.password) {
          if (this.originalToAliasMap.has(parsed.password)) {
            passAlias = this.originalToAliasMap.get(parsed.password)!;
          } else {
            this.dbPassCounter++;
            passAlias = `DB_PASS_${this.dbPassCounter}`;
            this.originalToAliasMap.set(parsed.password, passAlias);
            this.aliasToOriginalMap.set(passAlias, parsed.password);
          }
        }
        if (userAlias && passAlias) authPart = `${userAlias}:${passAlias}@`;
        else if (userAlias) authPart = `${userAlias}@`;
        else if (passAlias) authPart = `:${passAlias}@`;
      }

      // 2. Hostname: If IP, use valid IPv4 alias; if domain, use host alias
      let hostAlias = '';
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname)) {
        hostAlias = this.generateValidIpv4Alias(parsed.hostname);
      } else {
        hostAlias = this.getOrCreateHostAlias(parsed.hostname);
      }

      // 3. Port & Path
      const portPart = parsed.port ? `:${parsed.port}` : '';
      const pathPart = parsed.pathname;

      // 4. Query Parameters
      let searchPart = '';
      if (parsed.search) {
        const searchParams = new URLSearchParams(parsed.search);
        const reconstructedParams: string[] = [];

        for (const [key, val] of searchParams.entries()) {
          const lowerKey = key.toLowerCase();
          const isSensitiveKey =
            lowerKey.includes('token') ||
            lowerKey.includes('session') ||
            lowerKey.includes('code') ||
            lowerKey.includes('secret') ||
            lowerKey.includes('password') ||
            lowerKey.includes('key') ||
            lowerKey.includes('auth') ||
            lowerKey.includes('sig') ||
            lowerKey.includes('signature') ||
            lowerKey.includes('credential') ||
            lowerKey.includes('jwt') ||
            lowerKey === 'pwd';

          const isEmailVal = val.includes('@') || lowerKey === 'email';

          if (isEmailVal) {
            let emailAlias = this.originalToAliasMap.get(val);
            if (!emailAlias) {
              const atIdx = val.indexOf('@');
              const u = atIdx > 0 ? val.slice(0, atIdx) : 'user';
              const d = atIdx > 0 ? val.slice(atIdx + 1) : 'example.com';
              emailAlias = this.generateEmailAlias({
                category: 'email',
                original: val,
                startIndex: 0,
                endIndex: val.length,
                label: 'Email',
                metadata: { username: u, domain: d },
              });
              this.originalToAliasMap.set(val, emailAlias);
              this.aliasToOriginalMap.set(emailAlias, val);
            }
            reconstructedParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(emailAlias)}`);
          } else if (isSensitiveKey) {
            let secretAlias = this.originalToAliasMap.get(val);
            if (!secretAlias) {
              this.secretCounter++;
              secretAlias = `SECRET_KEY_${this.secretCounter}`;
              this.originalToAliasMap.set(val, secretAlias);
              this.aliasToOriginalMap.set(secretAlias, val);
            }
            reconstructedParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(secretAlias)}`);
          } else {
            // Non-sensitive parameter (e.g. redirect=/dashboard, region=us-east-1) is PRESERVED!
            reconstructedParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
          }
        }

        if (reconstructedParams.length > 0) {
          searchPart = `?${reconstructedParams.join('&')}`;
        }
      }

      // 5. Hash / Fragment
      const hashPart = parsed.hash || '';

      return `${parsed.protocol}//${authPart}${hostAlias}${portPart}${pathPart}${searchPart}${hashPart}`;
    } catch {
      this.hostCounter++;
      return `https://internal-host-${this.hostCounter}.local`;
    }
  }

  /**
   * Database Connection URI
   * Preserves postgresql://db_user_1:DB_PASS_1@10.0.0.1:5432/db_name_1
   */
  public generateDbUriAlias(match: RawEntityMatch): string {
    const scheme = (match.metadata?.scheme as string) || 'postgresql://';
    const user = match.metadata?.username as string | undefined;
    const pass = match.metadata?.password as string | undefined;
    const host = (match.metadata?.host as string) || '10.0.0.1';
    const port = match.metadata?.port as string | undefined;
    const dbName = match.metadata?.database as string | undefined;
    const query = match.metadata?.query as string | undefined;

    let userAlias = '';
    if (user) {
      if (this.originalToAliasMap.has(user)) {
        userAlias = this.originalToAliasMap.get(user)!;
      } else {
        this.dbUserCounter++;
        userAlias = `db_user_${this.dbUserCounter}`;
        this.originalToAliasMap.set(user, userAlias);
        this.aliasToOriginalMap.set(userAlias, user);
      }
    }

    let passAlias = '';
    if (pass) {
      if (this.originalToAliasMap.has(pass)) {
        passAlias = this.originalToAliasMap.get(pass)!;
      } else {
        this.dbPassCounter++;
        passAlias = `DB_PASS_${this.dbPassCounter}`;
        this.originalToAliasMap.set(pass, passAlias);
        this.aliasToOriginalMap.set(passAlias, pass);
      }
    }

    // Host: If it's an IP, use valid IPv4 alias; if domain, use host alias
    let hostAlias = '';
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      hostAlias = this.generateValidIpv4Alias(host);
    } else {
      hostAlias = this.getOrCreateHostAlias(host);
    }

    let dbAlias = '';
    if (dbName && dbName !== '/') {
      const cleanDbName = dbName.replace(/^\//, '');
      if (this.originalToAliasMap.has(cleanDbName)) {
        dbAlias = `/${this.originalToAliasMap.get(cleanDbName)!}`;
      } else {
        this.dbNameCounter++;
        const mappedName = `db_name_${this.dbNameCounter}`;
        this.originalToAliasMap.set(cleanDbName, mappedName);
        this.aliasToOriginalMap.set(mappedName, cleanDbName);
        dbAlias = `/${mappedName}`;
      }
    }

    let authSection = '';
    if (userAlias && passAlias) {
      authSection = `${userAlias}:${passAlias}@`;
    } else if (userAlias) {
      authSection = `${userAlias}@`;
    } else if (passAlias) {
      authSection = `:${passAlias}@`;
    }

    const portSection = port ? `:${port}` : '';
    const querySection = query || '';

    return `${scheme}${authSection}${hostAlias}${portSection}${dbAlias}${querySection}`;
  }

  private generatePhoneAlias(): string {
    this.phoneCounter++;
    const padded = String(this.phoneCounter).padStart(4, '0');
    return `+1-555-${padded}`;
  }

  private generatePersonAlias(match?: RawEntityMatch): string {
    if (match?.metadata?.isDbUser) {
      this.dbUserCounter++;
      return `db_user_${this.dbUserCounter}`;
    }
    this.personCounter++;
    return `Person_${this.personCounter}`;
  }

  private generateProjectAlias(match: RawEntityMatch): string {
    const isAppDir = Boolean(match.metadata?.isAppDir);
    if (isAppDir) {
      this.appDirCounter++;
      const orig = match.original;
      let prefix = '/srv/';
      if (orig.startsWith('/var/www/')) prefix = '/var/www/';
      else if (orig.startsWith('/opt/')) prefix = '/opt/';
      else if (orig.startsWith('/app/')) prefix = '/app/';
      else if (orig.startsWith('/home/')) {
        const parts = orig.split('/');
        prefix = `/${parts[1]}/${parts[2]}/`;
      }
      return `${prefix}app_${this.appDirCounter}/`;
    }

    this.projectCounter++;
    const greekLetters = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Prime'];
    const letter = greekLetters[(this.projectCounter - 1) % greekLetters.length];
    return `Project_${letter}`;
  }

  private generateCompanyAlias(): string {
    this.companyCounter++;
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter = alphabet[(this.companyCounter - 1) % alphabet.length];
    return `Company_${letter}`;
  }

  private generateCustomAlias(): string {
    this.customCounter++;
    return `CUSTOM_ENTITY_${this.customCounter}`;
  }

  public getAllMappings(): Array<{ original: string; alias: string }> {
    return Array.from(this.originalToAliasMap.entries()).map(([original, alias]) => ({
      original,
      alias,
    }));
  }
}
