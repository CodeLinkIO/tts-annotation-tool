import json
import os
import tempfile
import pytube
import uuid
import soundfile as sf
from io import BytesIO
from scipy.io.wavfile import write

import nltk
import aiohttp
import asyncio
from flask import Flask, jsonify, request
import librosa
from unidecode import unidecode
from jiwer import wer
from nltk.tokenize.treebank import TreebankWordDetokenizer
# from google.cloud import storage
import urllib.request
from google.cloud import tasks_v2
import json
from flask_cors import CORS

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import storage

# @TODO: push this to env
cred = credentials.Certificate("cert.json")

default_app = firebase_admin.initialize_app(cred)
db = firestore.client()

ASR_PREDICT_URL = os.environ.get("ASR_PREDICT_URL", "")
CREATE_SNIPPET_URL = os.environ.get("CREATE_SNIPPET_URL", "")
app = Flask(__name__)
CORS(app)
PROJECT = os.environ.get("PROJECT_ID", "project-id")
QUEUE = os.environ.get("QUEUE_NAME", "audio-task-queue")
LOCATION = "asia-southeast1"

# You have to deploy this service to Cloud Run first then input the URL here
URL = "<THIS_SERVICE_URL>/asr-prediction-list"
SERVICE_ACCOUNT = "<task-queue-account-email>"
BUCKET_NAME = "codelink-hal.appspot.com"

# storage = storage.Client()
bucket = storage.bucket(BUCKET_NAME)

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "task-cert.json"

@app.route('/push-queue', methods=['POST'])
async def create_task():
    content = request.get_json()
    client = tasks_v2.CloudTasksClient()

    # Construct the fully qualified queue name.
    parent = client.queue_path(PROJECT, LOCATION, QUEUE)

    # Process youtube link & create source audio
    if not content.get('sourceAudioUid') and content.get('youtubeURL'):
        url = content.get('youtubeURL')  # 'https://www.youtube.com/watch?v=86G-Yiy7nR4'
        youtube = pytube.YouTube(url)

        streams = youtube.streams.filter(only_audio=True).filter(file_extension='mp4')
        path = streams[0].download(filename="audio.mp4")

        y, sr = librosa.load(path)

        file = 'audio.wav'
        # write wav file
        sf.write(file, y, samplerate=sr)

        # upload file to bucket
        storage_path = f'source-audios/{str(uuid.uuid4())}.wav'
        blob = bucket.blob(storage_path)
        blob.upload_from_filename(file)

        # create source audio doc
        source_audio = {
            "name": content.get('name', ''),
            "storageRefPath": storage_path,
            "preProcessDone": False,
            "speakerId": content.get('speakerId', ''),
            "youtubeURL": content.get('youtubeURL', '')
        }
        # doc = db.collection(u'sourceAudios').add(source_audio)
        source_audio_ref = db.collection(u'sourceAudios').document()
        source_audio_ref.set(source_audio)
        source_id = source_audio_ref.id
        doc_data = source_audio
    else:
        doc = db.collection(u'sourceAudios').document(content.get('sourceAudioUid', '')).get()
        source_id = content.get('sourceAudioUid', '')
        doc_data = doc.to_dict()

    payload = {
        "sourceAudioUid": source_id,
        "audioPath": doc_data.get('storageRefPath', ''),
        "text": doc_data.get('subtitle', '')
    }

    task = {
        "http_request": {  # Specify the type of request.
            "http_method": tasks_v2.HttpMethod.POST,
            "url": URL,  # The full url path that the task will be sent to.
            "oidc_token": {"service_account_email": SERVICE_ACCOUNT}
        },
        "dispatch_deadline": {
            "seconds": 1800
        }
    }

    if payload is not None:
        # The API expects a payload of type bytes.
        converted_payload = json.dumps(payload).encode()

        # Add the payload to the request.
        task["http_request"]["body"] = converted_payload

    # Construct the request body.
    app.logger.info("<<<<<<<<< SEND TASK")
    app.logger.info(task)

    # Use the client to build and send the task.
    response = client.create_task(request={"parent": parent, "task": task})

    app.logger.info("Created task {}".format(response.name))
    return {'message': 'ok'}


