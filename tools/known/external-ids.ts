import { createHash } from 'node:crypto';

/**
 * The source files may describe operators which the local renderer does not
 * implement yet. They still need a conservative structural check so that a
 * native Known mapping is not discarded merely because local composition is
 * incomplete.
 */
const EXTERNAL_IDS_ARITY: Readonly<Record<string, number>> = {
  '⿰': 2,
  '⿱': 2,
  '⿲': 3,
  '⿳': 3,
  '⿴': 2,
  '⿵': 2,
  '⿶': 2,
  '⿷': 2,
  '⿸': 2,
  '⿹': 2,
  '⿺': 2,
  '⿻': 2,
  '⿼': 2,
  '⿽': 2,
  '⿾': 1,
  '⿿': 1,
  '㇯': 2,
  '〾': 1,
};

const LOCAL_IDS_OPERATORS = new Set([
  '⿰', '⿱', '⿲', '⿳', '⿴', '⿵', '⿶', '⿷',
  '⿸', '⿹', '⿺', '⿻', '⿼', '⿽',
]);

export type ExternalIdsAnalysis = {
  wellFormed: boolean;
  unsupportedStructuralIdc: readonly string[];
  hasSpecialComponent: boolean;
};

export function analyzeExternalIds(ids: string): ExternalIdsAnalysis {
  const tokens = Array.from(ids);
  const unsupported = new Set<string>();
  const hasSpecialComponent = /[#{}？?]/u.test(ids);
  let index = 0;

  function parseNode(): boolean {
    const token = tokens[index];
    if (token === undefined) return false;
    index += 1;

    const arity = EXTERNAL_IDS_ARITY[token];
    if (arity === undefined) {
      const codePoint = token.codePointAt(0);
      if (codePoint !== undefined && codePoint >= 0x2ff0 && codePoint <= 0x2fff) {
        unsupported.add(token);
        return false;
      }
      return !/[\u0000-\u0020\u007f-\u009f]/u.test(token) && !/[#{}？?]/u.test(token);
    }

    if (!LOCAL_IDS_OPERATORS.has(token)) unsupported.add(token);
    for (let child = 0; child < arity; child += 1) {
      if (!parseNode()) return false;
    }
    return true;
  }

  const wellFormed = tokens.length > 0 && parseNode() && index === tokens.length;
  return {
    wellFormed,
    unsupportedStructuralIdc: [...unsupported].sort(),
    hasSpecialComponent,
  };
}

export function sha256Text(text: string): string {
  return `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`;
}

export type YiBaiSequenceParts = {
  core: string;
  indicators: string[];
  unbalancedParentheses: boolean;
};

/** Remove Yi Bai's trailing/source annotations without changing the IDS. */
export function splitYiBaiSequence(raw: string): YiBaiSequenceParts {
  let core = '';
  const indicators: string[] = [];
  let group = '';
  let depth = 0;
  let unbalancedParentheses = false;

  for (const token of Array.from(raw.trim())) {
    if (token === '(') {
      depth += 1;
      if (depth > 1) group += token;
      continue;
    }
    if (token === ')') {
      if (depth === 0) {
        unbalancedParentheses = true;
        core += token;
        continue;
      }
      depth -= 1;
      if (depth === 0) {
        if (group.length > 0) indicators.push(group);
        group = '';
      } else {
        group += token;
      }
      continue;
    }
    if (depth > 0) {
      group += token;
    } else {
      core += token;
    }
  }

  if (depth !== 0) {
    unbalancedParentheses = true;
    core += `(${group}`;
  }

  return { core, indicators, unbalancedParentheses };
}

/**
 * Yi Bai uses short ASCII markers for stroke/source details inside an IDS.
 * They are source metadata, not Unicode IDS components. Drop only those
 * markers; structural or special syntax is left intact and classified as a
 * candidate instead of being guessed away.
 */
export function normalizeYiBaiCore(core: string): string {
  return Array.from(core).filter((token) => !/[A-Za-z.]/u.test(token)).join('');
}

export function hasYiBaiSpecialSyntax(core: string, normalized: string): boolean {
  return core !== normalized || /[#{}？?\[\]:-]/u.test(core);
}
