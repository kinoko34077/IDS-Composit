import { describe, expect, it, vi } from 'vitest';
import { resolveIds } from '../../src/resolver/resolve-ids';

describe('resolveIds', () => {
  it('prefers a CHISE native match', async () => {
    const provider = { matchIds: vi.fn().mockResolvedValue({ found: true, text: '字' }) };

    await expect(resolveIds('⿰木可', provider)).resolves.toEqual({ kind: 'native', text: '字', sourceIds: '⿰木可' });
  });

  it('composes on a CHISE no-match', async () => {
    const provider = { matchIds: vi.fn().mockResolvedValue({ found: false }) };
    const result = await resolveIds('⿰木可', provider);

    expect(result).toMatchObject({ kind: 'compose', sourceIds: '⿰木可' });
    expect(result.kind === 'compose' ? result.ast : undefined).toEqual({
      type: 'composition',
      operator: '⿰',
      children: [{ type: 'char', value: '木' }, { type: 'char', value: '可' }],
    });
  });

  it('composes and preserves an unavailable diagnostic', async () => {
    const provider = { matchIds: vi.fn().mockResolvedValue({ found: false, unavailable: true }) };
    const result = await resolveIds('⿰木可', provider);

    expect(result).toMatchObject({ kind: 'compose', sourceIds: '⿰木可', diagnostic: { kind: 'chise-unavailable' } });
  });

  it('composes locally when no provider is configured', async () => {
    const result = await resolveIds('⿰木可');

    expect(result).toMatchObject({ kind: 'compose', sourceIds: '⿰木可' });
  });

  it('returns unresolved for malformed IDS', async () => {
    await expect(resolveIds('⿰木')).resolves.toMatchObject({ kind: 'unresolved', sourceIds: '⿰木' });
  });
});
