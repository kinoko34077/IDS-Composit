# Resolution Flow

## Phase 0
Resolverは未実装。
```text
⟦IDS⟧
→ Composition
→ DOM
```

## 将来
```text
Input
↓
Unicode相当あり?
├─ YES → native Unicode
└─ NO
    ↓
Registry hit?
├─ YES → registered glyph
└─ NO
    ↓
Composition可能?
├─ YES → composed layout
└─ NO → unresolved/source fallback
```

## 優先原則
`Unicode > Registered Glyph > Composition > Fallback`

## 注意
Composition Engine自身はUnicode存在確認もRegistry lookupもしない。
