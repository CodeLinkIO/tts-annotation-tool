# Use Python37
FROM python:3.7
# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED True

ENV PORT 8080

COPY . ./

RUN apt update
RUN apt install -y libsndfile1-dev
RUN pip install -r requirements.txt

CMD exec gunicorn --bind :$PORT --workers 1 --timeout 0 --threads 1 app:app
