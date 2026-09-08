import { renderIdsInElement } from '../src/renderer/render-document';

const corpus = document.querySelector<HTMLElement>('#corpus');
const verticalInvestigation = document.querySelector<HTMLElement>('.vertical-investigation');
const fontSelect = document.querySelector<HTMLSelectElement>('#font-select');

if (corpus !== null) {
  renderIdsInElement(corpus);
}
if (verticalInvestigation !== null) {
  renderIdsInElement(verticalInvestigation);
}

fontSelect?.addEventListener('change', () => {
  if (corpus !== null && fontSelect.value !== 'system') {
    corpus.dataset.font = fontSelect.value;
  } else if (corpus !== null) {
    corpus.dataset.font = 'system';
  }
});
