import { RawEntityMatch } from '../types';

const DB_PREFIX_REGEX =
  /\b((?:postgresql|postgres|mysql|mongodb(?:\+srv)?|redis|rediss):\/\/[^\s"'<>]+)/gi;

export function detectDbUris(text: string): RawEntityMatch[] {
  const matches: RawEntityMatch[] = [];
  let match: RegExpExecArray | null;

  DB_PREFIX_REGEX.lastIndex = 0;
  while ((match = DB_PREFIX_REGEX.exec(text)) !== null) {
    const fullUri = match[1].replace(/[.,;:]$/, '');
    const protoIndex = fullUri.indexOf('://');
    const scheme = fullUri.slice(0, protoIndex + 3);
    const rest = fullUri.slice(protoIndex + 3);

    const [pathPart, queryPart] = rest.split('?');
    const firstSlash = pathPart.indexOf('/');
    const hostAuthPart = firstSlash !== -1 ? pathPart.slice(0, firstSlash) : pathPart;
    const database = firstSlash !== -1 ? pathPart.slice(firstSlash) : '';

    let user: string | undefined;
    let password: string | undefined;
    let hostPortPart = hostAuthPart;

    // Auth is everything before the LAST '@'
    const lastAt = hostAuthPart.lastIndexOf('@');
    if (lastAt !== -1) {
      const credentials = hostAuthPart.slice(0, lastAt);
      hostPortPart = hostAuthPart.slice(lastAt + 1);

      const colonIndex = credentials.indexOf(':');
      if (colonIndex !== -1) {
        user = credentials.slice(0, colonIndex);
        password = credentials.slice(colonIndex + 1);
      } else {
        user = credentials;
      }
    }

    // Host and port
    let host = hostPortPart;
    let port: string | undefined;
    const portColon = hostPortPart.lastIndexOf(':');
    if (portColon !== -1) {
      const potentialPort = hostPortPart.slice(portColon + 1);
      if (/^\d+$/.test(potentialPort)) {
        host = hostPortPart.slice(0, portColon);
        port = potentialPort;
      }
    }

    matches.push({
      category: 'db_uri',
      original: fullUri,
      startIndex: match.index,
      endIndex: match.index + fullUri.length,
      label: 'Database Connection URI',
      metadata: {
        scheme,
        username: user,
        password: password,
        host: host,
        port: port,
        database: database,
        query: queryPart ? `?${queryPart}` : undefined,
      },
    });
  }

  return matches;
}

