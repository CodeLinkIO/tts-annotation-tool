import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import cuid from 'cuid';

import { Region } from 'wavesurfer.js/src/plugin/regions';
import { useWaveSurfer } from '../../../hooks';

import { useSelector, useDispatch, store } from '../../../redux';
import {
  getSourceAudioList,
  selectAudio,
  sourceAudioSelectors,
} from '../../../redux/source-audio-slice';
import {
  addSnippet,
  editSnippet,
  removeSnippet,
  snippetSelectors,
  sourceAudioSnippetsSelector,
} from '../../../redux/snippet-slice';

import SnippetList from './SnippetList';
import SnippetEditCard from './SnippetEditCard';

const AnnotationSheet: React.FC = () => {
  const dispatch = useDispatch();
  const { audioId } = useParams();

  const selectedSourceAudioId = useSelector((s) => s.sourceAudio.selectedId);
  const sourceAudio = sourceAudioSelectors.selectById(
    store.getState().sourceAudio,
    selectedSourceAudioId,
  );
  const sourceAudioUrl = useSelector((s) => s.sourceAudio.selectedAudioURL);
  const snippetList = useSelector(sourceAudioSnippetsSelector);

  const sourceAudioIds = useSelector((s) => s.sourceAudio.ids);
  const isNotFound = useMemo<boolean | undefined>(() => {
    if (sourceAudioIds.length === 0 || !audioId) return undefined;
    if (sourceAudioIds.includes(audioId)) return false;
    return true;
  }, [sourceAudioIds, audioId]);

  useEffect(() => {
    if (audioId) {
      (async () => {
        if (!sourceAudio) {
          await dispatch(getSourceAudioList());
        }
        dispatch(selectAudio({ audioId }));
      })();
    }
  }, [dispatch, audioId, sourceAudio]);

  const onRegionCreate = useCallback(
    (region: Pick<Region, 'start' | 'end'>) => {
      const snippet = {
        id: cuid(),
        startTime: region.start,
        endTime: region.end,
        text: '',
      };
      dispatch(addSnippet(snippet));
      return snippet;
    },
    [dispatch],
  );

  const onRegionUpdate = useCallback(
    (region: Pick<Region, 'id' | 'start' | 'end'>) => {
      const { start, end } = region;
      const snippet = snippetList.find((s) => s.id === region.id);
      const leftOverlappingSnippets = snippetList.filter(
        (s) => s.startTime < region.start && s.endTime > region.start,
      );
      const rightOverlappingSnippets = snippetList.filter(
        (s) => s.startTime < region.end && s.endTime > region.end,
      );

      leftOverlappingSnippets.forEach((s) => {
        dispatch(editSnippet({ ...s, endTime: start }));
      });
      rightOverlappingSnippets.forEach((s) => {
        dispatch(editSnippet({ ...s, startTime: end }));
      });
      dispatch(
        editSnippet({
          id: region.id,
          startTime: start,
          endTime: end,
          text: snippet?.text ?? '',
        }),
      );
    },
    [dispatch, snippetList],
  );
  const onRegionDelete = useCallback(
    (id: string) => dispatch(removeSnippet(id)),
    [dispatch],
  );

  const waveformRef = useRef<HTMLDivElement>(null);
  const {
    isReady,
    isPlaying,
    playPauseCurrentRegion,
    setCurrentRegion,
    resetRegions,
    setZoom,
  } = useWaveSurfer(
    sourceAudioUrl ?? '',
    waveformRef,
    onRegionCreate,
    onRegionUpdate,
  );

  const currentSnippetId = useSelector((s) => s.snippet.selectedId);
  const snippetListUid = useSelector((s) => s.snippet.uid);
  const currentSnippet = snippetSelectors.selectById(
    store.getState().snippet,
    currentSnippetId,
  );
  useEffect(() => {
    if (currentSnippet) {
      setCurrentRegion(currentSnippet);
    }
  }, [setCurrentRegion, currentSnippet, snippetListUid]);

  return (
    <Box height="calc(100vh - 196px)" position="relative">
      {!isNotFound ? (
        <Grid container spacing={1}>
          <Grid item xs={3}>
            <SnippetList
              isReady={isReady}
              isPlaying={isPlaying}
              onSelectSnippet={setCurrentRegion}
              onPlayPause={playPauseCurrentRegion}
            />
          </Grid>
          <Grid item xs={9}>
            <SnippetEditCard
              waveformRef={waveformRef}
              isAudioReady={isReady}
              isPlaying={isPlaying}
              onZoomChange={setZoom}
              onDelete={(uid) => {
                onRegionDelete(uid);
                resetRegions();
              }}
              onPlayPause={playPauseCurrentRegion}
            />
          </Grid>
        </Grid>
      ) : (
        <Typography>No audio found</Typography>
      )}
    </Box>
  );
};

export default AnnotationSheet;
