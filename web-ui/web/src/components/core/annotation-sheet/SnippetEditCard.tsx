import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  Divider,
  Slider,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import {
  DeleteOutline,
  ViewAgendaOutlined,
  PauseOutlined,
  PlayArrowOutlined,
  Replay,
  ZoomInOutlined,
  LayersOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@mui/icons-material';
import cuid from 'cuid';
import { GlobalHotKeys } from 'react-hotkeys';

import { useSelector, useDispatch, store } from '../../../redux';
import { sourceAudioSelectors } from '../../../redux/source-audio-slice';
import {
  editSnippet,
  splitSnippet,
  snippetSelectors,
  openMerge,
  cancelMerge,
  confirmMergeSnippets,
} from '../../../redux/snippet-slice';
import { Input, ConfirmModal, ErrorSnackbar } from '../../common';

import { useDebounce } from '../../../hooks';

const separators = ['.', '!', '?', ';'];

const isMacDevice = window.navigator.userAgent.includes('Macintosh');
const cmdCtrlKey = isMacDevice ? 'command' : 'ctrl';

interface Props {
  waveformRef: React.RefObject<HTMLDivElement>;
  isAudioReady: boolean;
  isPlaying: boolean;
  onDelete: (uid: string) => void;
  onPlayPause: (playFromStart?: boolean) => void;
  onZoomChange: (zoomValue: number) => void;
}

const SnippetEditCard: React.FC<Props> = ({
  waveformRef,
  isAudioReady,
  isPlaying,
  onDelete,
  onPlayPause,
  onZoomChange,
}) => {
  const dispatch = useDispatch();

  const currentSnippetId = useSelector((s) => s.snippet.selectedId);
  const currentSnippet = snippetSelectors.selectById(
    store.getState().snippet,
    currentSnippetId,
  );

  const [zoomValue, setZoomValue] = useState(100);
  const audioControlNode = (
    <>
      <Box>
        <GlobalHotKeys
          keyMap={{
            PLAY_PAUSE: `${cmdCtrlKey}+p`,
            PLAY_FROM_START: `${cmdCtrlKey}+shift+p`,
          }}
          handlers={{
            PLAY_PAUSE: (e) => {
              console.log(window.navigator.userAgent);
              e?.preventDefault();
              onPlayPause();
            },
            PLAY_FROM_START: (e) => {
              e?.preventDefault();
              onPlayPause(true);
            },
          }}
        >
          <IconButton
            disabled={!currentSnippet}
            title={!isPlaying ? 'Play' : 'Pause'}
            onClick={() => onPlayPause()}
            size="large"
          >
            {!isPlaying ? <PlayArrowOutlined /> : <PauseOutlined />}
          </IconButton>
          <IconButton
            disabled={!currentSnippet}
            onClick={() => onPlayPause(true)}
            size="large"
          >
            <Replay />
          </IconButton>
        </GlobalHotKeys>
      </Box>
      <Box display="flex" alignItems="center" width="200px" marginLeft={4}>
        <Slider
          color="secondary"
          min={100}
          max={200}
          onChange={(_, value) => setZoomValue(value as number)}
          onChangeCommitted={(_, value) => onZoomChange(value as number)}
        />
      </Box>
      <Box display="flex" alignItems="center" padding={1} marginLeft={1}>
        <ZoomInOutlined />
        <Typography>{`${zoomValue}%`}</Typography>
      </Box>
    </>
  );

  const waveformNode = (
    <>
      {!isAudioReady && (
        <Box
          position="absolute"
          height="100%"
          width="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          bgcolor="white"
          zIndex={5}
        >
          <CircularProgress size={100} />
        </Box>
      )}
      <Box
        ref={waveformRef}
        sx={(theme) => ({
          width: '100%',
          '& wave': {
            border: 'none !important',
            '& .wavesurfer-region': {
              backgroundColor: `${theme.palette.primary.light} !important`,
              '& .wavesurfer-handle': {
                backgroundColor: `${theme.palette.primary.main} !important`,
              },
            },
            '& .wavesurfer-region[data-id="whole-audio"]': {
              backgroundColor: 'unset !important',
            },
          },
        })}
      />
    </>
  );

  const selectedAudioId = useSelector((s) => s.sourceAudio.selectedId);
  const sourceAudio = sourceAudioSelectors.selectById(
    store.getState().sourceAudio,
    selectedAudioId,
  );
  const isMerging = useSelector((s) => s.snippet.isMerging);
  const shouldDisabled = sourceAudio?.isAnnotated || Boolean(isMerging);

  const isEditable = useRef(false);
  const [text, setText] = useState('');
  useEffect(() => {
    isEditable.current = false;
    setText(currentSnippet?.text ?? '');
  }, [currentSnippet]);
  const debouncedText = useDebounce(text, 400);
  useEffect(() => {
    if (currentSnippet && isEditable.current) {
      dispatch(
        editSnippet({
          ...currentSnippet,
          text: debouncedText,
        }),
      );
      isEditable.current = false;
    }
  }, [dispatch, currentSnippet, debouncedText, isEditable]);
  const snippetTextInputNode = (
    <Input
      label="Text"
      rows={5}
      disabled={!currentSnippet || shouldDisabled}
      value={text}
      onChange={(v) => {
        setText(v);
        isEditable.current = true;
      }}
    />
  );

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const deleteSectionNode = currentSnippet ? (
    <GlobalHotKeys
      keyMap={{ DELETE_SNIPPET: `${cmdCtrlKey}+d` }}
      handlers={{
        DELETE_SNIPPET: (e) => {
          e?.preventDefault();
          setOpenDeleteConfirm(true);
        },
      }}
    >
      <Button
        disableElevation
        variant="outlined"
        color="secondary"
        onClick={() => setOpenDeleteConfirm(true)}
        sx={(theme) => ({ marginRight: parseInt(theme.spacing(1)) / 2 })}
        disabled={shouldDisabled}
      >
        <Box marginRight={1}>DELETE</Box>
        <DeleteOutline fontSize="small" />
      </Button>
      <ConfirmModal
        open={openDeleteConfirm}
        title="Confirm"
        description="Delete this snippet?"
        onConfirm={() => {
          onDelete(currentSnippet.id ?? '');
          setOpenDeleteConfirm(false);
        }}
        onCancel={() => setOpenDeleteConfirm(false)}
        onClose={() => setOpenDeleteConfirm(false)}
      />
    </GlobalHotKeys>
  ) : null;

  const [openSplitConfirm, setOpenSplitConfirm] = useState(false);
  const snippetListUid = useSelector((s) => s.snippet.uid); // trigger re-render for snippet list
  const canSplit = useMemo(() => {
    if (!currentSnippet) return false;
    if (!snippetListUid) return false;
    let hasSeparator = false;
    const { text } = currentSnippet;
    separators.forEach((separator) => {
      if (text.substring(0, text.length - 1).includes(separator)) {
        hasSeparator = true;
        return;
      }
    });
    return hasSeparator;
  }, [currentSnippet, snippetListUid]);
  const splitSnippetSectionNode = currentSnippet ? (
    <GlobalHotKeys
      keyMap={{ SPLIT_SNIPPET: `${cmdCtrlKey}+s` }}
      handlers={{
        SPLIT_SNIPPET: (e) => {
          e?.preventDefault();
          setOpenSplitConfirm(true);
        },
      }}
    >
      <Button
        disableElevation
        variant="outlined"
        color="secondary"
        onClick={() => setOpenSplitConfirm(true)}
        disabled={shouldDisabled || !canSplit}
        sx={(theme) => ({ marginRight: parseInt(theme.spacing(1)) / 2 })}
      >
        <Box marginRight={1}>SPLIT</Box>
        <ViewAgendaOutlined fontSize="small" />
      </Button>
      <ConfirmModal
        open={openSplitConfirm}
        title="Confirm"
        description="Split this snippet?"
        onConfirm={() => {
          let splitted = false;
          const { text } = currentSnippet;
          separators.forEach((separator) => {
            const hasSeparator = text
              .substring(0, text.length - 1)
              .includes(separator);
            if (hasSeparator && !splitted) {
              dispatch(
                splitSnippet({
                  snippet: currentSnippet,
                  newSnippets: text
                    .split(separator)
                    .filter((s) => s)
                    .map((s) => ({
                      id: cuid(),
                      text: `${s.trim()}${separator}`,
                    })),
                }),
              );
              setOpenSplitConfirm(false);
              splitted = true;
              return;
            }
          });
        }}
        onCancel={() => setOpenSplitConfirm(false)}
        onClose={() => setOpenSplitConfirm(false)}
      />
    </GlobalHotKeys>
  ) : null;

  const mergingSelectedIds = useSelector((s) => s.snippet.mergingSelectedIds);
  const mergingCount = mergingSelectedIds.length;
  const [openMergeConfirm, setOpenMergeConfirm] = useState(false);
  const mergingNode = currentSnippet ? (
    <GlobalHotKeys
      keyMap={{
        MERGE_SNIPPETS: `${cmdCtrlKey}+m`,
        CONFIRM_MERGE_SNIPPETS: `${cmdCtrlKey}+shift+m`,
      }}
      handlers={{
        MERGE_SNIPPETS: (e) => {
          e?.preventDefault();
          dispatch(openMerge(currentSnippetId));
        },
        CONFIRM_MERGE_SNIPPETS: (e) => {
          e?.preventDefault();
          setOpenMergeConfirm(true);
        },
      }}
    >
      {mergingSelectedIds.length === 0 ? (
        <Button
          disableElevation
          variant="outlined"
          color="secondary"
          onClick={() => {
            dispatch(openMerge(currentSnippetId));
          }}
          disabled={shouldDisabled}
          sx={(theme) => ({ marginRight: parseInt(theme.spacing(1)) / 2 })}
        >
          <Box marginRight={1}>MERGE</Box>
          <LayersOutlined fontSize="small" />
        </Button>
      ) : (
        <>
          <Button
            disableElevation
            variant="outlined"
            color="secondary"
            onClick={() => setOpenMergeConfirm(true)}
            disabled={mergingCount <= 1}
            sx={(theme) => ({ marginRight: parseInt(theme.spacing(1)) / 2 })}
          >
            <Box marginRight={1}>
              MERGE {mergingCount} {mergingCount >= 2 ? 'SNIPPETS' : 'SNIPPET'}
            </Box>
            <CheckOutlined fontSize="small" />
          </Button>
          <ConfirmModal
            open={openMergeConfirm}
            title="Confirm"
            description={`
              Merge
              ${mergingCount} ${mergingCount >= 2 ? 'snippets' : 'snippet'}?
            `}
            onConfirm={() => dispatch(confirmMergeSnippets())}
            onCancel={() => setOpenMergeConfirm(false)}
            onClose={() => setOpenMergeConfirm(false)}
          />
          <Button
            disableElevation
            variant="outlined"
            color="secondary"
            onClick={() => {
              dispatch(cancelMerge());
            }}
            sx={(theme) => ({ marginRight: parseInt(theme.spacing(1)) / 2 })}
          >
            <Box marginRight={1}>CANCEL</Box>
            <CloseOutlined fontSize="small" />
          </Button>
        </>
      )}
    </GlobalHotKeys>
  ) : null;

  const errorMessage = useSelector((s) => s.snippet.errorMessage);
  const errorNode = <ErrorSnackbar error={errorMessage} />;

  return (
    <Card
      sx={{
        height: 'calc(100vh - 100px)',
        position: 'relative',
      }}
    >
      {errorNode}
      <Box
        display="flex"
        justifyContent="space-between"
        paddingX="12px"
        paddingY="20px"
      >
        <Box display="flex">{audioControlNode}</Box>
        <Box display="flex" alignItems="center">
          {!isMerging && (
            <>
              {deleteSectionNode}
              {splitSnippetSectionNode}
            </>
          )}
          {mergingNode}
        </Box>
      </Box>
      <Divider />
      <Box
        height="calc(100% - 80px - 170px)"
        overflow="auto"
        sx={{ pointerEvents: shouldDisabled ? 'none' : 'unset' }}
      >
        <Box
          position="relative"
          display="flex"
          height="100%"
          alignItems="center"
        >
          {waveformNode}
        </Box>
      </Box>
      <Divider />
      <Box padding={2} display="flex">
        <Box flexGrow={6}>{snippetTextInputNode}</Box>
      </Box>
    </Card>
  );
};

export default SnippetEditCard;
