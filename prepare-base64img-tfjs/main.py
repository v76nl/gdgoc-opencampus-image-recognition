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

# 犬の画像をWebから取得
image_url = "https://images.unsplash.com/photo-1552053831-71594a27632d?w=224&h=224&fit=crop"
response = requests.get(image_url)
original_pil_image = Image.open(BytesIO(response.content))

input_image = preprocess_image(original_pil_image)

# ターゲットクラスの指定
# 954はImageNetにおけるバナナ (banana)
target_class_idx = 954
target_label = tf.one_hot(target_class_idx, 1000)
target_label = tf.reshape(target_label, (1, 1000))

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

# 画像の保存
# 元画像と加工画像を比較可能にするため両方とも保存する
original_image_array = deprocess_image(tf.convert_to_tensor(input_image))
adversarial_image_array = deprocess_image(adversarial_tensor)

original_img = Image.fromarray(original_image_array)
adversarial_img = Image.fromarray(adversarial_image_array)

# prepare/ 直下に保存
original_img.save("original.png")
adversarial_img.save("hacked.png")

# handson/ 直下にも保存
current_dir = os.path.dirname(os.path.abspath(__file__))
handson_dir = os.path.join(current_dir, "..", "handson-base64img-tfjs")
os.makedirs(handson_dir, exist_ok=True)
original_img.save(os.path.join(handson_dir, "original.png"))
adversarial_img.save(os.path.join(handson_dir, "hacked.png"))

print(f"生成された画像: {os.path.abspath('.')}")

# Base64データをimages.jsに書き出す
def get_base64_data_url(image_array):
    img = Image.fromarray(image_array)
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"

original_base64 = get_base64_data_url(original_image_array)
adversarial_base64 = get_base64_data_url(adversarial_image_array)

current_dir = os.path.dirname(os.path.abspath(__file__))
js_path = os.path.join(current_dir, "..", "handson-base64img-tfjs", "images.js")

js_content = f"""// Base64 image data for local file:// access without CORS/Tainted canvas errors.
const ORIGINAL_IMAGE_BASE64 = "{original_base64}";
const HACKED_IMAGE_BASE64 = "{adversarial_base64}";
"""

os.makedirs(os.path.dirname(js_path), exist_ok=True)
with open(js_path, "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"images.js を {js_path} に保存")
print("画像データの最大差分 (0-255スケール):", np.max(np.abs(original_image_array.astype(float) - adversarial_image_array.astype(float))))

# 生成した元画像と加工画像のテスト推論
orig_img = Image.open("original.png")
orig_input = preprocess_image(orig_img)
orig_pred = model(orig_input)
decoded_orig = tf.keras.applications.mobilenet_v2.decode_predictions(orig_pred.numpy(), top=3)[0]
print("Python側でのオリジナル画像判定結果:")
for i, (imagenet_id, label, prob) in enumerate(decoded_orig):
    print(f"  {i+1}: {label} ({prob*100:.2f}%)")

hacked_img = Image.open("hacked.png")
hacked_input = preprocess_image(hacked_img)
hacked_pred = model(hacked_input)
decoded_hacked = tf.keras.applications.mobilenet_v2.decode_predictions(hacked_pred.numpy(), top=3)[0]
print("Python側でのハック画像判定結果:")
for i, (imagenet_id, label, prob) in enumerate(decoded_hacked):
    print(f"  {i+1}: {label} ({prob*100:.2f}%)")