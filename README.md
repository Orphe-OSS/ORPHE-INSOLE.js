# ORPHE-INSOLE.js
Happy hacking for ORPHE INSOLE module on javascript.

> [!CAUTION]
> 現在ベータ版での提供です。細かなチュートリアルやドキュメントは整備中です。動作確認やフィードバックをお待ちしています。

## 動作確認
まずは手元のORPHE INSOLEを[sensor dashboard](https://orphe-oss.github.io/ORPHE-INSOLE.js/examples/sensor-dashboard)ページで接続し、値が取得できるかを確認してみましょう

## Getting Started
動作を確認できたら、以下のコードを利用して、ORPHE INSOLEの値を取得してみましょう。

```javascript
<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>ORPHE INSOLE JS</title>
    </head>
    <body>
      <h1>Hello, ORPHE-INSOLE.js!</h1>
      <button onclick="insole.begin();">connect</button>
      <p id="sensor-data"></p>
      <script src="https://cdn.jsdelivr.net/gh/Orphe-OSS/ORPHE-INSOLE.js@latest/dist/orphe-insole.min.js"></script>
      <script>
      var insole = new Orphe(0);
      window.onload = function () {
        // ORPHE INSOLE Init
        insole.setup();
        insole.gotPress = function(press){
          document.getElementById("sensor-data").innerText = JSON.stringify(press)
        }
      }
      </script>
    </body>
  </html>
```

### CDN
```
<script src="https://cdn.jsdelivr.net/gh/Orphe-OSS/ORPHE-INSOLE.js@latest/dist/orphe-insole.min.js"></script>
```

## 開発者向け情報
### 環境構築
必要なパッケージはnpmで事前にインストールしておきます。
```
git clone https://github.com/Orphe-OSS/ORPHE-INSOLE.js.git
cd ORPHE-INSOLE.js
npm install
```
### CDN用の圧縮ソースファイル生成
圧縮ソースファイルは/dist以下に置きます。orphe-insole.min.jsを生成するには、以下のコマンドを実行してください。/dist 以下の圧縮されたorphe-insole.min.jsが保存されます。
```
npm install terser --save-dev
```
```
npm run build:min
```

### APIドキュメント生成
ORPHE-INSOLE.jsのAPIドキュメントを生成するには、以下のコマンドを実行してください。ORPHE-INSOLE.jsファイルを直接jsdoc方式でコメントインして、以下のコマンドを実行するとdocs/にドキュメントが生成されます。jsdocの設定は、`jsdoc.json`に記述されています。ソースコードの変更があった場合に利用します。
```
npm run generate-docs
```

 ##  BLE情報
 characteristicに関しては、device information, update sensor values, date timeの3つのサービスを利用しています。これはORPHE COREと同じUUIDです。
   * device information: 01a9d6b5-ff6e-444a-b266-0be75e85c064
   * update sensor values: f3f9c7ce-46ee-4205-89ac-abe64e626c0f
   * date time: f53eeeb1-b2e8-492a-9673-10e0f1c29026

### Device Information
coreの時とは異なり、sensor_valuesの値を取得形式を変更する手段になっています。任意のデータをwriteすることで以下の通りのデータ形式になります。
 * 0x0D,0x01：リアルタイムデータを取得（従来の200Hz魔改造版のデータ形式）
 * 0x0D,0x02: 任意データ取得（現在未対応）
 * 0x0D,0x03: リアルタイム（ジャイロ、加速度、圧力）200Hz
 * 0x0D,0x04: リアルタイム（ジャイロ、加速度、圧力、クオータニオン）100Hz -- デフォルト

### Update Sensor Values
センサーの値を更新するためのサービスです。device informationを通じてデータを送信すると、送信フォーマットを変更することができます。デフォルトでは0x0D,0x04の100Hzreal time送信になります。

### Date Time
センサから送信されてくるタイムスタンプ情報を同期するために利用します。ユーザサイドからの操作は基本的には不要です。

## Requirements
 * float16.js, https://github.com/petamoriken/float16
 * quaternion.js, https://github.com/infusion/Quaternion.js

## Copyright and licensing
 * Copyright (C) 2025, Tetsuaki BABA and ORPHE.inc under the MIT License.
