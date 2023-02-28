import * as functions from 'firebase-functions';

import { firestore } from './utils/app';
import { FirestoreCollections } from './utils/enums';

const cuid = require('cuid');

type Input = {
  sourceAudioUid: string;
  snippets: Array<Vinyl.Snippet & { subtitle?: string }>;
};

export const createSnippets = functions.https.onRequest(
  async (request, response) => {
    const { sourceAudioUid, snippets } = request.body as Input;

    const docRef = firestore
      .collection(FirestoreCollections.SourceAudios)
      .doc(sourceAudioUid);

    const doc = await docRef.get();
    if (!doc.exists) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Can not find source audio data',
      );
    }

    doc.ref.update({
      snippets: snippets.map((s) => ({
        id: cuid(),
        startTime: parseFloat(`${s.startTime}`),
        endTime: parseFloat(`${s.endTime}`),
        text: s.text ?? s.subtitle,
      })),
    });

    await docRef.update({ preProcessDone: true });

    response.send(doc.data());
  },
);
