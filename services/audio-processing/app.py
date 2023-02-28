import json
import os
import torch
from flask import Flask, jsonify, request
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor, pipelines
import librosa

app = Flask(__name__)
SAMPLE_RATE = 16_000
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_path = "./model/wav2vec2-large-xlsr-vietnamese"
processor = Wav2Vec2Processor.from_pretrained(model_path)
model = Wav2Vec2ForCTC.from_pretrained(model_path).to(device)


@app.route('/asr-predict', methods=['POST'])
def classify_review():
    if 'file' in request.files:
        f = request.files['file']
        speech_array, sampling_rate = librosa.load(f)
    else:
        content = request.get_json()
        speech_array = content['audio_array']
    app.logger.info("speech_array")
    inputs = processor([speech_array], sampling_rate=SAMPLE_RATE, return_tensors="pt", padding=True)
    with torch.no_grad():
        logits = model(inputs.input_values, attention_mask=inputs.attention_mask).logits
    predicted_ids = torch.argmax(logits, dim=-1)
    predicted_text = processor.batch_decode(predicted_ids)[0]
    print("Prediction:", processor.batch_decode(predicted_ids))
    return {"prediction": predicted_text}


if __name__ == '__main__':
    # This is used when running locally only. When deploying to Google Cloud
    # Run, a webserver process such as Gunicorn will serve the app.
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
