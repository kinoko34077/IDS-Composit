import { renderIdsInElement } from '../src/renderer/render-document';
import { composeLayout } from '../src/composition';
import { parseIds } from '../src/parser';
import { DEFAULT_LAYOUT_PROFILES } from '../src/data/layout-profiles';
import { renderLayout } from '../src/renderer/render-layout';

export type CalibrationReport = {
  operator: string;
  training: { measuredSamples: number };
  holdout: { measuredSamples: number };
  gate: {
    status: string;
    reason: string;
    sans: { baseline: { median: number; p75: number }; candidate: { median: number; p75: number } };
    serif: { baseline: { median: number; p75: number }; candidate: { median: number; p75: number } };
  };
  profile: { corpusVersion: string; sampleCount: number } | null;
};

export type CalibrationReportLoader = () => Promise<CalibrationReport>;

export async function loadCalibrationReport(): Promise<CalibrationReport> {
  const response = await fetch('./data/calibration/operator-u2ff0-v0.2.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Calibration reportの取得に失敗しました (HTTP ${response.status})`);
  return (await response.json()) as CalibrationReport;
}

function addComparisonItem(container: HTMLElement, label: string, content: Node): void {
  const item = container.ownerDocument.createElement('section');
  item.className = 'comparison-item';
  const heading = container.ownerDocument.createElement('h3');
  heading.textContent = label;
  const sample = container.ownerDocument.createElement('div');
  sample.className = 'sample comparison-sample';
  sample.append(content);
  item.append(heading, sample);
  container.append(item);
}

export async function renderCalibrationComparison(
  container: HTMLElement,
  loadReport: CalibrationReportLoader = loadCalibrationReport,
): Promise<void> {
  const document = container.ownerDocument;
  const status = document.querySelector<HTMLElement>('#calibration-report-status');
  const ids = '⿰木可';
  const parsed = parseIds(ids);
  if (!parsed.ok) throw new Error('Calibration comparison fixture must parse');
  container.replaceChildren();
  addComparisonItem(container, 'Native', document.createTextNode('柯'));
  addComparisonItem(container, 'v0.1 Fixed', renderLayout(composeLayout(parsed.ast), document, ids));
  addComparisonItem(container, 'v0.2 Calibrated', renderLayout(composeLayout(parsed.ast, { layoutProfiles: DEFAULT_LAYOUT_PROFILES }), document, ids));
  try {
    const report = await loadReport();
    if (status !== null) {
      status.dataset.status = report.gate.status === 'accept' ? 'ready' : 'error';
      status.textContent = `${report.operator} Gate: ${report.gate.status}（${report.gate.reason}） / train ${report.training.measuredSamples}, holdout ${report.holdout.measuredSamples} / profile ${report.profile?.corpusVersion ?? 'fallback'}`;
    }
    const details = document.createElement('dl');
    details.className = 'telemetry';
    const rows: ReadonlyArray<readonly [string, string]> = [
      ['Sans median', `${report.gate.sans.baseline.median.toFixed(5)} → ${report.gate.sans.candidate.median.toFixed(5)}`],
      ['Sans p75', `${report.gate.sans.baseline.p75.toFixed(5)} → ${report.gate.sans.candidate.p75.toFixed(5)}`],
      ['Serif median', `${report.gate.serif.baseline.median.toFixed(5)} → ${report.gate.serif.candidate.median.toFixed(5)}`],
      ['Serif p75', `${report.gate.serif.baseline.p75.toFixed(5)} → ${report.gate.serif.candidate.p75.toFixed(5)}`],
    ];
    for (const [label, value] of rows) {
      const term = document.createElement('dt');
      term.textContent = label;
      const detail = document.createElement('dd');
      detail.textContent = value;
      details.append(term, detail);
    }
    container.append(details);
  } catch (error) {
    if (status !== null) {
      status.dataset.status = 'error';
      status.textContent = `実測reportを表示できません: ${String(error)}`;
    }
  }
}

const corpus = document.querySelector<HTMLElement>('#corpus');
const verticalInvestigation = document.querySelector<HTMLElement>('.vertical-investigation');
const fontSelect = document.querySelector<HTMLSelectElement>('#font-select');

if (corpus !== null) {
  renderIdsInElement(corpus);
}
if (verticalInvestigation !== null) {
  renderIdsInElement(verticalInvestigation);
}

const calibrationComparison = document.querySelector<HTMLElement>('#calibration-comparison-grid');
if (calibrationComparison !== null) void renderCalibrationComparison(calibrationComparison);

fontSelect?.addEventListener('change', () => {
  if (corpus !== null && fontSelect.value !== 'system') {
    corpus.dataset.font = fontSelect.value;
  } else if (corpus !== null) {
    corpus.dataset.font = 'system';
  }
});
