import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ContributionsPage } from "./pages/ContributionsPage";
import { PatrolPage } from "./pages/PatrolPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/contributions" replace />} />
          <Route path="contributions" element={<ContributionsPage />} />
          <Route path="patrol" element={<PatrolPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/contributions" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
