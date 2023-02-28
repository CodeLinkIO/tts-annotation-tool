import * as functions from 'firebase-functions';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
const ffmpeg_static = require('ffmpeg-static');

import { bucket } from './utils/app';

const TMP_FOLDER = 'tmp';
const TRAINING_DATA_FOLDER = 'training-data-multiple-speakers';

type Data = {
  sourceAudioId: string;
  speakerId: string;
  sourceAudioRefPath: string;
  snippet: Vinyl.Snippet;
};

export const sliceSnippet = functions.https.onCall(async (data: Data) => {
  const { sourceAudioId, speakerId, snippet, sourceAudioRefPath } = data;
  const sourceAudioFile = bucket.file(sourceAudioRefPath);
  try {
    const snippetFileName = `${snippet.id}.wav`;
    const snippetRefPath = `${TRAINING_DATA_FOLDER}/${speakerId}/${sourceAudioId}/${snippetFileName}`;
    const tmpSnippetFileName = `/${TMP_FOLDER}/${snippetFileName}`;
    const ffmpegPromise = new Promise((resolve, reject) => {
      ffmpeg(sourceAudioFile.createReadStream())
        .setFfmpegPath(ffmpeg_static)
        .outputOptions([`-ss ${snippet.startTime}`, `-to ${snippet.endTime}`])
        .save(tmpSnippetFileName)
        .on('error', reject)
        .on('end', resolve);
    });
    await ffmpegPromise;
    await bucket.upload(tmpSnippetFileName, {
      destination: snippetRefPath,
    });
    fs.unlinkSync(tmpSnippetFileName);

    const textFileName = `${snippet.id}.txt`;
    const tmpTextFileName = `/${TMP_FOLDER}/${textFileName}`;
    const textRefPath = `${TRAINING_DATA_FOLDER}/${speakerId}/${sourceAudioId}/${textFileName}`;
    fs.writeFile(
      tmpTextFileName,
      `\ufeff${snippet.text}`, // \ufeff for unicode
      async (error) => {
        if (error) {
          throw error;
        }
        await bucket.upload(tmpTextFileName, {
          destination: textRefPath,
        });
        fs.unlinkSync(tmpTextFileName);
      },
    );
  } catch (error) {
    throw new functions.https.HttpsError(
      'internal',
      JSON.stringify(error),
      error,
    );
  }
});
