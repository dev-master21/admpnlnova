// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n';
import 'dayjs/locale/ru';
import 'dayjs/locale/en';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Импортируем стили Mantine
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/carousel/styles.css';

dayjs.extend(relativeTime);

const language = localStorage.getItem('language') || 'ru';
dayjs.locale(language);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);