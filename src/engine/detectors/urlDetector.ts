import { RawEntityMatch } from '../types';
import { URL_WEB_REGEX } from '../patterns';

export function detectUrls(text: string): RawEntityMatch[] {
  const matches: RawEntityMatch[] = [];

  URL_WEB_REGEX.lastIndex = 0;
  let protoMatch: RegExpExecArray | null;
  while ((protoMatch = URL_WEB_REGEX.exec(text)) !== null) {
    const fullUrl = protoMatch[1].replace(/[.,;:]$/, ''); // trim trailing punctuation
    try {
      const parsed = new URL(fullUrl);

      matches.push({
        category: 'url',
        original: fullUrl,
        startIndex: protoMatch.index,
        endIndex: protoMatch.index + fullUrl.length,
        label: 'HTTP URL Endpoint',
        metadata: {
          protocol: parsed.protocol,
          hostname: parsed.hostname,
          pathname: parsed.pathname,
          search: parsed.search,
        },
      });
    } catch {
      matches.push({
        category: 'url',
        original: fullUrl,
        startIndex: protoMatch.index,
        endIndex: protoMatch.index + fullUrl.length,
        label: 'URL Endpoint',
      });
    }
  }

  return matches;
}
