# はじめてのFIFO収録（fifo-guide）

ORPHE INSOLE を買ったばかりの方・これから FIFO を使うプログラムを書く方が、
**Realtime と FIFO の違い / FIFO の利点と限界 / 欠損の見かた**を短時間で理解し、
その場で実機を試せる公開サンプルです。

- 対象: **INSOLE 1台**
- 操作: 接続 → 計測時間を選ぶ → 収録開始 → drain（回収）待ち → 結果確認 → CSV保存
- 出力: FIFO CSV（正式計測区間のみ）／結果JSON／イベントログ

> 本サンプルは医療機器ではなく、疾病の診断・治療・予防を目的としていません。

## 起動

Web Bluetooth は `https` または `localhost` が必須です。

```bash
cd ORPHE-INSOLE.js
python3 -m http.server 8765 --bind 127.0.0.1
# → http://localhost:8765/examples/fifo-guide/
```

デスクトップ版 Chrome / Edge で開いてください（Firefox / Safari は Web Bluetooth 非対応）。
別マシンの LAN アドレスではなく `localhost` を使ってください。

## このページが伝えること

| 論点 | 要点 |
|---|---|
| Realtime | FW がデータを垂れ流す（push）。低遅延。**取りこぼしは回収できない**。quat あり |
| FIFO | FW 内部にいったん保存し、**serial 番号を指定して取り出す**（pull）。遅れても再要求で埋められる |
| FIFO Raw の中身 | gyro / acc / 6ch pressure。**quaternion は含まれない** |
| Step Analysis との関係 | 現行FWでは **FIFO Raw と Step Analysis は同時取得しない**。順番に使う |
| drain | stop 後も未回収データを回収してから記録完了になる |
| CSV の行数 | **1 serial packet = 4 フレーム = CSV 4行**。行数と serial 数を混同しない |
| `dropped` と `missing` | 別指標（下記） |

### `dropped` と `missing` を同じ指標として扱わない

| 指標 | 意味 | 取得元 |
|---|---|---|
| `dropped` | 収録中に「もう取り戻せない」と判定された**累計イベント数**（`ring_overflow` / `carryover_overflow` / `fw_nodata` / `resync_backlog` / `stopped_pending`） | `fifo.onDataLoss(info.cumulative)` / `onStopped(info.dropped)` |
| `missing` | **最終CSVの区間**で expected に対して足りなかった serial 数 | `stopMeasurement()` の結果 + 本ページの再計算 |

プレビュー中に確定した分や、あとから再要求で回収された分の数え方が違うため、
両者は一致しないことがあります。**合否は両方が 0 かどうかで判断してください。**

## 約30秒のバッファ限界（根拠と換算式）

ORPHE INSOLE の FIFO バッファが保持できる長さは**約30秒分**です。
これは推測値ではなく、SDK 実装の定数からの換算です。

```text
src/InsoleFifo.js:
  RING_BUFFER_CAPACITY = 1500   # 追従遅れ(lag)がこれを超えた分を回復不能として扱う上限
  NOTIFY_DATA_NUM      = 4      # 1 serial packet に含まれるフレーム数
  decodePacket()                # フレーム間隔は 5 ms（packet_number * 5）

1 serial packet   = 4 frame × 5 ms = 20 ms
保持できる長さ     = 1500 packet × 20 ms = 30,000 ms ≒ 30 秒
（等価: 200 sample/s ÷ 4 sample/packet = 50 packet/s → 1500 ÷ 50 = 30 s）
```

この換算は `tests/fifo-guide-continuity.test.js` が
`src/InsoleFifo.js` の定数と `decodePacket()` の実測フレーム間隔に対して検証しています
（定数が変わったらテストが落ちます）。

### 運用上の注意

