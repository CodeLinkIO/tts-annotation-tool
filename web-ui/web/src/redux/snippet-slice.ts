import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
  createSelector,
} from '@reduxjs/toolkit';
import cuid from 'cuid';

import { RootState } from '.';
import { getSourceAudioList } from './source-audio-slice';

const snippetAdapter = createEntityAdapter<Vinyl.Snippet>({
  sortComparer: (a, b) => a.startTime - b.startTime,
});
export const snippetSelectors = snippetAdapter.getSelectors();

export const sourceAudioSnippetsSelector = createSelector(
  (state: RootState) => state.sourceAudio,
  (state: RootState) => state.snippet,
  (sourceAudioState, snippetState) => {
    const sourceAudioId = sourceAudioState.selectedId;
    const sourceAudio = sourceAudioState.entities[sourceAudioId];
    if (!sourceAudio) return [];

    const { snippetIds } = sourceAudio;
    const snippets: Vinyl.Snippet[] = [];
    snippetIds.forEach((snippetId) => {
      const snippet = snippetState.entities[snippetId];
      if (snippet) snippets.push(snippet);
    });
    return snippets.sort((a, b) => a.startTime - b.startTime);
  },
);

interface State {
  uid: string;
  loading: boolean;
  syncing: boolean;
  selectedId: string;
  isMerging: boolean;
  mergingSelectedIds: string[];
  errorMessage: string;
}

const snippetSlice = createSlice({
  name: 'snippet',
  initialState: snippetAdapter.getInitialState<State>({
    uid: cuid(),
    loading: false,
    syncing: false,
    selectedId: '',
    isMerging: false,
    mergingSelectedIds: [],
    errorMessage: '',
  }),
  reducers: {
    loadSnippets: (state, action: PayloadAction<Vinyl.Snippet[]>) => {
      snippetAdapter.setAll(state, action.payload);
    },
    selectSnippet: (state, action: PayloadAction<string>) => {
      state.selectedId = action.payload;
    },
    addSnippet: (state, action: PayloadAction<Vinyl.Snippet>) => {
      snippetAdapter.addOne(state, action.payload);
      state.selectedId = action.payload.id;
    },
    editSnippet: (state, action: PayloadAction<Vinyl.Snippet>) => {
      snippetAdapter.upsertOne(state, action.payload);
    },
    removeSnippet: (state, action: PayloadAction<string>) => {
      snippetAdapter.removeOne(state, action.payload);
      state.selectedId = '';
    },
    splitSnippet: (
      state,
      action: PayloadAction<{
        snippet: Vinyl.Snippet;
        newSnippets: Array<{
          id: string;
          text: string;
        }>;
      }>,
    ) => {
      const { snippet, newSnippets } = action.payload;
      const snippetDuration = snippet.endTime - snippet.startTime;

      const processedSnippets = newSnippets.reduce<
        Array<{ id: string; text: string; startTime: number; endTime: number }>
      >((result, newSnippet, index) => {
        const wordPercentage = newSnippet.text.length / snippet.text.length;
        const duration = snippetDuration * wordPercentage;
        const startTime =
          index !== 0 ? result[index - 1].endTime : snippet.startTime;
        return [
          ...result,
          {
            id: newSnippet.id,
            text: newSnippet.text,
            startTime,
            endTime: startTime + duration,
          },
        ];
      }, []);

      const firstSnippet = {
        ...processedSnippets[0],
        id: snippet.id,
      };
      const newProcessedSnippets = processedSnippets.slice(1);

      snippetAdapter.upsertOne(state, firstSnippet);
      snippetAdapter.addMany(state, newProcessedSnippets);
    },
    openMerge: (state, action: PayloadAction<string>) => {
      state.isMerging = true;
      state.mergingSelectedIds = [action.payload];
    },
    toggleMergingSnippet: (state, action: PayloadAction<string>) => {
      if (state.mergingSelectedIds.includes(action.payload)) {
        state.mergingSelectedIds = state.mergingSelectedIds.filter(
          (id) => id !== action.payload,
        );
      } else {
        state.mergingSelectedIds.push(action.payload);
      }
    },
    confirmMergeSnippets: (state) => {
      const snippetIds = state.mergingSelectedIds;
      const snippets = snippetIds.map(
        (id) => state.entities[id],
      ) as Vinyl.Snippet[];
      snippets.sort((a, b) => a.startTime - b.startTime);
      const startTime = Math.min(...snippets.map((s) => s.startTime));
      const endTime = Math.max(...snippets.map((s) => s.endTime));
      const text = snippets.map((s) => s.text).join(' ');
      const newSnippet = {
        id: snippets[0].id,
        startTime,
        endTime,
        text,
      };
      const deletingIds = snippets.slice(1).map((s) => s.id);
      snippetAdapter.upsertOne(state, newSnippet);
      snippetAdapter.removeMany(state, deletingIds);
      state.isMerging = false;
      state.mergingSelectedIds = [];
    },
    cancelMerge: (state) => {
      state.isMerging = false;
      state.mergingSelectedIds = [];
    },
    touchSnippetList: (state) => {
      state.uid = cuid();
    },
    syncSnippetListPending: (state) => {
      state.syncing = true;
    },
    syncSnippetListFulfilled: (state) => {
      state.syncing = false;
    },
    syncSnippetListRejected: (state) => {
      state.syncing = false;
      state.errorMessage = 'Update snippets failed';
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getSourceAudioList.fulfilled, (state, action) => {
      const snippets = action.payload
        .map((sourceAudio) => sourceAudio.snippets)
        .filter((snippet) => snippet)
        .flat();
      snippetAdapter.setAll(state, snippets ?? []);
    });
  },
});

export const {
  loadSnippets,
  selectSnippet,
  addSnippet,
  editSnippet,
  touchSnippetList,
  syncSnippetListPending,
  syncSnippetListFulfilled,
  syncSnippetListRejected,
  removeSnippet,
  openMerge,
  toggleMergingSnippet,
  confirmMergeSnippets,
  cancelMerge,
  splitSnippet,
} = snippetSlice.actions;

export default snippetSlice.reducer;
