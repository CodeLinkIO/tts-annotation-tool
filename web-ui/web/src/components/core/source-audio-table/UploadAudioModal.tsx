import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  LinearProgress,
  DialogActions,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import { AttachFile, ChevronRightOutlined } from '@mui/icons-material';
import { Alert } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

import { useSelector, useDispatch, store } from '../../../redux';
import { getSourceAudioList } from '../../../redux/source-audio-slice';
import { getSpeakerList, speakerSelectors } from '../../../redux/speaker-slice';

import firebase, { firestore } from '../../../firebase/client';
import {
  FirestoreCollections,
  FunctionNames,
  StorageFolder,
} from '../../../utils/enums';

import { Input, Autocomplete, ErrorSnackbar } from '../../common';
import { getYouTubeVideoId } from '../../../utils/helpers';
import { normalizeAudioTitle } from '../../../utils/string';

interface Props {
  open: boolean;
  onClose: () => void;
}

const createSourceAudio = firebase
  .functions()
  .httpsCallable(FunctionNames.CreateSourceAudio);

const UploadAudioModal: React.FC<Props> = ({ open, onClose }) => {
  const dispatch = useDispatch();

  const [isFileUpload, setIsFileUpload] = useState(true);
  const tabNode = (
    <Tabs
      value={isFileUpload ? 0 : 1}
      onChange={(_, value) => setIsFileUpload(value === 0)}
    >
      <Tab label="File Upload" />
      <Tab label="YouTube" />
    </Tabs>
  );

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const loadingNode = loading ? (
    <LinearProgress
      variant={isFileUpload ? 'determinate' : 'indeterminate'}
      value={progress}
    />
  ) : null;

  // file upload
  const [step, setStep] = useState(1);
  useEffect(() => {
    if (!isFileUpload) {
      setStep(1);
    }
  }, [isFileUpload]);
  const stepNode = (stepNumber: number, content: React.ReactNode) => (
    <Typography
      component="span"
      color={(theme) => {
        const disabledColor = stepNumber === 1 ? '' : theme.palette.grey[400];
        return step === stepNumber ? theme.palette.primary.main : disabledColor;
      }}
    >
      {content}
    </Typography>
  );
  const breadcrumbsNode = (
    <>
      {stepNode(1, 'Step 1: Select Audio')}
      {stepNode(2, <ChevronRightOutlined sx={{ verticalAlign: 'middle' }} />)}
      {stepNode(2, 'Step 2: Add Subtitle')}
    </>
  );

  const [name, setName] = useState('');
  const [file, setFile] = useState<File>();
  const fileUploadButtonNode = useMemo(() => {
    const handleFileUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        const file = e.target.files[0];
        // remove extension from file name
        const filename = file.name.split('.').slice(0, -1).join('.');
        setFile(file);
        !name && setName(normalizeAudioTitle(filename));
      }
    };

    return (
      <Button
        variant="outlined"
        component="label"
        disabled={loading}
        startIcon={<AttachFile />}
      >
        {file ? file.name : 'Select Audio File'}
        <input
          type="file"
          accept="audio/*"
          hidden
          onChange={handleFileUploaded}
        />
      </Button>
    );
  }, [file, loading, name]);

  // YouTube
  const [youtubeURL, setYoutubeURL] = useState('');
  const youtubeURLInputNode = (
    <Input
      label="URL"
      value={youtubeURL}
      onChange={setYoutubeURL}
      disabled={loading}
    />
  );
  const youtubePreviewNode = (
    <Box>
      <iframe
        width="100%"
        height="250"
        src={`https://www.youtube.com/embed/${getYouTubeVideoId(youtubeURL)}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </Box>
  );

  const nameInputNode = useMemo(() => {
    const normalizeNameOnBlur = () => {
      if (!name) return;

      setName(normalizeAudioTitle(name));
    };

    return (
      <Input
        value={name}
        label="Name"
        disabled={loading}
        onChange={setName}
        onBlur={normalizeNameOnBlur}
      />
    );
  }, [loading, name]);

  const [subtitle, setSubtitle] = useState('');
  const subtitleInputNode = (
    <Input
      label="Subtitle"
      rows={20}
      disabled={loading}
      value={subtitle}
      onChange={setSubtitle}
    />
  );

  const [error, setError] = useState('');
  const errorNode = error ? (
    <Box marginBottom={2}>
      <Alert severity="error">{error}</Alert>
    </Box>
  ) : null;

  useEffect(() => {
    dispatch(getSpeakerList());
  }, [dispatch]);

  const state = store.getState();
  const speakerList = speakerSelectors.selectAll(state.speaker);
  const getSpeakersLoading = useSelector((s) => s.speaker.loading);
  const [speaker, setSpeaker] = useState<Vinyl.Speaker & { isNew?: boolean }>();
  const speakerInputNode = (
    <Autocomplete
      label="Speaker"
      value={speaker ? { label: speaker.name, value: speaker.id } : null}
      options={speakerList.map((speaker) => ({
        value: speaker.id,
        label: speaker.name,
      }))}
      disabled={getSpeakersLoading || loading}
      onChange={(s) => {
        if (s) {
          setSpeaker(
            s.isNew
              ? { id: '', name: `${s.value}` }
              : { id: `${s.value}`, name: s.label }
          );
        } else {
          setSpeaker(undefined);
        }
      }}
    />
  );

  const handleUpload = useCallback(() => {
    setError('');
    if (file) {
      const fileExtensionDot = file.name.lastIndexOf('.');
      const fileExtension = file.name.slice(fileExtensionDot);
      const fileName = `${uuidv4()}${fileExtension}`;
      setLoading(true);
      const storageRef = firebase.storage().ref();
      const storageRefPath = `${StorageFolder.SourceAudios}/${fileName}`;
      const uploadTask = storageRef.child(storageRefPath).put(file);

      uploadTask.on('state_changed', (snapshot) => {
        const { bytesTransferred, totalBytes } = snapshot;
        const progress = (bytesTransferred / totalBytes) * 100;
        setProgress(progress);
      });

      uploadTask.then(() => {
        createSourceAudio({
          // just to make sure name is already normalized when blurring the input
          name: normalizeAudioTitle(name),
          storageRefPath,
          subtitle,
          speaker,
        })
          .then(() => {
            setLoading(false);
            onClose();
            dispatch(getSourceAudioList());
          })
          .catch(() => {
            setError('Can not upload audio');
            setLoading(false);
          });
      });
    }
  }, [file, onClose, name, subtitle, speaker, dispatch]);

  const cancelButton = (
    <Button
      variant="outlined"
      onClick={onClose}
      disabled={loading}
      sx={{ marginRight: 1 }}
    >
      CANCEL
    </Button>
  );

  const step1ActionsNode = (
    <>
      {cancelButton}
      <Button
        disableElevation
        variant="contained"
        color="secondary"
        disabled={loading || !name || !speaker || !file}
        onClick={() => setStep(2)}
      >
        CONTINUE
      </Button>
    </>
  );

  const step2ActionsNode = (
    <>
      <Button
        variant="outlined"
        onClick={() => setStep(1)}
        disabled={loading}
        sx={{ marginRight: 1 }}
      >
        BACK
      </Button>
      <Button
        disableElevation
        variant="contained"
        color="secondary"
        disabled={loading || !name || !file || !speaker}
        onClick={handleUpload}
      >
        {loading ? 'UPLOADING' : 'UPLOAD'}
      </Button>
    </>
  );

  const handleYouTube = useCallback(async () => {
    setLoading(true);
    let speakerId = '';
    if (!speaker?.id) {
      const doc = await firestore
        .collection(FirestoreCollections.Speakers)
        .add({ name: speaker?.name });
      speakerId = doc.id;
    }
    await fetch(process.env.REACT_APP_YOUTUBE_HANDLE_URL ?? '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify({ youtubeURL, speakerId, name }),
    });
    onClose();
    setLoading(false);
  }, [youtubeURL, name, speaker, onClose]);

  const youtubeActionsNode = (
    <>
      {cancelButton}
      <Button
        disableElevation
        variant="contained"
        color="secondary"
        disabled={loading || !name || !speaker || !youtubeURL}
        onClick={handleYouTube}
      >
        {loading ? 'PROCESSING' : 'PROCESS'}
      </Button>
    </>
  );

  const errorMessage = useSelector((s) => s.speaker.errorMessage);
  const fetchSpeakerErrorNode = <ErrorSnackbar error={errorMessage} />;

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      onClose={!loading ? onClose : () => {}}
    >
      {loadingNode}
      {fetchSpeakerErrorNode}
      <Box marginBottom={1}>{tabNode}</Box>
      {isFileUpload && <DialogTitle>{breadcrumbsNode}</DialogTitle>}
      <DialogContent>
        {errorNode}
        {isFileUpload ? (
          <>
            {step === 1 && (
              <>
                <Box marginBottom={2}>{fileUploadButtonNode}</Box>
                <Box marginBottom={2}>{nameInputNode}</Box>
                <Box marginBottom={2}>{speakerInputNode}</Box>
              </>
            )}
            {step === 2 && <Box marginBottom={2}>{subtitleInputNode}</Box>}
          </>
        ) : (
          <>
            {!isFileUpload && youtubeURL && youtubePreviewNode}
            <Box marginBottom={2}>{youtubeURLInputNode}</Box>
            <Box marginBottom={2}>{nameInputNode}</Box>
            <Box marginBottom={2}>{speakerInputNode}</Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Box padding={1}>
          {isFileUpload ? (
            <>
              {step === 1 && step1ActionsNode}
              {step === 2 && step2ActionsNode}
            </>
          ) : (
            youtubeActionsNode
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default UploadAudioModal;
