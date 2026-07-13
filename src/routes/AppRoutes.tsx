import { Navigate, Route, Routes } from 'react-router-dom';
import { NotFound } from './NotFound';
import { FinanceApp } from './finance';
import { FieldApp } from './field';

/**
 * The application's authenticated route table.
 *
 * @remarks
 * Rendered inside `<AuthenticatedTemplate>` in {@link App} — only reachable
 * once MSAL confirms a signed-in account. The index path (`/`) redirects to
 * `/finance`; any unmatched path falls back to {@link NotFound}.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/finance" replace />} />
      <Route path="/finance/*" element={<FinanceApp />} />
      <Route path="/field/*" element={<FieldApp />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}