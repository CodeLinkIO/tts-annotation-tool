import React from 'react';
import {
  configureStore,
  combineReducers,
  ThunkAction,
  Action,
  AnyAction,
} from '@reduxjs/toolkit';
import {
  useDispatch as _useDispatch,
  ReactReduxContextValue,
  createSelectorHook,
} from 'react-redux';

import { combineEpics } from 'redux-observable';
import {
  epicMiddleware,
  touchSnippetListEpic,
  updateSnippetPendingEpic,
  updateSnippetFulfilledEpic,
} from './observables';

import sourceAudio from './source-audio-slice';
import snippet from './snippet-slice';
import speaker from './speaker-slice';

const reducer = combineReducers({
  sourceAudio,
  snippet,
  speaker,
});

export const store = configureStore({
  reducer: combineReducers({
    sourceAudio,
    snippet,
    speaker,
  }),
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({}).concat(epicMiddleware);
  },
});

const rootEpic = combineEpics(
  touchSnippetListEpic,
  updateSnippetPendingEpic,
  updateSnippetFulfilledEpic,
);

epicMiddleware.run(rootEpic);

type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof reducer>;
export const ReduxContext = React.createContext<
  ReactReduxContextValue<RootState, AnyAction>
>({
  store,
  storeState: store.getState(),
});

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

// const useSelector: TypedUseSelectorHook<RootState> = _useSelector;
export const useSelector = createSelectorHook(ReduxContext);
export const useDispatch = () => _useDispatch<AppDispatch>();
