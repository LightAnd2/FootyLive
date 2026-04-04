const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const browserProtocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

const apiOrigin = trimTrailingSlash(
  import.meta.env.VITE_API_ORIGIN?.trim()
  || `${browserProtocol}//${browserHost}:8000`,
);

const wsUrl = trimTrailingSlash(
  import.meta.env.VITE_WS_URL?.trim()
  || `${browserProtocol === 'https:' ? 'wss:' : 'ws:'}//${browserHost}:8000/ws`,
);

export const API_BASE_URL = `${apiOrigin}/api`;
export const WS_URL = wsUrl;
