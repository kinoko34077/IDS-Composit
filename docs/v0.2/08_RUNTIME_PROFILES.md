# Runtime Layout Profiles

Known Character hitはnative Unicodeを表示する。Known IndexとCHISEの双方で未解決のsupported IDSだけがGeneric Layout Profileを使う。

```text
Known/native
    → native Unicode

Unknown
    → Structural Coverage
    → Generic Layout Profile
    → DOM/CSS composition
```

Profileはpure dataで、最低限operator、role別slot、sampleCount、corpusVersionを持つ。Profile miss・破損時はv0.1 fixed Layout Templateへfallbackし、sourceを失わない。

既知字の個別calibration結果を、その既知字のruntime表示へ直接適用しない。
