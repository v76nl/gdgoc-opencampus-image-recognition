let model = null;
const mainCanvas = document.getElementById("mainCanvas");
const mainCtx = mainCanvas.getContext("2d");

// 現在ロードされている画像のピクセルデータ
let currentImageData = null;

// AIで解析を行うプログラムの部分
// (inference: 推論する)
async function run_inference() {
    show_notification("AI解析機能が実装されていません。指示をお待ちください。", "info");
    // if (!model) {
    //     show_notification(
    //         "AIモデルの読み込みが終わっていません。準備が完了するまでお待ちください。",
    //         "warning"
    //     );
    //     return;
    // }
    // document.getElementById("resultBox").innerText = "解析中...";
    //
    // const predictions = await model.classify(mainCanvas);
    // const topPrediction = predictions[0];
    // const probability = (topPrediction.probability * 100).toFixed(2);
    //
    // const displayClassName = translate_class_name(topPrediction.className);
    //
    // document.getElementById("resultBox").innerText =
    //     `判定結果: ${displayClassName} (確信度: ${probability}%)`;
}

function load_selected_image() {
    draw_image(DOG_ORIGINAL_IMAGE_BASE64);
}

// 通知トーストを表示する関数
function show_notification(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = message;

    container.appendChild(toast);

    // 3秒後にフェードアウトを開始し、3.5秒後に削除
    setTimeout(() => {
        toast.classList.add("fade-out");
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3000);
}

async function load_model() {
    show_notification("AIモデルを読み込み中……そのままお待ちください。", "info");
    model = await mobilenet.load({ version: 2, alpha: 1.0 });
    show_notification("AIモデルの準備が完了しました。", "success");
}

function draw_image(imageSrc) {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
        mainCtx.drawImage(img, 0, 0, 224, 224);
        currentImageData = mainCtx.getImageData(0, 0, 224, 224);
        show_notification("画像をロードしました。", "success");
    };
}

// 英語の判定結果を日本語（およびシンプルな英語表記）に翻訳・簡略化する関数
function translate_class_name(className) {
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

// 初期化処理の実行
const faviconLink = document.getElementById("favicon");
if (faviconLink && typeof FAVICON_BASE64 !== "undefined") {
    faviconLink.href = FAVICON_BASE64;
}
load_model();
