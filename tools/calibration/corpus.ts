import { IDC_DEFINITIONS } from '../../src/data/idc.ts';
import type { IdsNode } from '../../src/core/types.ts';
import type { KnownCharacterEntry } from '../../src/known/types.ts';
import { parseIds } from '../../src/parser/parse-ids.ts';

export type CalibrationCorpusEntry = {
  ids: string;
  character: string;
  operator: string;
  components: string[];
  source: string;
  sourceVersion?: string;
  retrievalMethod?: string;
  sourceHash?: string;
};

export type CalibrationCorpus = {
  version: string;
  train: CalibrationCorpusEntry[];
  holdout: CalibrationCorpusEntry[];
};

export type CalibrationCorpusOptions = {
  targetAvailable?: (character: string) => boolean;
  componentAvailable?: (character: string) => boolean;
  split?: (entry: CalibrationCorpusEntry, index: number) => 'train' | 'holdout';
};

function collectComponents(node: IdsNode, components: string[]): void {
  if (node.type === 'char') {
    components.push(node.value);
    return;
  }
  for (const child of node.children) collectComponents(child, components);
}

export function buildCalibrationCorpus(
  entries: readonly KnownCharacterEntry[],
  options: CalibrationCorpusOptions = {},
): CalibrationCorpus {
  const targetAvailable = options.targetAvailable ?? (() => true);
  const componentAvailable = options.componentAvailable ?? (() => true);
  const split = options.split ?? ((_entry, index) => index % 5 === 0 ? 'holdout' : 'train');
  const train: CalibrationCorpusEntry[] = [];
  const holdout: CalibrationCorpusEntry[] = [];
  let eligibleIndex = 0;

  for (const entry of entries) {
    if (entry.status !== 'verified' || !targetAvailable(entry.character)) continue;
    const parsed = parseIds(entry.ids);
    if (!parsed.ok || parsed.ast.type !== 'composition' || IDC_DEFINITIONS[parsed.ast.operator] === undefined) continue;
    const components: string[] = [];
    collectComponents(parsed.ast, components);
    if (!components.every(componentAvailable)) continue;

    const corpusEntry: CalibrationCorpusEntry = {
      ids: entry.ids,
      character: entry.character,
      operator: parsed.ast.operator,
      components,
      source: entry.source,
      ...(entry.sourceVersion === undefined ? {} : { sourceVersion: entry.sourceVersion }),
      ...(entry.retrievalMethod === undefined ? {} : { retrievalMethod: entry.retrievalMethod }),
      ...(entry.sourceHash === undefined ? {} : { sourceHash: entry.sourceHash }),
    };
    if (split(corpusEntry, eligibleIndex) === 'holdout') holdout.push(corpusEntry);
    else train.push(corpusEntry);
    eligibleIndex += 1;
  }

  return { version: 'v0.2', train, holdout };
}
