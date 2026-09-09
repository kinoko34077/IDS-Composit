import {
  createKnownCharacterIndex,
  entriesFromKnownRecordsArtifact,
  renderIds,
  type KnownCharacterIndex,
  type KnownCharacterMergedRecordsArtifact,
  type RenderIdsOptions,
} from '../src/public-api';
import './index.css';
import { PATTERN_CASES, toDisplaySource, type PatternCase } from './playground-model';

export type PlaygroundRenderer = (
  target: HTMLElement,
  options?: Pick<RenderIdsOptions, 'chise' | 'knownIndex'>,
) => Promise<void>;

export type FullKnownIndexLoader = () => Promise<KnownCharacterIndex>;

type ResolutionMode = 'local' | 'chise' | 'full-known' | 'full-known-chise';

type RenderContext = {
  mode: ResolutionMode;
  options: Pick<RenderIdsOptions, 'chise' | 'knownIndex'>;
  knownIndex?: KnownCharacterIndex;
};

function text(document: Document, value: string): Text {
  return document.createTextNode(value);
}

function sourceFromInput(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('⟦') && trimmed.endsWith('⟧')) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export async function loadFullKnownIndexFromPages(): Promise<KnownCharacterIndex> {
  const response = await fetch('./data/known-index-v0.2.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Full Known Indexの取得に失敗しました (HTTP ${response.status})`);
  }
  const artifact = (await response.json()) as KnownCharacterMergedRecordsArtifact;
  if (artifact.schemaVersion !== 'ids-composit-known-records-merged/v0.2') {
    throw new Error('Full Known Indexのschemaが対応していません。');
  }
  return createKnownCharacterIndex(entriesFromKnownRecordsArtifact(artifact));
}

function modeFromValue(value: string): ResolutionMode {
  if (value === 'chise' || value === 'full-known' || value === 'full-known-chise') return value;
  return 'local';
}

function modeDescription(mode: ResolutionMode): string {
  switch (mode) {
    case 'chise': return 'CHISE API';
    case 'full-known': return 'Full Known Index';
    case 'full-known-chise': return 'Full Known + CHISE';
    default: return 'Local only';
  }
}

function createHeading(document: Document): HTMLElement {
  const heading = document.createElement('h1');
  heading.textContent = 'IDS-Composit スマホ確認ページ';
  return heading;
}

function createPatternRow(document: Document, pattern: PatternCase): HTMLTableRowElement {
  const row = document.createElement('tr');
  const label = document.createElement('th');
  label.scope = 'row';
  label.textContent = pattern.label;

  const sourceCell = document.createElement('td');
  const source = document.createElement('code');
  source.textContent = pattern.source;
  sourceCell.append(source);

  const previewCell = document.createElement('td');
  const preview = document.createElement('span');
  preview.className = 'sample';
  preview.dataset.case = pattern.id;
  preview.textContent = `⟦${pattern.source}⟧`;
  previewCell.append(preview);

  const description = document.createElement('td');
  description.textContent = pattern.description;
  const resolution = document.createElement('td');
  resolution.textContent = pattern.resolution;
  row.append(label, sourceCell, previewCell, resolution, description);
  return row;
}

function createPatternTable(document: Document): HTMLTableElement {
  const table = document.createElement('table');
  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const label of ['候補', 'IDS source', '表示', '解決経路（目安）', '確認対象']) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = label;
    headRow.append(cell);
  }
  head.append(headRow);

  const body = document.createElement('tbody');
  body.id = 'pattern-table-body';
  for (const pattern of PATTERN_CASES) body.append(createPatternRow(document, pattern));
  table.append(head, body);
  return table;
}

function setStatus(element: HTMLElement, message: string, kind: 'ready' | 'error' = 'ready'): void {
  element.textContent = message;
  element.dataset.status = kind;
}

