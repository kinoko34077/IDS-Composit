import { describe, expect, it } from 'vitest';
import { normalizeIdsMatchResponse } from '../../src/chise/normalize-response';

describe('normalizeIdsMatchResponse', () => {
  it('normalizes a Unicode string as a native match', () => {
    expect(normalizeIdsMatchResponse('字')).toEqual({ found: true, text: '字', raw: '字' });
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
