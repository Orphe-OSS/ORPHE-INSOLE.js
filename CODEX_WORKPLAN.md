# CODEX_WORKPLAN — 改善プロジェクト作業指示書

対象読者: **Codex（実装担当エージェント）** / レビュー・マージ担当: **Claude + 菊川**
根拠文書: [`IMPROVEMENT_PLAN.md`](./IMPROVEMENT_PLAN.md)（分析済み。行番号付きの課題一覧はそちら）
最終更新: 2026-07-11

---

## 現在の進捗（2026-07-12 時点）

| PR | 内容 | 状態 |
|---|---|---|
| PR#1 | CI・ESLint 導入 / package衛生化 | ✅ マージ済み（GitHub #14） |
| PR#2 | setup() options 正規化 + serial wraparound 修正 | ✅ マージ済み（GitHub #16） |
| PR#3 | TypeScript 型定義 | ✅ マージ済み（GitHub #17。レビューfixup: lockfile同期・setup options型の部分指定対応） |
| PR#5 | OrpheInsoleSimulator | ✅ マージ済み（GitHub #15。レビューfixup: simulatorテストを test:unit に登録） |
| PR#4 | characteristic UUID 別管理 | ✅ マージ済み（GitHub #19。実機チェック 2026-07-12 通過: 自動テストT1〜T6全PASS + デバイス切替OK。`examples/device-test/` に実機チェックページ追加） |
| PR#7 | InsoleUtils（検証・キャリブレーション・CoP・接地検出） | ✅ マージ済み（GitHub #21。型定義込み。examples 移行は PR#8 へ） |
| PR#9 | docs 再建（docs README / SENSOR_SPEC / TROUBLESHOOTING / 医療注意書き / CLAUDE.md 同期） | ✅ マージ済み（GitHub #22。ルート README は music-shoe 並行作業との競合回避で未変更） |
| PR#6 | `buildInsoleToolkit {simulator:true}` + Simulator 型定義 | ✅ マージ済み（GitHub #23。ヘッドレス Chrome で11チェック検証。**showcase/balance-* 内部の Simulator 移行は PR#8 へ延期** — 公開ページの視覚回帰は目視確認とセットで行うため） |
| PR#8 | examples の座標を InsoleUtils 共通定義へ + examples/README.md（マトリクス） | ✅ マージ済み（GitHub #25。菊川の目視+実機確認 2026-07-13 通過。hula-detector は別座標系のため対象外と判断） |
| hotfix | 物理切断→自動再接続が stale characteristic で永続失敗するリグレッション（PR#4 由来・実機で発見） | ✅ マージ済み（GitHub #27。red→green 回帰テスト付き。実機での再接続確認は PR#10 のチェックパスに含む） |
| PR#10 | エラー/接続状態モデル（error.code / connectionState / connectTimeoutMs / ログのdebugゲート） | ✅ マージ済み（GitHub #26・**v1.2.0**。実機チェック 2026-07-13 通過: T1〜T8 全PASS + 再接続（hotfix検証込み）+ CONNECT_TIMEOUT×3 + デバイス切替） |

**🏁 計画の PR#1〜#10 + 再接続hotfix がすべて完了（2026-07-13）。** 残課題は IMPROVEMENT_PLAN の P2 バックログ（ESM/npm publish・E2E・Recorder 等）と、実機テストで観測された一過性エラーの改善余地（高速デバイス切替中の InvalidStateError → begin() 自動リトライ検討）。

> **PR#10 の相談ポイント（着手前に菊川の判断が必要）**:
> 1. 既定 on* コールバックの console.log を `debug` 時のみに抑制する挙動変更を入れるか（利用者の「動かなくなった」誤認リスク vs コンソール汚染。入れるなら minor リリース + README 案内）
> 2. `begin({connectTimeoutMs})` の既定値を設けるか（推奨: 既定なし = 現状維持、opt-in）
> 3. Error+code 統一（`error.code = 'NO_DEVICE'` 等、メッセージ文字列は互換維持）と `connectionState` getter（disconnected/connecting/connected/reconnecting）は追加的で低リスク
> 4. Track A（src 中核）なので**マージに実機チェック必須**（device-test ページに接続タイムアウト・状態遷移の項目を追加して検証）
>
> 実機チェックの注意: INSOLE は物理スイッチがないため「電源OFF→ON」項目は電波範囲外への移動で代替するか省略（再接続経路はユニットテストで担保）。

