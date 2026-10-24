import { describe, expect, it, vi } from 'vitest';
import { loadConfig } from './config';
import { requestJson } from './ai-client';

const config = loadConfig({ AI_API_KEY: 'test-key-only' });
const success = () => Response.json({ choices: [{ finish_reason: 'stop', message: { content: '{"messages":[]}' } }] });

describe('compatible provider formats and failures', () => {
  it.each(['json_object', 'json_schema', 'text'] as const)('sends the %s format without vendor fields to a generic endpoint', async format => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => success());
    await requestJson({ ...config, format, baseUrl: 'https://provider.example/v1' }, 'JSON', '{}', undefined, fetcher);
    const [url, init] = fetcher.mock.calls[0];
    const body = JSON.parse(String(init!.body));
    expect(url).toBe('https://provider.example/v1/chat/completions');
    expect(body.thinking).toBeUndefined();
    expect(body.response_format?.type).toBe(format === 'text' ? undefined : format);
    if (format === 'json_schema') expect(body.response_format.json_schema.strict).toBe(true);
    expect(init!.redirect).toBe('error');
  });

  it.each([
    [401, 'rejected the server API key'], [403, 'rejected the server API key'],
    [429, 'rate limit'], [500, 'HTTP 500'],
  ])('reports provider HTTP %s without exposing its private response body', async (status, reason) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('PRIVATE_PROVIDER_BODY', { status: Number(status) }));
    const result = requestJson(config, 'JSON', '{}', undefined, fetcher);
    await expect(result).rejects.toThrow(String(reason));
    await expect(result).rejects.not.toThrow('PRIVATE_PROVIDER_BODY');
  });

  it.each([
    ['malformed JSON', () => new Response('{broken')],
    ['missing choices', () => Response.json({ output: 'wrong API shape' })],
    ['empty choices', () => Response.json({ choices: [] })],
    ['refusal', () => Response.json({ choices: [{ finish_reason: 'stop', message: { content: '{}', refusal: 'Refused' } }] })],
    ['missing content', () => Response.json({ choices: [{ finish_reason: 'stop', message: { content: null } }] })],
    ['oversized output', () => new Response('x'.repeat(100001))],
  ] as const)('rejects %s', async (_name, response) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response());
    await expect(requestJson(config, 'JSON', '{}', undefined, fetcher)).rejects.toThrow();
  });

  it('handles an already-aborted caller without leaking network diagnostics', async () => {
    const controller = new AbortController(); controller.abort();
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new DOMException('private diagnostic', 'AbortError'));
    await expect(requestJson(config, 'JSON', '{}', controller.signal, fetcher)).rejects.toMatchObject({ status: 499, message: 'Preparation cancelled.' });
    expect(fetcher.mock.calls[0][1]!.signal!.aborted).toBe(true);
  });
});

describe('server configuration boundaries', () => {
  it.each(['http://localhost:8000/v1/', 'http://127.0.0.1:8000/', 'http://[::1]:8000/', 'https://provider.example/v1///'])('accepts and normalizes %s', url => {
    expect(loadConfig({ AI_BASE_URL: url }).baseUrl).toBe(url.replace(/\/+$/, ''));
  });
  it.each(['ftp://provider.example', 'http://remote.example', 'https://user:password@provider.example', 'https://provider.example?key=secret', 'https://provider.example#fragment'])('rejects invalid API base %s', url => {
    expect(() => loadConfig({ AI_BASE_URL: url })).toThrow();
  });
  it.each(['99', '120001', 'NaN', '1.5'])('rejects invalid timeout %s', value => {
    expect(() => loadConfig({ AI_TIMEOUT_MS: value })).toThrow();
  });
});