@app.route('/asr-prediction-list', methods=['POST'])
async def to_prediction_list():
    # print("<<<<<<<<< LOG 1", flush=True)

    content = {}
    sr = 16_000
    top_db = 45
    if 'file' in request.files:
        print("<<<<<<<<< LOG 2", flush=True)
        audio_file = request.files['file']
        speech = request.form["speech"]
        y, sr = librosa.load(audio_file, sr=sr)
    else:
        print("<<<<<<<<< LOG 3", flush=True)
        print("> Getting request...", flush=True)
        payload = request.get_data(as_text=True)
        print("> Payload:", payload, flush=True)
        # print(request.data)
        # print(request.get_json())

        # content = request.get_json()
        content = json.loads(payload)
        if not content:
            text = request.data
            content = json.loads(text)

        top_db = content.get('top_db', top_db)

        if 'sourceAudioUid' in content:
            # read from bucket
            audio_file_blob = bucket.blob(content['audioPath'])
            speech = content['text']
            with tempfile.NamedTemporaryFile('w+b') as out_file:
                audio_file_blob.download_to_filename(out_file.name)
                audio_file = out_file.name
                y, sr = librosa.load(audio_file, sr=sr)
        else:
            # download URL
            with urllib.request.urlopen(content['audio_path']) as file_response, tempfile.NamedTemporaryFile(
                    'w+b') as out_file:
                data = file_response.read()
                out_file.write(data)
                audio_file = out_file.name
                y, sr = librosa.load(audio_file, sr=sr)

            speech_response = urllib.request.urlopen(content['text_path'])
            speech = speech_response.read().decode('utf-8')

    # y, sr = librosa.load(audio_file, sr=sr)
    section_records = []
    predictions = []
    nonMuteSections = librosa.effects.split(y, top_db=top_db)  # default vaule 60 dB
    for section in nonMuteSections:
        section_audio = y[section[0]:section[1]]
        section_start_time = section[0] / sr
        section_end_time = section[1] / sr
        section_records.append({
            "audio_array": section_audio,
            "start": section_start_time,
            "sample_start": section[0],
            "sample_end": section[1],
            "end": section_end_time
        })
    tasks = []

    app.logger.info("<<<<<<<<< NUMBER OF SPLITS")
    app.logger.info(len(section_records))
    for section in section_records:
        # tasks.append(asyncio.ensure_future(get_texts(section, speech)))
        tasks.append(get_texts(section, speech))
        # tasks.append(asyncio.ensure_future(safe_get_texts(section, speech)))

    preds = await gather_with_concurrency_v2(50, *tasks)
    # preds = await asyncio.gather(*tasks)
    for pred in preds:
        predictions.append(pred)

    if 'sourceAudioUid' in content:
        req = {
            "sourceAudioUid": content['sourceAudioUid'],
            "snippets": predictions
        }

        # check if snipet exists
        docs = []
        try:
            docs = db.collection(u'snippets').where(u'sourceAudioUid', u'==', content['sourceAudioUid']).limit(
                3).stream()
        except Exception as e:
            print(e)
            print('Something wrong when checking db')

        # return req
        if not docs or sum(1 for _ in docs) < 2:
            await create_snippet(req)

    return {"data": predictions}

# async def safe_get_texts(section, speech):
#     async with asyncio.Semaphore(3):  # semaphore limits num of simultaneous downloads
#         return await get_texts(section, speech)


async def gather_with_concurrency(n, *tasks):
    semaphore = asyncio.Semaphore(n)

    async def sem_task(task):
        async with semaphore:
            return await task

    return await asyncio.gather(*(sem_task(task) for task in tasks))


async def gather_with_concurrency_v2(n, *tasks):
    res = []
    # run async in slice
    for i in range(0, len(tasks), n):
        res.extend(await asyncio.gather(*tasks[i:i+n-1]))
    return res


