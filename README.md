# TTS annotation tool
This is a tool for annotating text-to-speech (TTS) data.
It makes your text - audio alignment easier by providing a simple interface to upload the audio and then create audio - text pair.
The process can be described as follows:
1. Upload the audio file
2. Input the long text
3. System will process audio and split into small chunks
4. An ASR (automatic speech recognition) service will assign suitable text to each chunk
5. User can edit the text and align audio using the slider from app
6. The result will be saved in Firebase storage with the same name audio - text pair


## Project architecture
The project is built using ReactJS and Firebase. The app is deployed on Firebase hosting and the data is stored in Firebase storage.
Beside that the project uses Firebase Cloud Function for some services and Google Cloud Platform for ASR service.

Architecture diagram:
![Architecture diagram](Architecture_diagram.png)

## How to run the project
### Setup Firebase
To run the project you need to setup Firebase project and Firebase storage. 
Please refer to the [Firebase docs](https://firebase.google.com/docs?authuser=0&hl=en) for more information.

1. Create a Firebase project
2. Create a Firebase storage
3. Create a Firebase Cloud Function

### Setup Google Cloud Platform
To run the project you need to setup Google Cloud Platform project.

### Deploy ASR tasks and Services to Cloud Run
- Deploy the ASR service to Cloud Run
- Obtain any ASR model from Hugging Face, in this case we use a wav2vec2 model. You can also use other models if you want.
- Obtain the URL of the service. It will be used in the next step

- Create a Cloud task queue in GCP
- Create a Service account for Cloud task queue and give it permission to access Cloud Tasks Queue
- Put `task-cert.json` file in `services/audio-processing-task` folder
- Add the task `QUEUE_NAME` and `PROJECT_ID` to `services/audio-processing-task/.env` file
- Add Firebase service account key to `services/audio-processing-task` folder so that the service can access Firestore DB and Firebase storage
- Deploy the service to Cloud Run
- Obtain the URL of the service. It will be used in the next step

### Deploy Firebase Cloud Function and Firebase Hosting
- Add Firebase service account key to `web-ui/functions` folder so that the service can access Firestore DB and Firebase storage
- Add URL obtained from last step to the cloud function ENV `functions.config().preprocesssourceaudio.processingurl`
- Deploy the cloud function to Firebase and get the URL of the service.
- Get `CREATE_SNIPPET_URL` put `services/audio-processing-task/.env` then redeploy the tasks
- Build and deploy the web app to Firebase hosting `web-ui/web`. See the README in `web-ui/web` for more details


## Released dataset using this tool
We have released a vietnamese dataset using this tool. You can find it [here]()
This is a dataset for Vietnamese TTS. It contains 10000 audio - text pairs. 
The audio is recorded by a professional voice actor. The text is collected from news articles from the internet. 
The dataset is used for training a TTS model for Vietnamese language.

## Application
We have trained a TTS model using with the help of this tool for preparing the dataset.


## License