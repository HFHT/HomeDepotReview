import { Route, Routes } from "react-router-dom";
import { AppLayout } from "../../lib/layout/AppLayout";
import { NotFound } from "../NotFound";
import { appRoutes, navRoutes } from "./registry";
import { useEffect } from "react";
import { useAuthStore } from "../../lib/auth/stores/authStore";
import { useReceiptStore } from "./stores/receiptStore";
import { getReceipts } from '../../services/receiptService';

export function FinanceApp() {
    const { accessToken } = useAuthStore();
    const setReceipts = useReceiptStore((s) => s.setReceipts);
    const setReceiptsLoading = useReceiptStore((s) => s.setLoading);

    //    Once token is in the store, load the finance receipt queue
    //    (receiptStore) consumed by ReceiptListPage / ReceiptReviewPage. The
    //    `loading` flag is used by ReceiptListPage to overlay a spinner on the
    //    table while the initial fetch is in flight.
    useEffect(() => {
        if (!accessToken) return;

        let cancelled = false;
        setReceiptsLoading(true);
        getReceipts(null, accessToken).then(({ data, error }) => {
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

    return (
        <AppLayout routes={navRoutes}>
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
    )
}