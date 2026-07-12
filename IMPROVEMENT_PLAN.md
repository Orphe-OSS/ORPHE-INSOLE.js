# ORPHE-INSOLE.js 改善プラン

作成日: 2026-07-05 / 対象: v1.1.0 (main, 42bf866) / ステータス: **分析のみ・コード未変更**

---

## 1. 現状理解

### 1.1 構造

| 領域 | 実態 |
|---|---|
| コアSDK | `src/ORPHE-INSOLE.js`（1,741行・単一ファイル・IIFE + CJS export）、`src/InsoleToolkit.js`（355行・Bootstrap依存の接続UI） |
| 配布 | `dist/orphe-insole(.min).js` を**コミットして** jsDelivr `@latest` で配信。npm publishなし、ESMなし |
| examples | 11個（VISUALIZE / showcase / sensor-dashboard / sensor-dashboard-FSRvisualize / balance-tuner / balance-sway / hula-motion-sonifier / terminal / UDON_fsr_20250724 / p5.ORPHE.FSR_visualise_0327_submit / assets） |
| tests | Node素朴assert 4本（parser / stability / coexistence / hula-detector）+ balance-tuner用1本。フレームワークなし |
| docs | JSDoc生成（clean-jsdoc-theme）、`docs/ai/PRESSURE_RECIPES.md`（252行・秀逸）、`docs/README.md` は**1行のみ** |
| 型 / lint / CI | `types/`・`lib/`・`.d.ts`・ESLint・tsconfig・CI設定 **すべて不在** |
| AGENTS.md | 存在する（Codex用開発ルール。CLAUDE.md とほぼ同内容の理想論で、実リポジトリ状態と乖離：`npm run lint`/`type-check`/`npm start` は存在しない） |

### 1.2 強み（守るべき資産）

- **パーサが純関数として分離済み**（`parseInsoleSensorValues`, src/ORPHE-INSOLE.js:131-267）。BLEなしでテスト可能で、実際に `tests/insole-parser.test.js` が回帰を守っている。
- **CORE.js との共存設計が厳密**。IIFE化・`Orphe` エイリアスの条件付き公開（:1713-1729）を `tests/insole-coexistence.test.js` が vm 隔離環境で検証。これは他OSSにない優れた資産。
- **v1.1.0 の接続安定化**（デバイス記憶・自動再接続 :640-840）に回帰テストあり（`tests/insole-stability.test.js`）。
- 新しめの examples（VISUALIZE / showcase）は **rAFバッファ + 30fps描画スロットリング**を正しく実装。showcase には**デモ再生（合成歩行データ + CSV再生）**があり、シミュレーターの原型が既にある（`examples/showcase/demo-data.js`）。
- `docs/ai/PRESSURE_RECIPES.md` はキャリブレーション・接地ヒステリシス・CoP・可聴化・アンチパターンまで揃った実装ガイドで、SDK化の設計書としてそのまま使える。

### 1.3 弱み（要約）

- SDK本体にバグ・未実装APIが残る（§2.1）。センサデータの**検証・キャリブレーション層がSDKに存在せず**、各exampleが同じ計算（CoP・レイアウト・接地判定）を4回コピペ実装（§2.2）。
- 型定義・ESM・CI・lintゼロ。「SDK」を名乗るための土台が未整備（§2.5）。
- ドキュメントの入口が壊れている（docs/README.md 1行、README のコード例のミスラベル、CLAUDE.md の examples 一覧が古く showcase / balance-sway / UDON を含まない）。

---

## 2. 主要課題

### 2.1 SDK/API設計

| # | 課題 | 場所 |
|---|---|---|
| A1 | **`setup(names, {})` でクラッシュ**。`options.interpolation` が無いと `this.interpolation = undefined` → 次行の `setSize(undefined.max_consecutive_missing)` で TypeError | src/ORPHE-INSOLE.js:537-542 |
| A2 | **単一 `dataCharacteristic` スロットの競合**。connectGATT が characteristic を1変数に上書きするため、SENSOR_VALUES 通知中に `getDeviceInformation()` を呼ぶと `dataCharacteristic` が DEVICE_INFORMATION に差し替わり、以後の `stopNotify()` が誤った characteristic に作用する | :310, :1035-1081 |
| A3 | **serial_number の uint16 wraparound**。65535→0 で `diff != 1` となり `lostData` が誤発火。ギャップ検出ロジックが gotData 経路(:1340)と通常経路(:1374)に重複実装 | :1329-1358, :1371-1380 |
| A4 | **タイムスタンプ設計**: header 55/56 は packet 内全サンプルが同一 `t_start`（200Hz でも4サンプル同時刻）→ 歩行解析の時間分解能が失われる。かつ「今日の日付+デバイス時刻」方式(:114-121)は**日付跨ぎで約24hジャンプ** | :114-121, :209-261 |
| A5 | **未実装・呼ばれないAPIの公開**: `interpolation` オプション（実体は空のifブロック :1343-1345）、`gotDelta`/`this.delta`（どこからも計算・呼出なし :418, :1587）、STEP_ANALYSIS系 got* 15個（FW未対応と注記はあるが型もツールもないため利用者が気づけない） | 各所 |
| A6 | **実行時CDNスクリプト注入**: import時に ORPHE-CORE.js リポジトリの `@main`（可変ref）から quaternion.js / float16.min.js を自動ロード。SRIなし・オフライン不可・**float16はINSOLEコードで未使用**。Quaternion 未ロード中は `gotEuler` が黙って発火しない | :17-45, :1408-1419 |
| A7 | **エラーモデル不統一**: 文字列エラー（`"No Bluetooth Device"` :1044,:1199）と Error オブジェクト混在、既定 on* コールバックが console.log 直書き(:1665-1702)、`_reportError` + rethrow の二重報告 | 各所 |
| A8 | 型の不安定さ: `device_information` が `''`(string) 初期化→接続後 object(:359)。`OrpheInsole._instances` が増える一方でSPAリロードでリーク(:343-344)。`setup()` の press 履歴だけ setSize 漏れ(:538-542) | 各所 |
| A9 | 接続タイムアウトなし（`gatt.connect()` がハングし得る）、接続状態が `isConnected()` の bool のみで `connecting / reconnecting` を問い合わせ不可（Toolkitは独自管理） | :1054, :1186-1191 |
| A10 | 型定義（.d.ts）なし・ESMなし・`jsdoc` が `dependencies` に入っており（package.json:32-34）npm利用者に脆弱な推移的依存（lodash等 npm audit 6件）を引き込む | package.json |

