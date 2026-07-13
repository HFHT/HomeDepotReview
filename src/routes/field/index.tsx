import { Route, Routes } from "react-router-dom";
import { AppLayout } from "../../lib/layout/AppLayout";
import { NotFound } from "../NotFound";
import { appRoutes, navRoutes } from "./registry";

export function FieldApp() {
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