# Balance Tuner

ORPHE INSOLE の 6ch 圧力 ADC から推定した荷重中心と左右荷重比を、連続音へ変換する sonification example です。

## Modes

- Balance Tuner: 推定中心の左右位置をパン、前後位置を音程に割り当てます。中心から離れるほどビブラートと濁りが増えます。
- Left/Right Harmony: 左右荷重が 50/50 に近いほど協和音、片足へ偏るほど不協和な響きになります。

## Live Test

1. Chrome または Edge で `examples/balance-tuner/` を開きます。
2. 充電された INSOLE を用意します。
3. `Mode 4` または `Mode 3` を選び、`INSOLE 01` / `INSOLE 02` を接続します。
4. 必要に応じて `中心を合わせる` を押します。
5. `Balance Tuner` または `Left/Right Harmony` を押すと音が始まります。

この example は可聴化プロトタイプです。6点 ADC 生値から求めた推定中心を使っており、医療用の重心計測や力学解析ではありません。