### 2.2 センサーデータ処理

- **検証層ゼロ**: `press.values` は無検証で素通し。uint16 飽和（65535張り付き）、断線chの0固定、長さ!==6、NaN いずれも検出不可。AGENTS.md / CLAUDE.md は「圧力データの検証は必須」と定めるのに**SDKに実装がない**。
- **キャリブレーションAPIなし**: PRESSURE_RECIPES.md に手順は書かれているが、全アプリが自前実装。単位は ADC 生値のみで、example 間で閾値スケールが不整合（hula-detector `contactPressure=40` vs UDON メモの「0.8〜4.0N」— 単位系が別物）。
- **共通計算の4重コピペ**（SDK昇格候補・調査済み）:
  - CoP計算: `examples/balance-tuner/balance-tuner.js`、`examples/balance-sway/balance-sway.js:344-366`、`examples/hula-motion-sonifier/hula-detector.js:124-129`、`examples/showcase/viz-pressure.js:75-85`
  - 6chセンサレイアウト座標: balance-tuner.js:33-40 / balance-sway.js:233-240 / hula-detector.js:63-70 / showcase/viz-pressure.js:9-16（4ファイルで同一座標セットを重複定義）
  - 左右鏡像変換（`side === LEFT ? 1-x : x`）: 3箇所
  - 接地判定ヒステリシス: hula-detector / UDON / PRESSURE_RECIPES で三様
- **履歴管理**: `FixedSizeArray(4)` 固定で記録用途に使えず、CSV記録は showcase / hula が別々に実装。
- **左右判定**: `mount_position` bit0 のマッピングは Toolkit にしかなく、素のSDK利用者は生bit演算が必要。

### 2.3 可視化・Chart.js

- VISUALIZE / showcase は模範的（バッファ + rAF 30fps + 履歴上限 100-200点 + `chart.update()` 一括）。一方 **sensor-dashboard-FSRvisualize は受信毎（100Hz）にDOM更新**しており重い。
- チャート供給パターン（ChartFeed 相当）が各example内の私有実装で、共有ヘルパーがない。CLAUDE.md の「100ms間隔 + `chart.update('none')`」規約と実装（33ms + `update()`）が微妙に不一致。
- デモ用途と実用用途の分離は showcase の LIVE/DEMO 切替が唯一。

### 2.4 通信層（Web Bluetooth / WebSocket）

- 再接続戦略は良い。ただし §2.1 A9 のタイムアウト欠如、`onReconnectAttempt` 系と `onDisconnect` の発火順序がドキュメント化されていない。
- Web Bluetooth 非対応ブラウザ（Safari/Firefox/iOS）への**フィーチャー検出とユーザー向け説明文がSDKにない**（`navigator.bluetooth` undefined で即例外）。
- WebSocket は SDK スコープ外で examples にも参照実装なし。`wss://` 前提・再接続・状態通知のリファレンスが存在せず、AGENTS.md のWebSocket規約は現状**根拠となるコードがない**。
- **`examples/UDON_fsr_20250724/measurement-server` はソース不明の macOS arm64 バイナリ実行ファイル（59MB）がそのままコミットされている**。OSSリポジトリとして供給網・ライセンス・リポジトリ肥大の三重の問題（要除去）。
- XSS: `InsoleToolkit.js` の `ITbuildElement` が第2引数をそのまま `innerHTML` に代入（src/InsoleToolkit.js:346-348）。`buildInsoleToolkit(parent, title, ...)` の **title が innerHTML 経由**（:55）なので、titleに外部入力を渡すアプリでXSS可能。

### 2.5 テスト・品質

- CI・ESLint・型チェック・カバレッジ**なし**。`npm test` は `&&` 連結の一本鎖（package.json:16）で、1つ失敗すると後続が見えない。showcase / balance-sway / VISUALIZE のJSは `node --check` 対象外。
- E2Eなし。BLEモックはテスト内に散在し共通化されていない。dist はコミット運用なのに **src↔dist の同期を検証する仕組みがない**（ビルド忘れ配信事故のリスク）。

### 2.6 ドキュメント

