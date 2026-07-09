// import { useEffect, useRef } from 'react';
// import {
//   AuthenticatedTemplate,
//   UnauthenticatedTemplate,
//   useMsal,
// } from '@azure/msal-react';
// import { EventType, type EventMessage } from '@azure/msal-browser';
// import { Navigate, Route, Routes } from 'react-router-dom';
// import '@mantine/core/styles.css';
// import '@mantine/dates/styles.css';
// import '@mantine/notifications/styles.css';

// import { Center, Loader } from '@mantine/core';
// import { loginRequest } from './lib/auth/config/msalConfig';
// import { useAuthStore } from './lib/auth/stores/authStore';
// import { fetchMembers, fetchUserPhoto } from './lib/auth/services/graph';
// import {
//   getAvatarRecord,
//   saveAvatarRecord,
//   clearAllAvatarRecords,
// } from './lib/auth/services/avatarStorage';
// import { Login } from './lib/auth/components/Login';
// import { AppLayout } from './lib/layout/AppLayout';
// import { NotFound } from './routes';
// import { appRoutes } from './routes/registry';
// import { useSelectsStore } from './lib/stores/selectsStore';
// import { getProjects } from './services/receiptService';

// /**
//  * Top-level application component.
//  *
//  * @remarks
//  * Routing is provided by {@link https://reactrouter.com | React Router}. The
//  * surrounding {@link BrowserRouter} lives in `main.tsx`. Here we declare the
//  * route table from {@link appRoutes}, redirect the index path to the first
//  * destination, and fall back to {@link NotFound} for unmatched paths.
//  */
// export function App() {
//   const { instance, accounts, inProgress } = useMsal();
//   const {
//     accessToken,
//     setAccount,
//     setAccessToken,
//     setMembers,
//     setAvatarUrl,
//     setAvatarLoading,
//   } = useAuthStore();
//   const setSelects = useSelectsStore((s) => s.setSelects);

//   // Tracks the most recently created object URL so it can be revoked when a
//   // new avatar is resolved or the component unmounts, preventing leaks.
//   const avatarObjectUrlRef = useRef<string | null>(null);

//   // 1. Acquire token after MSAL has an account
//   useEffect(() => {
//     if (!accounts[0]) return;
//     setAccount(accounts[0]);

//     instance
//       .acquireTokenSilent({ ...loginRequest, account: accounts[0] })
//       .then((res) => setAccessToken(res.accessToken))
//       .catch(() => instance.acquireTokenRedirect(loginRequest));
//   }, [accounts, instance, setAccount, setAccessToken]);

//   // 2. Once token is in the store, load members
//   useEffect(() => {
//     if (!accessToken) return;

//     let cancelled = false;
//     fetchMembers(accessToken)
//       .then((members) => {
//         if (!cancelled) setMembers(members);
//       })
//       .catch((err) => console.error('Failed to load members:', err));

//     return () => {
//       cancelled = true;
//     };
//   }, [accessToken, setMembers]);

//   // 3. Once token is in the store, load the projects/phases select-list data
//   //    used by the New Receipt "Details" step (selectsStore).
//   useEffect(() => {
//     if (!accessToken) return;

//     let cancelled = false;
//     getProjects(accessToken).then(({ data, error }) => {
//       if (cancelled) return;
//       if (error || !data) {
//         console.error('Failed to load project selects:', error?.message);
//         return;
//       }
//       setSelects(data);
//     });

//     return () => {
//       cancelled = true;
//     };
//   }, [accessToken, setSelects]);

//   // 4. Resolve the signed-in user's avatar photo, preferring the IndexedDB
//   //    cache over a fresh Graph fetch. The Header renders an initials
//   //    placeholder while `avatarLoading` is true.
//   useEffect(() => {
//     const account = accounts[0];
//     if (!accessToken || !account) return;

//     const accountId = account.homeAccountId;
//     let cancelled = false;

//     async function resolveAvatar() {
//       setAvatarLoading(true);
//       try {
//         const existing = await getAvatarRecord(accountId);

//         let blob: Blob | null = existing?.blob ?? null;

//         if (!blob) {
//           // Not cached yet — fetch from Graph and persist for next time.
//           blob = await fetchUserPhoto(accessToken);
//           if (blob) {
//             await saveAvatarRecord({ id: accountId, blob, mediaType: blob.type });
//           }
//         }

//         if (cancelled) return;

