import { parseIds, type ParseResult } from './parse-ids';
import type { ParseError } from './errors';

export type ScanError = ParseError | { kind: 'unterminated'; index: number; message?: string };

export type TextSegment =
  | { type: 'text'; value: string }
  | { type: 'ids'; source: string; raw: string }
  | { type: 'invalid'; raw: string; error: ScanError };

function parseSegment(source: string, raw: string): TextSegment {
  const result: ParseResult = parseIds(source);
  if (result.ok || result.error.kind === 'unknown-operator') {
    // A closed IDS source may still be outside local structural coverage.
    // Keep it resolvable by native providers/Known Index before fallback.
    return { type: 'ids', source, raw };
  }
  return { type: 'invalid', raw, error: result.error };
}

export function scanEmbeddedIds(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const openIndex = text.indexOf('⟦', cursor);
    if (openIndex === -1) {
      if (cursor < text.length) {
        segments.push({ type: 'text', value: text.slice(cursor) });
      }
      break;
    }

    if (openIndex > cursor) {
      segments.push({ type: 'text', value: text.slice(cursor, openIndex) });
    }

    const closeIndex = text.indexOf('⟧', openIndex + 1);
    if (closeIndex === -1) {
      segments.push({
        type: 'invalid',
        raw: text.slice(openIndex),
        error: { kind: 'unterminated', index: openIndex },
      });
      break;
    }

    const raw = text.slice(openIndex, closeIndex + 1);
    segments.push(parseSegment(text.slice(openIndex + 1, closeIndex), raw));
    cursor = closeIndex + 1;
  }

  return segments;
}
