import { describe, expect, it } from 'vitest';
import { scanEmbeddedIds } from '../../src/parser/scan-source';

describe('scanEmbeddedIds', () => {
  it('keeps surrounding text and extracts a valid IDS source', () => {
    expect(scanEmbeddedIds('AAA⟦⿰木可⟧BBB')).toEqual([
      { type: 'text', value: 'AAA' },
      { type: 'ids', source: '⿰木可', raw: '⟦⿰木可⟧' },
      { type: 'text', value: 'BBB' },
    ]);
  });

  it('keeps an invalid embedded source as a visible fallback segment', () => {
    const segments = scanEmbeddedIds('A⟦⿰木⟧B');
    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ type: 'text', value: 'A' });
    expect(segments[1]?.type).toBe('invalid');
    expect(segments[1]).toMatchObject({ type: 'invalid', raw: '⟦⿰木⟧' });
    expect(segments[2]).toEqual({ type: 'text', value: 'B' });
  });

  it('keeps a closed unsupported IDC source resolvable as an IDS segment', () => {
    expect(scanEmbeddedIds('A⟦⿾木可⟧B')).toEqual([
      { type: 'text', value: 'A' },
      { type: 'ids', source: '⿾木可', raw: '⟦⿾木可⟧' },
      { type: 'text', value: 'B' },
    ]);
  });

  it('does not invent a closing delimiter for an unterminated source', () => {
    expect(scanEmbeddedIds('A⟦⿰木B')).toEqual([
      { type: 'text', value: 'A' },
      { type: 'invalid', raw: '⟦⿰木B', error: { kind: 'unterminated', index: 1 } },
    ]);
  });
});
