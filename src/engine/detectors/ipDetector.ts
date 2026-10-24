import { RawEntityMatch } from '../types';
import { IPV4_STRICT_REGEX } from '../patterns';

// Standard well-known public DNS & infrastructure resolvers that should be preserved
// (e.g. Google Public DNS 8.8.8.8, Cloudflare 1.1.1.1, Quad9 9.9.9.9)
const WELL_KNOWN_PUBLIC_RESOLVERS = new Set([
  '8.8.8.8',
  '8.8.4.4',
  '1.1.1.1',
  '1.0.0.1',
  '9.9.9.9',
  '149.112.112.112',
  '208.67.222.222',
  '208.67.220.220',
]);

export function isPrivateSubnet(ip: string): boolean {
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('127.')) {
    return true;
  }
  const parts = ip.split('.').map(Number);
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true;
  }
  return false;
}

export function detectIps(text: string): RawEntityMatch[] {
  const matches: RawEntityMatch[] = [];
  let match: RegExpExecArray | null;

  IPV4_STRICT_REGEX.lastIndex = 0;
  while ((match = IPV4_STRICT_REGEX.exec(text)) !== null) {
    const ip = match[0];

    // Benchmark standard: Preserve standard public utility DNS resolvers like 8.8.8.8
    if (WELL_KNOWN_PUBLIC_RESOLVERS.has(ip)) {
      continue;
    }

    const isPrivate = isPrivateSubnet(ip);

    matches.push({
      category: 'ipv4',
      original: ip,
      startIndex: match.index,
      endIndex: match.index + ip.length,
      label: isPrivate ? 'Private IPv4' : 'IPv4 Address',
      metadata: {
        isPrivate,
      },
    });
  }

  return matches;
}