//         if (blob) {
//           // Revoke the previous object URL (if any) before creating a new one.
//           if (avatarObjectUrlRef.current) {
//             URL.revokeObjectURL(avatarObjectUrlRef.current);
//           }
//           const objectUrl = URL.createObjectURL(blob);
//           avatarObjectUrlRef.current = objectUrl;
//           setAvatarUrl(objectUrl);
//         } else {
//           setAvatarUrl(null);
//         }
//       } catch (err) {
//         console.error('Failed to load avatar photo:', err);
//         if (!cancelled) setAvatarUrl(null);
//       } finally {
//         if (!cancelled) setAvatarLoading(false);
//       }
//     }

//     resolveAvatar();

//     return () => {
//       cancelled = true;
//     };
//   }, [accessToken, accounts, setAvatarUrl, setAvatarLoading]);

//   // 5. Clear the persisted avatar (and its object URL) on sign-out so the
//   //    next signed-in user never sees a stale photo.
//   useEffect(() => {
//     const callbackId = instance.addEventCallback((event: EventMessage) => {
//       if (event.eventType === EventType.LOGOUT_SUCCESS) {
//         if (avatarObjectUrlRef.current) {
//           URL.revokeObjectURL(avatarObjectUrlRef.current);
//           avatarObjectUrlRef.current = null;
//         }
//         clearAllAvatarRecords().catch((err) =>
//           console.error('Failed to clear avatar cache:', err)
//         );
//         setAvatarUrl(null);
//       }
//     });

//     return () => {
//       if (callbackId) instance.removeEventCallback(callbackId);
//     };
//   }, [instance, setAvatarUrl]);

//   // Revoke any outstanding object URL when App unmounts entirely.
//   useEffect(() => {
//     return () => {
//       if (avatarObjectUrlRef.current) {
//         URL.revokeObjectURL(avatarObjectUrlRef.current);
//       }
//     };
//   }, []);

//   if (inProgress === 'startup' || inProgress === 'handleRedirect') {
//     return (
//       <Center h="100vh">
//         <Loader color="habitatGreen" />
//       </Center>
//     );
//   }

//   return (
//     <>
//       <UnauthenticatedTemplate>
//         <Login
//           title="Habitat Home Depot Receipt"
//           desc=">> Tracking Today, Building Tomorrow. <<"
//         />
//       </UnauthenticatedTemplate>

//       <AuthenticatedTemplate>
//         <AppLayout>
//             <Routes>
//               {/* Index redirect to the first primary destination. */}
//               {/* <Route
//                 path="/"
//                 element={<Navigate to="/home-depot-receipts" replace />}
//               /> */}

//               {/* Application routes derived from the single source of truth. */}
//               {appRoutes.map(({ path, element }) => (
//                 <Route key={path} path={path} element={element} />
//               ))}

//               {/* Catch-all fallback. */}
//               <Route path="*" element={<NotFound />} />
//             </Routes>
//         </AppLayout>
//       </AuthenticatedTemplate>
//     </>
//   );
// }

import { useEffect, useRef } from 'react';
import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
  useMsal,
} from '@azure/msal-react';
import { EventType, type EventMessage } from '@azure/msal-browser';
import { Navigate, Route, Routes } from 'react-router-dom';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/carousel/styles.css';

import { Center, Loader } from '@mantine/core';
import { loginRequest } from './lib/auth/config/msalConfig';
import { useAuthStore } from './lib/auth/stores/authStore';
import { fetchMembers, fetchUserPhoto } from './lib/auth/services/graph';
import {
  getAvatarRecord,
  saveAvatarRecord,
  clearAllAvatarRecords,
} from './lib/auth/services/avatarStorage';
import { Login } from './lib/auth/components/Login';
import { AppLayout } from './lib/layout/AppLayout';
import { NotFound } from './routes';
import { appRoutes } from './routes/registry';
import { useSelectsStore } from './lib/stores/selectsStore';
import { useReceiptStore } from './lib/stores/receiptStore';
import { getProjects, getReceipts } from './services/receiptService';

/**
 * Top-level application component.
 *
 * @remarks
 * Routing is provided by {@link https://reactrouter.com | React Router}. The
 * surrounding {@link BrowserRouter} lives in `main.tsx`. Here we declare the
 * route table from {@link appRoutes}, redirect the index path to the first
 * destination, and fall back to {@link NotFound} for unmatched paths.
 */
