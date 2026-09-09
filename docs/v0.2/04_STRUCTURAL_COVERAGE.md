# Structural Coverage

## v0.2.0で対応する14 spatial IDC

|IDC|arity|role|
|---|---:|---|
|`⿰`|2|left, right|
|`⿱`|2|top, bottom|
|`⿲`|3|left, middle, right|
|`⿳`|3|top, middle, bottom|
|`⿴`|2|outer, inner|
|`⿵`|2|outer, inner|
|`⿶`|2|outer, inner|
|`⿷`|2|outer, inner|
|`⿸`|2|outer, inner|
|`⿹`|2|outer, inner|
|`⿺`|2|outer, inner|
|`⿻`|2|first, second|
|`⿼`|2|outer, inner|
|`⿽`|2|outer, inner|

IDC definition is data-driven:

```ts
type IdcDefinition = {
  operator: string;
  arity: number;
  roles: StructuralRole[];
  layoutProfileKey: string;
};
```

`⿾` reflection and `⿿` rotation remain unsupported v0.2.x candidates. Subtraction系も対象外とする。

## Unknown character composition

解決できないIDSでも、supported IDCかつ全childをParserが扱える場合はlocal compositionへ進む。`⟦⿵門日⟧`はsource-only fallbackではなくcomposition対象とする。
