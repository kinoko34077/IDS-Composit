/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { initializePlayground } from '../../examples/index';
import { PATTERN_CASES } from '../../examples/playground-model';

describe('v0.2 mobile validation surface', () => {
  it('exposes all 14 spatial operators plus an explicit unsupported case', async () => {
    const root = document.createElement('main');
    await initializePlayground(root, async () => undefined);
    const sources = PATTERN_CASES.map((pattern) => pattern.source);

    expect(sources).toEqual(expect.arrayContaining([
      '⿰木可', '⿱艹明', '⿲彳圭亍', '⿳士冖豆', '⿴囗王',
      '⿵門日', '⿶一凵', '⿷匚口', '⿸广木', '⿹戸口', '⿺廴日',
      '⿻木口', '⿼句口', '⿽乙丶', '⿾木可',
    ]));
    expect(root.querySelector('#pattern-table-body')?.textContent).toContain('Known candidate（未検証）→ local composition');
    expect(root.querySelector('#pattern-table-body')?.textContent).toContain('Unsupported IDC → source preserved');
    expect(root.textContent).toContain('Gateを通過した⿰のみ適用');
  });
});
