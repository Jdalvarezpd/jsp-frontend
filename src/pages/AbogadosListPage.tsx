import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';

// Forma de cada elemento que devuelve GET /api/v1/usuarios (solo admin).
interface Usuario {
  id: number;
  nombre: string;
  email: string | null;
  tarjetaProfesional: string | null;
  rol: { nombre: string };
}

// Listado de solo lectura de los abogados del CRM. GET /api/v1/usuarios trae
// todas las cuentas (admin, abogado, cliente); aqui se filtra en el frontend
// las que tengan rol "abogado". Sin crear/editar/eliminar todavia.
export function AbogadosListPage() {
  const navigate = useNavigate();
  const [abogados, setAbogados] = useState<Usuario[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch(`${import.meta.env.VITE_API_URL}/usuarios`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return null;
        }
        if (!res.ok) {
          throw new Error('No se pudo cargar el listado de abogados');
        }
        return res.json();
      })
      .then((data: Usuario[] | null) => {
        if (data) setAbogados(data.filter((usuario) => usuario.rol.nombre === 'abogado'));
      })
      .catch(() => setError('No se pudo cargar el listado de abogados'));
  }, [navigate]);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-gray-900">Abogados</h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {abogados === null && !error && <p className="text-sm text-gray-500">Cargando...</p>}

      {abogados !== null && (
        <Card titulo="Todos los abogados">
          {abogados.length === 0 ? (
            <p className="px-6 py-4 text-sm text-gray-500">No hay abogados registrados.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Nombre</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Tarjeta profesional</th>
                </tr>
              </thead>
              <tbody>
                {abogados.map((abogado) => (
                  <tr key={abogado.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-3 font-medium text-gray-900">{abogado.nombre}</td>
                    <td className="px-6 py-3 text-gray-700">{abogado.email}</td>
                    <td className="px-6 py-3 text-gray-700">
                      {abogado.tarjetaProfesional ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
