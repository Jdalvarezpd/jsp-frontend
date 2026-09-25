import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { ProtectedLayout } from './components/ProtectedLayout';
import { AbogadosListPage } from './pages/AbogadosListPage';
import { EscritorioPage } from './pages/EscritorioPage';
import { LoginPage } from './pages/LoginPage';
import { ProcesoCreatePage } from './pages/ProcesoCreatePage';
import { ProcesoDetailPage } from './pages/ProcesoDetailPage';
import { ProcesoEditPage } from './pages/ProcesoEditPage';
import { ProcesosListPage } from './pages/ProcesosListPage';
import { VehiculosPage } from './pages/VehiculosPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/escritorio" element={<EscritorioPage />} />
          <Route path="/procesos" element={<ProcesosListPage />} />
          <Route path="/procesos/nuevo" element={<ProcesoCreatePage />} />
          <Route path="/procesos/:id" element={<ProcesoDetailPage />} />
          <Route path="/procesos/:id/editar" element={<ProcesoEditPage />} />
          <Route path="/abogados" element={<AbogadosListPage />} />
          <Route path="/vehiculos" element={<VehiculosPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/escritorio" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
