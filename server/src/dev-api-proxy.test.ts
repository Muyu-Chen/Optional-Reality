import { describe, expect, it, vi } from 'vitest';
import { devApiProxy } from '../dev-api-proxy';

describe('development API relay', () => {
  it('defaults to the local backend and accepts explicit HTTPS and loopback origins', () => {
    expect(devApiProxy().target).toBe('http://127.0.0.1:3001');
    expect(devApiProxy(' https://example.org/ ').target).toBe('https://example.org');
    expect(devApiProxy('http://localhost:3002').target).toBe('http://localhost:3002');
  });
  it.each(['http://example.org', 'https://name:secret@example.org', 'https://example.org/api',
    'https://example.org/?key=secret', 'https://example.org/#secret', 'file:///tmp/api', 'not a URL'])('rejects unsafe or ambiguous targets without echoing them: %s', value => {
    expect(() => devApiProxy(value)).toThrow('DEV_API_ORIGIN must be an HTTPS origin');
    try { devApiProxy(value); } catch (error) { expect(String(error)).not.toContain('secret'); }
  });
  it('rewrites the upstream Origin to match its Host, without changing browser-facing permissions', () => {
    const options = devApiProxy('https://example.org');
    const request = { setHeader: vi.fn() };
    const proxy = { on: vi.fn((_event, callback) => callback(request)) };
    options.configure!(proxy as never, options);
    expect(options.changeOrigin).toBe(true);
    expect(proxy.on).toHaveBeenCalledWith('proxyReq', expect.any(Function));
    expect(request.setHeader).toHaveBeenCalledWith('origin', 'https://example.org');
  });
});
