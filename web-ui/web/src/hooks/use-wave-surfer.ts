import { useState, useEffect, useCallback, useRef, RefObject } from 'react';

import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { Region } from 'wavesurfer.js/src/plugin/regions';
import CursorPlugin from 'wavesurfer.js/src/plugin/cursor';

import { secondsToTime } from '../utils/helpers';
import theme from '../utils/theme';

const useWaveSurfer = (
  audioUrl: string,
  waveformRef: RefObject<HTMLDivElement>,
  onRegionCreate: (data: Pick<Region, 'start' | 'end'>) => Vinyl.Snippet,
  onRegionUpdate: (data: Pick<Region, 'id' | 'start' | 'end'>) => void,
) => {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const waveSurfer = useRef<WaveSurfer>();
  const originalRegion = useRef<Pick<Region, 'id' | 'start' | 'end'>>();
  const currentRegion = useRef<Region>();

  const resetRegions = useCallback(() => {
    const ws = waveSurfer.current;
    if (ws) {
      ws.regions.clear();
      ws.regions.add({
        id: 'whole-audio',
        start: 0,
        end: ws.getDuration(),
        showTooltip: false,
        drag: false,
        resize: false,
      });
    }
  }, []);

  const playPauseCurrentRegion = useCallback((playFromStart?: boolean) => {
    const ws = waveSurfer.current;
    const region = currentRegion.current;
    const ogRegion = originalRegion.current;
    if (ws && region && ogRegion) {
      if (playFromStart) {
        region.play(0);
        return;
      }
      if (ws.isPlaying()) {
        ws.pause();
      } else {
        const currentTime = ws.getCurrentTime();
        // stupid float numbers
        const startDifferent = Math.abs(ogRegion.start - region.start);
        const endDifferent = Math.abs(ogRegion.end - region.end);
        const isRegionModified = startDifferent > 0.01 || endDifferent > 0.01;
        if (
          currentTime > region.start &&
          currentTime < region.end &&
          !isRegionModified
        ) {
          region.play(currentTime);
        } else {
          region.play(0);
        }
      }
    }
  }, []);

  const setCurrentRegion = useCallback(
    (snippet: Vinyl.Snippet, instantPlay?: boolean) => {
      const ws = waveSurfer.current;
      if (ws) {
        resetRegions();
        ws.regions.add({
          id: snippet.id,
          start: parseFloat(`${snippet.startTime}`),
          end: parseFloat(`${snippet.endTime}`),
          drag: false,
        });
        if (instantPlay) {
          playPauseCurrentRegion(true);
        }
      }
    },
    [playPauseCurrentRegion, resetRegions],
  );

  const setZoom = useCallback((zoomValue: number) => {
    const ws = waveSurfer.current;
    if (ws) {
      ws.zoom(zoomValue);
    }
  }, []);

  useEffect(() => {
    if (audioUrl) {
      const ws = WaveSurfer.create({
        container: waveformRef.current ?? '',
        height: 200,
        pixelRatio: 1,
        minPxPerSec: 50,
        fillParent: false,
        plugins: [
          RegionsPlugin.create({}),
          CursorPlugin.create({
            showTime: true,
            customShowTimeStyle: {
              color: '#fff',
              padding: '2px',
              backgroundColor: theme.secondary,
              fontSize: '10px',
              fontFamily: 'Be Vietnam Pro',
            },
            formatTimeCallback: secondsToTime,
          }),
        ],
      });
      ws.on('ready', () => {
        ws.zoom(100);
        setIsReady(true);
        ws.enableDragSelection({ drag: false });
        resetRegions();
      });
      ws.load(audioUrl);
      waveSurfer.current = ws;
    }

    return () => {
      waveSurfer.current?.destroy();
      waveSurfer.current = undefined;
      setIsReady(false);
    };
  }, [audioUrl, waveformRef, resetRegions]);

  useEffect(() => {
    const ws = waveSurfer.current;
    if (ws) {
      ws.unAll();
      ws.on('ready', () => {
        ws.zoom(100);
        setIsReady(true);
        ws.enableDragSelection({ drag: false });
        resetRegions();
      });
      ws.on('play', () => setIsPlaying(true));
      ws.on('pause', () => setIsPlaying(false));
      ws.on('region-created', (region: Region) => {
        originalRegion.current = {
          id: region.id,
          start: region.start,
          end: region.end,
        };
        currentRegion.current = region;

        if (!region.id.includes('wavesurfer')) {
          const selector = `region[data-id="${region.id}"]`;
          const regionEl = document.querySelector(selector);
          regionEl?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
            inline: 'center',
          });
        }
      });
      ws.on('zoom', () => {
        const region = currentRegion.current;
        if (region) {
          const selector = `region[data-id="${region.id}"]`;
          const regionEl = document.querySelector(selector);
          regionEl?.scrollIntoView({
            block: 'end',
            inline: 'center',
          });
        }
      });
      ws.on('region-update-end', (region: Region, e: Event) => {
        e.stopPropagation();
        currentRegion.current = region;
        if (region.id.includes('wavesurfer')) {
          resetRegions();
          const snippet = onRegionCreate({
            start: region.start,
            end: region.end,
          });
          setCurrentRegion(snippet);
          waveformRef.current?.click(); // one click to fix the unregistered click bug
        } else {
          onRegionUpdate({
            id: region.id,
            start: region.start,
            end: region.end,
          });
        }
      });
    }
  }, [
    audioUrl,
    onRegionUpdate,
    onRegionCreate,
    resetRegions,
    setCurrentRegion,
    waveformRef,
  ]);

  return {
    isReady,
    isPlaying,
    playPauseCurrentRegion,
    setCurrentRegion,
    resetRegions,
    setZoom,
  };
};

export default useWaveSurfer;
