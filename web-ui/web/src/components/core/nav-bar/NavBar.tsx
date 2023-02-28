import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Toolbar from '@mui/material/Toolbar';
import React from 'react';

type Props = {
  children: JSX.Element | JSX.Element[];
  loading?: boolean;
};

const NavBar: React.FC<Props> = ({ children, loading }) => {
  return (
    <Box marginBottom={2}>
      <AppBar position="static" elevation={1} color="transparent">
        {loading && (
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 0,
              zIndex: 1,
              width: '100%',
            }}
          />
        )}
        <Toolbar sx={{ justifyContent: 'space-between' }}>{children}</Toolbar>
      </AppBar>
    </Box>
  );
};

export default React.memo(NavBar);
