let model = null;
const mainCanvas = document.getElementById("mainCanvas");
const mainCtx = mainCanvas.getContext("2d");
const xaiCanvas = document.getElementById("xaiCanvas");
const xaiCtx = xaiCanvas.getContext("2d");

// オリジナル画像のピクセルデータを保存しておく変数
let originalImageData = null;
// 現在ロードされている画像のピクセルデータ
let currentImageData = null;

// 現在選択されている対象 (lion / tiger)
let currentSubject = "lion";

async function run_inference() {
    if (!model) {
        show_notification(
            "AIモデルの読み込みが終わっていません。準備が完了するまでお待ちください。",
            "warning"
        );
        return;
    }
    document.getElementById("resultBox").innerText = "解析中...";

    const predictions = await model.classify(mainCanvas);
    const topPrediction = predictions[0];
    const probability = (topPrediction.probability * 100).toFixed(2);

    const displayClassName = translate_class_name(topPrediction.className);

    document.getElementById("resultBox").innerText =
        `判定結果: ${displayClassName} (確信度: ${probability}%)`;
}

function select_subject(subject) {
    currentSubject = subject;

    // タブのスタイル更新
    document.querySelectorAll(".tab-button").forEach((btn) => {
        btn.classList.remove("active");
    });
    const activeTab = document.getElementById(`${subject}Tab`);
    if (activeTab) {
        activeTab.classList.add("active");
    }

    // 対象切り替え時に自動的にオリジナル画像をロードして表示
    load_original_image();
    load_selected_image("original");
}

function load_selected_image(type) {
    const base64 =
        type === "original"
            ? currentSubject === "lion"
                ? LION_ORIGINAL_IMAGE_BASE64
                : TIGER_ORIGINAL_IMAGE_BASE64
            : currentSubject === "lion"
              ? LION_HACKED_IMAGE_BASE64
              : TIGER_HACKED_IMAGE_BASE64;
    draw_image(base64);
}

// オリジナル画像を裏側で読み込んでピクセルデータを保持する関数
function load_original_image() {
    const img = new Image();
    img.src =
        currentSubject === "lion"
            ? LION_ORIGINAL_IMAGE_BASE64
            : TIGER_ORIGINAL_IMAGE_BASE64;
    img.onload = () => {
        try {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = 224;
            tempCanvas.height = 224;
            const tempCtx = tempCanvas.getContext("2d");
            tempCtx.drawImage(img, 0, 0, 224, 224);
            originalImageData = tempCtx.getImageData(0, 0, 224, 224);
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

        // 画像切り替え時はXAIキャンバスをクリアする
        xaiCtx.clearRect(0, 0, 224, 224);
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

function visualize_difference() {
    try {
        if (!originalImageData || !currentImageData) {
            show_notification("画像の読み込みが不十分です。", "warning");
            return;
        }

        const diffImageData = xaiCtx.createImageData(224, 224);
        const diffData = diffImageData.data;
        const origData = originalImageData.data;
        const currData = currentImageData.data;

        for (let i = 0; i < origData.length; i += 4) {
            const rDiff = Math.abs(origData[i] - currData[i]);
            const gDiff = Math.abs(origData[i + 1] - currData[i + 1]);
            const bDiff = Math.abs(origData[i + 2] - currData[i + 2]);

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
        document.getElementById("resultBox").innerText = "エラー: " + e.message;
    }
}

// 初期化処理の実行
const faviconLink = document.getElementById("favicon");
if (faviconLink && typeof FAVICON_BASE64 !== "undefined") {
    faviconLink.href = FAVICON_BASE64;
}
load_model();
