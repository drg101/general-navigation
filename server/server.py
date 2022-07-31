from flask import Flask, request
from werkzeug.utils import secure_filename
import os
from flask_cors import CORS
import cv2
import tensorflow as tf
import urllib.request
import matplotlib.pyplot as plt
import numpy as np

# load model
interpreter = tf.lite.Interpreter(model_path="model_opt.tflite")
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
input_shape = input_details[0]['shape']

def run_inf(img):
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB) / 255.0
    img_resized = tf.image.resize(img, [256,256], method='bicubic', preserve_aspect_ratio=False)
    # img_resized = tf.transpose(img_resized, [2, 0, 1])
    img_input = img_resized.numpy()
    mean=list(img_input.reshape(-1,3).mean(axis=0))
    std=list(img_input.reshape(-1,3).std(axis=0))
    img_input = (img_input - mean) / std
    reshape_img = img_input.reshape(1,256,256,3)
    tensor = tf.convert_to_tensor(reshape_img, dtype=tf.float32)

    interpreter.set_tensor(input_details[0]['index'], tensor)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]['index'])
    output = output.reshape(256, 256)
    depth_min = output.min()
    depth_max = output.max()
    img_out = (255 * (output - depth_min) / (depth_max - depth_min)).astype("uint8")
    return img_out

def angle_diff(a1,a2):
    diff = ( a1 - a2 + 180 ) % 360 - 180
    return diff + 360 if diff < -180 else diff

def get_score(file, goal_ang):
    filename = secure_filename(file.filename)
    ang = int(filename.split('_')[1].split('.')[0])
    tmp_loc = f'./files/{filename}'
    file.save(tmp_loc)
    im = cv2.imread(tmp_loc)
    im = run_inf(im)
    if os.path.exists(tmp_loc):
        os.remove(tmp_loc)
    front_score = im[115,123]
    print(f'front: {front_score}')
    if front_score > 60:
        front_score = front_score * 10
    else:
        front_score = 0
    ang_score = abs(angle_diff(goal_ang, ang))
    print(f"angscore: {ang_score + front_score}")
    return ang_score + front_score

    

app = Flask(__name__)

CORS(app, resources={r"*": {"origins": "*"}})

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route('/run', methods=["POST"])
def upload_image():
    if request.method == 'POST':
        scores = []
        direction = int(request.form['direction'])
        print(direction)
        files = request.files.getlist("files")
        for file in files:
            scores.append(get_score(file, direction))
        return f'{np.array(scores).argmin()},{np.array(scores).min()}'

@app.route('/try_fw', methods=["POST"])
def img_score():
    if request.method == 'POST':
        scores = []
        direction = int(request.form['direction'])
        print(direction)
        files = request.files.getlist("files")
        for file in files:
            scores.append(get_score(file, direction))
        return f'{scores[0]}'

if __name__ == "__main__":
    app.run(debug=True)