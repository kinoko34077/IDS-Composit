import { describe, expect, it } from 'vitest';
import {
  DEFAULT_YIBAI_IDS_REVISION,
  DEFAULT_YIBAI_IDS_VERSION,
  buildYiBaiImportReport,
  computeYiBaiSourceHash,
  createYiBaiSource,
  downloadYiBaiIds,
  parseYiBaiIdsFile,
} from '../../tools/known/import-yibai-ids';

describe('Yi Bai IDS importer', () => {
  it('keeps primary and alternative sequences and normalizes safe inline markers', () => {
    const result = parseYiBaiIdsFile([
      '街\t⿴行圭t\t⿰徍亍',
      '行\t⿰彳亍',
      '臦\t⿰⿾臣臣(m)',
      '香\t⿰{1}香(G)',
    ].join('\n'), 'ids_lv0.txt', 'lv0');

    expect(result.records).toEqual([
      { ids: '⿴行圭', character: '街', status: 'candidate', variantTag: 'primary' },
      { ids: '⿰徍亍', character: '街', status: 'candidate', variantTag: 'alternative' },
      { ids: '⿰彳亍', character: '行', status: 'candidate', variantTag: 'primary' },
      { ids: '⿰⿾臣臣', character: '臦', status: 'candidate', variantTag: 'primary;m' },
      { ids: '⿰{1}香', character: '香', status: 'candidate', variantTag: 'primary;G' },
    ]);
    expect(result.stats).toMatchObject({ records: 5, primary: 4, alternative: 1, candidate: 5 });
    expect(result.issues).toEqual([]);
  });

  it('marks plain lv2 records as verified while keeping special syntax as candidate', () => {
    const result = parseYiBaiIdsFile([
      '街\t⿰徍亍\t⿴行圭',
      '香\t#(H)',
      '坏\t⿱一',
    ].join('\n'), 'ids_lv2.txt', 'lv2');

    expect(result.records).toEqual([
      { ids: '⿰徍亍', character: '街', status: 'verified', variantTag: 'primary' },
      { ids: '⿴行圭', character: '街', status: 'verified', variantTag: 'alternative' },
      { ids: '#', character: '香', status: 'candidate', variantTag: 'primary;H' },
    ]);
    expect(result.issues).toEqual([{ file: 'ids_lv2.txt', line: 3, kind: 'malformed-ids', message: 'IDS sequence has invalid structure' }]);
    expect(buildYiBaiImportReport(result).examples.street).toEqual(['⿰徍亍', '⿴行圭']);
  });

  it('downloads a level from the pinned repository revision', async () => {
    const requested: string[] = [];
    const file = await downloadYiBaiIds({
      revision: DEFAULT_YIBAI_IDS_REVISION,
      level: 'lv2',
      fetchImpl: async (url) => {
        requested.push(url);
        return { ok: true, status: 200, text: async () => '# fixture' };
      },
    });

    expect(requested).toEqual([
      `https://raw.githubusercontent.com/yi-bai/ids/${DEFAULT_YIBAI_IDS_REVISION}/ids_lv2.txt`,
    ]);
    expect(file).toEqual({ file: 'ids_lv2.txt', text: '# fixture' });
  });

  it('creates MIT source metadata with a deterministic hash', () => {
    const source = createYiBaiSource({
      revision: DEFAULT_YIBAI_IDS_REVISION,
      level: 'lv2',
      fileHash: computeYiBaiSourceHash('# fixture'),
    });

    expect(source).toEqual({
      name: 'Yi Bai IDS lv2',
      version: `${DEFAULT_YIBAI_IDS_VERSION}-lv2`,
      retrievalMethod: 'HTTPS raw download from a pinned repository revision',
      fileHash: expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
      repository: 'https://github.com/yi-bai/ids',
      revision: DEFAULT_YIBAI_IDS_REVISION,
      license: 'MIT',
      files: ['ids_lv2.txt'],
    });
  });

  it('regenerates the same records and report from a pinned level snapshot', () => {
    const snapshot = '街\t⿰徍亍\t⿴行圭';
    const first = parseYiBaiIdsFile(snapshot, 'ids_lv2.txt', 'lv2');
    const second = parseYiBaiIdsFile(snapshot, 'ids_lv2.txt', 'lv2');

    expect(second).toEqual(first);
    expect(buildYiBaiImportReport(second)).toEqual(buildYiBaiImportReport(first));
  });
});
