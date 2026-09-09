import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../../tools/calibration/fonts/manifest.json';
import { assertExpectedSha256, type CalibrationFontManifest } from '../../tools/calibration/fonts/fetch-fonts';

describe('Calibration font manifest', () => {
  it('pins the JP training and cross-validation fonts to official releases', () => {
    const typedManifest = manifest as CalibrationFontManifest;
    expect(typedManifest.fonts).toHaveLength(2);
    expect(typedManifest.fonts.map((font) => [font.id, font.version, font.region, font.weight, font.format])).toEqual([
      ['source-han-sans-jp-regular', '2.005R', 'JP', 'Regular', 'static OTF'],
      ['source-han-serif-jp-regular', '2.003R', 'JP', 'Regular', 'static OTF'],
    ]);
    for (const font of typedManifest.fonts) {
      expect(font.upstream).toMatch(/^https:\/\/github\.com\/adobe-fonts\//u);
      expect(font.release).toMatch(/releases\/tag\/2\.00[35]R$/u);
      expect(font.expectedSha256).toMatch(/^sha256:[0-9a-f]{64}$/u);
      expect(font.archiveSha256).toMatch(/^sha256:[0-9a-f]{64}$/u);
      expect(font.assetUrl).toMatch(/^https:\/\/github\.com\/adobe-fonts\/.*\/releases\/download\//u);
    }
  });

  it('fails closed on a font hash mismatch', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ids-composit-font-'));
    const path = join(directory, 'font.otf');
    await writeFile(path, 'not-a-font', 'utf8');
    try {
      await expect(assertExpectedSha256(path, 'sha256:0000000000000000000000000000000000000000000000000000000000000000'))
        .rejects.toThrow(/hash mismatch/u);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
