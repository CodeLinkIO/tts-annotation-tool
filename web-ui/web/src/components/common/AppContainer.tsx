import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import AudioNavBar from '../core/nav-bar/AudioNavBar';
import HomeNavBar from '../core/nav-bar/HomeNavBar';

const NAV_BARS = {
  home: HomeNavBar,
  audio: AudioNavBar,
};

type Props = {
  navBarType?: 'home' | 'audio';
};

const AppContainer: React.FC<Props> = ({ children, navBarType = 'home' }) => {
  const NavBar = useMemo(() => NAV_BARS[navBarType], [navBarType]);
  return (
    <>
      <NavBar />
      <Container maxWidth={false}>
        <Box paddingBottom={2}>{children}</Box>
      </Container>
    </>
  );
};

export default AppContainer;
