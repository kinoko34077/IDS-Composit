import { describe, expect, it } from 'vitest';
import { resolveUniqueIds } from '../../src/runtime/resolve-batch';

describe('resolveUniqueIds', () => {
  it('deduplicates sources and respects the concurrency limit', async () => {
    const calls: string[] = [];
    let active = 0;
    let peak = 0;
    const resolve = async (source: string) => {
      calls.push(source);
      active += 1;
      peak = Math.max(peak, active);
      await new Promise<void>((done) => setTimeout(done, source === 'b' ? 5 : 0));
      active -= 1;
      return { kind: 'unresolved', sourceIds: source, reason: 'test' } as const;
    };

    const resolutions = await resolveUniqueIds(['a', 'b', 'a', 'c'], resolve, 2);

    expect(peak).toBeLessThanOrEqual(2);
    expect(calls).toEqual(['a', 'b', 'c']);
    expect(resolutions.get('a')).toEqual({ kind: 'unresolved', sourceIds: 'a', reason: 'test' });
    expect(resolutions.get('b')).toEqual({ kind: 'unresolved', sourceIds: 'b', reason: 'test' });
    expect(resolutions.get('c')).toEqual({ kind: 'unresolved', sourceIds: 'c', reason: 'test' });
  });
});