- `docs/README.md` が1行 → 生成APIドキュメントのランディングが空。
- README.md: Getting Started のコードブロックが ```javascript なのに中身はHTML。トラブルシューティング（chooser にデバイスが出ない / getDevices 無効環境 / HTTPS必須 / Bluetooth権限）不在。
- CLAUDE.md の examples 対応表が古い（showcase / balance-sway / UDON / FSRvisualize 不記載）。PRESSURE_RECIPES.md が `docs/ai/` に埋もれ README から未リンク。
- センサ仕様書（chレイアウトのモデル差・ADCスケール・mount_position ビット定義・packetフォーマット50/55/56）が README の断片とコードコメントに分散。
- balance-sway 等は医療隣接（重心動揺計風）だが、**「医療機器ではない/診断に使わない」旨の注意書きが統一されていない**。

---

## 3. 改善ゴール

**短期（〜2週間）: 「壊れない・嘘をつかないSDK」**
P0バグ（setup クラッシュ・wraparound・characteristic競合）をゼロにし、CI + lint + .d.ts で回帰を機械的に止める。未実装APIはドキュメントと型で「使えない」と明示。実機なしで全exampleを検証できるシミュレーターを整備。

**中期（〜1ヶ月）: 「圧力データを正しく扱える唯一のSDK」**
検証・キャリブレーション・CoP・接地検出を `InsoleUtils`（仮）としてSDKに昇格し、examples のコピペを解消。PRESSURE_RECIPES.md を実装付きドキュメントに昇格。エラー/接続状態モデルを整理し、研究・営業デモで落ちない品質に。

**長期（1〜3ヶ月）: 「臨床・研究に出せる配布物」**
npm publish + ESM/型のデュアル配布、Playwright E2E、記録（CSV/JSONL）標準化、WebSocketリレー参照実装、医療用途向け注意書きの統一。TypeScript 移行は JSDoc `@ts-check` → 段階的に。

---

## 4. 優先度付きバックログ

凡例: 各項目 = 目的 / 変更対象 / 実装方針 / 影響範囲 / リスク / 検証 / 完了条件

### P0（今すぐ・バグと安全網）

**P0-1: `setup()` の options 正規化クラッシュ修正**
- 目的: `setup(names, {})` や部分 options での TypeError を根絶
- 対象: src/ORPHE-INSOLE.js:528-555
- 方針: `const interp = { enabled:false, max_consecutive_missing:1, ...(options?.interpolation ?? {}) }` でマージ。press 履歴の setSize 漏れも同時修正
- 影響: setup() 利用の全コード（挙動は既定値補完のみ＝互換）
- リスク: 低。既存の正常系は不変
- 検証: tests/insole-parser.test.js に部分options 3ケース追加
- 完了条件: `setup()`, `setup(names)`, `setup(names,{})`, `setup(names,{interpolation:{enabled:true}})` 全部通る

**P0-2: serial_number wraparound 対応 + ギャップ検出の一本化**
- 目的: 65535→0 での `lostData` 誤発火防止、重複ロジック排除
- 対象: src/ORPHE-INSOLE.js:1329-1358, 1371-1380
- 方針: `diff = (curr - prev + 65536) % 65536; if (diff !== 1) lostData(...)` を私有メソッド `_checkSerialGap()` に抽出し両経路から呼ぶ。`serial_number === 0` が falsy 扱いされる初期化バグも `=== undefined` 判定に修正
- 影響: lostData 利用者（誤発火が減る方向のみ）
- リスク: 低
- 検証: wraparound 境界のユニットテスト（65534→65535→0→1 で発火なし、65535→1 で発火）
- 完了条件: 境界テスト green、実機で長時間ストリーミングして誤発火ログなし

**P0-3: characteristic を UUID 別に保持（read-during-notify 競合修正）**
- 目的: 通知中の `getDeviceInformation()` / `syncCoreTime()` で通知制御が壊れる問題の解消
- 対象: src/ORPHE-INSOLE.js:310, 1035-1081, 1139-1185
- 方針: `this.dataCharacteristic` → `this._characteristics = {}`（uuid名→characteristic）。`startNotify/stopNotify/read/write` は自分のUUIDのエントリのみ参照。既存プロパティ `dataCharacteristic` は最後に触った characteristic を指す getter として残す（互換）
- 影響: 内部のみ。公開APIシグネチャ不変
- リスク: 中（接続フローの中核。自動再接続との相互作用に注意）
- 検証: tests/insole-stability.test.js にモックGATTで「notify中に read → stopNotify が SENSOR_VALUES に効く」テスト追加。実機で mode変更・battery読取を通知中に実行
- 完了条件: 新旧テスト全green + 実機確認チェックリスト通過

**P0-4: CI導入（GitHub Actions）**
- 目的: test/build/audit の自動化。dist 同期忘れの検出
- 対象: `.github/workflows/ci.yml`（新規）
- 方針: push/PR で `npm ci → npm test → npm run build → git diff --exit-code dist/`（dist乖離検出）+ `npm audit --omit=dev` を warning 表示。Node 18/20/22 マトリクス
- 影響: リポジトリ運用のみ。ランタイム変更ゼロ
- リスク: なし
- 検証: わざと dist を古くしたPRで fail することを確認
- 完了条件: main と全PRでバッジ green

**P0-5: ESLint（flat config）+ `npm test` 分割**
- 目的: 未定義変数・デッドコードの機械検出、テスト出力の可読化
- 対象: `eslint.config.js`（新規）、package.json scripts
- 方針: `eslint:recommended` + browser/node globals。既存コードは warning 開始で段階的に error 昇格。scripts を `test:syntax` / `test:unit` / `lint` に分割し `test` は全部呼ぶ
- 影響: 開発フローのみ
- リスク: 低（autofix は当てず、まず可視化）
- 検証: CI で lint ジョブ green
- 完了条件: error 0 / warning 一覧が issue 化されている

**P0-6: 手書き型定義 `types/orphe-insole.d.ts` + package.json 衛生化**
- 目的: TS/VSCode 利用者への型提供。未実装API（STEP_ANALYSIS系, gotDelta）を `@deprecated`/コメントで型レベル明示
- 対象: `types/`（新規）、package.json（`"types"` 追加、`jsdoc` を devDependencies へ移動）
- 方針: ランタイム無変更の宣言のみ。`OrpheInsole` / callbacks / `PressSample` / `DeviceInformation` / begin options を定義。`tsc --noEmit` で d.ts 自体を検証するスクリプト追加
- 影響: npm メタデータのみ
- リスク: 低（`dependencies` 変更は npm 利用者に影響するが、jsdoc をランタイムで require していないことは確認済み）
- 検証: サンプルTSファイルが型チェックを通る/誤用がエラーになる
- 完了条件: `npm i` 後に VSCode で補完が効く

### P1（2週間以内・価値の中核）

**P1-1: `OrpheInsoleSimulator`（実機なし開発の要）**
- 目的: 実機ゼロで全example・E2Eを動かす
- 対象: `src/InsoleSimulator.js`（新規）。種は `examples/showcase/demo-data.js`（合成歩行 + CSV再生が実装済み）と balance-* の `generateDemoFrame()`
- 方針: `OrpheInsole` と同一の公開面（`setup/begin/stop/got*/on*/device_information`）を持つクラスとして抽出。歩行/静止立位/左右差の3プリセット + CSV再生。`buildInsoleToolkit` に `{simulator:true}` オプション
- 影響: 追加のみ。既存API不変
- リスク: 低。ただし「シミュレータで動く≠実機で動く」の明示が必要（README注意書き）
- 検証: showcase を simulator 経由に差し替えても表示同一。Nodeでも動く（timer駆動）ことをユニットテスト
- 完了条件: 全example が実機なしで目視確認可能、READMEに手順記載

**P1-2: `InsoleUtils`（検証・キャリブレーション・CoP・接地検出のSDK昇格）**
- 目的: 4重コピペ解消と「検証必須」規約の実体化
- 対象: `src/InsoleUtils.js`（新規・opt-in、コアは変更しない）
- 方針: PRESSURE_RECIPES.md と balance-sway 実装を正とし、以下を純関数/小クラスで提供:
  - `validatePress(press)` → `{ok, flags:[SATURATED_CH, STUCK_CH, BAD_LENGTH, NOT_FINITE]}`（uint16飽和・0張り付き・長さ検査）
  - `PressureCalibrator`（無負荷/全体重の2点サンプリング→0..1正規化。ADC生値は物理量でないことをJSDocに明記）
  - `SENSOR_LAYOUT` 定数 + `mirrorForSide(layout, side)` + `computeCoP(values, layout)` → `{x,y,load,isValid}`
  - `ContactDetector`（ON/OFFヒステリシス + 最小接地時間、イベント `footDown/footUp`）
  - `sideFromMountPosition(mount_position)` → `'left'|'right'` + 足背/足底
- 影響: examples 4本の書き換え（P1-3）。コアSDKは無変更
- リスク: 中。チャネル物理配置のモデル差 → レイアウトを引数化し既定値に現行値、リマップ層を仕様として明記
- 検証: 全関数に Node ユニットテスト（エッジ: 全ch 0 / 全ch 65535 / NaN / 5ch配列）。balance-sway の出力が置換前後で一致するゴールデンテスト
- 完了条件: balance-tuner / balance-sway / hula / showcase が InsoleUtils を参照しコピペ削除、テスト green

**P1-3: examples の統一整備 + 例マトリクス**
- 目的: 「初心者がすぐ動く」「研究/営業デモで安定」の導線
- 対象: examples/README.md（新規: 目的×必要デバイス×確認方法の表）、sensor-dashboard-FSRvisualize（rAFスロットリング化 + グローバル整理 app.js:4-14）、p5.ORPHE.FSR_visualise_0327_submit（ORPHE-CORE.jsコピー同梱の旧例 → `examples/archive/` へ移動 or 削除）、UDON（**59MBのバイナリ `measurement-server` をリポジトリから除去**。必要ならソース公開 + GitHub Releases 配布へ。git履歴からの削除は別途判断）
- 方針: 全example冒頭に「目的/必要機材/実機なし確認方法/免責」ヘッダを統一。simulator 対応を明記
- 影響: examples のみ。URLが変わる例は旧パスにリダイレクトhtmlを置く
- リスク: 低（GitHub Pages のリンク切れに注意）
- 検証: `node --check` 対象を全JSに拡大、リンクチェッカーをCIに追加
- 完了条件: マトリクスから全例に到達でき、全例が実機なしで少なくともデモモード動作

**P1-4: エラー/接続状態モデルの整理（後方互換）**
- 目的: アプリが接続状態をUIに出せるように
- 対象: src/ORPHE-INSOLE.js（A7, A9）
- 方針: 文字列エラーを `Error`（`error.code = 'NO_DEVICE' | 'ALREADY_DISCONNECTED' | ...`）に統一（メッセージ文字列は既存互換維持）。`get connectionState()` → `'disconnected'|'connecting'|'connected'|'reconnecting'` を追加。`begin()` に `connectTimeoutMs`（既定なし=現状維持）。既定 on* の console.log は `this.debug` 時のみに（**挙動変更なので CHANGELOG 明記**）
- 影響: onError で文字列比較しているアプリ（examples内 grep で確認済みゼロ）
- リスク: 中（ログ抑制は「動かなくなった」誤認を招き得る → READMEのトラブルシューティングで debug 案内）
- 検証: stability テスト拡張 + Toolkit の再接続バッジが connectionState 参照でも同挙動
- 完了条件: 状態遷移図が docs に載り、テストが遷移を検証

**P1-5: 外部依存の健全化（quaternion / float16）**
- 目的: `@main` 直リンクの供給網リスクと未使用ロードの排除
- 対象: src/ORPHE-INSOLE.js:17-45
- 方針: float16 ロード削除（**未使用確認済み**）。quaternion.js はバージョン固定タグ + SRI付きでロード、かつ「同梱 or 自前euler変換（数式は既知）」を比較検討。未ロード時に gotEuler が発火しない現仕様を JSDoc へ明記
- 影響: euler利用者。CDN障害時の挙動が改善
- リスク: 中（quaternion.js の toEuler 規約と自前実装の一致検証が必要）
- 検証: 既知クォータニオン→euler のゴールデンテスト
- 完了条件: 外部 `@main` 参照ゼロ

**P1-6: ドキュメント基盤の再建**
- 目的: 入口の破損を直し、実機なし開発と医療隣接用途の注意を明文化
- 対象: README.md、docs/README.md、`docs/TROUBLESHOOTING.md`（新規）、`docs/SENSOR_SPEC.md`（新規）、CLAUDE.md
- 方針:
  - README: Getting Started のコードブロック言語修正（```javascript→```html）、examples マトリクスへのリンク、PRESSURE_RECIPES.md への導線、「実機がない場合」節（simulator）
  - TROUBLESHOOTING: chooser に出ない / HTTPS必須 / `getDevices()` 無効環境 / Safari・Firefox非対応 / 再接続が走らない / `insole.debug = true` の使い方
  - SENSOR_SPEC: packet 50/55/56 のレイアウト、ADC生値の意味（**物理量ではない**）、mount_position ビット定義、モデル別chレイアウト差とリマップ方針
  - 医療注意書きテンプレ:「本ライブラリ・デモは医療機器ではなく、診断・治療目的での使用を意図していません」を balance-sway / showcase / README に統一挿入（断定的な医学表現を避けるガイドライン付き）
  - CLAUDE.md の examples 表を現状（11例）に同期
- 影響: ドキュメントのみ
- リスク: なし
- 検証: リンクチェッカー（CI）、新規メンバーによる素読レビュー
- 完了条件: 上記ページが存在し README から2クリック以内で到達

### P2（1ヶ月〜・SDKとしての完成度）

**P2-1: ESM対応 + npm publish**
- 目的: `import { OrpheInsole } from 'orphe-insole'` を可能に
- 対象: package.json（`exports` map）、ビルド（terser 2出力 or Rollup導入）、`dist/orphe-insole.esm.js`
- 方針: 現行 IIFE/グローバル版は不変で維持し、ESM を追加出力。npm publish は `1.2.0-beta` から
- 影響: 追加のみ / リスク: 低（デュアルパッケージの二重インスタンス問題は README で注意喚起）
- 検証: Vite/Node18 での import テストを CI に追加
- 完了条件: npm から install して examples 相当が動く

**P2-2: ChartFeed ヘルパーの共通化**
- 目的: VISUALIZE/showcase の rAF スロットリング実装を共有部品に
- 対象: `examples/assets/chart-feed.js`（新規、SDK本体には入れない）
- 方針: `push(values)` + `attach(chart, {fps:30, history:200, mode:'none'})`。sensor-dashboard-FSRvisualize を移行して重さを解消。CLAUDE.md の「100ms/`update('none')`」規約と実装を一致させる
- 影響: examples のみ / リスク: 低
- 検証: 60分放置でヒープ増加なし（メモリリークチェック手順を README 化）
- 完了条件: チャート系3例が共通ヘルパー利用

**P2-3: Playwright E2E（simulator駆動）**
- 目的: 「接続→データ→可視化」のブラウザ実行経路を自動検証
- 対象: `e2e/`（新規）、CI
- 方針: Web Bluetooth はエミュレートせず、P1-1 simulator を注入して UI 検証（Toolkit のトグル・バッジ・チャート描画・デモ再生）。実機BLEは対象外と割り切る
- 影響: 開発フローのみ / リスク: 中（CIでのブラウザ安定性）
- 検証: CI で headless Chromium green
- 完了条件: showcase / VISUALIZE / balance-sway の3例に smoke E2E

**P2-4: 記録フォーマット標準化（Recorder）**
- 目的: showcase / hula で別々の CSV 実装を統一し、研究用途の再現性を確保
- 対象: `src/InsoleRecorder.js`（新規 opt-in）
- 方針: showcase/demo-data.js の列形式（device, timestamp, serial, press0-5, acc, gyro, quat, euler）を正式仕様化し、書出し（CSV/JSONL）+ 読込み（simulator 再生入力）を対で提供
- 影響: 追加のみ / リスク: 低
- 検証: 書出し→再生のラウンドトリップテスト
- 完了条件: showcase と hula が Recorder に移行

**P2-5: WebSocket リレー参照実装**
- 目的: 「INSOLE→ブラウザ→他システム」連携の公式パターン提示（AGENTS.md 規約の実体化）
- 対象: `examples/websocket-relay/`（新規: Node `ws` サーバ + ブラウザ送信側）
- 方針: `wss://` 前提の設定例、指数バックオフ再接続、接続状態UI、切断時のローカルバッファリング。UDON の空の `measurement-server` はこれに置換
- 影響: 追加のみ / リスク: 低
- 検証: サーバ側ユニットテスト + ローカル統合テスト（BLE不要、simulator入力）
- 完了条件: README 付きで動作、examplesマトリクスに掲載

