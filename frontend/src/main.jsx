import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import store from './store';
import theme from './theme';

// Development ortamında @hello-pangea/dnd uyarılarını sustur
if (process.env.NODE_ENV === 'development') {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args) => {
    const message = args.join(' ');
    if (message.includes('Droppable') && message.includes('unsupported nested scroll container')) {
      return;
    }
    originalLog.apply(console, args);
  };

  console.error = (...args) => {
    const message = args.join(' ');
    if (message.includes('Droppable') && message.includes('unsupported nested scroll container')) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('Droppable') && message.includes('unsupported nested scroll container')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);