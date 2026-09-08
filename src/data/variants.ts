import type { StructuralRole } from '../core/types';

export type VariantMap = Record<string, Partial<Record<StructuralRole, string>>>;

export const VARIANT_MAP: VariantMap = {
  水: { left: '氵', bottom: '氺' },
  火: { bottom: '灬' },
  人: { left: '亻' },
  心: { left: '忄' },
  手: { left: '扌' },
  犬: { left: '犭' },
  示: { left: '礻' },
  糸: { left: '糹' },
  爪: { top: '爫' },
};
