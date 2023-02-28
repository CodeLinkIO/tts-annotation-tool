import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import MuiAutocomplete, {
  createFilterOptions,
} from '@mui/material/Autocomplete';

import { store, useSelector, useDispatch } from '../../../redux';
import {
  sourceAudioSelectors,
  updateSourceAudioSpeaker,
} from '../../../redux/source-audio-slice';
import { getSpeakerList, speakerSelectors } from '../../../redux/speaker-slice';

import { ErrorSnackbar } from '../../common';

type Option = {
  label: string;
  value: string | number;
  isNew?: boolean;
};

const filter = createFilterOptions<Option>();

const UpdateSpeakerButton: React.FC = () => {
  const speakerListUid = useSelector((s) => s.speaker.uid);
  speakerListUid.toString(); // force re-render

  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getSpeakerList());
  }, [dispatch]);

  const state = store.getState();
  const speakerList = speakerSelectors.selectAll(state.speaker);
  const options = speakerList.map((speaker) => ({
    value: speaker.id,
    label: speaker.name,
  })) as Option[];

  const sourceAudioId = useSelector((s) => s.sourceAudio.selectedId);
  const handleChange = async (option: Option) => {
    if (!sourceAudioId) return;
    setLoading(true);
    const speaker: {
      sourceAudioId: string;
      speakerId?: string;
      speakerName?: string;
    } = {
      sourceAudioId,
      speakerId: option.value as string,
      speakerName: option.value as string,
    };
    if (option.isNew) {
      delete speaker.speakerId;
    } else {
      delete speaker.speakerName;
    }
    await dispatch(updateSourceAudioSpeaker(speaker));
    setLoading(false);
  };

  const errorMessage = useSelector((s) => s.speaker.errorMessage);
  const errorNode = <ErrorSnackbar error={errorMessage} />;

  const audioId = useSelector((s) => s.sourceAudio.selectedId);
  const audio = sourceAudioSelectors.selectById(state.sourceAudio, audioId);
  return (
    <Box marginRight={2}>
      {errorNode}
      {audio && (
        <MuiAutocomplete
          selectOnFocus
          clearOnBlur
          freeSolo
          value={{
            label: audio.speakerName ?? '',
            value: audio.speakerId,
          }}
          options={options}
          disabled={loading || audio.isAnnotated}
          onChange={(_, value) => handleChange(value as Option)}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);
            if (filtered.length === 0 && params.inputValue) {
              filtered.push({
                value: params.inputValue,
                label: `Add "${params.inputValue}"`,
                isNew: true,
              });
            }

            return filtered;
          }}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option;
            }
            return option.label;
          }}
          renderOption={(props, option) => <li {...props}>{option.label}</li>}
          renderInput={(params) => (
            <Box
              ref={params.InputProps.ref}
              sx={(theme) => ({
                input: {
                  resize: 'none',
                  border: '1px solid',
                  borderColor: 'white',
                  padding: 0,
                  fontFamily: 'Be Vietnam Pro',
                  fontSize: '20px',
                  lineHeight: '32px',
                  fontWeight: 'bold',
                  transitionDuration: '0.3s',
                  '&:hover, &:focus': {
                    borderColor: theme.palette.grey[300],
                    padding: '0 8px',
                  },
                  '&:focus': {
                    outline: 'none',
                  },
                  '&:disabled': {
                    border: 'none',
                    background: 'white',
                    color: 'black',
                    padding: 0,
                  },
                },
              })}
            >
              <input {...params.inputProps} />
            </Box>
          )}
        />
      )}
    </Box>
  );
};

export default UpdateSpeakerButton;
