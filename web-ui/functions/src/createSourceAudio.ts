import * as functions from 'firebase-functions';

import { firestore, bucket } from './utils/app';
import { FirestoreCollections } from './utils/enums';

type Payload = Omit<Vinyl.SourceAudio, 'ownerUid'> & {
  speaker: Vinyl.Speaker;
};

export const createSourceAudio = functions.https.onCall(
  async (data: Payload, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'No auth found');
    }
    const { name, storageRefPath, subtitle, speaker } = data;

    const sourceAudio = bucket.file(storageRefPath);
    const exists = (await sourceAudio.exists())[0];
    if (!exists) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        "No source audio's file found",
      );
    }

    let speakerId = speaker.id;

    if (!speakerId) {
      const doc = await firestore
        .collection(FirestoreCollections.Speakers)
        .add({ name: speaker.name });
      speakerId = doc.id;
    }

    const result = await firestore
      .collection(FirestoreCollections.SourceAudios)
      .add({
        name,
        storageRefPath,
        subtitle,
        speakerId,
        isAnnotated: false,
      });

    return result.id;
  },
);
