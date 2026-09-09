import { describe, expect, it } from 'vitest';
import { composeLayout, getChildRoles } from '../../src/composition';
import { IDC_DEFINITIONS } from '../../src/data/idc';
import { parseIds } from '../../src/parser';

const spatialCases = [
  ['⿰', 2], ['⿱', 2], ['⿲', 3], ['⿳', 3], ['⿴', 2],
  ['⿵', 2], ['⿶', 2], ['⿷', 2], ['⿸', 2], ['⿹', 2],
  ['⿺', 2], ['⿻', 2], ['⿼', 2], ['⿽', 2],
] as const;

describe('v0.2 spatial IDC coverage', () => {
  it.each(spatialCases)('defines %s as a data-driven operator with arity %i', (operator, arity) => {
    expect(IDC_DEFINITIONS[operator]).toMatchObject({ operator, arity, layoutProfileKey: operator });
    expect(getChildRoles(operator)).toHaveLength(arity);
  });

  it.each(spatialCases)('parses and composes %s with the declared number of children', (operator, arity) => {
    const source = `${operator}${'木可火'.slice(0, arity)}`;
    const parsed = parseIds(source);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const layout = composeLayout(parsed.ast);
    expect(layout.type).toBe('composition');
    if (layout.type === 'composition') expect(layout.children).toHaveLength(arity);
  });

  it.each(spatialCases)('rejects invalid arity for %s without entering composition', (operator) => {
    expect(parseIds(`${operator}木`)).toMatchObject({ ok: false, error: { kind: 'missing-child' } });
  });

  it('leaves reflection and rotation outside v0.2 coverage', () => {
    expect(parseIds('⿾木可')).toMatchObject({ ok: false, error: { kind: 'unknown-operator' } });
    expect(parseIds('⿿木可')).toMatchObject({ ok: false, error: { kind: 'unknown-operator' } });
  });
});