---

## 0. 運用フロー（must）

1. Codex は本書の「PRキュー」を **トラック単位** で実施する。異なるトラックは並行作業可、同一トラック内は番号順に1本ずつ。
   - **Track A（src系・直列）**: PR#2 →（マージ後）PR#4 → PR#10。`src/ORPHE-INSOLE.js` と `dist/` を触るPRは**常にこのトラックのみ**。同時に2本走らせない。
   - **Track B（型）**: PR#3。src/dist を触らない。
   - **Track C（新規モジュール）**: PR#5 →（レビュー後）PR#6。新規ファイル中心、dist 不触。
   - **Track D（docs/examples）**: PR#8, PR#9（PR#7 の成果待ちのものは除く）。
   - 初回の同時起動は **PR#2 + PR#3 + PR#5 の3本**（いずれも PR#1 マージ後の main を起点にすること）。
1-b. **並行時の衝突ルール**:
   - 各ブランチは**必ず最新 main から**切る。ready 化の直前に `git rebase origin/main` する。
   - `dist/` の競合は手で解決しない。src の競合解決後に `npm run build` で**再生成してコミット**する（これが唯一の正解手順）。
   - `CHANGELOG.md` は各PRが `## [Unreleased]` に自分の箇条書きを**追記**する。rebase 時の競合は両方残す。
   - `package.json` の scripts/devDependencies に触るのは自分のPRで指示された行のみ。整形・並べ替えをしない（無用な競合の元）。
   - 自分のトラック外のファイルに触る必要が生じたら、実装せず完了レポートの質問欄へ。
