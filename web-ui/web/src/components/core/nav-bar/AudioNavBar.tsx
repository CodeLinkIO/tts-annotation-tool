import React, { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import {
  ArrowBackOutlined,
  ClearOutlined,
  DoneOutlined,
  HelpOutlineOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch, store } from '../../../redux';
import {
  NormalizedSourceAudio,
  selectAudio,
  sourceAudioSelectors,
  updateSourceAudioAnnotatedStatus,
} from '../../../redux/source-audio-slice';
import { APP_VERSION } from '../../../constants';
import UpdateSpeakerButton from './UpdateSpeakerButton';
import NavBar from './NavBar';

const IS_MAC_DEVICE = window.navigator.userAgent.includes('Macintosh');
const CMD_CTRL_KEY = IS_MAC_DEVICE ? '⌘' : 'Ctrl';
const SHORTCUT_LIST = [
  { label: 'Play/Pause Snippet', keys: [CMD_CTRL_KEY, 'P'] },
  { label: 'Play Snippet from start', keys: [CMD_CTRL_KEY, 'Shift', 'P'] },
  { label: 'Delete Snippet', keys: [CMD_CTRL_KEY, 'D'] },
  { label: 'Split Snippet', keys: [CMD_CTRL_KEY, 'S'] },
  { label: 'Merge Snippets', keys: [CMD_CTRL_KEY, 'M'] },
  { label: 'Confirm Merge Snippets', keys: [CMD_CTRL_KEY, 'Shift', 'M'] },
];

const HelpNode = React.memo(() => {
  const [openHelp, setOpenHelp] = useState(false);

  return (
    <>
      <IconButton sx={{ marginLeft: 1 }} onClick={() => setOpenHelp(true)}>
        <HelpOutlineOutlined />
      </IconButton>
      <Drawer anchor="right" open={openHelp} onClose={() => setOpenHelp(false)}>
        <Box padding={2}>
          <Typography variant="overline">Keyboard Shortcuts</Typography>
          <List disablePadding>
            <Divider />
            {SHORTCUT_LIST.map((shortcut) => (
              <React.Fragment key={shortcut.label}>
                <ListItem sx={{ paddingLeft: 0, paddingRight: 0 }}>
                  <Box
                    display="flex"
                    minWidth="400px"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography sx={{ minWidth: '100px' }}>
                      {shortcut.label}
                    </Typography>
                    <Box display="flex">
                      {shortcut.keys.map((key, i) => (
                        <React.Fragment key={key}>
                          {i !== 0 && <Typography>+</Typography>}
                          <Paper
                            elevation={3}
                            sx={(theme) => ({
                              background: theme.palette.grey[100],
                              padding: '2px 8px',
                              borderRadius: '4px',
                              margin: '0 8px',
                            })}
                          >
                            <Typography>{key}</Typography>
                          </Paper>
                        </React.Fragment>
                      ))}
                    </Box>
                  </Box>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
});

const UpdateAnnotateStatus = React.memo<{
  sourceAudio: NormalizedSourceAudio | undefined;
}>(({ sourceAudio }) => {
  const [openUpdateStatusConfirm, setOpenUpdateStatusConfirm] = useState(false);
  const dispatch = useDispatch();
  const SyncIcon = useMemo(
    () => (sourceAudio?.isAnnotated ? ClearOutlined : DoneOutlined),
    [sourceAudio?.isAnnotated]
  );

  const actionText = useMemo(() => {
    return sourceAudio?.isAnnotated ? 'Unannotated' : 'Annotated';
  }, [sourceAudio?.isAnnotated]);

  const annotatedButtonText = useMemo(() => {
    return `Mark as ${actionText}`;
  }, [actionText]);

  const modalConfirmTitle = useMemo(() => {
    return `Mark "${sourceAudio?.name}" as ${actionText}`;
  }, [sourceAudio?.name, actionText]);

  const toggleAnnotated = async () => {
    setOpenUpdateStatusConfirm(false);
    await dispatch(updateSourceAudioAnnotatedStatus(!sourceAudio?.isAnnotated));
  };

  if (!sourceAudio) {
    return null;
  }

  return (
    <Box display="flex">
      <Button
        disableElevation
        color="secondary"
        variant={!sourceAudio.isAnnotated ? 'contained' : 'outlined'}
        onClick={() => setOpenUpdateStatusConfirm(true)}
      >
        {annotatedButtonText}
        <SyncIcon sx={{ marginLeft: '4px', fontSize: '16px' }} />
      </Button>
      <HelpNode />
      <Dialog
        open={openUpdateStatusConfirm}
        onClose={() => setOpenUpdateStatusConfirm(false)}
      >
        <DialogTitle sx={{ padding: 1 }}>{modalConfirmTitle}</DialogTitle>
        <DialogActions>
          <Button
            autoFocus
            color="secondary"
            variant="outlined"
            disableElevation
            onClick={() => setOpenUpdateStatusConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            color="secondary"
            variant="contained"
            disableElevation
            onClick={toggleAnnotated}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

const AudioNavBar: React.FC = () => {
  const loading = useSelector((s) => s.sourceAudio.loading);
  const selectedSourceAudioId = useSelector((s) => s.sourceAudio.selectedId);
  const sourceAudio = sourceAudioSelectors.selectById(
    store.getState().sourceAudio,
    selectedSourceAudioId
  );

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const unselectSourceAudio = () => {
    dispatch(selectAudio({ audioId: undefined }));
  };

  useEffect(() => {
    return () => {
      unselectSourceAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NavBar loading={loading}>
      <Box display="flex" alignItems="center">
        <ArrowBackOutlined
          sx={{
            verticalAlign: 'text-top',
            marginRight: 1,
            cursor: 'pointer',
          }}
          onClick={() => {
            navigate(-1);
          }}
        />
        {sourceAudio && (
          <>
            <Typography
              variant="h6"
              fontWeight="bold"
              title={APP_VERSION}
              sx={{ flexGrow: 1 }}
            >
              {sourceAudio.name}
            </Typography>

            <Divider
              orientation="vertical"
              flexItem
              sx={{ margin: '0 8px', borderRightWidth: 'unset' }}
            />
            <UpdateSpeakerButton />
          </>
        )}
      </Box>
      <UpdateAnnotateStatus sourceAudio={sourceAudio} />
    </NavBar>
  );
};

export default React.memo(AudioNavBar);
