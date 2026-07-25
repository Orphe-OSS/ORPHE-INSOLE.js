# FIFO Recording + Loss Check

`InsoleToolkit.js` の `fifo-recording` profile を使い、INSOLE を**1台または2台（左右同時）**で
**FIFO（端末内バッファ）収録 → drain（未回収データの回収）→ serial連続性の確認 → CSV保存**
までを1ページで試せるexampleです。FIFO を初めて使う方が、Realtime との違い・
FIFO の利点と限界（**端末内バッファ約30秒**）・欠損の見かたを短時間で把握できます。

2台つなぐと**同時に収録**し、デバイスごとに serial 連続性・欠損・lag を独立して表示します。
2台同時はホスト側の Bluetooth 負荷が上がるため**片側だけ欠損することがある**ので、
まず1台で基準を取ってから比べてください（全体判定は悪い側に合わせます）。

ヘッダーの `JA` / `EN` で、説明・状態表示・結果表・グラフ内ラベルを切り替えられます。
URLの `?lang=ja` / `?lang=en` でも指定できます。指定がない場合は、端末のタイムゾーンが
`Asia/Tokyo` なら日本語、それ以外は英語で表示します。

レイアウト・デザイン・i18n の構成は [`examples/step-analysis/`](../step-analysis/) と同じ
example テンプレート（header + control-strip + settings-guide + chart-card +
table-frame + scope-note + code-card）に揃えています。

## Toolkit UI の設定

FIFO収録を使いたいときは、Toolkit UI の歯車を開き、次のように設定してください。

- Data Outputs: `Raw Sensor Data` をON / `Step Analysis` はOFF
- Raw Data Acquisition: `FIFO`
- Realtime Streaming Format: FIFOでは使いません（quaternion は含まれません）

このデモプログラムでは、収録開始時に `fifo-recording` プロファイルへ自動で切り替え、
停止・drain 完了後に Realtime へ戻します。

## RealtimeとFIFOの違い

| 観点 | Realtime（push） | FIFO（pull） |
|---|---|---|
| 送り方 | FWが計測と同時に垂れ流す | 本体に貯め、hostが「serial ○番から○個」と要求して取り出す |
| 取りこぼし | **回収できない** | **再要求で埋められる** |
| 遅延 | 非常に小さい | 数百msごとにバースト到着 |
| quaternion | あり | **なし** |
| Step Analysis | 同時に使える（`realtime-full-step`） | **現行FWでは同時取得しない**（順番に使う） |
| 停止時 | 即終了 | **drain（未回収データの回収）後に完了** |

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

この換算は `tests/fifo-guide-continuity.test.js` が `src/InsoleFifo.js` の定数と
`decodePacket()` の実測フレーム間隔に対して検証しています（定数が変わればテストが落ちます）。

### 運用上の注意

- **30秒以内の短時間計測**は、計測区間の全体を端末内バッファに保持しやすく、安定した記録に向いています。
- **30秒を超える計測も可能**ですが、接続マシンの性能・Bluetooth 環境・他デバイスとの競合・
  タブのバックグラウンド化などにより、**回収速度が生成速度に追いつかないと古いデータが上書きされ、
  回復不能な欠損が発生しえます**。
- **「30秒以内なら絶対に無欠損」という保証ではありません。** 30秒以内でも回収が滞れば欠損し、
  30秒を超えても追いつけていれば欠損しません。
- 長時間計測では、必ず結果表の欠損表示（missing / dropped / timeline）と、
  保存した CSV の中身を確認してください。

### 実機での実測（1台 / Chrome 150 / macOS）

| 台数 | 予定 | デバイス | 収録serial | 収録スパン | maxLag | missing | dropped | 判定 |
|---:|---|---|---:|---:|---:|---:|---:|---|
| 1台 | 30秒 | L | 1327 | 26.5 s (88%) | 299 / 1500 | 0 | 0 | `PASS` |
| 1台 | 60秒 | L | 2144 | 42.9 s (71%) | 1129 / 1500 | 4 | 4 | `FAIL` |
| 2台 | 60秒 | L | 1995 | 62.4 s | **1560 / 1500** | 1123 | 6557 | `FAIL` |
| 2台 | 60秒 | R | 2827 | 56.5 s (94%) | 453 / 1500 | 0 | 0 | `WARN`（60秒超のみ） |

