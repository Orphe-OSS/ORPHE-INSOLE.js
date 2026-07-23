# ORPHE INSOLE Data Modes

ORPHE INSOLEの通信経路と計測モードを学び、1〜2台の実機で切替・可視化・記録まで試せるexampleです。
画面自身も`InsoleToolkitSession`の名前付きprofileとmeasurement APIを使っています。

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Chromeで次を開きます。Web Bluetoothのsecure contextを保つため、LAN内IPではなく
このMacの`localhost`を使ってください。

```text
http://localhost:8765/examples/data-modes/
```

## 目的から選ぶ

| 目的 | Toolkit profile | 通信 | 主なデータ | 注意 |
|---|---|---|---|---|
| 圧力と姿勢をまず表示 | `realtime-full` | Notify | acc / gyro / press / quat、100 Hz | 低遅延だがlosslessではない |
| 姿勢を高速表示 | `realtime-orientation` | Notify | acc / gyro / quat、200 Hz | pressなし |
| 圧力を高速表示 | `realtime-pressure` | Notify | acc / gyro / press、200 Hz | quatなし |
| Rawと歩行指標を同時利用 | `realtime-full-step` | 2系統のNotify | Full Sensor + Step Analysis | Rawの欠損率も確認する |
| 歩行指標だけ利用 | `step-analysis` | STEP_ANALYSIS Notify | step / stride / pronation | Raw Sensor Valuesは停止 |
| Rawを完全性優先で保存 | `fifo-recording` | Request–response | acc / gyro / press、200 Hz | Stepと排他、停止後にdrain |

Realtimeは低遅延の表示向けです。packetをBLEで取りこぼしても再取得しません。
FIFOはINSOLE内リングバッファからserialを追跡して回収するため、研究記録や後解析に向きます。
停止操作は未回収データのdrainが終わるまで完了しません。Step Analysisはファームウェアが算出した
歩行イベントで、Realtime Rawとは併用できますが、現行ファームウェアではlossless FIFOと排他です。

## アプリへ組み込む

低レベル設定を順番に変更せず、profileを1回で適用します。

```js
buildInsoleToolkit(document.querySelector('#toolkit'), 'INSOLE 01', 0);
const session = getInsoleToolkitSession(0);

// ユーザが接続スイッチから実機を選択した後:
await session.applyProfile('realtime-full-step');
await session.startMeasurement({
  metadata: { participant: 'P001', condition: 'walk' }
});

// 計測する

const result = await session.stopMeasurement();
const rawCsv = insoleToolkitMeasurementToCSV(result, 'raw');
const stepCsv = insoleToolkitMeasurementToCSV(result, 'step');
```

FIFOも同じAPIです。

```js
await session.startMeasurement({
  profile: 'fifo-recording',
  metadata: { participant: 'P001' }
});

// stopMeasurement()はFIFO停止後のdrain完了を待つ。
const result = await session.stopMeasurement();
console.log(result.raw.serial.missing);
```

計測中の`applyProfile()` / `configure()`は`MEASUREMENT_ACTIVE`で拒否されます。
これにより、記録区間の途中で列構成や通信経路が意図せず変わることを防ぎます。
独自構成が必要なら`configure({ streamingMode, sensorDataMode, outputs })`でまとめて変更できます。

## 画面で確認できるもの

- Realtimeのsample / packet周波数、到着間隔、delivery age、serial continuity
- FIFOのlag、dropped、停止後drain、デバイス時刻順へ再構成した全区間波形
- Quaternionの数値と3D姿勢
- Step Analysisのraw packet内訳と完成step row
- 接続断、自動再接続、profile復元までの時間
- 正式計測区間の結果JSON、Raw CSV、Step CSV

ページを開いただけの受信は「ライブプレビュー」です。緑色の計測開始ボタンから
`startMeasurement()`〜`stopMeasurement()`で囲んだ区間だけが、正式な記録と判定の対象です。

## FIFOのHost比較

2台同時FIFOはMac / Web Bluetooth側の同時要求負荷の影響を受けるため、ページは
1台計測を`fifo-single-baseline`、2台計測を`fifo-dual-host-stress`として分けます。
Host差を調べる場合は、同じ実機・電池・距離・計測時間・Chrome条件で
INSOLE 01単体、INSOLE 02単体、2台同時の順に記録してください。
2台だけの欠損を、ただちにToolkit単体の不具合とは判定しません。

通信の完全性と、Step Analysisが算出する歩行指標の妥当性は別の評価対象です。
このexampleの自動判定は取得状態の診断であり、医療的な妥当性を示すものではありません。
