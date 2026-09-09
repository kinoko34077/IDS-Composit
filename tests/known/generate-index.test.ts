import { describe, expect, it } from 'vitest';
import { generateKnownIndexArtifact, generateKnownRecordsArtifact } from '../../tools/known/generate-index';

describe('generateKnownIndexArtifact', () => {
  it('creates a deterministic external artifact with provenance on every entry', () => {
    const artifact = generateKnownIndexArtifact([
      { ids: '⿰木可', character: '柯', status: 'verified' },
      { ids: '⿲彳圭亍', character: '街', status: 'candidate' },
    ], {
      name: 'external IDS fixture',
      version: '2026-09',
      retrievalMethod: 'downloaded source file',
      fileHash: 'sha256:example',
    });

    expect(artifact).toEqual({
      schemaVersion: 'ids-composit-known-index/v0.2',
      source: {
        name: 'external IDS fixture',
        version: '2026-09',
        retrievalMethod: 'downloaded source file',
        fileHash: 'sha256:example',
      },
      entries: [
        {
          ids: '⿰木可',
          character: '柯',
          source: 'external IDS fixture',
          sourceVersion: '2026-09',
          retrievalMethod: 'downloaded source file',
          sourceHash: 'sha256:example',
          status: 'verified',
        },
        {
          ids: '⿲彳圭亍',
          character: '街',
          source: 'external IDS fixture',
          sourceVersion: '2026-09',
          retrievalMethod: 'downloaded source file',
          sourceHash: 'sha256:example',
          status: 'candidate',
        },
      ],
    });
  });

  it('rejects incomplete external provenance', () => {
    expect(() => generateKnownIndexArtifact([], {
      name: 'external IDS fixture',
      version: '',
      retrievalMethod: 'downloaded source file',
    })).toThrow('version must not be empty');
  });

  it('preserves source IDS values instead of normalizing provenance data', () => {
    const artifact = generateKnownIndexArtifact([
      { ids: '⿰が木', character: ' 字 ', status: 'candidate' },
    ], {
      name: 'external IDS fixture',
      version: '2026-09',
      retrievalMethod: 'downloaded source file',
    });

    expect(artifact.entries[0]?.ids).toBe('⿰が木');
    expect(artifact.entries[0]?.character).toBe(' 字 ');
  });

  it('supports a compact bulk artifact with source provenance stored once', () => {
    const artifact = generateKnownRecordsArtifact([
      { ids: '⿱日月', character: '明', status: 'verified' },
      { ids: '⿰木可', character: '柯', status: 'verified' },
    ], {
      name: 'external IDS fixture',
      version: '2026-09',
      retrievalMethod: 'downloaded source file',
    });

    expect(artifact.schemaVersion).toBe('ids-composit-known-records/v0.2');
    expect(artifact.records).toEqual([
      { ids: '⿰木可', character: '柯', status: 'verified' },
      { ids: '⿱日月', character: '明', status: 'verified' },
    ]);
    expect(artifact.source).toEqual({
      name: 'external IDS fixture',
      version: '2026-09',
      retrievalMethod: 'downloaded source file',
    });
  });
});
