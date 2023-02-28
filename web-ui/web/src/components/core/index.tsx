import { LinearProgress, Box } from '@mui/material';
import { Alert } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignInOverlay from './sign-in-overlay';
import AnnotationSheet from './annotation-sheet';
import SourceAudioTable from './source-audio-table';
import firebase from '../../firebase/client';
import { AppContainer } from '../common';

const App = () => {
  const [user, loading, error] = useAuthState(firebase.auth());

  return (
    <div>
      {loading && <LinearProgress />}
      <SignInOverlay open={!loading && !user && !error} />
      {error && (
        <Alert severity="error">{JSON.stringify(error, null, 2)}</Alert>
      )}
      {user && (
        <Box>
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  <AppContainer>
                    <SourceAudioTable />
                  </AppContainer>
                }
              />
              <Route
                path=":audioId"
                element={
                  <AppContainer navBarType="audio">
                    <AnnotationSheet />
                  </AppContainer>
                }
              />
            </Routes>
          </BrowserRouter>
        </Box>
      )}
    </div>
  );
};

export default App;