2. ブランチ名: `codex/pr01-ci`, `codex/pr02-setup-serial` … のように `codex/prNN-<topic>`。
3. **main へ直接 push・セルフマージ禁止**。PRを作成して open のままにする。
4. PR作成時、PR説明文に §8 の完了レポートを貼る。レビューは Claude が行い、修正 → マージする。
5. 仕様が曖昧・矛盾していると判断したら、**公開APIに影響する部分は推測で実装せず**、完了レポートの「質問」欄に書いて他の部分を仕上げる。
6. 各PRの最後に必ず: `npm test` green → `npm run build` → `dist/` の差分をコミット（§1参照）。
7. `IMPROVEMENT_PLAN.md`・本書・`docs/` 生成物（docs/*.html）は指示がない限り編集しない。

### 絶対的制約（全PR共通）
- **後方互換最優先**。公開シグネチャ（`setup/begin/stop/reset/got*/on*`、グローバル `OrpheInsole`/`Orphe`/`insoles`/`bles`/`cores`）を変更・削除しない。
- `tests/insole-coexistence.test.js`（CORE共存）と既存テストを**全て green のまま**にする。
- 新しい npm 依存の追加は §「承認済み依存」のみ。それ以外が必要なら質問欄へ。
- `examples/UDON_fsr_20250724/measurement-server`（59MBバイナリ）には触れない（除去は別途人間が判断）。
- 医療・リハビリ関連の文言では断定表現（「診断できる」「改善する」等）を使わない。

---

## 1. リポジトリの前提知識（5分で読む）

- コアSDK: `src/ORPHE-INSOLE.js`（1,741行、IIFE + 条件付きグローバル公開 + CJS export）。パーサ `parseInsoleSensorValues` は純関数（:131-267）。
- 配布: `dist/` を**コミットして** jsDelivr で配信。`npm run build` = cp + terser。**src を触ったら dist の再ビルド・コミットが必須**。
- テスト: `npm test`（package.json:16 の `&&` 連結）。Node素朴 assert、BLEはモック。テストフレームワーク不使用（今後も導入しない。既存スタイルに合わせる）。
- 既知の重要事実:
  - packet header 50=mode1(quat+imu), 55=mode3(imu+press 200Hz), 56=mode4(全部 100Hz)。byteLength は常に104。
  - `serial_number` は uint16。50packet/s なので約22分で一周する。
  - `Quaternion` / float16 は実行時にCDNから注入される（PR対象外の既知課題）。
  - AGENTS.md 記載の `npm run lint` 等は PR#1 で新設するまで存在しない。

---

## 2. PR#1 `chore: CI・ESLint導入と package.json 衛生化` — ✅マージ済み（GitHub PR #14）

**目的**: ランタイム無変更で安全網を作る。以降の全PRはこのCIを通過してからレビューに出す。

### 変更内容
1. **package.json**
   - `"jsdoc": "^4.0.4"` を `dependencies` → `devDependencies` へ移動（`dependencies` は空になる）。
   - devDependencies に追加: `eslint@^9`, `globals@^15`。
   - scripts を再構成（既存の挙動は温存）:
     ```json
     "lint": "eslint .",
     "test:syntax": "<現行 test の node --check 部分をそのまま>",
     "test:unit": "node tests/insole-parser.test.js && node tests/hula-detector.test.js && node tests/insole-stability.test.js && node tests/insole-coexistence.test.js && node examples/balance-tuner/test-balance-tuner.mjs",
     "test": "npm run test:syntax && npm run test:unit"
     ```
   - `test:syntax` の `node --check` 対象に追加: `examples/showcase/*.js`, `examples/balance-sway/balance-sway.js`, `examples/VISUALIZE/sketch.js`, `examples/sensor-dashboard-FSRvisualize/*.js`（`node --check` が通らないファイルがあれば**修正せず**質問欄へ記載し対象から除外）。
2. **eslint.config.js**（flat config, 新規）
   - `ignores`: `dist/`, `docs/`, `node_modules/`, `examples/p5.ORPHE.FSR_visualise_0327_submit/`（ベンダードライブラリ入りの旧例）, `examples/UDON_fsr_20250724/`
   - `js.configs.recommended` ベース。`languageOptions.globals`: `globals.browser` + `globals.node` + 手動追加 `{ Quaternion:'readonly', Chart:'readonly', p5:'readonly', bootstrap:'readonly', OrpheInsole:'writable', Orphe:'writable', insoles:'writable', buildInsoleToolkit:'readonly' }`（lint 実行して不足があれば追補）。
   - ルール緩和で開始: `no-unused-vars: 'warn'`, `no-empty: 'warn'`, `no-prototype-builtins: 'off'`。**error は0件、warning は許容**。既存コードのロジックを lint のために書き換えない。
3. **`.github/workflows/ci.yml`**（新規）
   ```yaml
   name: CI
   on:
     push: { branches: [main] }
     pull_request:
   jobs:
     test:
       runs-on: ubuntu-latest
       strategy:
         matrix: { node: [18, 20, 22] }
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: "${{ matrix.node }}", cache: npm }
         - run: npm ci
         - run: npm run lint
         - run: npm test
         - run: npm run build
         - run: git diff --exit-code -- dist/
     audit:
       runs-on: ubuntu-latest
       continue-on-error: true
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 20, cache: npm }
         - run: npm ci
         - run: npm audit --audit-level=high
   ```
4. **dist 同期**: 現在コミット済みの `dist/orphe-insole.min.js` は過去の terser で生成された可能性がある。`npm ci && npm run build` を実行し、差分が出たら**このPRで dist をコミット**（`git diff --exit-code -- dist/` を green にするため）。

### テスト方法
ローカルで `npm ci && npm run lint && npm test && npm run build && git diff --exit-code -- dist/` が全て成功。

### 完了条件（DoD）
- CI が本PR上で green（3 Node バージョン）。
- `src/` の diff が **dist 再生成以外ゼロ**（ランタイム変更なし）。
- lint error 0。warning 一覧を完了レポートに添付（後続PRの参考にする）。

---

## 3. PR#2 `fix: setup() options 正規化と serial_number 一周時の lostData 誤発火修正` — ✅マージ済み（GitHub PR #16）

**目的**: IMPROVEMENT_PLAN P0-1 / P0-2。利用者が実際に踏む2バグの修正。

### 変更内容（src/ORPHE-INSOLE.js）
1. **setup() の正規化**（現 :528-555）。`setup(names, {})` や部分指定で TypeError にならないように:
   ```js
   setup(names = ['DEVICE_INFORMATION', 'DATE_TIME', 'SENSOR_VALUES'], options = {}) {
     const defaultInterpolation = { enabled: false, max_consecutive_missing: 1 };
     this.interpolation = Object.assign({}, defaultInterpolation,
       (options && typeof options.interpolation === 'object' && options.interpolation) || {});
     // setSize は従来の5系列 + press（漏れていたので追加）
     for (const key of ['acc','gyro','quat','press','converted_acc','converted_gyro']) {
       this.history_sensor_values[key].setSize(this.interpolation.max_consecutive_missing);
     }
     // 以降の names ループは現行のまま
   ```
   JSDoc の `@param` も実挙動（既定値マージ）に合わせて更新。
2. **serial ギャップ検出の一本化**。私有メソッドを追加し、gotData 経路（現 :1329-1358 内）と通常経路（現 :1371-1380）の重複ロジックを両方これに置き換える:
   ```js
   _checkSerialGap(current) {
     if (!this._serialInitialized) {
       this._serialInitialized = true;
       this.serial_number = current;
       return;
     }
     const prev = this.serial_number;
     this.serial_number = current;
     const diff = (current - prev + 65536) % 65536; // uint16 wraparound 対応
     if (diff !== 1) this.lostData(current, prev);
   }
   ```
   - 挙動維持ポイント: `this.serial_number` は従来どおり public に読める。`lostData(現在値, 直前値)` の引数順は現行踏襲。diff===0（重複packet）で発火するのも現行同等なので維持。
   - **修正される挙動**（CHANGELOGに書く）: (a) 65535→0 で誤発火しない、(b) serial 0 で毎回初期化扱いになる falsy バグ解消、(c) `clear()` で `_serialInitialized = false` にリセットし、再接続直後の1回だけの巨大ギャップ誤発火を防ぐ。
   - gotData 経路の header ガード（`50||55||56` チェック）は現行のまま残し、その内側で `_checkSerialGap(data.getUint16(1))` を呼ぶ。
3. **CHANGELOG.md 新規作成**（Keep a Changelog 形式、`## [Unreleased]` に本修正2件を記載）。

### テスト（tests/insole-parser.test.js に追記）
- 部分options: `setup(['SENSOR_VALUES'])` / `setup(['SENSOR_VALUES'], {})` / `setup(['SENSOR_VALUES'], {interpolation:{enabled:true}})` が throw せず、`interpolation.max_consecutive_missing === 1` が補完される。
- serial境界: header 56 のパケットを serial = 65534, 65535, 0, 1 の順で `onRead` に流し、`lostData` が**一度も呼ばれない**こと。65535 の次に 1 を流すと `lostData(1, 65535)` が呼ばれること。パケットの作り方は同ファイル既存の buildPacket ヘルパー流を踏襲（無ければ 104byte の ArrayBuffer を組む小関数を追加）。
- `clear()` 後に最初のパケットで発火しないこと。

### 完了条件
全テスト green / dist 再ビルド済み / CHANGELOG 記載 / 公開APIシグネチャ変更なし。

---

## 4. PR#3 `feat: TypeScript 型定義 (types/orphe-insole.d.ts)` — ✅マージ済み（GitHub PR #17）

**目的**: P0-6。ランタイム変更ゼロで型と補完を提供し、未実装APIを型レベルで明示。

### 変更内容
1. **`types/orphe-insole.d.ts`**（新規・手書き）。含めるもの:
   - データ型: `InsolePressSample {values:number[]; timestamp:number; serial_number:number; packet_number:number}` / `InsoleVector3Sample {x,y,z,timestamp,serial_number,packet_number}` / `InsoleQuatSample {w,x,y,z,...}` / `InsoleEuler {pitch,roll,yaw}` / `InsoleDeviceInformation {battery:number; mount_position:number; range:{acc:number;gyro:number}; raw:DataView}` / `InsoleStatus`（gotStatus payload, src:1536-1548 のJSDoc準拠）/ `ReconnectAttemptInfo` ほか on* payload / `InsoleBeginOptions {streamingMode?:1|3|4; autoReconnect?:boolean; reconnectIntervalMs?:number; reconnectMaxAttempts?:number; forceDeviceSelection?:boolean}`。
   - `class OrpheInsole`: constructor(id?), `setup`, `begin(type?:'SENSOR_VALUES', options?)` と `begin(options)` の両オーバーロード, `stop`, `reset`, `setDataStreamingMode`, `getDeviceInformation`, `getDateTime`, `syncCoreTime`, `selectBluetoothDevice`, `forgetLastBluetoothDevice`, `resetAnalysisLogs`, `isConnected`, `debug:boolean`, `id:number`, 最新値フィールド（press/acc/gyro/quat/euler/converted_*/device_information）, コールバックプロパティ（gotPress 等は代入で上書きする設計なので **メソッドでなくプロパティ型** `gotPress: (press: InsolePressSample) => void`）。
   - **STEP_ANALYSIS 系（gotGait/gotStride/gotPronation/gotType/gotDirection/gotCalorie/gotDistance/gotStandingPhaseDuration/gotSwingPhaseDuration/gotFootAngle/gotLandingImpact/gotStepsNumber）と `gotDelta` には `/** @deprecated ORPHE INSOLE 現行FWでは呼び出されません（FW対応待ち） */`** を必ず付ける。
   - `parseInsoleSensorValues`, `FixedSizeArray`, `OrpheTimestamp`, `Orphe`（= OrpheInsole の別名）を named export。`export as namespace` は使わず、`declare global { var OrpheInsole: ...; var insoles: OrpheInsole[]; function buildInsoleToolkit(...): void }` ブロックでグローバル利用（scriptタグ読み込み）にも対応。
