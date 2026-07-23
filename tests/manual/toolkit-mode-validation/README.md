# Toolkit Data Mode Validation

`InsoleToolkitSession` のデータ取得モードを、左右の実機で手動検証するためのローカル専用ページです。
公開Examplesにはリンクせず、開発時の受け入れ確認に使います。

```bash
python3 -m http.server 8765
```

Chromeで次を開きます。

```text
http://localhost:8765/tests/manual/toolkit-mode-validation/
```

確認プリセット:

1. Realtime Format 1
2. Realtime Format 3
3. Realtime Format 4
4. FIFO Raw
5. Step Analysis only
6. FIFO Raw + Step Analysis

Realtime/FIFOの通信品質は、各実機についてpacket/sample周期、到着間隔、serial continuity、
FIFO lag/dropped/drainを分けて確認します。Step Analysisはnotify packetと完成step rowを分けて表示します。
切断・再接続は、計測中に実機を通信圏外へ移動して観測します。

## 実機確認の流れ

1. INSOLE 01 / 02を接続し、L/Rバッジとデバイス名が別々であることを確認する。
   接続直後はRaw/Stepのライブプレビューが表示される。正式なHz・欠損集計は「計測開始」後だけを対象にする。
2. プリセットを選ぶと接続中の実機へ即時適用される。各カードの「実機状態」とイベントログで
   Realtime/FIFO、Raw/Stepが目的どおりか確認してから計測を開始する。
3. Realtime Format 1 / 3 / 4を各30秒計測する。期待するフィールドの取得率、実効sample Hz、
   packet Hz、P95到着間隔、delivery age、serial missingを左右別に確認する。
   Format 1 / 4ではQuaternion値と3D靴モデルが動き、Format 3では「Quaternionなし」になることも確認する。
4. FIFO Rawを30秒以上計測して停止する。停止時に自動でRealtimeへ戻るまで待ち、
   `FIFO stop / drain`、`dropped`、`drain recovered`、serial continuityを確認する。
5. Step Analysis onlyを選び、数歩動かしてStep notifyと完成step rowを確認する。
   settle後にSENSOR_VALUESが届いた場合は`Raw停止`が警告になる。
6. FIFO + Stepを選び、Rawの連続性とStep notifyが同じ計測区間で継続することを確認する。
7. 各プリセットの計測中に片方ずつ通信圏外へ移動し、戻した後の再接続成功、
   Toolkit設定復元、最初の期待データまでの時間を確認する。
8. 結果JSONと、必要に応じてFIFO / Step CSVを保存する。
9. 問題があれば「イベントログをコピー」を押し、接続・設定・5秒ごとの左右別進捗・最終判定を共有する。

自動判定のsample Hzはnominal値の60〜135%を通常範囲として扱います。電波環境やブラウザ負荷の
影響を受けるため、`要確認`は即時の機能不良判定ではなく、左右差・繰り返し結果・保存データを
確認するための目印です。

結果JSONはページ上の全runを保持します。FIFO / Step CSVは各モジュールの直近セッションを
保存するため、再接続を含むrunの区間横断比較には結果JSONと画面のserial履歴を併用してください。
