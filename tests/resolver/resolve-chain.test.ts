import { describe, expect, it, vi } from 'vitest';
import { createKnownCharacterIndex } from '../../src/known';
import { resolveIdsWithChain } from '../../src/resolver/resolve-chain';

describe('resolveIdsWithChain', () => {
  it('uses the verified Known Index before the CHISE provider', async () => {
    const chise = { matchIds: vi.fn().mockResolvedValue({ found: false }) };
    const knownIndex = createKnownCharacterIndex([{
      ids: '⿲彳圭亍',
      character: '街',
      source: 'test',
      status: 'verified',
    }]);

    await expect(resolveIdsWithChain('⿲彳圭亍', { knownIndex, chiseProvider: chise }))
      .resolves.toEqual({ kind: 'native', text: '街', sourceIds: '⿲彳圭亍' });
    expect(chise.matchIds).not.toHaveBeenCalled();
  });

  it('gives an explicit provider priority over the Known Index', async () => {
    const knownIndex = createKnownCharacterIndex([{
      ids: '⿰木可',
      character: '柯',
      source: 'test',
      status: 'verified',
    }]);

    await expect(resolveIdsWithChain('⿰木可', {
      explicitProvider: { matchIds: async () => ({ found: true, text: '自' }) },
      knownIndex,
    })).resolves.toEqual({ kind: 'native', text: '自', sourceIds: '⿰木可' });
  });

  it('falls through when the Known Index is ambiguous', async () => {
    const knownIndex = createKnownCharacterIndex([
      { ids: '⿰木可', character: '柯', source: 'a', status: 'verified' },
      { ids: '⿰木可', character: '某', source: 'b', status: 'verified' },
    ]);

    const result = await resolveIdsWithChain('⿰木可', { knownIndex });

    expect(result).toMatchObject({ kind: 'compose', sourceIds: '⿰木可' });
  });
});
