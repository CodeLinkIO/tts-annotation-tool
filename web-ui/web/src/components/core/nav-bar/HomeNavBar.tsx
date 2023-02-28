import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { APP_NAME, APP_VERSION } from '../../../constants';
import UserNode from './UserNode';
import NavBar from './NavBar';

const HomeNavBar: React.FC = () => {
  return (
    <NavBar>
      <Box display="flex" alignItems="center">
        <Typography
          variant="h6"
          fontWeight="bold"
          title={APP_VERSION}
          sx={{ flexGrow: 1 }}
        >
          {APP_NAME}
        </Typography>
      </Box>
      <UserNode />
    </NavBar>
  );
};

export default React.memo(HomeNavBar);