async def create_snippet(req):
    timeout = aiohttp.ClientTimeout(total=3600)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        url = CREATE_SNIPPET_URL

        # app.logger.info(string(section['audio_array']))
        async with session.post(url, json=req) as resp:
            res = await resp.json()

        return res


async def get_texts(section, speech=''):
    timeout = aiohttp.ClientTimeout(total=3600)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        data = aiohttp.FormData()
        url = ASR_PREDICT_URL + '/asr-predict'
        if not speech:
            url = 'https://machine-learning-lab-315009.web.app/stt-citrinet'
        app.logger.info("<<<<<<<<<<< predict_text")
        app.logger.info(url)

        buffer = BytesIO()
        buffer.flush()
        write(buffer, 16_000, section['audio_array'])

        data.add_field('file', buffer, filename='audio.wav')

        # app.logger.info(string(section['audio_array']))
        async with session.post(url, data=data) as resp:
            # app.logger.info(resp)
            predict = {'prediction': ''}
            try:
                predict = await resp.json()
            except Exception as e:
                app.logger.info(resp.status)
            predict_text = predict['prediction']
            # app.logger.info(predict_text)
            real_text = get_real_text_word_compare(predict_text, speech) if speech else predict_text

        prediction = {
            "prediction": predict_text,
            "subtitle": real_text,
            "startTime": str(section['start']),
            "sample_start": str(section['sample_start']),
            "sample_end": str(section['sample_end']),
            "endTime": str(section['end']),
            "real_text": real_text
        }

        return prediction


def get_real_text(prediction_text, speech):
    best_start_index = 0
    best_end_index = 1
    best_wer = 1.0
    for local_start_index in range(len(speech) - len(prediction_text) + 1):
        for local_end_index in range(local_start_index, len(speech)):
            if local_start_index < local_end_index < local_start_index + len(prediction_text) + 5:
                sub_string = str(speech)[local_start_index: local_end_index]
                if len(sub_string) > 1:
                    evaluate_point = evaluate(sub_string, prediction_text)
                    if evaluate_point <= best_wer:
                        best_start_index = local_start_index
                        best_end_index = local_end_index
                        best_wer = evaluate_point
    return speech[best_start_index: best_end_index]


def get_real_text_word_compare(prediction_text, speech):
    best_wer = 1.0
    speech_tokens = nltk.word_tokenize(speech)
    # speech_tokens_origin = speech_tokens
    nb_special_character = 0
    # speech_tokens = remove_values_from_list(speech_tokens)
    pred_text_tokens = nltk.word_tokenize(prediction_text)
    best_return = ''
    for local_start_index in range(len(speech_tokens) - len(pred_text_tokens) + 1):
        for local_end_index in range(local_start_index, len(speech_tokens)):
            if is_special(speech_tokens[local_end_index]):
                nb_special_character = nb_special_character + 1
            elif local_start_index < local_end_index < local_start_index + len(
                    pred_text_tokens) + 2 + nb_special_character:
                sub_string = TreebankWordDetokenizer().detokenize(
                    speech_tokens[local_start_index: local_end_index]).replace(" .", ".")
                # app.logger.info(sub_string)
                if len(sub_string) > 1:
                    evaluate_point = evaluate(sub_string, prediction_text)
                    if evaluate_point <= best_wer:
                        best_wer = evaluate_point
                        best_return = sub_string
        nb_special_character = 0
    return best_return


def remove_values_from_list(the_list):
    return [value for value in the_list if not is_special(value)]


def is_special(value):
    return any(not c.isalnum() for c in value)


def normalize_text(text):
    new_text = unidecode(text)
    new_text = new_text.lower()
    return new_text


def evaluate(ground_truth, hypothesis):
    if ground_truth.isspace():
        return 1
    return wer(normalize_text(ground_truth), normalize_text(hypothesis))


if __name__ == '__main__':
    # This is used when running locally only. When deploying to Google Cloud
    # Run, a webserver process such as Gunicorn will serve the app.
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
