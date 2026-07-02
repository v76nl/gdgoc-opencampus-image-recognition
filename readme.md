# gdgoc-opencampus-image-recognition

オープンキャンパスの環境 (502WS / PC室) で開発体験を行うことが可能な、画像解析GUIアプリプロジェクト

## オープンキャンパスの環境

- vscodeあり
- pythonなし
- Android Studioあり

## 仕組み

Base64 + TensorFlow.js。
ローカルサーバーが立てにくい環境なので、CORSやWebGL Tainted canvas エラーを回避するため、画像ファイルをあらかじめ Python で Base64 データ URL 形式に変換し、JavaScript の定数として `images.js` に出力しておく。

## その他

- 機能: 判定結果の簡略化・日本語化

    判定時に、ImageNet の専門的な品種名（tabby, golden retriever 等）を自動で「ネコ (cat)」「イヌ (dog)」のように分かりやすい日本語に翻訳して出力します。

- 技術的な補足

    ピクセル差分の計算処理は、Canvas 標準の `Uint8ClampedArray` (1次元の型付き配列) のまま直接アクセスして処理。オブジェクトへの変換を挟まないことで、メモリアロケーションと型変換のオーバーヘッドを無くしている。

## ディレクトリ構造

```text
.
├── hands-on/                    # 参加者が作業するフロントエンド側
│   ├── index.html               # アプリの画面構造
│   ├── style.css                # 画面のスタイル定義
│   ├── script.js                # 画像処理および推論のフロントロジック
│   └── images.js                # base64エンコードされた画像データ（自動生成）
│
└── prepare/                     # 運営が事前に使用する、画像のbase64化および確認スクリプト
    ├── main.py                  # 敵対的サンプル画像生成＆base64変換スクリプト
    └── assets/                  # 生成された画像ファイル（オリジナル・ハック後）
```

## TODO

- setup
    1. 誤認識部分を切り出す
    2. 参加者に書いてもらう部分をTODOとして切り出す
- others
    1. 確認などのためにWeb公開 (本番ではローカルでやるので使わないが)
