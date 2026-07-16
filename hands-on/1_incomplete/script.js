let model = null;
const mainCanvas = document.getElementById("mainCanvas");
const mainCtx = mainCanvas.getContext("2d");

// 現在ロードされている画像のピクセルデータ
let currentImageData = null;

// AIで画像認識を行うプログラムの部分
// (inference: 推論する)
async function run_inference() {
    show_notification(
        "AI画像認識機能が実装されていません。指示をお待ちください。",
        "info"
    );
    // ここにプログラムを加えてください
}

function load_selected_image() {
    draw_image(LION_ORIGINAL_IMAGE_BASE64);
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

// 英語の判定結果を日本語に翻訳・簡略化する関数
function translate_class_name(className) {
    const lower = className.toLowerCase();

    if (lower.includes("banana")) {
        return "バナナ";
    }

    // ライオンの判定
    if (lower.includes("lion")) {
        return "ライオン";
    }

    // トラの判定
    if (lower.includes("tiger")) {
        return "トラ";
    }

    return className;
}

// 初期化処理の実行
const faviconLink = document.getElementById("favicon");
if (faviconLink && typeof FAVICON_BASE64 !== "undefined") {
    faviconLink.href = FAVICON_BASE64;
}
load_model();
