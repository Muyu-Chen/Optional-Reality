import type { ProxyOptions } from 'vite';

/** Development-only relay. Provider keys and model requests remain on the chosen backend. */
export function devApiProxy(value?: string): ProxyOptions {
  const message = 'DEV_API_ORIGIN must be an HTTPS origin, or an HTTP loopback origin, without a path or credentials.';
  let url: URL;
  try { url = new URL(value?.trim() || 'http://127.0.0.1:3001'); }
  catch { throw new Error(message); }
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) ||
      url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error(message);
  return {
    target: url.origin,
    changeOrigin: true,
    configure(proxy) {
      // The browser talks to same-origin localhost; the upstream validates its own origin.
      proxy.on('proxyReq', request => request.setHeader('origin', url.origin));
    },
  };
}
