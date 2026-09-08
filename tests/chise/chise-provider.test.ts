import { describe, expect, it, vi } from 'vitest';
import { createChiseProvider } from '../../src/chise/chise-provider';
import type { FetchLike } from '../../src/chise/types';

describe('createChiseProvider', () => {
  it('requests the encoded IDS and returns a native match', async () => {
    const fetcher = vi.fn<FetchLike>().mockResolvedValue(new Response(JSON.stringify('字'), { status: 200 }));
    const provider = createChiseProvider({ fetch: fetcher, endpoint: 'https://example.test/ids-match' });

    await expect(provider.matchIds('⿰木可')).resolves.toMatchObject({ found: true, text: '字' });
    expect(fetcher.mock.calls[0]?.[0].toString()).toBe('https://example.test/ids-match?ids=%E2%BF%B0%E6%9C%A8%E5%8F%AF');
  });

  it('classifies HTTP failure as unavailable', async () => {
    const fetcher = vi.fn<FetchLike>().mockResolvedValue(new Response('bad gateway', { status: 502 }));
    const provider = createChiseProvider({ fetch: fetcher });

    await expect(provider.matchIds('⿰木可')).resolves.toMatchObject({ found: false, unavailable: true });
  });

  it('classifies a timeout as unavailable', async () => {
    const fetcher = vi.fn<FetchLike>().mockImplementation(() => new Promise<Response>(() => undefined));
    const provider = createChiseProvider({ fetch: fetcher, timeoutMs: 10 });

    await expect(provider.matchIds('⿰木可')).resolves.toMatchObject({ found: false, unavailable: true });
  });

  it('reuses a cached normalized IDS result', async () => {
    const fetcher = vi.fn<FetchLike>().mockResolvedValue(new Response('null', { status: 200 }));
    const provider = createChiseProvider({ fetch: fetcher });

    await provider.matchIds('⿰木可');
    await provider.matchIds('⿰木可');

    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
