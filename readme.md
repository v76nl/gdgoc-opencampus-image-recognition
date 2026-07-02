# gdgoc-opencampus-image-recognition

オープンキャンパスの環境 (iTL502WS / PC室) で開発体験を行うことが可能な、画像解析GUIアプリプロジェクト

試す: https://v76nl.github.io/gdgoc-opencampus-image-recognition/

## オープンキャンパスの環境

- vscodeあり
- pythonなし
- Android Studioあり

## 仕組み

Base64 + TensorFlow.js。
ローカルサーバーが立てにくい環境なので、CORSやWebGL Tainted canvas エラーを回避するため、画像ファイルをあらかじめ Python で Base64 データ URL 形式に変換し、JavaScript の定数として `images.js` に出力しておく。

## その他

- 機能: 判定結果の簡略化・日本語化

    判定時に、ImageNet の専門的な品種名（tabby, golden retriever 等）を自動で「ネコ (cat)」「イヌ (dog)」のように分かりやすい日本語に翻訳して出力する。

- 技術的な補足

    ピクセル差分の計算処理は、Canvas 標準の `Uint8ClampedArray` (1次元の型付き配列) のまま直接アクセスして処理。オブジェクトへの変換を挟まないことで、メモリアロケーションと型変換のオーバーヘッドを無くしている。

- `hands-on/` にはpngファイルがあるが、実際に使う画像の本体はimages.jsにあるbase64文字列なので、これらpngファイルはあくまでイメージのためだけ。

## ディレクトリ構造

```text
.
├── hands-on/                    # フロントエンド側コード
│   ├── index.html               # 完成版（complete）へのリダイレクトHTML
│   ├── images.js                # base64エンコードされた画像データ（自動生成・各バージョンで共有）
│   ├── template/                # ① 参加者配布用テンプレート（TODO部分あり、未完成な状態）
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   │
│   ├── basic/                   # ② 最低限の機能が動作する中間状態のコード
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   │
│   └── complete/                # ③ 全機能が実装済みの答えのコード
│       ├── index.html
│       ├── style.css
│       └── script.js
│
└── prepare/                     # 運営が事前に使用する、画像のbase64化および確認スクリプト
    ├── main.py                  # 敵対的サンプル画像生成＆base64変換スクリプト
    └── assets/                  # 生成された画像ファイル（オリジナル・ハック後）
```

## TODO

1. 7/15まで: 犬と猫の画像を表示するボタンを隠す、※隠すだけで、あとで見せる余地は残したいので、削除はしない

    意図: 最初の段階で要素が多いと参加者が混乱しそうだから

2. 7/15まで: html, css, jsの隠す部分、つまり参加者に書いてもらう部分を決め、TODOとして切り出し隠す
3. 誤認識部分を切り出す
