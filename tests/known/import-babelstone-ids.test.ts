import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BABELSTONE_IDS_URL,
  DEFAULT_BABELSTONE_IDS_VERSION,
  buildBabelStoneImportReport,
  computeBabelStoneSourceHash,
  createBabelStoneSource,
  downloadBabelStoneIds,
  parseBabelStoneIdsFile,
} from '../../tools/known/import-babelstone-ids';

describe('BabelStone IDS importer', () => {
  it('parses regional and alternate IDS fields without losing the street mapping', () => {
    const result = parseBabelStoneIdsFile([
      '# BabelStone fixture',
      'U+8857\t街\t^⿲彳圭亍$(GHTJKPV)\t^⿴行圭$(X)',
      'U+81E6\t臦\t^⿰⿾臣臣$(G)',
      'U+9999\t香\t^⿰{1}香$(G)',
    ].join('\n'), 'IDS.TXT');

    expect(result.records).toEqual([
      { ids: '⿲彳圭亍', character: '街', status: 'verified', variantTag: 'GHTJKPV' },
      { ids: '⿴行圭', character: '街', status: 'verified', variantTag: 'X' },
      { ids: '⿰⿾臣臣', character: '臦', status: 'verified', variantTag: 'G' },
      { ids: '⿰{1}香', character: '香', status: 'candidate', variantTag: 'G' },
    ]);
    expect(result.stats).toMatchObject({ records: 4, verified: 3, candidate: 1, specialComponents: 1 });
    expect(result.issues).toEqual([]);
  });

  it('rejects malformed rows and mismatched code points', () => {
    const result = parseBabelStoneIdsFile([
      'not-a-row',
      'U+8857\t違う\t^⿴行圭$(G)',
      'U+8858\t衘\tbad',
    ].join('\n'), 'broken.txt');

    expect(result.records).toEqual([]);
    expect(result.issues.map((issue) => issue.kind)).toEqual([
      'malformed-row',
      'character-mismatch',
      'malformed-ids',
    ]);
  });

  it('reports source-level quality and street examples', () => {
    const parsed = parseBabelStoneIdsFile('U+8857\t街\t^⿲彳圭亍$(GHTJKPV)\t^⿴行圭$(X)', 'IDS.TXT');
    const report = buildBabelStoneImportReport(parsed);

    expect(report.stats).toMatchObject({ records: 2, uniquePairs: 2, uniqueIds: 2, candidate: 0, verified: 2 });
    expect(report.examples.street).toEqual(['⿲彳圭亍', '⿴行圭']);
  });

  it('downloads the fixed snapshot through an injectable fetcher', async () => {
    const requested: string[] = [];
    const file = await downloadBabelStoneIds({
      fetchImpl: async (url) => {
        requested.push(url);
        return { ok: true, status: 200, text: async () => '# fixture' };
      },
    });

    expect(requested).toEqual([DEFAULT_BABELSTONE_IDS_URL]);
    expect(file).toEqual({ file: 'IDS.TXT', text: '# fixture' });
  });

  it('creates reproducible source metadata and text hash', () => {
    const source = createBabelStoneSource({ fileHash: computeBabelStoneSourceHash('# fixture') });

    expect(source).toEqual({
      name: 'BabelStone IDS',
      version: DEFAULT_BABELSTONE_IDS_VERSION,
      retrievalMethod: 'HTTPS download of the pinned upstream file-date snapshot',
      fileHash: expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
      repository: 'https://www.babelstone.co.uk/CJK/index.html',
      revision: 'file-date-2025-06-27',
      license: 'BabelStone IDS data terms',
      files: ['IDS.TXT'],
    });
  });

  it('regenerates the same records and report from a fixed snapshot', () => {
    const snapshot = 'U+8857\t街\t^⿲彳圭亍$(GHTJKPV)';
    const first = parseBabelStoneIdsFile(snapshot, 'IDS.TXT');
    const second = parseBabelStoneIdsFile(snapshot, 'IDS.TXT');

    expect(second).toEqual(first);
    expect(buildBabelStoneImportReport(second)).toEqual(buildBabelStoneImportReport(first));
  });
});
