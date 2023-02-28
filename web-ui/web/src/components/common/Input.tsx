import { ChangeEvent } from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  label: string;
  value?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

const Input: React.FC<Props> = ({
  value,
  label,
  placeholder,
  rows,
  disabled,
  onChange,
  onBlur,
}) => {
  const Control = rows ? 'textarea' : 'input';
  return (
    <Box
      position="relative"
      sx={(theme) => ({
        'input, textarea': {
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
      <Control
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
          onChange?.(e.target.value);
        }}
        onBlur={onBlur}
      />
    </Box>
  );
};

export default Input;
