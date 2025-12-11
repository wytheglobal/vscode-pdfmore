export function parseUrl(url: string) {
  const result = {
    href: url,
    protocol: '',
    username: '',
    password: '',
    hostname: '',
    port: '',
    host: '',
    pathname: '',
    search: '',
    hash: '',
    origin: '',
  };

  let remaining = url.trim();

  // Extract hash (fragment)
  const hashIndex = remaining.indexOf('#');
  if (hashIndex !== -1) {
    result.hash = remaining.slice(hashIndex);
    remaining = remaining.slice(0, hashIndex);
  }

  // Extract search (query string)
  const searchIndex = remaining.indexOf('?');
  if (searchIndex !== -1) {
    result.search = remaining.slice(searchIndex);
    remaining = remaining.slice(0, searchIndex);
  }

  // Extract protocol
  const protocolMatch = remaining.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);
  if (protocolMatch) {
    result.protocol = protocolMatch[1] + ':';
    remaining = remaining.slice(protocolMatch[0].length);
  }

  // Extract pathname if no protocol (relative URL)
  if (!result.protocol) {
    result.pathname = remaining || '/';
    return result;
  }

  // Find where the pathname starts
  let pathStart = remaining.indexOf('/');
  if (pathStart === -1) pathStart = remaining.length;

  const authorityAndHost = remaining.slice(0, pathStart);
  result.pathname = remaining.slice(pathStart) || '/';

  // Extract username and password
  const atIndex = authorityAndHost.indexOf('@');
  let hostPart = authorityAndHost;

  if (atIndex !== -1) {
    const credentials = authorityAndHost.slice(0, atIndex);
    hostPart = authorityAndHost.slice(atIndex + 1);

    const colonIndex = credentials.indexOf(':');
    if (colonIndex !== -1) {
      result.username = credentials.slice(0, colonIndex);
      result.password = credentials.slice(colonIndex + 1);
    } else {
      result.username = credentials;
    }
  }

  // Extract hostname and port
  // Handle IPv6 addresses in brackets
  if (hostPart.startsWith('[')) {
    const bracketEnd = hostPart.indexOf(']');
    if (bracketEnd !== -1) {
      result.hostname = hostPart.slice(1, bracketEnd);
      const portPart = hostPart.slice(bracketEnd + 1);
      if (portPart.startsWith(':')) {
        result.port = portPart.slice(1);
      }
    }
  } else {
    const colonIndex = hostPart.lastIndexOf(':');
    if (colonIndex !== -1) {
      result.hostname = hostPart.slice(0, colonIndex);
      result.port = hostPart.slice(colonIndex + 1);
    } else {
      result.hostname = hostPart;
    }
  }

  // Set host (hostname + port)
  result.host = result.port
    ? `${result.hostname}:${result.port}`
    : result.hostname;

  // Set origin
  if (result.protocol && result.hostname) {
    result.origin = result.port
      ? `${result.protocol}//${result.hostname}:${result.port}`
      : `${result.protocol}//${result.hostname}`;
  }

  return result;
}
