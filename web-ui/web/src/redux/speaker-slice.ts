import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
} from '@reduxjs/toolkit';
import cuid from 'cuid';

import { firestore } from '../firebase/client';
import { FirestoreCollections } from '../utils/enums';

const speakerAdapter = createEntityAdapter<Vinyl.Speaker>();
export const speakerSelectors = speakerAdapter.getSelectors();

export const getSpeakerList = createAsyncThunk(
  'speaker/getSpeakerList',
  async () => {
    const { docs } = await firestore
      .collection(FirestoreCollections.Speakers)
      .get();

    const result = docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Vinyl.Speaker[];

    return result;
  },
);

export const addSpeaker = createAsyncThunk(
  'speaker/addSpeaker',
  async (arg: { name: string }) => {
    const { name } = arg;

    const doc = await firestore
      .collection(FirestoreCollections.Speakers)
      .add({ name });

    return doc.id;
  },
);

const speakerSlice = createSlice({
  name: 'speaker',
  initialState: speakerAdapter.getInitialState({
    loading: false,
    uid: '',
    errorMessage: '',
  }),
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getSpeakerList.pending, (state) => {
      state.loading = true;
      speakerAdapter.removeAll(state);
    });
    builder.addCase(getSpeakerList.fulfilled, (state, action) => {
      state.loading = false;
      speakerAdapter.setAll(state, action.payload);
      state.uid = cuid();
    });
    builder.addCase(getSpeakerList.rejected, (state) => {
      state.loading = false;
      state.errorMessage = 'Get speaker list failed';
    });

    builder.addCase(addSpeaker.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(addSpeaker.fulfilled, (state, action) => {
      state.loading = false;
      speakerAdapter.addOne(state, {
        id: action.payload,
        name: action.meta.arg.name,
      });
    });
    builder.addCase(addSpeaker.rejected, (state) => {
      state.loading = false;
      state.errorMessage = 'Add speaker failed';
    });
  },
});

export default speakerSlice.reducer;