**P2-6: interpolation の実装 or 撤去の決着**
- 目的: 「設定できるが何も起きないAPI」の解消
- 対象: src/ORPHE-INSOLE.js:477-489, 537-542, 1343-1345
- 方針: 推奨は**撤去**（`lostData` + 上位での補間が筋。SDK内補間は医療用途でデータ捏造と紛らわしい）。オプションは受け取ったら `console.warn` 1回 + JSDoc `@deprecated`。実装する場合は線形補間を opt-in で、補間サンプルに `interpolated: true` フラグ必須
- 影響: interpolation を設定している既存コード（動作は元々無なので実害なし）
- リスク: 低 / 検証: 警告発火テスト
- 完了条件: ドキュメント・型・実装の三者が一致

**P2-7: タイムスタンプ精度の改善（opt-in）**
- 目的: header 55/56 の同一タイムスタンプ問題と日付跨ぎの解消
- 対象: src/ORPHE-INSOLE.js:114-121, 196-261
- 方針: 既定挙動は不変。`begin({timestampMode:'spread'})` で packet 内サンプルにサンプリング周期（mode3: 5ms / mode4: 10ms）を按分付与。日付跨ぎは「前回値より大きく戻ったら日付+1」補正。FW仕様の確認を先行タスクに
- 影響: opt-in のみ / リスク: 中（FW 仕様の裏取りが必須）
- 検証: パーサユニットテスト + 実機で深夜跨ぎログ
- 完了条件: 歩行イベントの時間分解能が mode3 で 5ms 単位になる

