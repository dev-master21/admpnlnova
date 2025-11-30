// frontend/src/App.tsx
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import ruRU from 'antd/locale/ru_RU';
import AppRoutes from './routes';
import './styles/index.css';

// Создаём тёмную тему для Mantine
const mantineTheme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  fontFamilyMonospace: 'Monaco, Courier, monospace',
  headings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    fontWeight: '700',
  },
  colors: {
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5c5f66',
      '#373A40',
      '#2C2E33',
      '#25262b',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, .12), 0 1px 2px rgba(0, 0, 0, .24)',
    md: '0 3px 6px rgba(0, 0, 0, .15), 0 2px 4px rgba(0, 0, 0, .12)',
    lg: '0 10px 20px rgba(0, 0, 0, .15), 0 3px 6px rgba(0, 0, 0, .10)',
    xl: '0 15px 25px rgba(0, 0, 0, .15), 0 5px 10px rgba(0, 0, 0, .05)',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
      },
    },
    Paper: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'md',
        centered: true,
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});

function App() {
  return (
    <MantineProvider theme={mantineTheme} defaultColorScheme="dark">
      <Notifications 
        position="top-right" 
        zIndex={10000}
        autoClose={4000}
      />
      <ConfigProvider
        locale={ruRU}
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
          },
        }}
      >
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ConfigProvider>
    </MantineProvider>
  );
}

export default App;