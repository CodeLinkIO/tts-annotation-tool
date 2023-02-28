import MuiAutocomplete, {
  createFilterOptions,
} from '@mui/material/Autocomplete';
import { Box, Typography } from '@mui/material';

type Option = {
  label: string;
  value: string | number;
  isNew?: boolean;
};

interface Props {
  label: string;
  options: Option[];
  value: Option | null;
  disabled?: boolean;
  onChange: (option: Option | null) => void;
}

const filter = createFilterOptions<Option>();

const Autocomplete: React.FC<Props> = ({
  value: propValue,
  options,
  label,
  disabled,
  onChange,
}) => {
  return (
    <Box sx={{ position: 'relative' }}>
      <Typography
        component="label"
        fontSize="14px"
        lineHeight="16px"
        letterSpacing="0.75px"
        color={(theme) => theme.palette.grey[500]}
        sx={{
          display: 'block',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}
      >
        {label}
      </Typography>
      <MuiAutocomplete
        selectOnFocus
        clearOnBlur
        freeSolo
        value={propValue}
        options={options}
        disabled={disabled}
        onChange={(_, value) => {
          if (typeof value === 'string') {
            onChange?.({
              label: value,
              value: value,
            });
          } else {
            onChange?.(value);
          }
        }}
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
                border: `1px solid ${theme.palette.grey[300]}`,
                padding: '12px',
                width: '100%',
                borderRadius: '4px',
                boxSizing: 'border-box',
                fontFamily: 'Be Vietnam Pro',
                '&:focus': {
                  outline: 'none',
                },
                '&:disabled': {
                  background: theme.palette.grey[100],
                  border: 'none',
                },
              },
            })}
          >
            <input {...params.inputProps} />
          </Box>
        )}
      />
    </Box>
  );
};

export default Autocomplete;