**P2-8: `@ts-check` による段階的型付け**
- 目的: TS移行の第一歩（ビルド変更なし）
- 対象: src/*.js 冒頭 + `jsconfig.json`
- 方針: JSDoc 型注釈を強化し `tsc --noEmit --checkJs` を CI に。P0-6 の .d.ts と突合
- 影響: なし / リスク: 低 / 検証: CI green
- 完了条件: src/ が checkJs エラー 0

**P2-9: AGENTS.md / CLAUDE.md の実態同期**
- 目的: 存在しない `npm run lint` / `type-check` / `npm start` への言及を実コマンドに揃え、AIエージェント開発の精度を上げる
- 対象: AGENTS.md, CLAUDE.md, .claude/CLAUDE.md
- 影響: なし / リスク: なし / 完了条件: 記載コマンドが全部実行可能

---

## 5. 推奨ロードマップ

**最初の3日**
1. PR#1（CI + ESLint + package衛生化）→ 以降の全作業に安全網
2. PR#2（setup クラッシュ + wraparound 修正）
3. P1-6 着手: README の即修正（コードブロック言語、PRESSURE_RECIPES リンク）

**1週間**
- PR#3（.d.ts）、PR#4（characteristic map）マージ
- TROUBLESHOOTING.md / SENSOR_SPEC.md ドラフト
- 実機テストチェックリスト初版（§7）で PR#4 を実機確認

**2週間**
- PR#5（simulator）マージ → 全example の実機なし確認体制が成立
- P1-2 InsoleUtils 実装 + ユニットテスト（examples 移行はまだ）
- P1-4 エラー/状態モデル、P1-5 CDN依存健全化

**1ヶ月**
- P1-3 examples 統一整備（InsoleUtils 移行・archive 移動・マトリクス公開）
- P2-3 E2E smoke、P2-1 ESM/npm beta 公開、P2-4 Recorder
- v1.2.0 リリース（タグ + CHANGELOG + jsDelivr バージョン固定URLの告知）

---

## 6. 最初に作るべきPR案（5本）

**PR#1 `chore: CI・ESLint導入と package.json 衛生化`**
- 目的: 回帰検出の自動化。ランタイム変更ゼロで土台を作る
- 変更: `.github/workflows/ci.yml`、`eslint.config.js`、package.json（scripts分割、`jsdoc`→devDependencies、`files` に types/ 追加準備）
- テスト: CI 上で test/lint/build/dist差分チェックが走ること。ローカル `npm ci && npm test`
- レビュー観点: dist差分チェックの誤検知（改行/terserバージョン差）、Node バージョンマトリクスの妥当性
- マージ条件: CI green / 既存 `npm test` 挙動不変 / ランタイムコード diff ゼロ

**PR#2 `fix: setup() options 正規化と serial wraparound 誤検出の修正`**
- 目的: 利用者が最初に踏む2つの実バグの解消（P0-1, P0-2）
- 変更: src/ORPHE-INSOLE.js（setup 内マージ処理、`_checkSerialGap()` 抽出、`serial_number===0` falsy バグ修正、press 履歴 setSize 追加）+ tests への回帰ケース追加 + `npm run build` で dist 同期
- テスト: 新規ユニット（部分options 3ケース、65534→65535→0→1）、既存4テスト green
- レビュー観点: gotData オーバーライド経路と通常経路の両方が `_checkSerialGap` を通るか、既定値がドキュメントと一致するか
- マージ条件: 全テスト green / dist 再生成済み / CHANGELOG 記載

**PR#3 `feat: TypeScript 型定義 (types/orphe-insole.d.ts) を追加`**
- 目的: TS/エディタ補完対応。未実装APIを型レベルで明示（P0-6）
- 変更: `types/orphe-insole.d.ts`、package.json `"types"`、`test:types`（`tsc --noEmit` でサンプルTS検証）、README に TS 利用例
- テスト: 正しい使用がコンパイル通過・誤用（`begin('STEP_ANALYSIS')` 等）が期待通りか型テストで固定
- レビュー観点: got* コールバック引数型が parser 実出力と一致（timestamp/serial_number/packet_number を含む）、STEP_ANALYSIS 系の `@deprecated` 注記
- マージ条件: 型テスト green / ランタイム diff ゼロ

**PR#4 `fix: characteristic を UUID 別管理にし通知中の read/write 競合を解消`**
- 目的: P0-3。実運用アプリ（接続中のバッテリー取得・モード変更）での破綻防止
- 変更: src/ORPHE-INSOLE.js（`_characteristics` map、`dataCharacteristic` getter 互換維持）+ stability テスト拡張 + dist 同期
- テスト: モックGATTで「startNotify → read(DEVICE_INFORMATION) → stopNotify が SENSOR_VALUES に効く」/ 自動再接続シナリオ回帰
- レビュー観点: 再接続時の characteristic 破棄・再取得、`hashUUID_lastConnected` キャッシュ条件の置き換え漏れ
- マージ条件: 全テスト green + **実機チェックリスト（§7）通過を必須**

**PR#5 `feat: OrpheInsoleSimulator と examples のデモモード統一`**
- 目的: P1-1。実機なし開発・E2E・営業デモの基盤
- 変更: `src/InsoleSimulator.js`（showcase/demo-data.js から抽出・API同形化）、showcase を simulator 参照に移行、README「実機がない場合」節
- テスト: Node ユニット（プリセット3種の出力レンジ・周波数）、showcase のデモ再生が従来同様に動くこと
- レビュー観点: OrpheInsole との公開面の一致（got* 発火順・`device_information` 形状）、タイマー精度とクリーンアップ（stop でリーク無し）
- マージ条件: 全テスト green / showcase 目視確認 / simulator と実機の差異が README に明記

---

## 7. テスト戦略

### 実機なし（CI で常時実行）
| レイヤ | 内容 | 使うもの |
|---|---|---|
| パーサ | packet 50/55/56 のゴールデンバイト列 → 期待サンプル列。エッジ: byteLength≠104、未知header、全ch 0/65535、serial 境界 | tests/insole-parser.test.js 拡張 |
| データ処理 | InsoleUtils 全関数（検証フラグ、CoP、ヒステリシス、キャリブレーション）。NaN/欠損/5ch入力 | 新規 tests/insole-utils.test.js |
| 接続ロジック | モックGATT/localStorage で再接続・デバイス記憶・characteristic map・状態遷移 | tests/insole-stability.test.js 拡張 |
| 共存性 | CORE↔INSOLE 読み込み順（現行を維持・拡張） | tests/insole-coexistence.test.js |
| 構文/型/lint | 全 src + 全 examples の `node --check`、`tsc --noEmit`、ESLint | CI |
| E2E | simulator 注入で Toolkit UI・チャート描画・デモ再生を Playwright 検証 | e2e/（P2-3） |
| 実データ回帰 | 実機から採取した CSV（歩行/静止/階段）をフィクスチャ化し、接地検出・CoP の出力を固定 | Recorder 導入後 |

### 実機あり（リリース前チェックリスト・手動）
1. **接続系**: 初回接続（chooser）/ 記憶接続（ダイアログなし）/ `forgetLastBluetoothDevice` 後の再選択 / 2台同時（L/R バッジ正否）/ 電源OFF→ON での自動再接続（onReconnect* の発火順記録）
2. **データ系**: mode 1/3/4 切替と gotEuler/gotPress の有無が仕様通り / `gotBLEFrequency` が 45〜55Hz（packet）相当 / 30分ソークで lostData 率と `performance.memory` 記録
3. **境界**: 深夜0時跨ぎ / uint16 serial 一周（約22分@50Hz）で誤 lostData なし / 電波距離限界での切断挙動
4. **環境**: Chrome desktop / Edge / Android Chrome。Bluetooth OFF・非対応ブラウザでのエラーメッセージ確認
5. 結果は `docs/DEVICE_TEST_CHECKLIST.md`（新規）に版数・FWバージョンとともに記録

---

## 8. 破壊的変更を避ける方針

1. **追加のみ原則**: 新機能は新モジュール（InsoleUtils / InsoleSimulator / InsoleRecorder）か新オプションで提供。コアの公開シグネチャ（`setup/begin/stop/reset/got*/on*`）は変更しない。
2. **エイリアス恒久維持**: `Orphe` 条件付きエイリアス、`bles`/`cores`、`buildCoreToolkit`、グローバル公開（FixedSizeArray 等）は維持し、coexistence テストをマージゲートにする。
3. **互換シム**: `dataCharacteristic` は getter で残す（PR#4）。文字列エラー→Error 化ではメッセージ文字列を維持し `code` を追加。
4. **非推奨は警告のみ**: `@deprecated` + 初回1回の console.warn。削除は次メジャーまで行わない。
5. **リリース制御**: 現状 **dist コミット + jsDelivr `@latest` は「mainマージ＝即全ユーザー配信」**。以後は (a) README/examples のCDN例をバージョン固定（`@1.1.0`）に変更、(b) git tag + GitHub Release + CHANGELOG.md を必須化、(c) 挙動変更を含むPRは minor バージョンを上げてからマージ。
6. **ゴールデンフィクスチャ**: 実パケットのバイト列→パース結果を固定し、リファクタで数値が1bitでも変われば fail。
7. **既定ログ抑制（P1-4）だけは挙動変更**: minor リリースに載せ、CHANGELOG 冒頭 + README で `debug` フラグを案内。

---

## 9. サブエージェント分担案

依存: Lane T（テスト/CI）が最初。Lane A/B は T の後に並列可。C/D/E は A/B とファイル競合しないため常時並列可。

| Lane | 担当領域 | 主担当ファイル | 最初のタスク | 依存 |
|---|---|---|---|---|
| **T: テスト/CI** | CI・ESLint・test分割・E2E基盤 | .github/workflows, eslint.config.js, package.json, e2e/ | PR#1 | なし（最優先） |
| **A: コアSDK/API** | P0-1/2/3、P1-4、P2-6/7 | src/ORPHE-INSOLE.js, tests/insole-*.test.js | PR#2 → PR#4 | T |
| **B: センサーデータ処理** | InsoleUtils、Recorder、フィクスチャ | src/InsoleUtils.js(新), src/InsoleRecorder.js(新), tests/insole-utils.test.js(新), docs/ai/PRESSURE_RECIPES.md | P1-2 設計→実装 | T（examples移行はEと調整） |
| **C: 可視化/Chart.js** | ChartFeed、FSRvisualize改修、メモリ検証手順 | examples/assets/chart-feed.js(新), examples/sensor-dashboard-FSRvisualize/, examples/VISUALIZE/ | P2-2 | なし |
| **D: 通信（BLE/WebSocket）** | simulator、WebSocketリレー、CDN依存健全化 | src/InsoleSimulator.js(新), examples/websocket-relay/(新), src/ORPHE-INSOLE.js:17-45 | PR#5 | A と src 競合最小（loadScript部のみ調整） |
| **E: examples/docs** | P1-3、P1-6、マトリクス、医療注意書き | README.md, docs/, examples/README.md(新), examples/archive/ | README即修正 → TROUBLESHOOTING | B/C/D の成果を随時反映 |
| **S: セキュリティ/安全性** | Toolkit XSS修正、npm audit、supply chain（CDN `@main`・コミット済みバイナリ）、異常値仕様レビュー | src/InsoleToolkit.js:346-348, src/ORPHE-INSOLE.js:17-45, examples/UDON_fsr_20250724/measurement-server, package.json | title の textContent 化 + バイナリ除去提案 | なし（横断レビュー役を兼務） |

各 Lane の成果物は AGENTS.md のフェーズ完了レポート形式（達成事項/発見事項/引き継ぎ）で残す。

---

## 10. 今すぐ直すべき設計負債トップ10（厳しめ）

1. **リリース統制の不在が最大のリスク**。dist をコミットし jsDelivr `@latest` で配る現運用は、main への1マージが**全ユーザーの本番を即座に書き換える**仕組み。タグなし・CHANGELOG なし・dist と src の同期検証なし。SDK を名乗る以前の問題で、事故は時間の問題。
2. **単一 `dataCharacteristic` スロット**（:310, :1035-1081）。「接続中にバッテリーを読む」という当たり前の操作で通知制御が壊れる。read/write/notify を1変数で回す設計は BlueJelly 由来の負債で、実運用アプリの抽象化として破綻している。
3. **import しただけで他リポジトリの `@main` からスクリプトを注入する**（:17-45）。バージョン固定なし・SRI なし・オフライン不可、しかも float16 は使ってすらいない。supply chain 的に最悪の形。
4. **呼ばれない公開API が15個以上**（STEP_ANALYSIS 系 got*、`gotDelta`、`interpolation`）。コメントで「FW対応待ち」と書けば許されるものではなく、型もツールもない現状では利用者は動かない理由を自力デバッグするしかない。API 表面は「動くもの」だけで構成すべき。
5. **データ信頼性のバグが放置**: serial uint16 一周（50Hz なら約22分毎）で `lostData` 誤発火、mode 3/4 で packet 内全サンプル同一タイムスタンプ、日付跨ぎで時刻が24時間飛ぶ。歩行分析 SDK として致命的なのに、テストは正常系しか見ていない。
6. **`setup(names, {})` で落ちる**。最初に触る初心者が最初に踏む地雷が3年目のコードに残っている時点で、引数正規化の規律（正規化ヘルパー・入口バリデーション）が存在しないことを示している。
7. **検証・キャリブレーション層の不在**。AGENTS.md/CLAUDE.md は「圧力データの検証は必須」と謳うが、SDK は生 ADC を素通しし、飽和も断線も NaN も検出しない。規約と実装の乖離は、AI エージェント駆動開発ではそのまま誤ったコード生成として増幅される。
8. **型定義・ESM・npm 配布ゼロ**。2026年に TypeScript から使えない JS「SDK」は選定段階で落とされる。JSDoc は書いてあるのだから .d.ts 化は数日の作業で、やらない理由がない。
9. **examples がコピペ増殖体**: CoP計算×4、レイアウト定義×4、鏡像変換×3、さらに旧 ORPHE-CORE.js を丸ごと同梱した化石例（p5.ORPHE.FSR_visualise_0327_submit）が現役の顔をして置いてある。センサ配置が変わったら5箇所直すことになり、既に閾値のスケールは example 間で矛盾している（hula の 40 と UDON の 0.8N）。
10. **エラーモデルとUIの脇の甘さ**: 文字列 throw と Error の混在、既定コールバックの console.log 直書き、`_reportError`+rethrow の二重報告、そして Toolkit の `ITbuildElement` が第2引数を無条件 `innerHTML` 代入（title 経由の XSS 口）。1つ1つは小さいが、「臨床・研究・営業で使える SDK」の信頼感を削るのはこういう箇所。

次点: **ソース不明の59MB macOS バイナリ（`examples/UDON_fsr_20250724/measurement-server`）がコミットされている**（OSSとしては本来トップ10入りの供給網・ライセンス問題）、`OrpheInsole._instances` の無限成長（SPA でリーク）、`device_information` の string→object 型変化、`docs/README.md` が1行のまま API ドキュメントの玄関になっている点。

---
*本プランは分析のみでコードは未変更。着手順は §5、最初の一手は PR#1（CI）。*

