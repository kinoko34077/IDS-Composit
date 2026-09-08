export function applyGlyphAccessibility(root: HTMLElement, source: string): void {
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', source);
}

export function hideInternalAccessibility(element: HTMLElement): void {
  element.setAttribute('aria-hidden', 'true');
}
