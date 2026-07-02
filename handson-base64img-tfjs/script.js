let model = null;
const mainCanvas = document.getElementById("mainCanvas");
const mainCtx = mainCanvas.getContext("2d");
const xaiCanvas = document.getElementById("xaiCanvas");
const xaiCtx = xaiCanvas.getContext("2d");

// オリジナル画像のピクセルデータを保存しておく変数
let originalImageData = null;
// 現在ロードされている画像のピクセルデータ
let currentImageData = null;

// 現在選択されている対象 (dog / cat)
let currentSubject = "dog";

function selectSubject(subject) {
    currentSubject = subject;
    
    // タブのスタイル更新
    document.querySelectorAll(".tab-button").forEach(btn => {
        btn.classList.remove("active");
    });
    const activeTab = document.getElementById(`${subject}Tab`);
    if (activeTab) {
        activeTab.classList.add("active");
    }
    
    // 対象切り替え時に自動的にオリジナル画像をロードして表示
    loadOriginalImage();
    loadSelectedImage("original");
}

function loadSelectedImage(type) {
    const base64 = type === "original"
        ? (currentSubject === "dog" ? DOG_ORIGINAL_IMAGE_BASE64 : CAT_ORIGINAL_IMAGE_BASE64)
        : (currentSubject === "dog" ? DOG_HACKED_IMAGE_BASE64 : CAT_HACKED_IMAGE_BASE64);
    drawImage(base64);
}

function loadOriginalImage() {
    const img = new Image();
    img.src = currentSubject === "dog" ? DOG_ORIGINAL_IMAGE_BASE64 : CAT_ORIGINAL_IMAGE_BASE64;
    img.onload = () => {
        try {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = 224;
            tempCanvas.height = 224;
            const tempCtx = tempCanvas.getContext("2d");
            tempCtx.drawImage(img, 0, 0, 224, 224);
            originalImageData = tempCtx.getImageData(
                0,
                0,
                224,
                224
            );
        } catch (e) {
            document.getElementById("resultBox").innerText =
                "オリジナル画像データ取得エラー: " + e.message;
        }
    };
    img.onerror = (e) => {
        document.getElementById("resultBox").innerText =
            "オリジナル画像ロードエラー";
    };
}

async function loadModel() {
    document.getElementById("resultBox").innerText =
        "AIモデルを読み込み中……";
    model = await mobilenet.load({ version: 2, alpha: 1.0 });
    document.getElementById("resultBox").innerText =
        "AIモデルの準備が完了しました。";
}

function drawImage(imageSrc) {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
        mainCtx.drawImage(img, 0, 0, 224, 224);
        currentImageData = mainCtx.getImageData(0, 0, 224, 224);

        // 画像切り替え時はXAIキャンバスをクリアする
        xaiCtx.clearRect(0, 0, 224, 224);
        document.getElementById("resultBox").innerText =
            "画像をロードしました。解析を実行してください。";
    };
}

// 英語の判定結果を日本語（およびシンプルな英語表記）に翻訳・簡略化する関数
function translateClassName(className) {
    const lower = className.toLowerCase();
    
    if (lower.includes("banana")) {
        return "バナナ (banana)";
    }
    
    // 猫の判定
    if (
        lower.includes("cat") || 
        lower.includes("tabby") || 
        lower.includes("siamese") || 
        lower.includes("persian")
    ) {
        return "ネコ (cat)";
    }
    
    // 犬の判定
    if (
        lower.includes("dog") || 
        lower.includes("retriever") || 
        lower.includes("saluki") || 
        lower.includes("setter")
    ) {
        return "イヌ (dog)";
    }
    
    return className;
}

async function runInference() {
    if (!model) {
        alert("AIモデルの読み込みが終わっていません。");
        return;
    }
    document.getElementById("resultBox").innerText = "解析中...";

    const predictions = await model.classify(mainCanvas);
    const topPrediction = predictions[0];
    const probability = (topPrediction.probability * 100).toFixed(
        2
    );

    const displayClassName = translateClassName(topPrediction.className);

    document.getElementById("resultBox").innerText =
        `判定結果: ${displayClassName} (確信度: ${probability}%)`;
}

function visualizeDifference() {
    try {
        if (!originalImageData || !currentImageData) {
            alert("画像の読み込みが不十分です。");
            return;
        }

        const diffImageData = xaiCtx.createImageData(224, 224);
        const diffData = diffImageData.data;
        const origData = originalImageData.data;
        const currData = currentImageData.data;

        for (let i = 0; i < origData.length; i += 4) {
            const rDiff = Math.abs(origData[i] - currData[i]);
            const gDiff = Math.abs(
                origData[i + 1] - currData[i + 1]
            );
            const bDiff = Math.abs(
                origData[i + 2] - currData[i + 2]
            );

            const totalDiff = rDiff + gDiff + bDiff;

            // ピクセルに差分がある箇所を赤く発光させる
            if (totalDiff > 0) {
                diffData[i] = 255;
                diffData[i + 1] = 0;
                diffData[i + 2] = 0;
                diffData[i + 3] = 255;
            } else {
                diffData[i] = currData[i];
                diffData[i + 1] = currData[i + 1];
                diffData[i + 2] = currData[i + 2];
                // 背景の画像を薄く表示させる
                diffData[i + 3] = 50;
            }
        }

        xaiCtx.putImageData(diffImageData, 0, 0);
        document.getElementById("resultBox").innerText =
            "XAIフィルターを適用しました。";
    } catch (e) {
        document.getElementById("resultBox").innerText =
            "エラー: " + e.message;
    }
}

// 初期化処理の実行
selectSubject("dog");
loadModel();
