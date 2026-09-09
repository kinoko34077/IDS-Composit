import { renderIds, type RenderIdsOptions } from '../src/public-api';
import './index.css';
import { PATTERN_CASES, toDisplaySource, type PatternCase } from './playground-model';

type PlaygroundRenderer = (
  target: HTMLElement,
  options?: Pick<RenderIdsOptions, 'chise'>,
) => Promise<void>;

function text(document: Document, value: string): Text {
  return document.createTextNode(value);
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
  row.append(label, sourceCell, previewCell, description);
  return row;
}

function createPatternTable(document: Document): HTMLTableElement {
  const table = document.createElement('table');
  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const label of ['候補', 'IDS source', '表示', '確認対象']) {
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
): Promise<void> {
  const document = root.ownerDocument;
  root.replaceChildren();
  root.append(createHeading(document));

  const introduction = document.createElement('p');
  introduction.textContent = 'IDSを直接入力するか候補を選び、local compositionとCHISE native優先の表示をスマートフォンで確認できます。';
  root.append(introduction);

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

  const renderButton = document.createElement('button');
  renderButton.type = 'submit';
  renderButton.textContent = '入力を表示';

  const chiseLabel = document.createElement('label');
  chiseLabel.className = 'checkbox-label';
  const chise = document.createElement('input');
  chise.id = 'chise-toggle';
  chise.type = 'checkbox';
  chiseLabel.append(chise, text(document, ' CHISE native優先'));

  form.append(inputLabel, candidateLabel, renderButton, chiseLabel);
  root.append(form);

  const status = document.createElement('p');
  status.id = 'status';
  status.className = 'status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  root.append(status);

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

  const chiseOptions = (): Pick<RenderIdsOptions, 'chise'> => ({ chise: chise.checked });

  const renderTarget = async (target: HTMLElement): Promise<boolean> => {
    try {
      await renderer(target, chiseOptions());
      return true;
    } catch (error) {
      setStatus(status, `表示中にエラーが発生しました: ${String(error)}`, 'error');
      return false;
    }
  };

  const renderPreview = async (): Promise<void> => {
    const source = toDisplaySource(input.value);
    preview.replaceChildren(source.length > 0 ? text(document, source) : text(document, ''));
    if (source.length === 0) {
      setStatus(status, 'IDSを入力してください。', 'error');
      return;
    }
    const rendered = await renderTarget(preview);
    if (rendered) setStatus(status, `${chise.checked ? 'CHISE native優先' : 'local composition'}で表示しました。`);
  };

  const renderTable = async (): Promise<void> => {
    const body = root.querySelector<HTMLTableSectionElement>('#pattern-table-body');
    if (body === null) return;
    const rendered = await renderTarget(body);
    if (rendered) setStatus(status, `${chise.checked ? 'CHISE native優先' : 'local composition'}で一覧を表示しました。`);
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
  chise.addEventListener('change', () => {
    void renderPreview();
    void renderTable();
  });

  await renderTable();
}

const playground = document.querySelector<HTMLElement>('#playground');
if (playground !== null) void initializePlayground(playground);