export async function initializePlayground(
  root: HTMLElement,
  renderer: PlaygroundRenderer = renderIds,
  loadFullKnownIndex: FullKnownIndexLoader = loadFullKnownIndexFromPages,
): Promise<void> {
  const document = root.ownerDocument;
  root.replaceChildren();
  root.append(createHeading(document));

  const introduction = document.createElement('p');
  introduction.textContent = 'IDSを直接入力するか候補を選び、local compositionとCHISE native優先の表示をスマートフォンで確認できます。';
  root.append(introduction);

  const calibrationNotice = document.createElement('p');
  calibrationNotice.className = 'metadata';
  calibrationNotice.textContent = 'v0.2 Generic Layout Profile: Source Han Sans JP実測でGateを通過した⿰のみ適用し、その他の構図はv0.1 fixed templateへfallbackします。';
  root.append(calibrationNotice);

  const form = document.createElement('form');
  form.id = 'ids-form';
  form.className = 'control-panel';

  const inputLabel = document.createElement('label');
  inputLabel.htmlFor = 'ids-input';
  inputLabel.textContent = 'IDS入力';
  const input = document.createElement('input');
  input.id = 'ids-input';
  input.name = 'ids';
  input.type = 'text';
  input.autocomplete = 'off';
  input.inputMode = 'text';
  input.value = PATTERN_CASES[0]?.source ?? '';
  input.placeholder = '例: ⿰木可 または ⟦⿰木可⟧';
  inputLabel.append(input);

  const candidateLabel = document.createElement('label');
  candidateLabel.htmlFor = 'pattern-select';
  candidateLabel.textContent = '候補を選択';
  const candidate = document.createElement('select');
  candidate.id = 'pattern-select';
  candidate.name = 'pattern';
  for (const pattern of PATTERN_CASES) {
    const option = document.createElement('option');
    option.value = pattern.id;
    option.textContent = `${pattern.label} — ${pattern.source}`;
    candidate.append(option);
  }
  candidateLabel.append(candidate);

  const modeLabel = document.createElement('label');
  modeLabel.htmlFor = 'resolution-mode';
  modeLabel.textContent = 'Resolution mode';
  const mode = document.createElement('select');
  mode.id = 'resolution-mode';
  mode.name = 'resolution-mode';
  const modes: ReadonlyArray<readonly [ResolutionMode, string]> = [
    ['local', 'Local only'],
    ['chise', 'CHISE API'],
    ['full-known', 'Full Known Index'],
    ['full-known-chise', 'Full Known + CHISE'],
  ];
  for (const [value, label] of modes) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    mode.append(option);
  }
  modeLabel.append(mode);

  const renderButton = document.createElement('button');
  renderButton.type = 'submit';
  renderButton.textContent = '入力を表示';

  form.append(inputLabel, candidateLabel, modeLabel, renderButton);
  root.append(form);

  const status = document.createElement('p');
  status.id = 'status';
  status.className = 'status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  root.append(status);

  const telemetry = document.createElement('dl');
  telemetry.id = 'resolution-telemetry';
  telemetry.className = 'telemetry';
  telemetry.setAttribute('aria-live', 'polite');
  root.append(telemetry);

  const previewSection = document.createElement('section');
  previewSection.className = 'panel';
  const previewHeading = document.createElement('h2');
  previewHeading.textContent = '入力結果';
  const preview = document.createElement('div');
  preview.id = 'preview';
  preview.className = 'preview sample';
  previewSection.append(previewHeading, preview);
  root.append(previewSection);

  const tableSection = document.createElement('section');
  tableSection.className = 'panel';
  const tableHeading = document.createElement('h2');
  tableHeading.textContent = 'パターン一覧';
  const tableScroll = document.createElement('div');
  tableScroll.className = 'table-scroll';
  tableScroll.append(createPatternTable(document));
  tableSection.append(tableHeading, tableScroll);
  root.append(tableSection);

  const linksSection = document.createElement('nav');
  linksSection.className = 'panel page-links';
  linksSection.setAttribute('aria-label', '確認ページ');
  const linksHeading = document.createElement('h2');
  linksHeading.textContent = '詳細確認ページ';
  const links = document.createElement('ul');
  const pageLinks: ReadonlyArray<readonly [string, string]> = [
    ['Basic composition', './basic.html'],
    ['Visual validation', './validation.html'],
    ['CHISE live / CORS preflight', './chise-preflight.html'],
    ['Consumer demo', './consumer.html'],
  ];
  for (const link of pageLinks) {
    const item = document.createElement('li');
    const anchor = document.createElement('a');
    anchor.href = link[1];
    anchor.textContent = link[0];
    item.append(anchor);
    links.append(item);
  }
  linksSection.append(linksHeading, links);
  root.append(linksSection);

  let fullKnownIndexPromise: Promise<KnownCharacterIndex> | undefined;

  const ensureFullKnownIndex = async (): Promise<KnownCharacterIndex> => {
    if (fullKnownIndexPromise === undefined) {
      fullKnownIndexPromise = loadFullKnownIndex().catch((error: unknown) => {
        fullKnownIndexPromise = undefined;
        throw error;
      });
    }
    return fullKnownIndexPromise;
  };

  const getRenderContext = async (): Promise<RenderContext> => {
    const selectedMode = modeFromValue(mode.value);
    if (selectedMode === 'full-known' || selectedMode === 'full-known-chise') {
      setStatus(status, 'Full Known Indexを読み込んでいます…');
      const knownIndex = await ensureFullKnownIndex();
      return {
        mode: selectedMode,
        knownIndex,
        options: {
          knownIndex,
          chise: selectedMode === 'full-known-chise',
        },
      };
    }
    return {
      mode: selectedMode,
      options: { chise: selectedMode === 'chise' },
    };
  };

  const setTelemetry = (ids: string, context: RenderContext): void => {
    const known = context.knownIndex?.resolve(ids);
    const knownText = context.knownIndex === undefined
      ? '未ロード（Full Known Index未選択）'
      : known?.kind === 'match'
        ? `hit: ${known.character}`
        : known?.kind === 'ambiguous'
          ? 'ambiguous'
          : 'miss';
    const chiseText = known?.kind === 'match'
      ? 'not queried (Known hit)'
      : context.options.chise === true
        ? 'enabled / queried as needed'
        : 'disabled';
    const resultText = known?.kind === 'match'
      ? `native ${known.character}`
      : context.options.chise === true
        ? 'native / composition / fallback（CHISE結果依存）'
        : 'composition / fallback';

    telemetry.replaceChildren();
    const rows: ReadonlyArray<readonly [string, string]> = [
      ['Input', `⟦${ids}⟧`],
      ['Known lookup', knownText],
      ['CHISE', chiseText],
      ['Result', resultText],
      ['Mode', modeDescription(context.mode)],
    ];
    for (const [label, value] of rows) {
      const term = document.createElement('dt');
      term.textContent = label;
      const detail = document.createElement('dd');
      detail.textContent = value;
      telemetry.append(term, detail);
    }
  };

  const renderTarget = async (target: HTMLElement, ids: string): Promise<boolean> => {
    try {
      const context = await getRenderContext();
      await renderer(target, context.options);
      setTelemetry(ids, context);
      return true;
    } catch (error) {
      setStatus(status, `表示中にエラーが発生しました: ${String(error)}`, 'error');
      return false;
    }
  };

  const renderPreview = async (): Promise<void> => {
    const ids = sourceFromInput(input.value);
    const source = toDisplaySource(ids);
    preview.replaceChildren(source.length > 0 ? text(document, source) : text(document, ''));
    if (ids.length === 0) {
      setStatus(status, 'IDSを入力してください。', 'error');
      return;
    }
    const rendered = await renderTarget(preview, ids);
    if (rendered) setStatus(status, `${modeDescription(modeFromValue(mode.value))}で表示しました。`);
  };

  const renderTable = async (): Promise<void> => {
    const body = root.querySelector<HTMLTableSectionElement>('#pattern-table-body');
    if (body === null) return;
    const ids = sourceFromInput(input.value);
    const rendered = await renderTarget(body, ids);
    if (rendered) setStatus(status, `${modeDescription(modeFromValue(mode.value))}で一覧を表示しました。`);
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void renderPreview();
  });
  candidate.addEventListener('change', () => {
    const selected = PATTERN_CASES.find((pattern) => pattern.id === candidate.value);
    if (selected !== undefined) {
      input.value = selected.source;
      void renderPreview();
    }
  });
  mode.addEventListener('change', () => {
    void renderPreview();
    void renderTable();
  });

  await renderTable();
}

const playground = document.querySelector<HTMLElement>('#playground');
if (playground !== null) void initializePlayground(playground);
