import * as functions from 'firebase-functions';
import axios from 'axios';

import { FirestoreCollections } from './utils/enums';

export const preProcessSourceAudio = functions.firestore
  .document(`${FirestoreCollections.SourceAudios}/{uid}`)
  .onCreate(async (snap) => {
    const response = await axios.post(
      functions.config().preprocesssourceaudio.processingurl,
      { sourceAudioUid: snap.id },
    );
    console.log(response.data);
  });
