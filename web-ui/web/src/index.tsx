import ReactDOM from 'react-dom';
import {
  createTheme,
  ThemeProvider,
  StyledEngineProvider,
} from '@mui/material';
import { Provider } from 'react-redux';

import { store } from './redux';
import App from './components/core';
import theme from './utils/theme';

const createdTheme = createTheme({
  palette: {
    primary: {
      main: theme.primary,
      light: theme.primaryLight,
    },
    secondary: {
      main: theme.secondary,
    },
    grey: {
      100: theme.grey100,
      300: theme.grey300,
      500: theme.grey500,
    },
  },
  typography: {
    fontFamily: 'Be Vietnam Pro',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          '&:hover': {
            borderColor: theme.secondary,
          },
        },
        outlined: {
          borderColor: theme.secondary,
        },
        outlinedPrimary: {
          color: theme.secondary,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: theme.secondary,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: theme.secondaryLight,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 0,
        },
      },
    },
  },
});

ReactDOM.render(
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={createdTheme}>
      <Provider store={store}>
        <App />
      </Provider>
    </ThemeProvider>
  </StyledEngineProvider>,
  document.getElementById('root'),
);
