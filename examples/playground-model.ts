export type PatternCase = {
  id: string;
  label: string;
  source: string;
  description: string;
  resolution: string;
};

export const PATTERN_CASES: readonly PatternCase[] = [
  { id: 'binary', label: '左右', source: '⿰木可', description: 'binary horizontal', resolution: 'Known miss → local composition' },
  { id: 'variant', label: '位置variant', source: '⿰水青', description: 'left position variant', resolution: 'Known miss → local composition + variant' },
  { id: 'vertical', label: '上下', source: '⿱艹明', description: 'binary vertical', resolution: 'Known miss → local composition' },
  { id: 'surround', label: '全囲み', source: '⿴囗王', description: 'surround layout', resolution: 'Known miss → local composition' },
  { id: 'surround-above', label: '上包み', source: '⿵門日', description: 'top surround layout', resolution: 'Known miss → local composition' },
  { id: 'surround-below', label: '下包み', source: '⿶一凵', description: 'bottom surround layout', resolution: 'Known miss → local composition' },
  { id: 'surround-left', label: '左包み', source: '⿷匚口', description: 'left surround layout', resolution: 'Known miss → local composition' },
  { id: 'surround-upper-left', label: '左上包み', source: '⿸广木', description: 'upper-left surround layout', resolution: 'Known miss → local composition' },
  { id: 'surround-upper-right', label: '右上包み', source: '⿹戸口', description: 'upper-right surround layout', resolution: 'Known miss → local composition' },
  { id: 'surround-lower-left', label: '左下包み', source: '⿺廴日', description: 'lower-left surround layout', resolution: 'Known miss → local composition' },
  { id: 'overlay', label: '重ね合わせ', source: '⿻木口', description: 'overlay layout', resolution: 'Known miss → local composition' },
  { id: 'surround-corner', label: '角包み', source: '⿼句口', description: 'corner surround layout', resolution: 'Known miss → local composition' },
  { id: 'surround-corner-reverse', label: '逆角包み', source: '⿽乙丶', description: 'reverse corner surround layout', resolution: 'Known miss → local composition' },
  { id: 'nested', label: 'nested', source: '⿰木⿱日月', description: 'nested composition', resolution: 'Known miss → nested local composition' },
  { id: 'trinary-horizontal', label: '三項左右', source: '⿲彳圭亍', description: 'trinary horizontal', resolution: 'Known candidate（未検証）→ local composition' },
  { id: 'trinary-vertical', label: '三項上下', source: '⿳士冖豆', description: 'trinary vertical', resolution: 'Known miss → local composition' },
  { id: 'dense-horizontal', label: '高密度左右', source: '⿰鬱青', description: 'density difference', resolution: 'Known miss → local composition' },
  { id: 'dense-vertical', label: '高密度上下', source: '⿱龜心', description: 'density difference', resolution: 'Known miss → local composition' },
  { id: 'unsupported', label: '未対応IDC', source: '⿾木可', description: 'source-preserving fallback', resolution: 'Unsupported IDC → source preserved' },
];

export function toDisplaySource(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return '';
  if (trimmed.startsWith('⟦') && trimmed.endsWith('⟧')) return trimmed;
  return `⟦${trimmed}⟧`;
}
