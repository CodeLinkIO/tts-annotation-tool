# Use Python39
FROM python:3.8
# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED True

ENV PORT 8080

COPY . ./

RUN apt update
RUN apt install -y libsndfile1-dev
RUN apt-get install -y libasound-dev portaudio19-dev libportaudio2 libportaudiocpp0 ffmpeg
RUN pip install -r requirements.txt
RUN python -m nltk.downloader punkt -d /usr/local/nltk_data

CMD exec gunicorn --bind :$PORT --workers 2 --timeout 0 --threads 4 app:app
