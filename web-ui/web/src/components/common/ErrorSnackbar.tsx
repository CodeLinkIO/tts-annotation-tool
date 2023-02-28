import { useState, useEffect } from 'react';
import { Alert, Snackbar } from '@mui/material';

interface Props {
  error: string;
}

const ErrorSnackbar: React.FC<Props> = ({ error }) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (error) {
      setOpen(true);
    }
  }, [error]);

  const handleClose = () => setOpen(false);

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={handleClose} severity="error">
        {error}
      </Alert>
    </Snackbar>
  );
};

export default ErrorSnackbar;
