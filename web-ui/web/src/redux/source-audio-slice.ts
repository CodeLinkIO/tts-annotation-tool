import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
} from '@reduxjs/toolkit';

import { RootState } from './index';
import firebase, { firestore, storage } from '../firebase/client';
import { FirestoreCollections, FunctionNames } from '../utils/enums';
import {
  addSnippet,
  removeSnippet,
  sourceAudioSnippetsSelector,
  splitSnippet,
} from './snippet-slice';
import { addSpeaker } from './speaker-slice';

const sliceSnippet = firebase
  .functions()
  .httpsCallable(FunctionNames.SliceSnippet);

const clearSourceAudioSnippetsBinary = firebase
  .functions()
  .httpsCallable(FunctionNames.ClearSourceAudioSnippetsBinary);

export type NormalizedSourceAudio = Omit<Vinyl.SourceAudio, 'snippets'> & {
  snippets?: Vinyl.Snippet[];
  snippetIds: string[];
};

const sourceAudioAdapter = createEntityAdapter<NormalizedSourceAudio>();
export const sourceAudioSelectors = sourceAudioAdapter.getSelectors();

export const getSourceAudioList = createAsyncThunk(
  'sourceAudio/getSourceAudioList',
  async () => {
    const { docs: sourceAudioDocs } = await firestore
      .collection(FirestoreCollections.SourceAudios)
      .get();

    const { docs: speakerDocs } = await firestore
      .collection(FirestoreCollections.Speakers)
      .get();

    const sourceAudioList = sourceAudioDocs.map((doc) => {
      const data = doc.data();
      const speaker = speakerDocs
        .find((a) => a.id === data.speakerId)
        ?.data() as Vinyl.Speaker;
      return {
        id: doc.id,
        ...data,
        speakerName: speaker?.name ?? '',
      };
    }) as Vinyl.SourceAudio[];

    return sourceAudioList;
  }
);

export const getDownloadURL = createAsyncThunk<
  string,
  { audioId: string },
  { state: RootState }
>('sourceAudio/getDownloadURL', async (arg, { getState }) => {
  const audio = sourceAudioSelectors.selectById(
    getState().sourceAudio,
    arg.audioId
  );
  if (!audio) throw new Error('No audio found');
  const file = storage.ref(audio?.storageRefPath);
  const downloadLink = await file.getDownloadURL();
  return downloadLink;
});

export const selectAudio = createAsyncThunk<
  string | undefined,
  { audioId?: string },
  { state: RootState }
>(
  'sourceAudio/selectAudio',
  async (arg: { audioId?: string }, { dispatch }) => {
    const { audioId } = arg;
    if (audioId) {
      await dispatch(getDownloadURL({ audioId }));
    }
    return audioId;
  }
);

export const updateSourceAudioAnnotatedStatus = createAsyncThunk<
  void,
  boolean,
  { state: RootState }
>(
  'sourceAudio/updateSourceAudioAnnotatedStatus',
  async (isAnnotated, { getState }) => {
    const state = getState();
    const { selectedId } = state.sourceAudio;
    if (!selectedId) return;
    const sourceAudio = sourceAudioSelectors.selectById(
      state.sourceAudio,
      selectedId
    );
    const snippetList = sourceAudioSnippetsSelector(state);
    if (sourceAudio) {
      await firestore
        .collection(FirestoreCollections.SourceAudios)
        .doc(sourceAudio.id)
        .update({ isAnnotated });
      if (isAnnotated) {
        snippetList.forEach((snippet) => {
          sliceSnippet({
            sourceAudioId: sourceAudio.id,
            sourceAudioRefPath: sourceAudio.storageRefPath,
            speakerId: sourceAudio.speakerId,
            snippet,
          });
        });
      } else {
        clearSourceAudioSnippetsBinary(sourceAudio);
      }
    }
  }
);

export const updateSourceAudioSpeaker = createAsyncThunk<
  NormalizedSourceAudio,
  {
    sourceAudioId: string;
    speakerId?: string;
    speakerName?: string;
  },
  { state: RootState }
