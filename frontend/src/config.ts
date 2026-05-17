const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const browserProtocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

// In production VITE_API_ORIGIN points to the Railway backend.
// In dev we use a relative URL so the Vite proxy handles the request,
// avoiding cross-origin 307 redirect issues.
const apiOrigin = import.meta.env.VITE_API_ORIGIN?.trim()
  ? trimTrailingSlash(import.meta.env.VITE_API_ORIGIN.trim())
  : '';

const wsUrl = trimTrailingSlash(
  import.meta.env.VITE_WS_URL?.trim()
  || `${browserProtocol === 'https:' ? 'wss:' : 'ws:'}//${browserHost}:8000/ws`,
);

export const API_BASE_URL = `${apiOrigin}/api`;
export const WS_URL = wsUrl;
