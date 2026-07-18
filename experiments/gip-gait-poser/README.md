# Gait Inertial Poser (GIP) for ORPHE INSOLE — 実験 / private

論文 **Hori, Deguchi, Maruyama, Tada, Saito, “Gait Inertial Poser (GIP): Gait‑Aware
Human Motion Capture Using Shoe‑Embedded IMUs,” IEEE Access, 2025**
（[document/11214366](https://ieeexplore.ieee.org/document/11214366) / DOI
[10.1109/ACCESS.2025.3624393](https://doi.org/10.1109/ACCESS.2025.3624393)、CC BY 4.0）
の手法を **ORPHE INSOLE** で試すための実験施策です。

原論文は **靴に埋め込んだ2つのIMUだけ**で、平地・直進歩行時の**全身姿勢**を推定します。
本ページはその考え方（直進限定・ドリフト回避・Body/Gait/Smoothing の3モジュール構成）を、
**ブラウザ上でシミュレーションと実機テストの両方を簡単に試せる**形で再実装したものです。

> **位置づけ:** `examples/` の公開デモとは分け、`experiments/` 配下の非公開・実験扱いにしています。
> 原論文の学習済みモデル（Transformer/VAE の重み）は未公開のため、
> 各モジュールは **測定値駆動の近似**で再現しています（下表参照）。

---

## 使い方

Chrome / Edge（Web Bluetooth 対応ブラウザ）で `index.html` を開くだけです。
p5.js・Bootstrap を CDN から読み込むので**インターネット接続**が必要です（他の `examples/` と同じ）。

```
# リポジトリ直下で簡易サーバを立てて開く例
npx http-server . -p 8080
# → http://localhost:8080/experiments/gip-gait-poser/
```

### ① シミュレーション（Ground Truth 付き・実機不要）
- 身長/体重/年齢/性別を入力 → Body Module が個別スケルトンを生成
- ケイデンス・ストライド倍率・IMUノイズを調整して **Start**
- 既知の正解歩行から**合成IMU（加速度・角速度）＋圧力**を生成し、GIP パイプラインで推定
- **青=推定 / 灰=正解ghost** を重ね、関節位置誤差・ストライド誤差をリアルタイム表示

### ② 実機（ORPHE INSOLE 2台）
- ストリーミングモード（4=100Hz/quat込み・推奨、3=200Hz/圧力込み・quatなし）を選択
- 各パネルの Connect で左右（id0=左, id1=右）を接続 → **Start**
- 実機がなくても「シミュレータで動かす」にチェックすれば同じUIで確認できます
  （`buildInsoleToolkit(..., {simulator:true})`）

推定される歩行パラメータ: **ケイデンス / ストライド長 / 歩行速度 / 左右対称性 /
4相の歩行相（L・R）**、および足先軌跡（上面・側面）と歩行相タイムライン。

---

## 論文との対応（重要）

| 論文モジュール | 本実験の実装 | ファイル |
|---|---|---|
| **Body Module**（属性→SMPL 形状 β を MLP 回帰） | 属性→人体計測比（Winter/Drillis‑Contini、身長Hに対する各セグメント比）で個別スケルトン生成 | `gip/body-model.js` |
| **Gait Module**（Transformer→歩行相・6D関節角・root速度/高さ・足高さ） | 圧力6ch/IMUで4相・接地検出＋**ZUPT足先軌跡**（＝論文の Integration+ZUPT ベースライン）。ストライド/ケイデンス/速度/対称性を実測 | `gip/gait-module.js` |
| **Smoothing Module**（VAE＋ZUPT損失で平滑・ドリフト抑制） | **4次Butterworth(10Hz)**＋**C²平滑**＋接地時の足速度/足高さ=0拘束。VAEの損失（`Lsmooth`/`Lfvel`/`Lfpos`）と同じ目的を**解析的**に実装 | `gip/smoothing.js` |
| 関節角回帰＋FK→全身姿勢 | 実測の歩行相・ストライドで**正規歩行テンプレ**（Winter標準の股/膝/足関節角、腕振りは脚と逆位相）を駆動しFK再構成 | `gip/pose.js` |
| **合成IMU**（SMPLメッシュから微分生成） | 正解歩行の足の並進を2階差分＋回転を1階差分して合成IMU＋圧力を生成（閉ループ検証用） | `gip/synthetic.js` |

**INSOLE ならではの改善:** 原論文のデモは圧力のない ORPHE CORE を使用。INSOLE は
**6ch圧力**を持つため、接地/離地・踵接地/踵離地の検出が IMU 単独より安定します
（論文が Future Work に挙げた「インソール圧力の統合」に相当）。

### ドリフト回避の要点（論文の中核）
- 直進歩行に限定し、**グローバル yaw を使わない**。前進方向は水平面の主成分（PCA）で決定
- 重力は**四元数で世界座標へ回した加速度のストライド平均**として推定（軸の取り方に依存しない）。
  quat が無いモード3では、ジャイロ積分姿勢＋接地時加速度から同じ手法で推定
- 各接地で速度を0にし（ZUPT）、遊脚区間の残差ドリフトを線形除去 → ストライド長を安定推定

### 限界
- 関節角は正規歩行テンプレの**測定駆動近似**（学習済み重みが公開されれば差し替え可能）。
  病的歩行（片麻痺・パーキンソン等）の細部は再現しません
- 対象は**平地・直進歩行のみ**。旋回・ジョギングは範囲外（旋回検出インジケータあり）
- 圧力チャネルの物理配置はモデル依存。`gait-module.js` の `heelChannels`/`forefootChannels`
  は要確認（既定は `src/InsoleUtils.js` の SENSOR_LAYOUT に基づく heel=[5], forefoot=[0..3]）
- L/R の割り当ては既定 id0=左/id1=右。実機では `device_information.mount_position`
  （`OrpheInsoleUtils.sideFromMountPosition`）で確定するのが正確

---

## ファイル構成

```
experiments/gip-gait-poser/
├── index.html            # UI（モード切替 / 属性 / 3Dアバター / 指標 / 軌跡・相プロット）
├── gip/
│   ├── body-model.js     # Body Module（純関数・Nodeテスト可）
│   ├── gait-module.js    # Gait Module: 相検出＋ZUPT（純関数＋オンライン FootTracker）
│   ├── smoothing.js      # Smoothing: Butterworth / C² / 接地拘束（純関数）
│   ├── pose.js           # 正規歩行テンプレ→全身FK再構成（純関数）
│   ├── synthetic.js      # 合成歩行→合成IMU（閉ループ検証・純関数）
│   ├── viz.js            # p5.js スケルトン＋2D軌跡/相プロット（ブラウザ）
│   └── app.js            # 配線（sim/real、InsoleToolkit連携）（ブラウザ）
└── README.md
```

`gip/*.js` の純ロジック（viz/app 以外）は Node で単体テストしています:
`tests/gip-gait.test.js`（`npm test` に含む）。合成IMU→Gait Module でケイデンス・
ストライドが復元できること（quatパスで誤差数%）を閉ループで検証済み。

---

## 参考文献・論文取得URL（東大アカウントでの取得メモ）

**結論: 主要論文はすべて無料ルートあり。UTokyo の機関アクセスは基本不要**で、
公式組版PDFが欲しい ACM/Wiley/Elsevier 版のときだけ使う価値があります。
唯一「申請」が要るのは AIST 歩行DB（ただし無料）です。

| 文献 | 取得URL | 区分 |
|---|---|---|
| **GIP（本論文）** | https://ieeexplore.ieee.org/document/11214366 （IEEE Access はフルOA/CC BY） | OPEN |
| UnderPressure（Mourot+ 2022, 圧力インソール+IMUデータセット） | arXiv https://arxiv.org/abs/2208.04598 ／ コード+データ https://github.com/InterDigitalInc/UnderPressure | OPEN |
| IMUPoser（Mollyn+ CHI2023） | 著者PDF https://www.figlab.com/research/2023/imuposer ／ コード https://github.com/FIGLAB/IMUPoser ／ 公式 https://dl.acm.org/doi/10.1145/3544548.3581392 | 著者PDF=OPEN / ACM=要機関 |
| MobilePoser（Xu+ UIST2024） | arXiv https://arxiv.org/abs/2504.12492 ／ コード https://github.com/SPICExLAB/MobilePoser ／ 公式 https://dl.acm.org/doi/10.1145/3654777.3676461 | arXiv=OPEN / ACM=要機関 |
| Transformer Inertial Poser（TIP, Jiang+ SIGGRAPH Asia2022, 論文[17]） | arXiv https://arxiv.org/abs/2203.15720 ／ コード https://github.com/jyf588/transformer-inertial-poser | OPEN |
| SMPL（Loper+ 2015） | 論文PDF https://is.mpg.de/publications/smpl-2015 ／ **モデル配布** https://smpl.is.tue.mpg.de （要登録・研究ライセンス。Web公開への再配布は不可） | OPEN（要登録） |
| VQF（Laidig & Seel 2023, 姿勢推定フィルタ） | arXiv https://arxiv.org/abs/2203.17024 ／ コード https://github.com/dlaidig/vqf | OPEN |
| **AIST Gait Database 2019**（GIP の学習元） | https://unit.aist.go.jp/harc/ExPART/GDB2019_e.html （**無料の利用申請**が必要） | 要申請（無料） |
| 6D 回転表現（Zhou+ CVPR2019, 論文[95]） | CVF https://openaccess.thecvf.com/content_CVPR_2019/html/Zhou_On_the_Continuity_of_Rotation_Representations_in_Neural_Networks_CVPR_2019_paper.html ／ arXiv https://arxiv.org/abs/1812.07035 | OPEN |

*（このセッションのプロキシは arXiv/IEEE/ACM への直接取得が 403 でブロックされていたため、
URL は検索結果で存在確認したものです。実際の取得は上記URLへ。GIP コードは
https://github.com/RyosukeHori/GaitInertialPoser に「近日公開」とだけあり、本実験は論文本文から再構成しています。）*

### 数値の出典（本実装の根拠）
- 正規歩行の矢状面関節角（股/膝/足）… Winter, *Biomechanics and Motor Control of Human Movement*
- 人体セグメント長比（身長Hに対する比）… Winter (1990) / Drillis & Contini (1966)
- ZUPT（足装着IMUの歩行者推測航法）… 標準的な strapdown+ゼロ速度更新＋歩間ドリフト補正
