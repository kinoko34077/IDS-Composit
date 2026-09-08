export type ParseErrorKind =
  | 'empty'
  | 'unknown-operator'
  | 'missing-child'
  | 'trailing-input';

export type ParseError = {
  kind: ParseErrorKind;
  index: number;
  message: string;
};
