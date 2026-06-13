import { useEffect } from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/carousel/styles.css';

import { Navigate, Route, Routes } from 'react-router-dom';

import { Center, Loader } from '@mantine/core';
import { loginRequest } from './lib/auth/config/msalConfig';
import { useAuthStore } from './lib/auth/stores/authStore';
import { fetchMembers } from './lib/auth/services/graph';
import { Login } from './lib/auth/components/Login';
import { AppLayout } from './lib/layout/AppLayout';
import { NotFound } from './pages/NotFound';
import { receiptRoutes } from './routes/receiptRoutes';
import { ReceiptReviewPage } from './pages/ReceiptReviewPage';
import { ReceiptListPage } from './pages/ReceiptListPage';

/**
 * Top-level application component.
 */
export function App() {
  const { instance, accounts, inProgress } = useMsal();
  const { accessToken, setAccount, setAccessToken, setMembers } = useAuthStore();

  // 1. Acquire token after MSAL has an account
  useEffect(() => {
    if (!accounts[0]) return;
    setAccount(accounts[0]);

    instance
      .acquireTokenSilent({ ...loginRequest, account: accounts[0] })
      .then((res) => setAccessToken(res.accessToken))
      .catch(() => instance.acquireTokenRedirect(loginRequest));
  }, [accounts, instance, setAccount, setAccessToken]);

  // 2. Once token is in the store, load members
  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    fetchMembers(accessToken)
      .then((members) => {
        if (!cancelled) setMembers(members);
      })
      .catch((err) => console.error('Failed to load members:', err));

    return () => {
      cancelled = true;
    };
  }, [accessToken, setMembers]);


  if (inProgress === 'startup' || inProgress === 'handleRedirect') {
    return (
      <Center h="100vh">
        <Loader color="habitatGreen" />
      </Center>
    );
  }

  return (
    <>
      <UnauthenticatedTemplate>
        <Login
          title="Habitat Home Depot Review"
          desc=">> Tracking Today, Building Tomorrow. <<"
        />      </UnauthenticatedTemplate>
      <AuthenticatedTemplate>
        <AppLayout position='top'>
          <Routes>
            {/* Index redirect to the first primary destination. */}
            <Route
                path='/'
                element={ <ReceiptListPage group="inProcess" title="In Process" />}
            
            />
            {/* Application routes derived from the single source of truth. */}
            {receiptRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
            <Route path='/receipts/:receiptId' element={<ReceiptReviewPage />} />
            {/* Catch-all fallback. */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </AuthenticatedTemplate>
    </>
  );
}