2. **package.json**: `"types": "types/orphe-insole.d.ts"`、`files` 配列に `"types/"` 追加、devDependencies に `typescript@^5`。scripts に `"test:types": "tsc -p tests/types/tsconfig.json"` を追加し `test` に連結。
3. **`tests/types/`**: `tsconfig.json`（`noEmit`, `strict`, `lib:["dom","es2020"]`）+ `usage.ts`（正しい使用例のコンパイル確認: begin のオーバーロード両方、gotPress の payload 型、device_information アクセス）。`@ts-expect-error` で誤用（`begin('STEP_ANALYSIS')` 的な型外文字列、`setDataStreamingMode(2)` は number なので通る点に注意→ mode は `1|3|4` リテラル型にして 2 を弾く）を固定。
4. CI（PR#1のyml）の test ジョブはそのまま（`npm test` 経由で test:types が走る）。

### 完了条件
`npm run test:types` green / ランタイムコード diff ゼロ / VSCode で `new OrpheInsole(0).` の補完が効くことをレポートにスクショ or 記述。

---

## 5. PR#4 `fix: characteristic を UUID 別管理にし通知中の read/write 競合を解消` — ✅マージ済み（GitHub PR #19、実機チェック通過）

**目的**: P0-3。SENSOR_VALUES 通知中に `getDeviceInformation()` / `setDataStreamingMode()` / `syncCoreTime()` を呼ぶと `this.dataCharacteristic` が上書きされ、`stopNotify` が誤対象に効く設計欠陥の修正。**このPRは挙動の中核に触るため、他PRと混ぜない。**

