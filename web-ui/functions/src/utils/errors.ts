import * as functions from 'firebase-functions';

export function unauthenticatedError() {
  return new functions.https.HttpsError(
    'unauthenticated',
    'The function must be called ' + 'while authenticated.',
  );
}

export function internalError(error: any) {
  return new functions.https.HttpsError('internal', error);
}

export function invalidArgumentError(message?: string) {
  return new functions.https.HttpsError(
    'invalid-argument',
    message ?? 'Invalid Arguments',
  );
}

export function notFoundError() {
  return new functions.https.HttpsError('not-found', 'Not found error');
}
