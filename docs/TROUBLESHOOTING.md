# ORPHE INSOLE トラブルシューティング

接続・データ受信のトラブルを上から順に切り分けるためのガイドです。

## 0. まず debug ログを有効にする

```javascript
insole.debug = true;  // 接続手順の詳細が console.info に出る
```

エラーは `insole.onError = (e) => console.error(e)` で受け取れます（既定でも console に出ます）。

## 1. デバイス選択ダイアログ（chooser）に INSOLE が出ない

- **INSOLE の電池残量を確認**。バッテリー切れが最多原因。充電して数分待つ
- 他のタブ・他のPC・スマホアプリが**既に接続していないか**（BLE は1接続のみ）
- ページが **HTTPS または http://localhost** で配信されているか（`file://` や http の LAN IP では Web Bluetooth 自体が使えない）
- OS の Bluetooth が ON か。macOS はシステム設定で Chrome に Bluetooth 権限が必要
- それでも出ない場合は `chrome://bluetooth-internals` でデバイスがスキャンできているか確認

## 2. ブラウザが対応していない

| ブラウザ | Web Bluetooth |
|---|---|
| Chrome（デスクトップ / Android） | ✅ |
| Edge / Opera | ✅ |
| **Firefox** | ❌ 非対応 |
| **Safari（macOS / iOS 全ブラウザ含む）** | ❌ 非対応（iOS は Chrome でも不可） |

`navigator.bluetooth` が `undefined` の環境では接続できません。アプリ側でフィーチャー検出して案内を出してください。

```javascript
if (!navigator.bluetooth) {
  alert('このブラウザは Web Bluetooth 非対応です。Chrome / Edge をご利用ください。');
}
```

## 3. 接続はされるがデータが来ない

- `insole.setup()` を `begin()` の**前に**呼んだか（最頻の実装ミス）
- `gotData` をオーバーライドしていないか。**`gotData` を上書きすると他のすべての got\* コールバックが停止**します（TERMINALモード）。デバッグ後は必ず外す
- streaming mode と受信データの対応を確認: mode 3 では `gotQuat`/`gotEuler` は来ない。mode 1 では `gotPress` は来ない
- `gotEuler` だけ来ない場合: quaternion.js（CDN からの実行時ロード）が読み込めていない可能性。オフライン環境では発生する

## 4. 記憶したデバイスに自動接続しない（毎回ダイアログが出る）

- デバイス記憶による無ダイアログ再接続には `navigator.bluetooth.getDevices()` が必要（Chrome では既定で有効）。無効な環境では選択ダイアログへ自動フォールバックします
- 別の INSOLE に切り替えたいときは `insole.selectBluetoothDevice()`（強制ダイアログ）または `insole.forgetLastBluetoothDevice()`

## 5. 自動再接続が走らない

- `begin()` に `{ autoReconnect: true }` を渡したか
- `insole.stop()` / `insole.reset()` は**手動切断の意思表示**とみなし自動再接続も解除します。切断検知だけしたい場合は `onDisconnect` を使う
- 再接続の進行は `onReconnectAttempt` / `onReconnectSuccess` / `onReconnectFailed` で観測できます
- 間隔・回数は `begin()` の `reconnectIntervalMs`（既定 3000）/ `reconnectMaxAttempts`（既定 120）で調整

## 6. lostData が頻発する

- 数件/分程度のパケット欠損は BLE では正常範囲
- stopNotify → startNotify / streaming mode 切替の直後に数件カウントされるのは仕様（serial 番号が飛ぶため）
- 継続的に大量発生する場合: 距離・遮蔽物・2.4GHz 干渉（Wi-Fi/USB3）を疑う。`gotBLEFrequency` で実測レートも確認
- 検証には `examples/device-test/` の実機チェックページが使えます

## 7. タブが固まる・チャートが重い

100Hz のコールバック内で DOM 更新や `chart.update()` をしていないか確認。
データはバッファに溜め、描画は `requestAnimationFrame` で 30fps に間引きます
（[CLAUDE.md](../CLAUDE.md) の Pattern 5、実装例は `examples/VISUALIZE`）。

## 8. 実機がない・実機なしでデバッグしたい

`OrpheInsoleSimulator`（`src/InsoleSimulator.js`）が `OrpheInsole` と同じコールバック面で
合成データ（歩行・静止・重心揺れ）を再生します。README の「実機がない場合」を参照。

---

解決しない場合は [GitHub Issues](https://github.com/Orphe-OSS/ORPHE-INSOLE.js/issues) へ。
`insole.debug = true` のログと、ブラウザ / OS / INSOLE の FW バージョンを添えてください。
