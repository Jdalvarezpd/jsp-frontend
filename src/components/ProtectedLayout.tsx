import { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Avatar } from './Avatar';
import { Sidebar } from './Sidebar';

// Forma de GET /api/v1/auth/me.
interface Usuario {
  id: number;
  nombre: string;
  cedula: string;
  email: string | null;
  rol: string;
  activo: boolean;
}

// Layout base de toda ruta protegida: si no hay token en localStorage,
// redirige a /login. Si hay token, pide GET /auth/me para mostrar
// nombre/rol del usuario y da el boton de cerrar sesion; el contenido de
// cada vista se renderiza dentro via <Outlet />.
export function ProtectedLayout() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setUsuario(data);
      })
      .finally(() => setCargando(false));
  }, [token, navigate]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  if (cargando) {
    return <div className="p-6 text-sm text-gray-500">Cargando...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar rol={usuario?.rol ?? ''} />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-end border-b border-gray-200 bg-white px-6 py-3">
          <div className="relative">
            <button
              onClick={() => setMenuAbierto((abierto) => !abierto)}
              className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-50"
            >
              <Avatar nombre={usuario?.nombre ?? ''} />
              <span className="text-left">
                <span className="block text-sm font-medium text-gray-900">{usuario?.nombre}</span>
                <span className="block text-xs capitalize text-gray-500">{usuario?.rol}</span>
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-4 w-4 text-gray-400"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {menuAbierto && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuAbierto(false)} />
                <div className="absolute right-0 z-20 mt-2 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
