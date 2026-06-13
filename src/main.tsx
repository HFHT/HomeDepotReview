import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { hfhTheme } from './lib/theme/habitatTheme';
import { MicrosoftAuthProvider, msalInstance } from './lib/auth/components/MicrosoftAuth';
import { BrowserRouter } from 'react-router-dom';

/**
 * Initialize MSAL before rendering. `initialize()` is required for
 * @azure/msal-browser v3+.
 */
async function bootstrap() {
  await msalInstance.initialize();

  // Handle redirect-style logins (no-op for popup flow but safe to call).
  await msalInstance.handleRedirectPromise().catch((err) => {
    console.error('MSAL redirect handling failed', err);
  });

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <MicrosoftAuthProvider>
        <MantineProvider theme={hfhTheme} defaultColorScheme="light">
          <Notifications position="top-right" />
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MantineProvider>
      </MicrosoftAuthProvider>
    </React.StrictMode>
  );
}

bootstrap();