let model = null;
const mainCanvas = document.getElementById("mainCanvas");
const mainCtx = mainCanvas.getContext("2d");

// 現在ロードされている画像のピクセルデータ
let currentImageData = null;

function loadSelectedImage(type) {
    const base64 = type === "original"
        ? DOG_ORIGINAL_IMAGE_BASE64
        : DOG_HACKED_IMAGE_BASE64;
    drawImage(base64);
}

async function loadModel() {
    const statusEl = document.getElementById("modelStatus");
    statusEl.innerText = "AIモデルを読み込み中……";
    statusEl.classList.remove("ready");
    model = await mobilenet.load({ version: 2, alpha: 1.0 });
    statusEl.innerText = "AIモデルの準備が完了しました。";
    statusEl.classList.add("ready");
}

function drawImage(imageSrc) {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
        mainCtx.drawImage(img, 0, 0, 224, 224);
        currentImageData = mainCtx.getImageData(0, 0, 224, 224);
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

// 初期化処理の実行
const faviconLink = document.getElementById("favicon");
if (faviconLink && typeof FAVICON_BASE64 !== "undefined") {
    faviconLink.href = FAVICON_BASE64;
}
loadSelectedImage("original");
loadModel();
