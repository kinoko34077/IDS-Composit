declare module 'fontkit' {
  export type Font = {
    unitsPerEm: number;
    ascent: number;
    descent: number;
    hasGlyphForCodePoint(codePoint: number): boolean;
  };

  export function openSync(path: string): Font;
}
