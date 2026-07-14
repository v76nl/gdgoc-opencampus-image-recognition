# gdgoc-opencampus-image-recognition

オープンキャンパスの環境 (iTL502WS / PC室) で開発体験を行うことが可能な、画像解析GUIアプリプロジェクト

3_completeを試す: https://v76nl.github.io/gdgoc-opencampus-image-recognition/3_complete/index.html

2_basic-answerを試す: https://v76nl.github.io/gdgoc-opencampus-image-recognition/2_basic-answer/index.html

1_incompleteを試す: https://v76nl.github.io/gdgoc-opencampus-image-recognition/1_incomplete/index.html

## ディレクトリ構造

```text
gdgoc-opencampus-image-recognition
├── hands-on/                    # フロントエンド側コード
│   ├── index.html               # 完成版（complete）へのリダイレクトHTML
│   ├── images.js                # base64エンコードされた画像データ（自動生成・各バージョンで共有）
│   ├── 1_incomplete/            # ① 参加者配布用テンプレート（TODO部分あり、未完成な状態）
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   │
│   ├── 2_basic-answer/          # ② 最低限の機能が動作する中間状態のコード
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   │
│   └── 3_complete/              # ③ 全機能が実装済みの答えのコード
│       ├── index.html
│       ├── style.css
│       └── script.js
│
└── prepare/                     # 運営が事前に使用する、画像のbase64化および確認スクリプト
    ├── main.py                  # 敵対的サンプル画像生成＆base64変換スクリプト
    └── assets/                  # 生成された画像ファイル（オリジナル・ハック後）
```

## 参加者向けTODO

1. HTML: ボタンを見かけだけ作成する
2. HTML: ボタンに機能を付加する

    JS側では `load_selected_image()` は実装済みなので「画像を読込」ボタンは動くが、`run_inference()` が未実装なのでAI解析は行われない

3. CSS: ボタンに色をつける
4. JS: `run_inference()` を実装する

## 開発TODO

現在なし

## オープンキャンパスの環境

- vscodeあり
- pythonなし
- Android Studioあり

## 仕組み

Base64 + TensorFlow.js。<br>
ローカルサーバーが立てにくい環境なので、CORSやWebGL Tainted canvas エラーを回避するため、画像ファイルをあらかじめ Python で Base64 データ URL 形式に変換し、JavaScript の定数として `images.js` に出力しておく。

## その他

- 機能: 判定結果の簡略化・日本語化

    判定時に、ImageNet の専門的な品種名（tabby, golden retriever 等）を自動で「ネコ (cat)」「イヌ (dog)」のように分かりやすい日本語に翻訳して出力する。

- 技術的な補足

    ピクセル差分の計算処理は、Canvas 標準の `Uint8ClampedArray` (1次元の型付き配列) のまま直接アクセスして処理。オブジェクトへの変換を挟まないことで、メモリアロケーションと型変換のオーバーヘッドを無くしている。

- `hands-on/` にはpngファイルがあるが、実際に使う画像の本体はimages.jsにあるbase64文字列なので、これらpngファイルはあくまでイメージのためだけ。

## ファイル単位での比較

- 1_incomplete と 2_basic-answer の比較

    ```bash
    git diff --no-index hands-on/1_incomplete/script.js hands-on/2_basic-answer/script.js
    git diff --no-index hands-on/1_incomplete/index.html hands-on/2_basic-answer/index.html
    git diff --no-index hands-on/1_incomplete/style.css hands-on/2_basic-answer/style.css
    ```

- 2_basic-answer と 3_complete の比較

    ```bash
    git diff --no-index hands-on/2_basic-answer/script.js hands-on/3_complete/script.js
    git diff --no-index hands-on/2_basic-answer/index.html hands-on/3_complete/index.html
    git diff --no-index hands-on/2_basic-answer/style.css hands-on/3_complete/style.css
    ```
