import type { IdsNode } from '../core/types';
import { IDC_ARITY } from '../data/idc.ts';
import type { ParseError } from './errors';

export type ParseResult =
  | { ok: true; ast: IdsNode }
  | { ok: false; error: ParseError };

type Cursor = {
  tokens: string[];
  index: number;
};

function error(kind: ParseError['kind'], index: number, message: string): ParseResult {
  return { ok: false, error: { kind, index, message } };
}

function parseNode(cursor: Cursor): IdsNode | ParseError {
  const token = cursor.tokens[cursor.index];
  if (token === undefined) {
    return {
      kind: 'missing-child',
      index: cursor.index,
      message: 'IDS operator is missing a child',
    };
  }

  cursor.index += 1;
  const arity = IDC_ARITY[token];
  if (arity === undefined) {
    const codePoint = token.codePointAt(0);
    if (codePoint !== undefined && codePoint >= 0x2ff0 && codePoint <= 0x2fff) {
      return {
        kind: 'unknown-operator',
        index: cursor.index - 1,
        message: `Unsupported IDS operator: ${token}`,
      };
    }
    return { type: 'char', value: token };
  }

  const children: IdsNode[] = [];
  for (let childIndex = 0; childIndex < arity; childIndex += 1) {
    const child = parseNode(cursor);
    if ('kind' in child) {
      return child;
    }
    children.push(child);
  }

  return { type: 'composition', operator: token, children };
}

export function parseIds(source: string): ParseResult {
  const tokens = Array.from(source);
  if (tokens.length === 0) {
    return error('empty', 0, 'IDS source must not be empty');
  }

  const cursor: Cursor = { tokens, index: 0 };
  const parsed = parseNode(cursor);
  if ('kind' in parsed) {
    return { ok: false, error: parsed };
  }

  if (cursor.index !== tokens.length) {
    return error('trailing-input', cursor.index, 'IDS source contains trailing input');
  }

  return { ok: true, ast: parsed };
}
