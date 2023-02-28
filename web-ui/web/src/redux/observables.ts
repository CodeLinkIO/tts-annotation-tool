import { AnyAction } from '@reduxjs/toolkit';
import { Epic, createEpicMiddleware, ofType } from 'redux-observable';
import { filter, debounceTime, map, mergeMap } from 'rxjs/operators';

import { RootState } from '.';
import { firestore } from '../firebase/client';
import { FirestoreCollections } from '../utils/enums';
import {
  addSnippet,
  confirmMergeSnippets,
  editSnippet,
  removeSnippet,
  sourceAudioSnippetsSelector,
  splitSnippet,
  syncSnippetListFulfilled,
  syncSnippetListPending,
  syncSnippetListRejected,
  touchSnippetList,
} from './snippet-slice';
import { sourceAudioSelectors } from './source-audio-slice';

export type MyEpic = Epic<AnyAction, AnyAction, RootState>;

export const epicMiddleware = createEpicMiddleware<
  AnyAction,
  AnyAction,
  RootState
>();

const beforeUnloadListener = (event: BeforeUnloadEvent) => {
  event.preventDefault();
  return (event.returnValue =
    'There are unsaved changes, are you sure want to leave?');
};

export const touchSnippetListEpic: MyEpic = (action$) =>
  action$.pipe(
    ofType(
      addSnippet.type,
      editSnippet.type,
      removeSnippet.type,
      splitSnippet.type,
      confirmMergeSnippets.type,
    ),
    mergeMap(async () => {
      window.addEventListener('beforeunload', beforeUnloadListener, {
        capture: true,
      });
      return touchSnippetList();
    }),
  );

export const updateSnippetPendingEpic: MyEpic = (action$) =>
  action$.pipe(
    filter(touchSnippetList.match),
    debounceTime(3000),
    map(() => syncSnippetListPending()),
  );

export const updateSnippetFulfilledEpic: MyEpic = (action$, state$) =>
  action$.pipe(
    filter(syncSnippetListPending.match),
    mergeMap(async () => {
      try {
        const state = state$.value;
        const { selectedId: selectedSourceAudioId } = state.sourceAudio;
        const snippetList = sourceAudioSnippetsSelector(state);
        const sourceAudio = sourceAudioSelectors.selectById(
          state.sourceAudio,
          selectedSourceAudioId,
        );
        if (!sourceAudio) throw new Error('No selected audio!');

        await firestore
          .collection(FirestoreCollections.SourceAudios)
          .doc(sourceAudio.id)
          .update({
            snippets: snippetList,
          });

        window.removeEventListener('beforeunload', beforeUnloadListener, {
          capture: true,
        });

        return syncSnippetListFulfilled();
      } catch (error) {
        return syncSnippetListRejected();
      }
    }),
  );