export function App() {
  const { instance, accounts, inProgress } = useMsal();
  const {
    accessToken,
    setAccount,
    setAccessToken,
    setMembers,
    setAvatarUrl,
    setAvatarLoading,
  } = useAuthStore();
  const setSelects = useSelectsStore((s) => s.setSelects);
  const setReceipts = useReceiptStore((s) => s.setReceipts);
  const setReceiptsLoading = useReceiptStore((s) => s.setLoading);

  // Tracks the most recently created object URL so it can be revoked when a
  // new avatar is resolved or the component unmounts, preventing leaks.
  const avatarObjectUrlRef = useRef<string | null>(null);

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

  // 3. Once token is in the store, load the projects/phases select-list data
  //    used by the New Receipt "Details" step (selectsStore).
  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    getProjects(accessToken).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) {
        console.error('Failed to load project selects:', error?.message);
        return;
      }
      setSelects(data);
    });

    return () => {
      cancelled = true;
    };
  }, [accessToken, setSelects]);

  // 4. Once token is in the store, load the finance receipt queue
  //    (receiptStore) consumed by ReceiptListPage / ReceiptReviewPage. The
  //    `loading` flag is used by ReceiptListPage to overlay a spinner on the
  //    table while the initial fetch is in flight.
  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setReceiptsLoading(true);
    getReceipts(accessToken).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) {
        console.error('Failed to load receipts:', error?.message);
      } else {
        setReceipts(data.history);
      }
      setReceiptsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [accessToken, setReceipts, setReceiptsLoading]);

  // 5. Resolve the signed-in user's avatar photo, preferring the IndexedDB
  //    cache over a fresh Graph fetch. The Header renders an initials
  //    placeholder while `avatarLoading` is true.
  useEffect(() => {
    const account = accounts[0];
    if (!accessToken || !account) return;

    const accountId = account.homeAccountId;
    let cancelled = false;

    async function resolveAvatar() {
      setAvatarLoading(true);
      try {
        const existing = await getAvatarRecord(accountId);

        let blob: Blob | null = existing?.blob ?? null;

        if (!blob) {
          // Not cached yet — fetch from Graph and persist for next time.
          blob = await fetchUserPhoto(accessToken);
          if (blob) {
            await saveAvatarRecord({ id: accountId, blob, mediaType: blob.type });
          }
        }

        if (cancelled) return;

        if (blob) {
          // Revoke the previous object URL (if any) before creating a new one.
          if (avatarObjectUrlRef.current) {
            URL.revokeObjectURL(avatarObjectUrlRef.current);
          }
          const objectUrl = URL.createObjectURL(blob);
          avatarObjectUrlRef.current = objectUrl;
          setAvatarUrl(objectUrl);
        } else {
          setAvatarUrl(null);
        }
      } catch (err) {
        console.error('Failed to load avatar photo:', err);
        if (!cancelled) setAvatarUrl(null);
      } finally {
        if (!cancelled) setAvatarLoading(false);
      }
    }

    resolveAvatar();

    return () => {
      cancelled = true;
    };
  }, [accessToken, accounts, setAvatarUrl, setAvatarLoading]);

  // 6. Clear the persisted avatar (and its object URL) on sign-out so the
  //    next signed-in user never sees a stale photo.
  useEffect(() => {
    const callbackId = instance.addEventCallback((event: EventMessage) => {
      if (event.eventType === EventType.LOGOUT_SUCCESS) {
        if (avatarObjectUrlRef.current) {
          URL.revokeObjectURL(avatarObjectUrlRef.current);
          avatarObjectUrlRef.current = null;
        }
        clearAllAvatarRecords().catch((err) =>
          console.error('Failed to clear avatar cache:', err)
        );
        setAvatarUrl(null);
      }
    });

    return () => {
      if (callbackId) instance.removeEventCallback(callbackId);
    };
  }, [instance, setAvatarUrl]);

  // Revoke any outstanding object URL when App unmounts entirely.
  useEffect(() => {
    return () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
      }
    };
  }, []);

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
          title="Habitat Home Depot Receipt"
          desc=">> Tracking Today, Building Tomorrow. <<"
        />
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        <AppLayout>
            <Routes>
              {/* Index redirect to the first primary destination. */}
              {/* <Route
                path="/"
                element={<Navigate to="/home-depot-receipts" replace />}
              /> */}

              {/* Application routes derived from the single source of truth. */}
              {appRoutes.map(({ path, element }) => (
                <Route key={path} path={path} element={element} />
              ))}

              {/* Catch-all fallback. */}
              <Route path="*" element={<NotFound />} />
            </Routes>
        </AppLayout>
      </AuthenticatedTemplate>
    </>
  );
}