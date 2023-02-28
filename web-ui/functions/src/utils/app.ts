import * as admin from 'firebase-admin';
// import * as cors from 'cors';
// const corsHandler = cors({ origin: true });

admin.initializeApp();
const firestore = admin.firestore();
const bucket = admin.storage().bucket();
const pubsub = admin.messaging();

export { firestore, bucket, pubsub };
