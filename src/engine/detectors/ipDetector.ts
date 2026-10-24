import { RawEntityMatch } from '../types';
import { IPV4_STRICT_REGEX } from '../patterns';

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
