import { useState } from 'react';
import {
  Card,
  Box,
  CardContent,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';

import firebase from '../../../firebase/client';

import loginBackground from '../../../assets/login.png';

var provider = new firebase.auth.GoogleAuthProvider();

interface Props {
  open: boolean;
}

const SignInOverlay: React.FC<Props> = ({ open }) => {
  const [loading, setLoading] = useState(false);

  if (!open) return null;
  return (
    <Box
      bgcolor={(theme) => theme.palette.grey[100]}
      position="absolute"
      height="100vh"
      width="100vw"
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <Card>
        <CardContent sx={{ padding: '40px' }}>
          <img alt="login-background" src={loginBackground} />
          <Typography
            fontSize="40px"
            lineHeight="52px"
            fontWeight="bold"
            align="center"
          >
            HAL Vinyl
          </Typography>
          <Button
            fullWidth
            disableElevation
            color="secondary"
            variant="contained"
            sx={{
              lineHeight: '16px',
              letterSpacing: 0.75,
              padding: '12px',
              marginTop: '40px',
            }}
            disabled={loading}
            onClick={() => {
              setLoading(true);
              firebase.auth().signInWithRedirect(provider);
            }}
          >
            {loading ? (
              <CircularProgress color="secondary" size={16} />
            ) : (
              'Sign in with Google'
            )}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SignInOverlay;
