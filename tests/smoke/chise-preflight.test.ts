import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('CHISE preflight example', () => {
  it('does not inject the live response body as HTML', () => {
    const source = readFileSync(new URL('../../examples/chise-preflight.ts', import.meta.url), 'utf8');

    expect(source).not.toContain('bodyCell.innerHTML');
    expect(source).toContain('bodyCell.textContent');
  });
});
