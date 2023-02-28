import * as functions from 'firebase-functions';

import { firestore } from './utils/app';
import { FirestoreCollections } from './utils/enums';

export const createUserDocument = functions.auth.user().onCreate((user) => {
  firestore
    .collection(FirestoreCollections.Users)
    .doc(user.uid)
    .set(JSON.parse(JSON.stringify(user)));
});