- 1台・60秒: 追従遅れが上限1500の75%まで達し、FWバッファから消えた4 serialが
  `fw_nodata` で回復不能になりました。**lag が 1000 を超えたあたりから欠損が出始めます**。
- **2台・60秒: 片側（L）だけが崩れました。** L は lag が上限1500を超え（1560）、
  `carryover_overflow` と `resync_backlog` を繰り返して missing 1123。
  同時刻の R は missing 0 / dropped 0 でした。**2台同時では片側だけ壊れることがある**ため、
  必ず1台の基準と比べてください。
- この L の `dropped=6557` は収録スパンの serial 数（3118）より大きいです。
  再同期のたびに未回収バックログを再計上する**イベントの累計**だからで、
  実際にCSVから抜けた数は `missing=1123` です（ページでもこの説明を出します）。

いずれも環境依存の実測値であり、どの長さ・台数でも「必ず欠損する / しない」を保証するものではありません。

## 収録スパンは予定時間より少し短くなる（欠損ではない）

停止した時点で端末内に残っていた「**まだ要求していない**」分は収録スパンに含まれません。
drain は *要求済みで届いていない* シリアルを回収するフェーズであり、未要求の新規サンプルは
取りに行かないためです。

実機（30.0 秒指定）では 1325 serial = **26.5 秒分**（88%）が CSV に入りました。
残りの約175 serial は停止時の追従遅れ（lag）分です。

これは `missing`（区間内の抜け）ではなく「区間の末尾が短い」だけなので、
結果表では **収録スパン** という別の指標として表示し、90% を下回ると注意を出します。
きっちり N 秒ぶん確保したい場合は、予定時間を少し長めにして後段でトリミングしてください。

## `dropped` と `missing` を同じ指標として扱わない

| 指標 | 意味 | 取得元 |
|---|---|---|
| `dropped` | 収録中に「もう取り戻せない」と判定された**累計イベント数**（`ring_overflow` / `carryover_overflow` / `fw_nodata` / `resync_backlog` / `stopped_pending`） | `fifo.onDataLoss(info.cumulative)` / `onStopped(info.dropped)` |
| `missing` | **最終CSVの区間**で expected に対して足りなかった serial 数 | `stopMeasurement()` の結果 + 本ページの再計算 |

プレビュー中に確定した分や、あとから再要求で回収された分の数え方が違うため、
両者は一致しないことがあります。**合否は両方が 0 かどうかで判断してください。**

## 表示する値

- **結果表**: 計測時間 / FIFO samples / 最初と最後のserial / expected / received / missing /
  missing rate / **収録スパン** / dropped / drain recovered / drain時間 / 最大lag / CSV保存可否
- **判定バー**: 欠損0かつ30秒以内 → 緑 `PASS` / 欠損あり → 赤 `FAIL` /
  30秒超過またはバッファ逼迫 → 黄 `WARN`（色だけでなくテキストでも表記）
- **Serial continuity timeline**: received を緑、missing を赤で横方向に表示。
  数千 serial でも DOM 要素を作らず、Canvas へ**固定数の bin**（既定240）に集約して描画します。
  bin ごとの missing 合計は再計算した missing と常に一致します（テスト済み）。
- **欠損range**: `1200–1208` のように正確な serial 番号で一覧表示（集約表示でも数値を確認できます）
- **FIFO BATCH グラフ**: 圧力合計と加速度ノルム。FIFOがバッチで届くことが分かります
- **最新sample**: serial / packet_number / gyro / acc / press のテキスト表示
- uint16 の `65535 → 0` wraparound、重複 serial、drain による順不同到着をすべて正しく扱います。

CSV は正式計測区間（開始〜drain完了）の sample だけを含みます。
1 serial packet は4フレーム（5ms間隔）なので **CSV では 1 serial = 4行**です。
欠損を数えるときは行数ではなく serial 番号の連続性を見てください。
ページ側でも保存CSVから欠損数を数え直して画面表示と照合し、結果をイベントログに出します。

## このexampleが使う公開API（FIFOプロトコルはページ側で再実装しない）

