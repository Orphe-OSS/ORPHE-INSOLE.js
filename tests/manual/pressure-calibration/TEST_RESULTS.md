# 校正値取得テストの記録（2026-10-02）

対象: `codex/pressure-calibration`、校正SDK実装 `689ada4`。

## 実機検証: 未完了

localhostでテストページを起動し、Web Bluetooth利用可能・secure contextであることを確認しました。
browser-useからChromeの接続操作を試しましたが、端末選択前でブラウザの操作応答が停止しました。
headed / headlessで同様の停止を観測し、操作要求のタイムアウト後に当該ブラウザセッションを終了しました。
端末選択イベントも取得できず、機器名・FW・6ch係数・実機応答バイト列は取得できていません。

**この結果から、校正取得の成否、充電中のBLE接続可否、FWの校正対応は判定できません。**
ブラウザの応答停止の原因（OS権限・端末選択UI等）も未確定です。
手元のChromeで本ページを開き、端末を選択して実測する必要があります。

## ブラウザUI + BLEモック検証: 通過

実際のページと配布SDKを読み込み、BLE境界だけをモックに置き換えました。
`begin()`、`getPressureCalibration()`、校正応答処理・換算は実装をそのまま使用しています。
これは実機での取得証拠ではありません。モック端末名は `INS-MOCK-0` / `INS-MOCK-1` です。

- 自動取得: 6chの有効係数を取得しオブジェクトに保持。
- 通常通知: ADC `[10,11,12,13,14,15]` → モック係数で荷重 `[21,24,27,30,33,36]`。
- 手動再取得: method=manualと取得所要時間・受信バイト列を記録。
- 2台接続: 校正値を独立保持。
- 部分応答: 2ch受信の試行を成功にせずnull。他端末の校正値は維持。
- 無応答: null、onErrorなし、接続と圧力通知を維持し既定換算へ復帰。
- 失敗後の再取得: 6ch取得に復帰。
- 切断: 校正値をnullにし、他端末は接続継続。
- 再接続: 自動取得で6chを再保持。
- JSON保存: 保存ボタンが生成するBlobに両端末の試行・受信バイト列が含まれることを確認。

## コード確認

- 新規ページのJavaScript構文確認: 通過。`test:syntax`にも追加。
- `npm run test:unit`: 全テスト通過。
- `npm run test:types`: TypeScript 5.9.3を既存の別プロジェクトから借用して通過。
- `node scripts/build-dist.js --check` / `node scripts/build-landing.js --check`: 同期済み。
- 新規ページのlint: ESLint 9.39.5（借用）でerror 0。
- 全体lint: 借用環境（ESLint 9.39.5 / globals 14.0.0）では既存の
  `examples/showcase/viz-3d.js:142` の `model`、`src/ORPHE-INSOLE.js:1309` の
  `BluetoothDevice` にno-undefが出るため未通過。校正実装前からある参照です。
  lockfile指定の依存はインストールしていないため、その環境でのlintは未確認。
- この追加作業ではsrc・distに変更なし。依存・lockfileの変更なし。

次の操作はREADMEに従った実機接続と、保存したJSONによる6ch取得結果の確認です。
