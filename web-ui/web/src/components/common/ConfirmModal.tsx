import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';

interface Props {
  title: string;
  open: boolean;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}

const ConfirmModal: React.FC<Props> = ({
  title,
  open,
  description,
  onConfirm,
  onCancel,
  onClose,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiPaper-root': {
          minWidth: '400px',
        },
        fontFamily: 'Be Vietnam Pro',
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{description}</DialogContent>
      <DialogActions sx={{ padding: 2 }}>
        <Button
          autoFocus
          color="secondary"
          variant="outlined"
          disableElevation
          onClick={() => {
            onCancel();
            onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          color="secondary"
          variant="contained"
          disableElevation
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmModal;
