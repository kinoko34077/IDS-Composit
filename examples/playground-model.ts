export type PatternCase = {
  id: string;
  label: string;
  source: string;
  description: string;
};

export const PATTERN_CASES: readonly PatternCase[] = [
  { id: 'binary', label: '左右', source: '⿰木可', description: 'binary horizontal' },
  { id: 'variant', label: '位置variant', source: '⿰水青', description: 'left position variant' },
  { id: 'vertical', label: '上下', source: '⿱艹明', description: 'binary vertical' },
  { id: 'surround', label: '全囲み', source: '⿴囗王', description: 'surround layout' },
  { id: 'nested', label: 'nested', source: '⿰木⿱日月', description: 'nested composition' },
  { id: 'trinary-horizontal', label: '三項左右', source: '⿲彳圭亍', description: 'trinary horizontal' },
  { id: 'trinary-vertical', label: '三項上下', source: '⿳士冖豆', description: 'trinary vertical' },
  { id: 'dense-horizontal', label: '高密度左右', source: '⿰鬱青', description: 'density difference' },
  { id: 'dense-vertical', label: '高密度上下', source: '⿱龜心', description: 'density difference' },
  { id: 'unsupported', label: '未対応IDC', source: '⿵門日', description: 'source-preserving fallback' },
];

export function toDisplaySource(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return '';
  if (trimmed.startsWith('⟦') && trimmed.endsWith('⟧')) return trimmed;
  return `⟦${trimmed}⟧`;
}
