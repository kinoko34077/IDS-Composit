import { IDS_GLYPH_CLASS } from './render-constants';

const documentsWithCopyHandler = new WeakSet<Document>();

export function installDocumentCopyHandler(document: Document): void {
  if (documentsWithCopyHandler.has(document)) return;
  documentsWithCopyHandler.add(document);
  document.addEventListener('copy', (event) => {
    const selection = document.getSelection();
    if (selection === null || selection.rangeCount === 0 || selection.isCollapsed) return;
    const selectedText = selection.toString();
    if (selectedText.length === 0) return;

    const matches = Array.from(document.querySelectorAll<HTMLElement>(`.${IDS_GLYPH_CLASS}`)).filter((element) => (
      element.textContent === selectedText
      && element.contains(selection.anchorNode)
      && element.contains(selection.focusNode)
    ));
    if (matches.length !== 1) return;
    const source = matches[0]?.dataset.ids;
    if (source === undefined || event.clipboardData === null) return;
    event.clipboardData.setData('text/plain', `⟦${source}⟧`);
    event.preventDefault();
  });
}

export function attachRootCopyHandler(root: HTMLElement, source: string): void {
  root.addEventListener('copy', (event) => {
    const clipboardData = event.clipboardData;
    if (clipboardData === null) return;
    clipboardData.setData('text/plain', `⟦${source}⟧`);
    event.preventDefault();
  });
}
