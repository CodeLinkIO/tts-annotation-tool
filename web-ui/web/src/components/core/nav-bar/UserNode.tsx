import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { AccountCircleOutlined, ExitToAppOutlined } from '@mui/icons-material';
import firebase from '../../../firebase/client';

const UserNote: React.FC = () => {
  const [user, loading, error] = useAuthState(firebase.auth());
  const [userButtonAnchor, setUserButtonAnchor] = useState<HTMLButtonElement>();

  const onSignOut = () => {
    firebase.auth().signOut();
    setUserButtonAnchor(undefined);
  };

  const onMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setUserButtonAnchor(event.currentTarget);
  };

  const onMenuHide = () => {
    setUserButtonAnchor(undefined);
  };

  if (loading) return <LinearProgress />;

  if (!loading && error) return null;

  if (!loading && !user) return null;

  return (
    <>
      <Button onClick={onMenuClick}>
        <AccountCircleOutlined
          sx={(theme) => ({
            fontSize: 36,
            color: theme.palette.secondary.dark,
          })}
        />
      </Button>
      <Popover
        id={userButtonAnchor ? 'simple-popover' : undefined}
        open={Boolean(userButtonAnchor)}
        anchorEl={userButtonAnchor}
        onClose={onMenuHide}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box padding={3} paddingY={1}>
          <Typography>{user?.email}</Typography>
        </Box>
        <Divider />
        <Divider />
        <Button
          fullWidth
          sx={(theme) => ({
            padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
            color: theme.palette.secondary.dark,
          })}
          onClick={onSignOut}
        >
          Sign out
          <ExitToAppOutlined sx={{ marginLeft: 1 }} />
        </Button>
      </Popover>
    </>
  );
};

export default React.memo(UserNote);
