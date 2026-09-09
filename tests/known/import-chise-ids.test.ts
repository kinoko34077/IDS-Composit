import { describe, expect, it } from 'vitest';
import {
  CHISE_IDS_FILES,
  DEFAULT_CHISE_IDS_REVISION,
  buildKnownImportReport,
  computeSourceHash,
  createChiseIdsSource,
  downloadChiseIdsFiles,
  parseChiseIdsFile,
  parseChiseIdsFiles,
} from '../../tools/known/import-chise-ids';

describe('CHISE IDS importer', () => {
  it('parses functional IDS records and reports apparent structures separately', () => {
    const result = parseChiseIdsFile(
      [
        ';; CHISE IDS fixture',
        'U+8857\t街\t⿴行圭\t@apparent=⿲彳圭亍',
        'U-00020000\t𠀀\t⿱一木',
      ].join('\n'),
      'IDS-UCS-Basic.txt',
    );

    expect(result.records).toEqual([
      { ids: '⿴行圭', character: '街', status: 'verified' },
      { ids: '⿱一木', character: '𠀀', status: 'verified' },
    ]);
    expect(result.stats).toEqual({
      file: 'IDS-UCS-Basic.txt',
      lines: 3,
      comments: 1,
      records: 2,
      apparent: 1,
      issues: 0,
      warnings: 0,
    });
  });

  it('does not silently accept malformed or mismatched source rows', () => {
    const result = parseChiseIdsFile([
      'U+8857\t違う\t⿴行圭',
      'not-a-codepoint\t字\t⿰木可',
      'U+110000\t字\t⿰木可',
      'U+8858\t\t',
    ].join('\n'), 'broken.txt');

    expect(result.records).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.issues.map((issue) => issue.kind)).toEqual([
      'character-mismatch',
      'invalid-codepoint',
      'invalid-codepoint',
      'empty-field',
    ]);
  });

  it('aggregates files and exposes duplicate and ambiguity metrics', () => {
    const result = parseChiseIdsFiles([
      { file: 'a.txt', text: 'U+4E00\t一\t⿱日月\nU+4E01\t丁\t⿱日月\nU+67EF\t柯\t⿰木可\n' },
      { file: 'b.txt', text: 'U+4E00\t一\t⿱日月\n' },
    ]);
    const report = buildKnownImportReport(result);

    expect(result.records).toHaveLength(4);
    expect(result.issues).toEqual([]);
    expect(report.stats).toMatchObject({
      files: 2,
      records: 4,
      uniquePairs: 3,
      duplicatePairs: 1,
      uniqueIds: 2,
      ambiguousIds: 1,
      uniquelyResolvableIds: 1,
    });
    expect(report.stats.warnings).toBe(0);
    expect(report.examples.street).toEqual([]);
    expect(report.resolutionSamples).toEqual([
      { ids: '⿰木可', characters: ['柯'], kind: 'match' },
      { ids: '⿱日月', characters: ['一', '丁'], kind: 'ambiguous' },
    ]);
  });

  it('records a missing functional IDS as a warning when only apparent IDS exists', () => {
    const result = parseChiseIdsFile('U-0002090E\t𠤎\t\t@apparent=⿻乚丿', 'IDS-UCS-Ext-B-1.txt');

    expect(result.records).toEqual([]);
    expect(result.issues).toEqual([]);
    expect(result.warnings).toEqual([{
      file: 'IDS-UCS-Ext-B-1.txt',
      line: 1,
      kind: 'missing-functional-ids',
      message: 'functional IDS is empty; apparent IDS is retained only as source metadata',
    }]);
    expect(result.stats.warnings).toBe(1);
  });

  it('downloads pinned source files through an injectable bounded fetcher', async () => {
    const requested: string[] = [];
    const files = await downloadChiseIdsFiles({
      revision: DEFAULT_CHISE_IDS_REVISION,
      files: ['IDS-UCS-Basic.txt', 'IDS-UCS-Ext-A.txt'],
      concurrency: 1,
      fetchImpl: async (url) => {
        requested.push(url);
        return {
          ok: true,
          status: 200,
          text: async () => `;; ${url}`,
        };
      },
    });

    expect(requested).toEqual([
      `https://raw.githubusercontent.com/chise/ids/${DEFAULT_CHISE_IDS_REVISION}/IDS-UCS-Basic.txt`,
      `https://raw.githubusercontent.com/chise/ids/${DEFAULT_CHISE_IDS_REVISION}/IDS-UCS-Ext-A.txt`,
    ]);
    expect(files).toEqual([
      { file: 'IDS-UCS-Basic.txt', text: expect.stringContaining('IDS-UCS-Basic.txt') },
      { file: 'IDS-UCS-Ext-A.txt', text: expect.stringContaining('IDS-UCS-Ext-A.txt') },
    ]);
  });

  it('creates reproducible source metadata and aggregate hash', () => {
    const files = [
      { file: 'b.txt', text: 'B' },
      { file: 'a.txt', text: 'A' },
    ] as const;
    const source = createChiseIdsSource({
      revision: 'abc123',
      version: 'snapshot-2026-09-09',
      files: files.map(({ file }) => file),
      fileHash: computeSourceHash(files),
    });

    expect(source).toEqual({
      name: 'CHISE IDS database',
      version: 'snapshot-2026-09-09',
      retrievalMethod: 'HTTPS raw download from a pinned repository revision',
      fileHash: expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
      repository: 'https://github.com/chise/ids',
      revision: 'abc123',
      license: 'GPL-2.0-or-later',
      files: ['a.txt', 'b.txt'],
    });
  });
});
