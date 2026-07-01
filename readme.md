# gdgoc-opencampus-image-recognition

オープンキャンパスの環境 (PC室) で画像解析GUIアプリの開発を体験してもらうための、各種アプローチをまとめたリポジトリ

## オープンキャンパスの環境

- vscodeあり
- pythonなし
- Android Studioあり

## アプローチ

### 1. base64img-tfjs

- 成功した
- アプローチの概要
    - 画像ファイルをあらかじめ Python で Base64 データ URL 形式に変換し、JavaScript の定数として `images.js` に出力しておくアプローチ
    - ローカル環境で発生する CORS 制限や WebGL の Tainted canvas エラーを回避し、Web サーバーを立てることなくブラウザ単体で TensorFlow.js による画像認識とピクセル解析が実行可能
- このアプローチのメリット
    - Webブラウザ上で動作する
    - PythonやモデルのバイナリをPCに置く必要がない
    - モデルも CDN からダウンロードできるので、ネットワークさえつながっていれば動作する
- このアプローチのデメリット・懸念点
    - ?

- 技術的な補足
  ピクセル差分の計算処理は、Canvas 標準の `Uint8ClampedArray` (1次元の型付き配列) のまま直接アクセスして処理。オブジェクトへの変換を挟まないことで、メモリアロケーションと型変換のオーバーヘッドを無くしている。

## ディレクトリ構造

```text
.
├── handson-base64img-tfjs/      # 参加者が作業するフロントエンド側
│   ├── index.html               # アプリの画面構造
│   ├── style.css                # 画面のスタイル定義
│   ├── script.js                # 画像処理および推論のフロントロジック
│   └── images.js                # base64エンコードされた画像データ（自動生成）
│
└── prepare-base64img-tfjs/      # 画像のbase64化および確認スクリプト
    ├── main.py                  # 敵対的サンプル画像生成＆base64変換スクリプト
    └── assets/                  # 生成された画像ファイル（オリジナル・ハック後）
```

## TODO

- setup
    1. 誤認識部分を切り出す
    2. 参加者に書いてもらう部分をTODOとして切り出す
- others
    1. favicon (iTLのロゴ?)
    2. 確認などのためにWeb公開 (本番ではローカルでやるので使わない)
