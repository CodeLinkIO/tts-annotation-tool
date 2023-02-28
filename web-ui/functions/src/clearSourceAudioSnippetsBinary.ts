import * as functions from 'firebase-functions';

import { bucket } from './utils/app';

const TRAINING_DATA_FOLDER = 'training-data-multiple-speakers';

export const clearSourceAudioSnippetsBinary = functions.https.onCall(
  async (sourceAudio: Vinyl.SourceAudio) => {
    const sourceAudioFile = bucket.file(sourceAudio.storageRefPath);
    const exists = (await sourceAudioFile.exists())[0];
    if (!exists) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'No source audio ref found',
      );
    }

    bucket.getFiles(
      {
        prefix: `${TRAINING_DATA_FOLDER}/${sourceAudio.speakerId}/${sourceAudio.id}/`,
      },
      (err, res) => {
        res?.forEach((file) => {
          file.delete({ ignoreNotFound: true });
        });
      },
    );
  },
);
