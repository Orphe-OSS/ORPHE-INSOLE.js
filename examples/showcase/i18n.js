/**
 * Lightweight i18n for the showcase page.
 * Mirrors the LP pattern: data-i18n attributes + EN/JA segmented buttons.
 */
(function () {
    const translations = {
        ja: {
            metaTitle: 'ORPHE INSOLE — Showcase',
            metaDescription: 'ORPHE INSOLE の製品紹介・データ理解・SDKの使い方が1つで分かるショーケースです。',
            navLabel: 'ページ内ナビゲーション',
            languageLabel: '言語',
            liveBadgeTitle: '実機未接続の間は記録済み/合成の歩行データを再生しています',
            btUnsupportedTitle: 'Chrome / Edge / Opera でアクセスしてください',
            btUnsupported: 'Web Bluetooth 非対応ブラウザ',
            navSpec: 'スペック',
            navConnect: 'つなぐ',
            navPressure: '圧力',
            navImu: 'IMU',
            navAttitude: '姿勢3D',
            navRecord: '記録',
            navBuy: '購入',
            heroLead: '6チャネルの圧力センサとモーションセンサ（IMU）を内蔵したインソール型IoTセンサー。足裏の荷重分布と足の動きを、最大200Hzでリアルタイムにワイヤレス取得できます。',
            heroImageAlt: 'ORPHE INSOLE の製品画像',
            heroDesc: 'このページは ORPHE INSOLE の<strong>製品紹介・データ理解・SDKの使い方</strong>が1つで分かるショーケースです。実機が無くても歩行データのデモ再生ですべての図が動きます。実機（左右最大2台）を接続すると <span class="badge bg-success">LIVE</span> に切り替わります。',
            heroBuy: 'ORPHE STORE で購入',
            heroContact: '製品ページ・お問い合わせ',
            specTitle: 'スペック & センサ構成',
            specMotionLabel: 'モーションセンサ',
            specMotionValue: '3軸加速度 + 3軸ジャイロ（クォータニオンはSDKで取得可能）',
            specPressureLabel: '圧力センサ',
            specPressureValue: '片足 6点',
            specAccRangeLabel: '加速度レンジ',
            specGyroRangeLabel: 'ジャイロレンジ',
            specPressureRangeLabel: '圧力レンジ',
            specSamplingLabel: 'サンプリングレート',
            specSamplingValue: '100Hz / 200Hz（ストリーミングモードによる）',
            specConnectionLabel: '接続',
            specConnectionValue: 'Bluetooth 5.2（Web Bluetooth 対応）',
            specBatteryLabel: '連続動作時間',
            specBatteryValue: '24時間',
            specChargeLabel: '充電',
            specChargeValue: 'マグネットコネクタ / ワイヤレス充電対応',
            specWeightLabel: '重量',
            specWeightValue: '約87g（片足）',
            specSizeLabel: 'サイズ (US men)',
            specNote: '※ ORPHE INSOLE (Beta) の公称値。アプリケーションにより変動する場合があります。',
            buyTitle: '購入について',
            buyBody: 'ORPHE INSOLE (Beta) は <strong>ORPHE Official Store</strong> の評価キットとして購入できます。共同開発パッケージや研究・事業でのご利用は製品ページのお問い合わせフォームからご相談ください。',
            buyKit: '評価キットを購入（ORPHE STORE）',
            buyContact: '評価キットのお問い合わせ',
            connectTitle: 'つないでみる',
            connectStep1: '充電された INSOLE を用意する',
            connectStep2: 'ページ上部の<strong>トグルスイッチをON</strong>にする（左右2台まで。1台でもOK）',
            connectStep3: 'デバイス選択ダイアログで <code>ORPHE INSOLE</code> を選ぶ',
            connectBody: '接続するとヘッダに実測周波数・<span class="badge bg-success">L</span>/<span class="badge bg-primary">R</span> バッジ（装着位置から自動判定）・バッテリーが表示され、ページ内の左右パネルも実際の足に合わせて並び替わります。 <i class="bi bi-gear"></i> ギアアイコンから<strong>データストリーミングモード</strong>を切り替えられます。',
            connectPrepTitle: '接続前の確認',
            connectPrepItem1: 'ORPHE INSOLE は動きを検知すると自動的にアドバタイズします。',
            connectPrepItem2: '反応しない場合は、軽く動かしてからブラウザのデバイス選択をやり直してください。',
            connectPrepItem3: '圧力値を見る場合は、ギアからモード3または4を選びます。',
            modeDataHeader: 'データ',
            modeRateHeader: '周波数',
            modeUseHeader: '用途',
            mode1Use: '姿勢のみ高速取得',
            mode3Use: '圧力＋IMUの高速取得',
            mode4Use: '全データ（デフォルト）',
            connectBrowserNote: '対応ブラウザ: Chrome / Edge / Opera（Web Bluetooth API が必要）。Firefox / Safari では接続できませんが、このページの閲覧とデモ再生は可能です。',
            snippetMinimalTitle: '最小コード',
            snippetMinimalCode: `&lt;script src="ORPHE-INSOLE.js"&gt;&lt;/script&gt;
&lt;script&gt;
  var insole = new OrpheInsole(0);  // id: 0 or 1 (最大2台)
  insole.setup();                   // begin の前に必須

  // ボタンクリック等のユーザー操作から呼ぶ
  async function connect() {
    await insole.begin('SENSOR_VALUES', {
      streamingMode: 4,     // 1 | 3 | 4
      autoReconnect: true,  // 切断時に自動再接続
    });
  }

  insole.gotPress = function (press) {
    console.log(this.id, press.values);  // 6ch の ADC 生値
  };
&lt;/script&gt;`,
            connectToolkitNote: 'このページのように接続UIごと使いたい場合は <code>InsoleToolkit.js</code> の <code>buildInsoleToolkit()</code> が便利です（トグル・再接続・モード切替UIを自動生成）。',
            pressureTitle: '圧力センサ（6ch × 左右）',
            pressureDesc: '足裏の6点で荷重を計測します。足型マップでは値が大きいほど赤く表示され、<span class="cop-legend"></span> は6点の重み付き平均から計算した<strong>推定中心</strong>です。左右2台を接続すると、体重移動・左右バランスがそのまま観察できます。',
            noticePress: '現在のモード(1)では圧力は配信されません — ギアからモード3/4へ',
            pressureTotalLabel: '合計',
            pressureGaugeEyebrow: 'TOTAL PRESSURE',
            pressureGaugeTitle: '全体圧力ゲージ',
            pressureLeftLabel: '左足',
            pressureRightLabel: '右足',
            snippetPressureTitle: '圧力データの取得',
            snippetPressureCode: `insole.gotPress = function (press) {
  // press.values: [p0..p5] 6ch の ADC 生値 (uint16)
  const total = press.values.reduce((a, b) =&gt; a + b, 0);
};`,
            pressureNote: '<i class="bi bi-exclamation-triangle"></i> 値は ADC 生値です。荷重[N]などの物理量が必要な場合は、無負荷時・既知荷重時のサンプリングによるキャリブレーションをアプリ側で行ってください。チャネルの物理配置はモデルにより異なる場合があります。',
            imuTitle: 'IMU: 加速度・ジャイロ',
            imuDesc: '3軸加速度（±16G）と3軸角速度（±2000dps）。<code>gotAcc</code>/<code>gotGyro</code> は -1..1 の正規化値、<code>gotConvertedAcc</code>/<code>gotConvertedGyro</code> は実値（G / deg/s）を返します。下のチャートは実値です。',
            snippetImuTitle: 'IMUデータの取得',
            snippetImuCode: `insole.gotConvertedAcc = function (acc) {
  // {x, y, z} 単位: G
};
insole.gotConvertedGyro = function (gyro) {
  // {x, y, z} 単位: deg/s
};`,
            attitudeTitle: '姿勢: クォータニオン → 3D',
            attitudeDesc: 'センサ内部で融合計算されたクォータニオン（姿勢）を取得できます。下のCGは受信したクォータニオンを左右それぞれの3Dモデルに適用したものです。実機をつま先上げ・かかと上げ・ひねりの方向に動かしてみてください。',
            noticeQuat: '現在のモード(3)ではクォータニオンは配信されません — ギアからモード1/4へ',
            resetAttitude: '姿勢をリセット（現在の向きを基準にする）',
            modelFollowNote: 'モデル: 装着位置(L/R)に追従',
            statoEyebrow: 'ESTIMATED LOAD CENTER',
            statoTitle: '左右荷重分布の推定中心軌跡',
            statoDesc: '左右それぞれ6点のADC生値から求めた推定中心を、荷重比で合成した30秒軌跡。',
            snippetAttitudeTitle: '姿勢データの取得（モード1/4）',
            snippetAttitudeCode: `insole.gotQuat = function (quat) {
  // {w, x, y, z}
};
insole.gotEuler = function (euler) {
  // {pitch, roll, yaw} 単位: rad
};`,
            recordTitle: 'データ記録（CSV）',
            recordDesc: 'ストリーミング中のデータ（接続中の全デバイス）をCSVとして保存できます。列: <code class="small">device, timestamp, serial_number, press0..5, acc_x/y/z[G], gyro_x/y/z[dps], quat_w/x/y/z, euler_pitch/roll/yaw[rad]</code>（モードにより配信されない列は空欄）。保存したCSVは下の「CSVを読み込んでデモ再生」からループ再生でき、このページのデモ用歩行データとしても利用されます。',
            recordStart: '記録開始',
            recordStop: '記録停止',
            recordStartHtml: '<i class="bi bi-record-fill"></i> 記録開始',
            recordStopHtml: '<i class="bi bi-stop-fill"></i> 記録停止',
            recordDownload: 'CSV保存',
            recordStatusIdle: '未記録',
            recordStatusRecording: '記録中 ({mode}): {rows}行 / {seconds}秒',
            recordStatusReady: '記録済み: {rows}行 — CSV保存できます',
            recordNote: '記録はライブ・デモどちらのデータでも可能です（デモ記録時はファイル名に demo が付きます）。',
            csvInputLabel: 'CSVを読み込んでデモ再生',
            csvLoaded: '{file}: {rows}行 / {seconds}秒 を読み込みました（未接続時にループ再生します）',
            csvLoadFailed: '読み込み失敗: {message}',
            nextTitle: '次のステップ',
            nextDesc: '用途に合わせて他のexampleアプリも試してみてください。すべてこのリポジトリに同梱されています。',
            nextVisualizeBody: '全データのリアルタイムチャート可視化（2台対応）',
            nextDashboardBody: '2台同時の数値ダッシュボード・L/R自動マッピング',
            nextSonifierBody: 'Web Audio による動作の可聴化',
            nextTerminalBody: '生データ・BLEプロトコルのデバッグ',
            apiDocs: 'API ドキュメント',
            programTitle: 'プログラムを自作する',
            programDesc: '独自アプリでは <code>ORPHE-INSOLE.js</code> を読み込み、ユーザー操作から <code>begin()</code> を呼びます。このShowcaseのような接続UIごと使いたい場合は <code>InsoleToolkit.js</code> の <code>buildInsoleToolkit()</code> が便利です。',
            programStepsTitle: '実装の流れ',
            programStep1: '<code>new OrpheInsole(id)</code> でインスタンスを作る。',
            programStep2: '<code>setup()</code> を呼び、ボタン操作などから <code>begin()</code> で接続する。',
            programStep3: '<code>gotPress</code>, <code>gotConvertedAcc</code>, <code>gotConvertedGyro</code>, <code>gotQuat</code> を必要に応じて実装する。',
            programStep4: '接続UIも必要なら <code>buildInsoleToolkit()</code> を使う。',
            contactTitle: '購入・お問い合わせ',
            contactDesc: 'ORPHE のセンサー製品・スマートシューズは ORPHE Official Store で購入できます。<br>ORPHE INSOLE の評価キット・共同開発パッケージ、研究・事業でのご利用のご相談は製品ページのお問い合わせフォームからご連絡ください。',
            contactProduct: 'お問い合わせ（製品ページ）',
            contactIssues: 'SDKの不具合報告 (Issues)',
            copyButton: 'copy',
            copyCopied: 'copied!',
            chartPressureTitle: '圧力 (6ch raw)',
            chartAccTitle: '加速度 [G]',
            chartGyroTitle: 'ジャイロ [deg/s]',
        },
        en: {
            metaTitle: 'ORPHE INSOLE — Showcase',
            metaDescription: 'A showcase for understanding ORPHE INSOLE product details, live data, and SDK usage in one page.',
            navLabel: 'Page navigation',
            languageLabel: 'Language',
            liveBadgeTitle: 'When no device is connected, recorded or synthetic walking data is replayed.',
            btUnsupportedTitle: 'Use Chrome, Edge, or Opera.',
            btUnsupported: 'Web Bluetooth unsupported',
            navSpec: 'Specs',
            navConnect: 'Connect',
            navPressure: 'Pressure',
            navImu: 'IMU',
            navAttitude: '3D Attitude',
            navRecord: 'Record',
            navBuy: 'Buy',
            heroLead: 'A smart insole IoT sensor with six pressure channels and an IMU. Capture plantar pressure distribution and foot motion wirelessly in real time at up to 200 Hz.',
            heroImageAlt: 'ORPHE INSOLE product image',
            heroDesc: 'This showcase explains <strong>ORPHE INSOLE product details, data behavior, and SDK usage</strong> in one page. Even without physical hardware, the demo walking data animates every visualization. Connect real devices, up to one left and one right, and the page switches to <span class="badge bg-success">LIVE</span>.',
            heroBuy: 'Buy at ORPHE STORE',
            heroContact: 'Product page / Contact',
            specTitle: 'Specs & Sensor Layout',
            specMotionLabel: 'Motion sensor',
            specMotionValue: '3-axis acceleration + 3-axis gyroscope; quaternion is available through the SDK',
            specPressureLabel: 'Pressure sensors',
            specPressureValue: '6 points per foot',
            specAccRangeLabel: 'Acceleration range',
            specGyroRangeLabel: 'Gyroscope range',
            specPressureRangeLabel: 'Pressure range',
            specSamplingLabel: 'Sampling rate',
            specSamplingValue: '100 Hz / 200 Hz, depending on streaming mode',
            specConnectionLabel: 'Connection',
            specConnectionValue: 'Bluetooth 5.2 with Web Bluetooth support',
            specBatteryLabel: 'Continuous runtime',
            specBatteryValue: '24 hours',
            specChargeLabel: 'Charging',
            specChargeValue: 'Magnetic connector / wireless charging support',
            specWeightLabel: 'Weight',
            specWeightValue: 'Approx. 87 g per foot',
            specSizeLabel: 'Size (US men)',
            specNote: 'Official values for ORPHE INSOLE (Beta). Values may vary depending on the application.',
            buyTitle: 'Purchase',
            buyBody: 'ORPHE INSOLE (Beta) is available as an Evaluation Kit from the <strong>ORPHE Official Store</strong>. For co-development packages, research, or business use, contact us through the product page.',
            buyKit: 'Buy Evaluation Kit (ORPHE STORE)',
            buyContact: 'Ask about the Evaluation Kit',
            connectTitle: 'Connect a Device',
            connectStep1: 'Prepare a charged INSOLE.',
            connectStep2: 'Turn <strong>ON</strong> the toggle switch in the header. Up to two devices can be used; one device is also fine.',
            connectStep3: 'Choose <code>ORPHE INSOLE</code> in the device selection dialog.',
            connectBody: 'After connection, the header shows measured frequency, <span class="badge bg-success">L</span>/<span class="badge bg-primary">R</span> badges based on mount position, and battery state. The left and right panels are also reordered to match the actual feet. Use the <i class="bi bi-gear"></i> gear icon to change the <strong>data streaming mode</strong>.',
            connectPrepTitle: 'Before Connecting',
            connectPrepItem1: 'ORPHE INSOLE advertises automatically when it detects motion.',
            connectPrepItem2: 'If it does not appear, move it lightly and reopen the browser device picker.',
            connectPrepItem3: 'To inspect pressure values, choose mode 3 or 4 from the gear menu.',
            modeDataHeader: 'Data',
            modeRateHeader: 'Rate',
            modeUseHeader: 'Use',
            mode1Use: 'High-speed attitude only',
            mode3Use: 'High-speed pressure + IMU',
            mode4Use: 'All data (default)',
            connectBrowserNote: 'Supported browsers: Chrome / Edge / Opera with the Web Bluetooth API. Firefox and Safari cannot connect to devices, but the page and demo playback still work.',
            snippetMinimalTitle: 'Minimal Code',
            snippetMinimalCode: `&lt;script src="ORPHE-INSOLE.js"&gt;&lt;/script&gt;
&lt;script&gt;
  var insole = new OrpheInsole(0);  // id: 0 or 1, up to two devices
  insole.setup();                   // required before begin()

  // Call from a user gesture such as a button click.
  async function connect() {
    await insole.begin('SENSOR_VALUES', {
      streamingMode: 4,     // 1 | 3 | 4
      autoReconnect: true,  // reconnect automatically after disconnects
    });
  }

  insole.gotPress = function (press) {
    console.log(this.id, press.values);  // 6ch raw ADC values
  };
&lt;/script&gt;`,
            connectToolkitNote: 'To use the same connection UI as this page, <code>buildInsoleToolkit()</code> from <code>InsoleToolkit.js</code> generates the toggle, reconnect, and mode controls for you.',
            pressureTitle: 'Pressure Sensors (6ch × Left/Right)',
            pressureDesc: 'Six points under each foot measure load. On the foot map, larger values appear redder, and <span class="cop-legend"></span> indicates an <strong>estimated center</strong> calculated from a weighted average of the six raw channels. With two devices connected, you can observe weight shift and left/right balance directly.',
            noticePress: 'Mode 1 does not stream pressure — switch to mode 3 or 4 from the gear menu.',
            pressureTotalLabel: 'Total',
            pressureGaugeEyebrow: 'TOTAL PRESSURE',
            pressureGaugeTitle: 'Total Pressure Gauge',
            pressureLeftLabel: 'Left',
            pressureRightLabel: 'Right',
            snippetPressureTitle: 'Read Pressure Data',
            snippetPressureCode: `insole.gotPress = function (press) {
  // press.values: [p0..p5] 6ch raw ADC values (uint16)
  const total = press.values.reduce((a, b) =&gt; a + b, 0);
};`,
            pressureNote: '<i class="bi bi-exclamation-triangle"></i> Values are raw ADC readings. If you need physical units such as load [N], calibrate in your application by sampling unloaded and known-load states. Physical channel placement may differ by model.',
            imuTitle: 'IMU: Acceleration & Gyroscope',
            imuDesc: '3-axis acceleration (±16G) and 3-axis angular velocity (±2000 dps). <code>gotAcc</code>/<code>gotGyro</code> return normalized -1..1 values, while <code>gotConvertedAcc</code>/<code>gotConvertedGyro</code> return physical values in G and deg/s. The charts below use the converted values.',
            snippetImuTitle: 'Read IMU Data',
            snippetImuCode: `insole.gotConvertedAcc = function (acc) {
  // {x, y, z}, unit: G
};
insole.gotConvertedGyro = function (gyro) {
  // {x, y, z}, unit: deg/s
};`,
            attitudeTitle: 'Attitude: Quaternion → 3D',
            attitudeDesc: 'The SDK can receive quaternions calculated by the sensor fusion process inside the device. The 3D view applies the received quaternion to each left/right model. Try lifting the toe, lifting the heel, or twisting the physical device.',
            noticeQuat: 'Mode 3 does not stream quaternions — switch to mode 1 or 4 from the gear menu.',
            resetAttitude: 'Reset attitude to current orientation',
            modelFollowNote: 'Model follows mount position (L/R)',
            statoEyebrow: 'ESTIMATED LOAD CENTER',
            statoTitle: 'Estimated Center of Left/Right Load Distribution',
            statoDesc: '30-second trace synthesized from each foot’s six-channel raw ADC weighted center and the left/right load ratio.',
            snippetAttitudeTitle: 'Read Attitude Data (Mode 1/4)',
            snippetAttitudeCode: `insole.gotQuat = function (quat) {
  // {w, x, y, z}
};
insole.gotEuler = function (euler) {
  // {pitch, roll, yaw}, unit: rad
};`,
            recordTitle: 'Data Recording (CSV)',
            recordDesc: 'Save streaming data from all connected devices as CSV. Columns: <code class="small">device, timestamp, serial_number, press0..5, acc_x/y/z[G], gyro_x/y/z[dps], quat_w/x/y/z, euler_pitch/roll/yaw[rad]</code>. Columns not streamed by the selected mode are left blank. Saved CSV files can be loaded below for looped demo playback and used as this page’s demo walking data.',
            recordStart: 'Start Recording',
            recordStop: 'Stop Recording',
            recordStartHtml: '<i class="bi bi-record-fill"></i> Start Recording',
            recordStopHtml: '<i class="bi bi-stop-fill"></i> Stop Recording',
            recordDownload: 'Save CSV',
            recordStatusIdle: 'Not recording',
            recordStatusRecording: 'Recording ({mode}): {rows} rows / {seconds}s',
            recordStatusReady: 'Recorded: {rows} rows — CSV is ready to save',
            recordNote: 'Recording works with both live and demo data. Demo recordings include demo in the file name.',
            csvInputLabel: 'Load CSV for Demo Playback',
            csvLoaded: '{file}: loaded {rows} rows / {seconds}s; loops while no device is connected',
            csvLoadFailed: 'Load failed: {message}',
            nextTitle: 'Next Steps',
            nextDesc: 'Try the other example apps depending on your use case. They are all included in this repository.',
            nextVisualizeBody: 'Real-time chart visualization of all data, with two-device support',
            nextDashboardBody: 'Numerical dashboard for two devices with automatic L/R mapping',
            nextSonifierBody: 'Motion sonification with Web Audio',
            nextTerminalBody: 'Debug raw data and BLE protocol behavior',
            apiDocs: 'API Documentation',
            programTitle: 'Build Your Own Program',
            programDesc: 'For a custom app, load <code>ORPHE-INSOLE.js</code> and call <code>begin()</code> from a user action. To reuse the connection UI from this Showcase, use <code>buildInsoleToolkit()</code> from <code>InsoleToolkit.js</code>.',
            programStepsTitle: 'Implementation Flow',
            programStep1: 'Create an instance with <code>new OrpheInsole(id)</code>.',
            programStep2: 'Call <code>setup()</code>, then connect with <code>begin()</code> from a button or other user action.',
            programStep3: 'Implement <code>gotPress</code>, <code>gotConvertedAcc</code>, <code>gotConvertedGyro</code>, and <code>gotQuat</code> as needed.',
            programStep4: 'Use <code>buildInsoleToolkit()</code> when you also need connection UI.',
            contactTitle: 'Purchase / Contact',
            contactDesc: 'ORPHE sensor products and smart shoes are available through the ORPHE Official Store.<br>For ORPHE INSOLE Evaluation Kits, co-development packages, research, or business use, contact us through the product page.',
            contactProduct: 'Contact via Product Page',
            contactIssues: 'Report SDK Issues',
            copyButton: 'copy',
            copyCopied: 'copied!',
            chartPressureTitle: 'Pressure (6ch raw)',
            chartAccTitle: 'Accelerometer [G]',
            chartGyroTitle: 'Gyro [deg/s]',
        },
    };

    let currentLanguage = 'ja';

    function strings() {
        return translations[currentLanguage] || translations.en;
    }

    function interpolate(text, params) {
        if (!params) return text;
        return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
            return Object.prototype.hasOwnProperty.call(params, key) ? params[key] : `{${key}}`;
        });
    }

    function t(key, params, fallback) {
        let actualParams = params;
        let actualFallback = fallback;
        if (typeof params === 'string') {
            actualParams = undefined;
            actualFallback = params;
        }
        const raw = strings()[key] || translations.en[key] || actualFallback || key;
        return interpolate(raw, actualParams);
    }

    function applyStaticText() {
        const selected = strings();
        document.documentElement.lang = currentLanguage;
        document.title = selected.metaTitle;

        const description = document.querySelector('meta[name="description"]');
        if (description) description.setAttribute('content', selected.metaDescription);

        document.querySelectorAll('[data-i18n]').forEach((element) => {
            element.textContent = t(element.dataset.i18n);
        });
        document.querySelectorAll('[data-i18n-html]').forEach((element) => {
            element.innerHTML = t(element.dataset.i18nHtml);
        });
        document.querySelectorAll('[data-i18n-title]').forEach((element) => {
            element.setAttribute('title', t(element.dataset.i18nTitle));
        });
        document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
            element.setAttribute('alt', t(element.dataset.i18nAlt));
        });
        document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
            element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
        });
        document.querySelectorAll('[data-lang-button]').forEach((button) => {
            const active = button.dataset.langButton === currentLanguage;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }

    function setLanguage(language) {
        currentLanguage = translations[language] ? language : 'en';
        applyStaticText();
        window.dispatchEvent(new CustomEvent('showcase:languagechange', {
            detail: { language: currentLanguage },
        }));
    }

    window.ShowcaseI18n = {
        getLanguage: () => currentLanguage,
        setLanguage,
        t,
        html: t,
    };

    document.addEventListener('DOMContentLoaded', () => {
        const requestedLanguage = new URLSearchParams(window.location.search).get('lang');
        setLanguage(translations[requestedLanguage] ? requestedLanguage : currentLanguage);

        document.querySelectorAll('[data-lang-button]').forEach((button) => {
            button.addEventListener('click', () => setLanguage(button.dataset.langButton));
        });
    });
})();