### 変更内容（src/ORPHE-INSOLE.js）
1. constructor に `this._characteristics = {};`（uuid名 → BluetoothRemoteGATTCharacteristic）。
2. `connectGATT(uuid)`（現 :1035-1081）:
   - キャッシュ判定を `if (this.bluetoothDevice.gatt.connected && this._characteristics[uuid]) return Promise.resolve();` に変更（`hashUUID_lastConnected` によるキャッシュ判定は廃止。変数自体は互換のため代入は残す）。
   - 取得成功時: `this._characteristics[uuid] = characteristic; this.dataCharacteristic = characteristic;`（`dataCharacteristic` は「最後に触った characteristic」として**プレーンなフィールドのまま**残す＝外部から参照している既存コードとの互換）。
3. `read/write/startNotify/stopNotify`: `this.dataCharacteristic` 参照を **全て `this._characteristics[uuid]`** に置換。`dataChanged` リスナーの付け外しも同様。
4. `clear()` と `connectGATT` の catch（記憶デバイス無効化パス、現 :1073-1078）で `this._characteristics = {};` にリセット。`selectBluetoothDevice()`（現 :750-761）も同様。
5. 切断時（onDisconnect 経路）には明示リセット不要（gatt.connected が false になるためキャッシュ判定で自然に再取得される）が、`disconnect()` 成功パスで `this._characteristics = {}` としてよい。

