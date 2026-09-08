import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { normalizeIdsMatchResponse } from '../../src/chise/normalize-response';

describe('normalizeIdsMatchResponse', () => {
  it('normalizes a Unicode string as a native match', () => {
    expect(normalizeIdsMatchResponse('字')).toEqual({ found: true, text: '字', raw: '字' });
  });

  it('normalizes the match list returned by the live CHISE endpoint', () => {
    const fixture = JSON.parse(readFileSync(new URL('../fixtures/chise/ids-match-native.json', import.meta.url), 'utf8')) as unknown;
    expect(normalizeIdsMatchResponse(fixture)).toEqual({ found: true, text: '字', raw: ['字'] });
  });

  it('normalizes an empty CHISE match list as a no-match', () => {
    const fixture = JSON.parse(readFileSync(new URL('../fixtures/chise/ids-match-empty.json', import.meta.url), 'utf8')) as unknown;
    expect(normalizeIdsMatchResponse(fixture)).toEqual({ found: false });
  });

  it('normalizes null as a no-match', () => {
    expect(normalizeIdsMatchResponse(null)).toEqual({ found: false });
  });

  it('sends a non-UCS CHISE object to composition', () => {
    expect(normalizeIdsMatchResponse({ '@type': 'genre:character', '@id': 'abstract-glyph:cns/1' })).toEqual({ found: false });
  });

  it('rejects an unknown successful response shape', () => {
    expect(() => normalizeIdsMatchResponse({ unexpected: true })).toThrow('Unsupported CHISE ids-match response');
  });
});
