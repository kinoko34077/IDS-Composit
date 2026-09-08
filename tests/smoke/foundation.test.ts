import { describe, expect, it } from 'vitest';
import type { Box, IdsNode, LayoutNode, Resolution } from '../../src/core/types';

describe('foundation type surface', () => {
  it('loads the core type modules and data boundaries', async () => {
    const types: [IdsNode, LayoutNode, Resolution, Box] | null = null;
    expect(types).toBeNull();
    const idc = await import('../../src/data/idc');
    expect(idc.IDC_ARITY['⿰']).toBe(2);
  });
});