>(
  'sourceAudio/updateSourceAudioSpeaker',
  async ({ sourceAudioId, speakerId, speakerName }, { getState, dispatch }) => {
    let tmpSpeakerId = speakerId;
    if (!tmpSpeakerId) {
      if (!speakerName) throw new Error('No speaker name');
      const { payload } = await dispatch(addSpeaker({ name: speakerName }));
      tmpSpeakerId = payload as string;
    }
    await firestore
      .collection(FirestoreCollections.SourceAudios)
      .doc(sourceAudioId)
      .update({ speakerId: tmpSpeakerId });

    const state = getState().sourceAudio;
    const sourceAudio = sourceAudioSelectors.selectById(state, sourceAudioId);
    const speaker = getState().speaker.entities[tmpSpeakerId] as Vinyl.Speaker;
    const tmpSpeakerName = speakerId ? speaker.name : speakerName;
    const result = {
      ...sourceAudio,
      speakerId: tmpSpeakerId as string,
      speakerName: tmpSpeakerName,
    } as NormalizedSourceAudio;
    return result;
  }
);

const sourceAudioSlice = createSlice({
  name: 'sourceAudio',
  initialState: sourceAudioAdapter.getInitialState({
    loading: false,
    selectedId: '',
    selectedAudioURL: '',
    errorMessage: '',
  }),
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getSourceAudioList.pending, (state) => {
      state.loading = true;
      sourceAudioAdapter.removeAll(state);
    });
    builder.addCase(getSourceAudioList.fulfilled, (state, action) => {
      state.loading = false;
      sourceAudioAdapter.setAll(
        state,
        action.payload.map((sa) => {
          const sourceAudio = {
            ...sa,
            snippetIds: sa.snippets?.map((s) => s.id) ?? [],
          } as NormalizedSourceAudio;
          delete sourceAudio.snippets;
          return sourceAudio;
        })
      );
    });
    builder.addCase(getSourceAudioList.rejected, (state) => {
      state.loading = false;
      state.errorMessage = 'Get source audio list failed';
    });

    builder.addCase(selectAudio.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(selectAudio.fulfilled, (state, action) => {
      const audioId = action.payload;
      if (audioId) {
        state.selectedId = audioId;
      } else {
        state.selectedId = '';
      }
    });
    builder.addCase(selectAudio.rejected, (state) => {
      state.loading = false;
      state.errorMessage = 'Select audio failed';
    });

    builder.addCase(getDownloadURL.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedAudioURL = action.payload;
    });
    builder.addCase(getDownloadURL.rejected, (state, action) => {
      state.loading = false;
      state.errorMessage = 'Get download URL failed';
    });

    builder.addCase(addSnippet, (state, action) => {
      const sourceAudio = state.entities[state.selectedId];
      if (!sourceAudio) return;
      sourceAudio.snippetIds.push(action.payload.id);
    });
    builder.addCase(removeSnippet, (state, action) => {
      const sourceAudio = state.entities[state.selectedId];
      if (!sourceAudio) return;
      sourceAudio.snippetIds = sourceAudio.snippetIds.filter(
        (snippetId) => snippetId !== action.payload
      );
    });
    builder.addCase(splitSnippet, (state, action) => {
      const sourceAudio = state.entities[state.selectedId];
      if (!sourceAudio) return;
      const newIds = action.payload.newSnippets
        .slice(1)
        .map((snippet) => snippet.id);
      sourceAudio.snippetIds.push(...newIds);
    });

    builder.addCase(updateSourceAudioAnnotatedStatus.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(
      updateSourceAudioAnnotatedStatus.fulfilled,
      (state, action) => {
        state.loading = false;
        const selectedAudio = state.entities[state.selectedId];
        if (selectedAudio) {
          selectedAudio.isAnnotated = action.meta.arg;
        }
      }
    );
    builder.addCase(updateSourceAudioAnnotatedStatus.rejected, (state) => {
      state.loading = false;
      state.errorMessage = 'Update annotated status failed';
    });

    builder.addCase(updateSourceAudioSpeaker.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(updateSourceAudioSpeaker.fulfilled, (state, action) => {
      state.loading = false;
      sourceAudioAdapter.upsertOne(state, action.payload);
    });
    builder.addCase(updateSourceAudioSpeaker.rejected, (state) => {
      state.loading = false;
      state.errorMessage = 'Update speaker failed';
    });
  },
});

export default sourceAudioSlice.reducer;