```js
buildInsoleToolkit(toolkit, "INSOLE 01", 0, {
  profile: "realtime-full",
  fifo: { startupDelayMs: 1000, drainTimeoutMs: 5000,
          onSamples, onProgress, onDataLoss, onStopped },
});
insoles[0].setup();   // 必須（buildInsoleToolkit は setup() を呼びません）
const session = getInsoleToolkitSession(0);

// FIFO収録（read mode 切替・バッファ消去・ポーリング・再要求はSDKが担当）
await session.startMeasurement({ profile: "fifo-recording", restoreProfile: true });

// drain（未回収データの回収）完了後に resolve する
const result = await session.stopMeasurement();
result.raw.serial;   // { first, last, expected, received, missing, missingRate }

// 正式計測区間だけのCSV
const csv = insoleToolkitMeasurementToCSV(result, "raw");
```

| 参照先 | 役割 |
|---|---|
| [`src/InsoleFifo.js`](../../src/InsoleFifo.js) | FIFO 収集ループ、再要求、drain、`createCheckpoint()` / `summarizeSince()` / `serialsSince()` |
| [`src/InsoleToolkit.js`](../../src/InsoleToolkit.js) | 接続UI、`fifo-recording` プロファイル、`startMeasurement()` / `stopMeasurement()`、`insoleToolkitMeasurementToCSV()` |
| [`./continuity.js`](./continuity.js) | 本ページの判定ロジック（serial連続性・欠損range・timeline集約・30秒判定）。純関数のみで Node からテスト可能 |
| [`./i18n.js`](./i18n.js) | ja / en の表示文言（step-analysis と同じ仕組み） |

## 起動

Web Bluetooth には localhost または HTTPS が必要です。

```bash
cd ORPHE-INSOLE.js
python3 -m http.server 8080
```

Chrome / Edge で次を開きます。

```text
http://localhost:8080/examples/fifo-guide/
```

別マシンの LAN アドレスではなく `localhost` を使ってください。
Firefox / Safari は Web Bluetooth 非対応です。

## 実機テスト

1. タイトル横の `INSOLE 01` をONにして1台接続します（`READY` 表示になります）。
2. 計測時間 `10秒` を選び「収録開始」を押します。`PREPARING` → `RECORDING` → `DRAINING` → `DONE` と進みます。
3. `DONE` になったら判定バーと結果表を確認します（**10秒は欠損0 / 緑 `PASS` を期待**）。
4. `30秒` で同じ手順を実行します（**欠損0 / 緑 `PASS` を期待**）。
5. `60秒` で実行します。バッファガイドが**警告帯**になり、判定は `WARN` または欠損ありの `FAIL` になります
   （実測では `maxLag` が1100超まで伸び、`fw_nodata` で数serialが失われて `FAIL` になりました）。
6. 「FIFO CSV」を保存し、CSVの serial と画面の missing が一致することを確認します
   （ページ側でも自動照合してイベントログに出します）。

7. `INSOLE 02` も接続し、同じ時間で2台同時収録を実行して1台の結果と比べます。

10秒・30秒では欠損0を期待しますが、**無欠損はコード上で保証していません**。
60秒で欠損が出ても不具合ではなく、限界と可視化が正しく表現されていることを確認する項目です。
2台同時で欠損が出た場合も、まず1台の基準と比較してください。

Realtime との実測比較は [`examples/fifo-vs-realtime/`](../fifo-vs-realtime/) も使えます。

## 2台（左右同時）で試す

1. `INSOLE 01` と `INSOLE 02` の両方をONにします（`READY (2台)` になります）。
2. 収録開始すると**両方を同時に**開始し、停止も同時に行って drain 完了を待ちます。
3. 結果表はデバイスごとの列になり、`serial continuity` のグラフもデバイスごとに1本ずつ出ます。
4. CSVは `device_id` 列つきで**1ファイル**にまとまります（デバイスごとに serial 連続性を数え直せます）。
5. 左右は `device_information.mount_position` の bit0 から判定して `INSOLE 01 (L)` のように表示します。
   両方が同じ装着位置として認識された場合は注意を出します（デバイス番号から左右を推測はしません）。

**2台同時で片側だけ欠損したときは、まず同じ条件の1台収録と比べてください。**
ホスト（PC）のBluetooth負荷で欠損することがあり、その場合はインソール個体の問題とは限りません。
結果JSONにはデバイスごとの数値と `deviceCount` が入るので、環境間の比較に使えます。

## テスト

```bash
node tests/fifo-guide-continuity.test.js
node --check examples/fifo-guide/app.js
```

> このページは研究・開発用のexampleです。医療機器ではなく、診断・治療・予防を目的としません。