- **30秒以内の短時間計測**は、計測区間の全体を端末内バッファに保持しやすく、安定した記録に向いています。
- **30秒を超える計測も可能**ですが、接続マシンの性能・Bluetooth 環境・他デバイスとの競合・
  タブのバックグラウンド化などにより、**回収速度が生成速度に追いつかないと古いデータが上書きされ、
  回復不能な欠損が発生しえます**。
- **「30秒以内なら絶対に無欠損」という保証ではありません。** 30秒以内でも回収が滞れば欠損し、
  30秒を超えても追いつけていれば欠損しません。
- 長時間計測では、必ず本ページの欠損表示（missing / dropped / timeline）と、
  保存した CSV の中身を確認してください。

## 欠損の可視化

- **結果カード**: 欠損0かつ30秒以内 → 緑 / 欠損あり → 赤 / 30秒超過またはバッファ逼迫 → 黄
- **PASS・WARN・FAIL のテキスト表記**も併記（色だけに依存しない）
- **Serial continuity timeline**: received を緑、missing を赤で横方向に表示。
  数千 serial でも DOM 要素を作らず、Canvas へ**固定数の bin**（既定240）に集約して描画。
  bin ごとの missing 合計は再計算した missing と常に一致します（テスト済み）。
- **欠損range**: `1200–1208` のように正確な serial 番号で一覧表示（集約表示でも数値を確認できる）
- uint16 の `65535 → 0` wraparound、重複 serial、drain による順不同到着をすべて正しく扱います。

## 再利用している公開API（FIFOプロトコルはページ側で再実装しない）

```js
buildInsoleToolkit(document.querySelector('#toolkit_placeholder'), 'ORPHE INSOLE', 0, {
  streamingMode: 4,
  sensorDataMode: 'realtime',
  fifo: { startupDelayMs: 1000, drainTimeoutMs: 5000,
          onSamples, onProgress, onDataLoss, onStopped },
});
const session = getInsoleToolkitSession(0);

// FIFO収録（read mode 切替・バッファ消去・ポーリング・再要求はSDKが担当）
await session.startMeasurement({ profile: 'fifo-recording', restoreProfile: true });

// drain（未回収データの回収）完了後に resolve する
const result = await session.stopMeasurement();
result.raw.serial;   // { first, last, expected, received, missing, missingRate }

// 正式計測区間だけのCSV
const csv = insoleToolkitMeasurementToCSV(result, 'raw');
```

| 参照先 | 役割 |
|---|---|
| [`src/InsoleFifo.js`](../../src/InsoleFifo.js) | FIFO 収集ループ、再要求、drain、`createCheckpoint()` / `summarizeSince()` / `serialsSince()` |
| [`src/InsoleToolkit.js`](../../src/InsoleToolkit.js) | 接続UI、`fifo-recording` プロファイル、`startMeasurement()` / `stopMeasurement()`、`insoleToolkitMeasurementToCSV()` |
| [`./continuity.js`](./continuity.js) | 本ページの判定ロジック（serial連続性・欠損range・timeline集約・30秒判定）。純関数のみで Node からテスト可能 |

## 実機での確認手順

1. **1台・10秒** — 欠損0（緑・PASS）を期待
2. **1台・30秒** — 欠損0（緑・PASS）を期待
3. **1台・60秒** — バッファ超過。黄の警告表示になり、欠損が出る場合もある
4. 保存した CSV の serial を数え直し、画面の missing と一致することを確認
   （ページ側でも自動照合し、結果をイベントログに出します）
5. 30秒超過時に警告帯・警告表示が出ることを確認

10秒・30秒では欠損0を期待しますが、**無欠損はコード上で保証していません**。
60秒で欠損が出ても不具合ではなく、限界と可視化が正しく表現されていることを確認する項目です。

## 関連サンプル

- [`examples/fifo-vs-realtime/`](../fifo-vs-realtime/) — 2台同時での通常/FIFO 比較・実測
- [`examples/showcase/`](../showcase/) — FIFO 収録パネルを含む全部入りデモ
- [`docs/ai/`](../../docs/) — センサ仕様・トラブルシューティング
