import tensorflow as tf
import numpy as np
from PIL import Image
import requests
from io import BytesIO
import os
import base64

# モデルの読み込み
model = tf.keras.applications.MobileNetV2(weights="imagenet")

# 画像の前処理関数
def preprocess_image(image):
    image = image.resize((224, 224))
    image = tf.keras.preprocessing.image.img_to_array(image)
    # MobileNetV2の入力範囲 [-1, 1] に正規化
    image = tf.keras.applications.mobilenet_v2.preprocess_input(image)
    image = tf.expand_dims(image, axis=0)
    return image

# 画像の復元関数（保存用）
def deprocess_image(processed_image):
    image = processed_image.numpy()
    image = image.reshape((224, 224, 3))
    # [-1, 1] から [0, 255] に戻す
    image = (image + 1.0) / 2.0 * 255.0
    image = np.clip(image, 0, 255).astype(np.uint8)
    return image

# Base64エンコード
def get_base64_data_url(image_array):
    img = Image.fromarray(image_array)
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"

# 対象画像の設定 (ライオンとトラ)
targets = [
    {
        "name": "lion",
        "url": "https://images.unsplash.com/photo-1575550959106-5a7defe28b56?w=224&h=224&fit=crop"
    },
    {
        "name": "tiger",
        "url": "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=224&h=224&fit=crop"
    }
]

# ターゲットクラスの指定
# 954はImageNetにおけるバナナ (banana)
target_class_idx = 954
target_label = tf.one_hot(target_class_idx, 1000)
target_label = tf.reshape(target_label, (1, 1000))

base64_results = {}

for target in targets:
    name = target["name"]
    url = target["url"]
    print(f"\n--- Processing {name} ---")
    
    # 画像の取得
    response = requests.get(url)
    original_pil_image = Image.open(BytesIO(response.content))
    input_image = preprocess_image(original_pil_image)

    # Targeted I-FGSM (Iterative FGSM) による攻撃画像の生成
    adversarial_tensor = tf.convert_to_tensor(input_image, dtype=tf.float32)
    iterations = 20
    alpha = 0.01  # 1ステップあたりのノイズ強度
    epsilon = 0.15  # 許容する最大ノイズ強度

    for i in range(iterations):
        with tf.GradientTape() as tape:
            tape.watch(adversarial_tensor)
            prediction = model(adversarial_tensor)
            loss = - tf.math.log(prediction[0, target_class_idx] + 1e-10)
        
        gradient = tape.gradient(loss, adversarial_tensor)
        signed_grad = tf.sign(gradient)
        
        # ターゲットクラスのLossを下げる（確率を上げる）方向にノイズを加える
        adversarial_tensor = adversarial_tensor - alpha * signed_grad
        # 元の画像からの変化量を [-epsilon, epsilon] にクリップする
        perturbation = tf.clip_by_value(adversarial_tensor - input_image, -epsilon, epsilon)
        adversarial_tensor = input_image + perturbation
        # 入力範囲 [-1, 1] にクリップする
        adversarial_tensor = tf.clip_by_value(adversarial_tensor, -1.0, 1.0)

    # 画像の保存用配列変換
    original_image_array = deprocess_image(tf.convert_to_tensor(input_image))
    adversarial_image_array = deprocess_image(adversarial_tensor)

    original_img = Image.fromarray(original_image_array)
    adversarial_img = Image.fromarray(adversarial_image_array)

    # prepare/ 直下に保存
    current_dir = os.path.dirname(os.path.abspath(__file__))
    original_img.save(os.path.join(current_dir, f"{name}_original.png"))
    adversarial_img.save(os.path.join(current_dir, f"{name}_hacked.png"))

    # hands-on/ 直下にも保存
    handson_dir = os.path.join(current_dir, "..", "hands-on")
    os.makedirs(handson_dir, exist_ok=True)
    original_img.save(os.path.join(handson_dir, f"{name}_original.png"))
    adversarial_img.save(os.path.join(handson_dir, f"{name}_hacked.png"))

    print(f"{name} の画像を保存しました。")
    print(f"画像データの最大差分 (0-255スケール):", np.max(np.abs(original_image_array.astype(float) - adversarial_image_array.astype(float))))

    base64_results[f"{name.upper()}_ORIGINAL"] = get_base64_data_url(original_image_array)
    base64_results[f"{name.upper()}_HACKED"] = get_base64_data_url(adversarial_image_array)

    # テスト推論
    orig_img = Image.open(os.path.join(current_dir, f"{name}_original.png"))
    orig_input = preprocess_image(orig_img)
    orig_pred = model(orig_input)
    decoded_orig = tf.keras.applications.mobilenet_v2.decode_predictions(orig_pred.numpy(), top=3)[0]
    print(f"Python側での {name} オリジナル画像判定結果:")
    for i, (imagenet_id, label, prob) in enumerate(decoded_orig):
        print(f"  {i+1}: {label} ({prob*100:.2f}%)")

    hacked_img = Image.open(os.path.join(current_dir, f"{name}_hacked.png"))
    hacked_input = preprocess_image(hacked_img)
    hacked_pred = model(hacked_input)
    decoded_hacked = tf.keras.applications.mobilenet_v2.decode_predictions(hacked_pred.numpy(), top=3)[0]
    print(f"Python側での {name} ハック画像判定結果:")
    for i, (imagenet_id, label, prob) in enumerate(decoded_hacked):
        print(f"  {i+1}: {label} ({prob*100:.2f}%)")

# js_contentの作成
current_dir = os.path.dirname(os.path.abspath(__file__))
js_path = os.path.join(current_dir, "..", "hands-on", "images.js")

# favicon.icoのBase64エンコード
favicon_path = os.path.join(current_dir, "favicon.ico")
favicon_url = ""
if os.path.exists(favicon_path):
    with open(favicon_path, "rb") as f:
        favicon_data = f.read()
        favicon_base64 = base64.b64encode(favicon_data).decode("utf-8")
        favicon_url = f"data:image/x-icon;base64,{favicon_base64}"

js_content = f"""// Base64 image data for local file:// access without CORS/Tainted canvas errors.
const FAVICON_BASE64 = "{favicon_url}";
const LION_ORIGINAL_IMAGE_BASE64 = "{base64_results['LION_ORIGINAL']}";
const LION_HACKED_IMAGE_BASE64 = "{base64_results['LION_HACKED']}";
const TIGER_ORIGINAL_IMAGE_BASE64 = "{base64_results['TIGER_ORIGINAL']}";
const TIGER_HACKED_IMAGE_BASE64 = "{base64_results['TIGER_HACKED']}";
"""

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"\nimages.js を {js_path} に保存しました。")