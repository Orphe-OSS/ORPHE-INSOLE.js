# ORPHE INSOLE センサ仕様（SENSOR_VALUES）

`src/ORPHE-INSOLE.js` の `parseInsoleSensorValues()`（実装が正）から起こした、
SENSOR_VALUES notification のパケット仕様と単位系のリファレンスです。

## パケット共通部

- 1 notification = **104 バイト固定**（`byteLength !== 104` のパケットはパーサが `null` を返す）
- 多バイト値はすべて **ビッグエンディアン**（`DataView` の既定）

| バイト | 型 | 内容 |
|---|---|---|
| 0 | uint8 | header（50 / 55 / 56） |
| 1–2 | uint16 | `serial_number`（パケット連番。**uint16 なので 65535 の次は 0**。50 packet/s なら約22分で一周） |
| 3 | uint8 | デバイス時刻: 時 |
| 4 | uint8 | デバイス時刻: 分 |
| 5 | uint8 | デバイス時刻: 秒 |
| 6–7 | uint16 | デバイス時刻: ミリ秒 |

`timestamp` は「**ブラウザ側の今日の日付 + デバイス時刻**」で合成された epoch ms です。
デバイス時刻は `begin()` 時に `syncCoreTime()` で PC 時刻に同期されます。
既知の制約: 日付跨ぎ（深夜0時）でタイムスタンプが約24時間ジャンプします。

## header 別レイアウト

### header 50 — mode 1（quat + gyro + acc, 200Hz相当）

1 パケットに **4 サンプル**。サンプルストライド 21 バイト。

| オフセット（+21×n） | 型 | 内容 |
|---|---|---|
| 8,10,12,14 | int16 ×4 | quat w,x,y,z（/32768 で -1..1 に正規化） |
| 16,18,20 | int16 ×3 | gyro x,y,z（/32768） |
| 22,24,26 | int16 ×3 | acc x,y,z（/32768） |
| 28 | uint8 | 次サンプルとの時間差 [ms]（mode 1 のみサンプル毎に加算される） |

### header 55 — mode 3（gyro + acc + press, 200Hz）

1 パケットに **4 サンプル**。サンプルストライド 24 バイト。**quat なし**（`gotQuat`/`gotEuler` は発火しない）。

| オフセット（+24×n） | 型 | 内容 |
|---|---|---|
| 8,10,12 | int16 ×3 | gyro x,y,z（/32768） |
| 14,16,18 | int16 ×3 | acc x,y,z（/32768） |
| 20,22,24,26,28,30 | **uint16 ×6** | press P0〜P5（ADC 生値） |

### header 56 — mode 4（quat + gyro + acc + press, 100Hz・既定）

1 パケットに **2 サンプル**。サンプルストライド 32 バイト。

| オフセット（+32×n） | 型 | 内容 |
|---|---|---|
| 8,10,12,14 | int16 ×4 | quat w,x,y,z（/32768） |
| 16,18,20 | int16 ×3 | gyro x,y,z（/32768） |
| 22,24,26 | int16 ×3 | acc x,y,z（/32768） |
| 28,30,32,34,36,38 | uint16 ×6 | press P0〜P5（ADC 生値） |

既知の制約: header 55/56 では**パケット内全サンプルが同一タイムスタンプ**になります
（200Hz でも 4 サンプルが同時刻）。サンプル順は `packet_number`（0 始まり）で判別してください。

## 単位系

| コールバック | 値 | 単位 |
|---|---|---|
| `gotAcc` / `gotGyro` / `gotQuat` | int16/32768 | 正規化値 -1..1 |
| `gotConvertedAcc` | 正規化値 × accRange（既定 16） | G |
| `gotConvertedGyro` | 正規化値 × gyroRange（既定 2000） | deg/s |
| `gotEuler` | quaternion から変換 | **rad**（pitch/roll/yaw） |
| `gotPress` | uint16 そのまま | **ADC 生値（物理量ではない）** |

レンジ（accRange/gyroRange）は `getDeviceInformation()` の `range` から取得された値が
パースに反映されます。

### 圧力 ADC 生値の扱い（重要）

`press.values` は **無次元の ADC 生値**です。体重[kg]や荷重[N]ではありません。

- 個体差・装着差・温度で大きく変わるため、**機種間・個体間の生値比較は無意味**
- 物理量的な扱いが必要な場合はアプリ起動時に 2 点キャリブレーション
  （`OrpheInsoleUtils.PressureCalibrator`、無負荷時・全体重時）を行い 0..1 に正規化する
- uint16 上限（65535）に張り付いたチャネルは飽和 → `OrpheInsoleUtils.validatePress` の
  `SATURATED_CH` フラグで検出できる

## mount_position ビット定義

`getDeviceInformation()` が返す `device_information.mount_position`:

| bit | 0 | 1 |
|---|---|---|
| bit0 | LEFT（左足） | RIGHT（右足） |
| bit1 | 足底（インソール） | 足背（アッパー装着） |

**`insoles[0]` が左足とは限りません。** 必ず `mount_position` で判定してください。
`OrpheInsoleUtils.sideFromMountPosition(mount_position)` が
`{side: 'left'|'right', surface: 'plantar'|'dorsal'}` を返します。

## 圧力チャネルの物理配置とリマップ方針

チャネル番号（P0〜P5）と足底上の物理位置の対応は**モデルによって異なる場合があります**。

- SDK の既定レイアウトは `OrpheInsoleUtils.SENSOR_LAYOUT`（右足基準・実機採寸値）
- 左足は `mirrorForSide(SENSOR_LAYOUT, 'left')` で x 軸反転
- 配置が異なるモデルでは、**チャネル→位置のリマップ層を1枚挟み**、
  アプリロジックは位置ベース（前足部/踵部など）で書く
  （[PRESSURE_RECIPES.md](./ai/PRESSURE_RECIPES.md) レシピ4の REGION パターン）

## アドバタイズメント（接続前の gotStatus）

manufacturer data（company ID 0x0000）から `gotStatus` に渡される値:

| バイト | 内容 |
|---|---|
| 5 | model_type |
| 6 | mounting_position |
| 7 | human_activity_recognition |
| 14 | battery |
| 15–17 | version（major.minor.patch） |

## 免責事項

本仕様はリバースエンジニアリングではなく SDK 実装のドキュメント化です。
ファームウェア更新により変わる可能性があります。本ライブラリは医療機器ではありません。