### テスト（tests/insole-stability.test.js に追記、既存のモック流儀に合わせる）
モックGATT: `getPrimaryService(uuid).getCharacteristic(uuid)` が **UUIDごとに別オブジェクト**（`startNotifications/stopNotifications/readValue/writeValue/addEventListener/removeEventListener` を記録するスパイ）を返すようにする。
- シナリオA: `startNotify('SENSOR_VALUES')` → `read('DEVICE_INFORMATION')` → `stopNotify('SENSOR_VALUES')` で、`stopNotifications` と `removeEventListener` が **SENSOR_VALUES 側のモック**に対して呼ばれること（現行実装ではここが DEVICE_INFORMATION 側に化ける＝レッドになるテストを先に書いて修正で green にする）。
- シナリオB: `write('DEVICE_INFORMATION', ...)` を通知中に実行しても SENSOR_VALUES のリスナー数が変わらないこと。
- シナリオC: 既存の自動再接続テストが全て green のまま。

### 完了条件
新旧テスト green / dist 再ビルド / CHANGELOG 記載。**マージは実機チェックリスト（IMPROVEMENT_PLAN §7）を菊川が通してから**（レポートに「実機確認待ち」と明記して止める）。

---

## 6. PR#5 `feat: OrpheInsoleSimulator（実機なし開発・デモ基盤）` — ✅マージ済み（GitHub PR #15）

**目的**: P1-1。`OrpheInsole` と同じコールバック面を持つシミュレータを SDK に追加し、実機ゼロで examples・E2E・営業デモを回せるようにする。

### 変更内容
1. **`src/InsoleSimulator.js`**（新規）。`examples/showcase/demo-data.js` の合成歩行生成と `examples/balance-sway/balance-sway.js` / `examples/balance-tuner` の `generateDemoFrame` を参考に、ロジックを**移植**（元ファイルはこのPRでは触らない。showcase の移行は次PR以降）。
   - 公開面（OrpheInsole と同形・サブセット）: `constructor(id=0)`, `setup(names?, options?)`（互換のため受けるが正規化のみ）, `async begin(type?, options?)`, `stop()`, `reset()`, `isConnected()`, `debug`, `id`, `device_information`（`{battery:2, mount_position: id===0?0:1, range:{acc:3, gyro:3}}` を begin 時に設定）, コールバック: `gotPress/gotAcc/gotGyro/gotQuat/gotEuler/gotConvertedAcc/gotConvertedGyro/gotBLEFrequency/lostData/onConnect/onDisconnect/onError/onScan/onStartNotify`。
   - `begin` options: `streamingMode`（4=100Hz/quatあり, 3=200Hz/quatなし, 1=press なし — **本物と同じデータ有無規則**を守る）, `preset: 'walk'|'stand'|'sway'`（既定 'walk'）, `frames`（CSV等から作ったフレーム配列を再生。書式は showcase/demo-data.js の `{device, t, serial, press:[6]|null, acc, gyro, quat, euler}`（demo-data.js:10-11 のコメント参照）に合わせる）, `loop=true`。
   - **単位の注意**: demo-data.js のフレームは acc[G]・gyro[dps] の**換算済み値**を持つ。シミュレータのコールバックは本物と同じ規則にすること — `gotAcc/gotGyro` には正規化値（-1..1、= 換算値/レンジ）、`gotConvertedAcc/gotConvertedGyro` には換算値を渡す（accRange=16, gyroRange=2000）。
   - 実装: `setInterval` 20ms で1tick（mode4なら2サンプル、mode3なら4サンプル分を順次コールバック）。`gotBLEFrequency(50)` 相当を tick 毎に。`stop()/reset()` で必ず `clearInterval`（リーク禁止）。**Node でも動く**こと（`document`/`window` 参照禁止）。
   - 公開方法は SDK と同じパターン: IIFE + `global.OrpheInsoleSimulator` +（`module.exports` があれば）CJS export。SDK 本体ファイルは変更しない。
   - 値レンジの目安: press は uint16 レンジ内（歩行時ピーク 3000〜20000 程度で山を作る）、acc/gyro/quat は -1..1 正規値 + converted 換算（accRange=16, gyroRange=2000）。
