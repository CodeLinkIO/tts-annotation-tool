import { Fragment } from 'react';
import {
  Card,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Checkbox,
} from '@mui/material';
import { PauseOutlined, PlayArrowOutlined } from '@mui/icons-material';

import { secondsToTime } from '../../../utils/helpers';
import { useSelector, useDispatch, store } from '../../../redux';
import {
  selectSnippet,
  snippetSelectors,
  sourceAudioSnippetsSelector,
  toggleMergingSnippet,
} from '../../../redux/snippet-slice';

interface Props {
  isReady: boolean;
  isPlaying: boolean;
  onSelectSnippet: (snippet: Vinyl.Snippet, instantPlay?: boolean) => void;
  onPlayPause: () => void;
}

const SnippetList: React.FC<Props> = ({
  isReady,
  isPlaying,
  onSelectSnippet,
  onPlayPause,
}) => {
  const state = store.getState();
  const currentSnippetId = useSelector((s) => s.snippet.selectedId);
  const currentSnippet = snippetSelectors.selectById(
    state.snippet,
    currentSnippetId,
  );
  const snippetListUid = useSelector((s) => s.snippet.uid); // trigger re-render for snippet list
  const sourceAudioId = useSelector((s) => s.sourceAudio.selectedId);
  const snippetList = useSelector(sourceAudioSnippetsSelector);
  const dispatch = useDispatch();

  const mergingId = useSelector((s) => s.snippet.isMerging);
  const mergingSelectedIds = useSelector((s) => s.snippet.mergingSelectedIds);
  const snippetsSumDuration = snippetList.reduce((prevValue, current) => {
    return prevValue + current.endTime - current.startTime;
  }, 0);
  const sumDuration = secondsToTime(snippetsSumDuration, true);

  return (
    <Card>
      <List disablePadding>
        <ListItem
          sx={{
            padding: '12px',
            opacity: 1,
          }}
        >
          <Typography
            title={snippetListUid}
            variant="overline"
            fontSize="10px"
            lineHeight="16px"
            letterSpacing="1.5px"
          >
            {`Snippet List [${snippetList.length}] [${sumDuration}]`}
          </Typography>
        </ListItem>
        <Divider />

        <Box height="calc(100vh - 141px)" overflow="auto">
          {snippetList.map((snippet, i) => {
            const { text } = snippet;
            const isSelected = currentSnippet?.id === snippet.id;
            const isSnippetPlaying = isSelected && isPlaying;
            const PlayPauseIcon = isSnippetPlaying
              ? PauseOutlined
              : PlayArrowOutlined;

            const snippetInMerging = mergingSelectedIds.includes(snippet.id);
            const prevSnippetInMerging =
              i !== 0
                ? mergingSelectedIds.includes(snippetList[i - 1]?.id)
                : false;
            const nextSnippetInMerging =
              i !== snippetList.length
                ? mergingSelectedIds.includes(snippetList[i + 1]?.id)
                : false;
            const inMiddleOfMergingSelected =
              snippetInMerging && prevSnippetInMerging && nextSnippetInMerging;
            const allowedToSelectForMerge =
              prevSnippetInMerging || nextSnippetInMerging;

            const disableMerge =
              inMiddleOfMergingSelected || !allowedToSelectForMerge;

            const wordCount = text.split(' ').length;

            const time = (
              <Box marginBottom={1} display="flex">
                {mergingId && (
                  <Checkbox
                    checked={snippetInMerging}
                    disabled={disableMerge}
                    sx={{ padding: 0, marginRight: 1 }}
                  />
                )}
                <Box display="flex" justifyContent="space-between" flex="1">
                  <Box>
                    <PlayPauseIcon
                      sx={{
                        verticalAlign: 'bottom',
                        marginRight: 1,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSelected) {
                          dispatch(selectSnippet(snippet.id));
                          onSelectSnippet(snippet, true);
                        } else {
                          onPlayPause();
                        }
                      }}
                    />
                    <Typography
                      variant="overline"
                      fontWeight="bold"
                      fontSize="14px"
                      lineHeight="20px"
                      letterSpacing="0.25px"
                      sx={{
                        verticalAlign: 'middle',
                        textTransform: 'unset',
                      }}
                    >
                      {`${i + 1}. `}
                      {secondsToTime(snippet.startTime)}
                      {' - '}
                      {secondsToTime(snippet.endTime)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="overline"
                      fontWeight="bold"
                      fontSize="14px"
                      lineHeight="20px"
                      letterSpacing="0.25px"
                      sx={{
                        verticalAlign: 'middle',
                        textTransform: 'unset',
                      }}
                    >
                      {'['}
                      {text ? wordCount : 0} {wordCount >= 2 ? 'words' : 'word'}
                      {']'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
            const subtitle = (
              <Typography
                fontSize="14px"
                lineHeight="20px"
                letterSpacing="0.25px"
              >
                {text}
              </Typography>
            );
            return (
              <Fragment key={snippet.id}>
                <ListItem
                  button
                  key={sourceAudioId}
                  autoFocus={isSelected}
                  disabled={!isReady}
                  sx={{
                    padding: '12px',
                    opacity: isSelected ? 1 : 0.6,
                  }}
                  onClick={() => {
                    dispatch(selectSnippet(snippet.id));
                    if (!isSelected && isPlaying) onPlayPause();
                    onSelectSnippet(snippet);
                    if (mergingId && !disableMerge) {
                      dispatch(toggleMergingSnippet(snippet.id));
                    }
                  }}
                >
                  <ListItemText
                    sx={{
                      margin: 0,
                      flex: 'none',
                      width: '100%',
                      '& .MuiTypography-root': {
                        fontFamily: 'Be Vietnam Pro',
                      },
                    }}
                    primary={time}
                    secondary={subtitle}
                  />
                </ListItem>
                <Divider component="li" />
              </Fragment>
            );
          })}
        </Box>
      </List>
    </Card>
  );
};

export default SnippetList;
