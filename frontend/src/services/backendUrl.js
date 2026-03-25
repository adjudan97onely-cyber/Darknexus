const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

const PRIVATE_IP_REGEX = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/;
const LOCAL_URL_REGEX = /localhost|127\.0\.0\.1|0\.0\.0\.0/i;

const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const isLocalHostname = (hostname) => {
  if (!hostname) return false;
  return LOCAL_HOSTS.has(hostname) || PRIVATE_IP_REGEX.test(hostname);
};

export const resolveBackendUrl = () => {
  const envBackendUrl = trimTrailingSlash((process.env.REACT_APP_BACKEND_URL || '').trim());

  if (typeof window === 'undefined') {
    return envBackendUrl || 'http://localhost:8001';
  }

  const { protocol, hostname, origin } = window.location;
  const currentHostIsLocal = isLocalHostname(hostname);
  const envLooksLocal = LOCAL_URL_REGEX.test(envBackendUrl);

  // Ignore localhost env var when app runs on a public domain (mobile/prod).
  if (envBackendUrl && !(envLooksLocal && !currentHostIsLocal)) {
    return envBackendUrl;
  }

  // Local/LAN usage: backend expected on same machine, port 8001.
  if (currentHostIsLocal) {
    return `${protocol}//${hostname}:8001`;
  }

  // Production fallback: same origin (works with reverse proxy / serverless rewrites).
  return trimTrailingSlash(origin);
};

export const BACKEND_URL = resolveBackendUrl();

export const buildBackendUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}${normalizedPath}`;
};