2. **`tests/insole-simulator.test.js`**（新規）: fake timer は使わず実タイマー短時間で —
   - `begin({preset:'stand', streamingMode:4})` 後 ~300ms 収集: gotPress の values が長さ6・全て 0..65535、gotQuat が発火、サンプル数が 100Hz±30% 相当。
   - `streamingMode:3` で gotQuat/gotEuler が**発火しない**こと。`streamingMode:1` で gotPress が発火しないこと。
   - `stop()` 後 100ms 待って追加コールバックゼロ。`frames` 再生でフレーム内容がそのまま流れること。
3. README に「実機がない場合（シミュレータ）」節を追加（10行程度、最小コード例）。
4. `test:syntax` と lint の対象に新ファイルを追加。

### 完了条件
新テスト green / Node で単体動作 / dist は**対象外**（simulator は当面 src 配布のみ。dist へのバンドルは別PRで判断）→ ただし `files` に含まれる `src/` で npm 配布はされる。CHANGELOG 記載。

---

## 7. PR#6以降のキュー（着手前に Claude レビューを待つこと）

| # | 内容 | 参照 |
|---|---|---|
| ~~PR#6~~ | ✅完了（GitHub #23）: `buildInsoleToolkit {simulator:true}` + Simulator 型定義。showcase / balance-* の内部移行は PR#8 へ | P1-1後半, P1-3 |
| ~~PR#7~~ | ✅完了（GitHub #21）: `src/InsoleUtils.js` + ユニットテスト + 型定義 | P1-2 |
| PR#8 | examples の InsoleUtils/Simulator 移行 + examples/README.md（マトリクス）。**マージ前に全example の目視確認必須**（公開ページの視覚回帰） | P1-3 |
| ~~PR#9~~ | ✅完了（GitHub #22）: docs 再建（docs/README.md, TROUBLESHOOTING.md, SENSOR_SPEC.md, 医療注意書き統一, CLAUDE.md 同期） | P1-6 |
| PR#10 | エラー/接続状態モデル（Error+code, connectionState, connectTimeoutMs）※挙動変更を含むため要事前相談（冒頭の相談ポイント参照）+ 実機チェック必須 | P1-4 |

---

## 8. 完了レポート書式（PR説明文に貼る）

```markdown
## PR#N 完了レポート
### 達成事項
- （変更ファイルと要点を箇条書き）
### DoD チェック
- [ ] npm test green（ローカル実行ログの末尾を貼る）
- [ ] npm run lint error 0
- [ ] npm run build 実行済み・dist 差分コミット済み（対象PRのみ）
- [ ] 公開APIシグネチャ変更なし
- [ ] CHANGELOG.md 更新（該当PRのみ）
### 発見事項・気づき
- （指示と実態の差異、warning一覧、次PRへの示唆）
### 質問（あれば。推測で進めなかった箇所）
- （なければ「なし」）
### 実機確認の要否
- 不要 / **必要（PR#4等）**: 確認observationチェック項目を列挙
```

## 9. レビュー・マージ手順（Claude / 菊川側。Codexは読むだけでよい）

1. Codex が PR を open → 菊川が Claude に「PR#N をレビューして」と依頼。
2. Claude は `git fetch && git diff main...codex/prNN-*` を確認し、以下のゲートで判定:
   - 全テスト・lint・build をローカル再実行 / dist 同期 / 公開API不変（coexistence テスト含む）
   - 本書の仕様との一致、テストが「レッド→グリーン」を実際に証明しているか（バグ修正PRは修正を revert するとテストが落ちることを確認）
   - CHANGELOG・レポートの妥当性
3. 問題が小さければ Claude が同ブランチに fixup コミットしてマージ。大きければ修正指示を PR コメント形式でまとめ、Codex に差し戻し。
4. PR#4 のみ: マージ前に菊川の実機チェックリスト通過が必須。
5. マージ後: 本書の該当PRを「✅完了 (マージ日)」に更新し、次のPR番号を Codex に指示。
```
