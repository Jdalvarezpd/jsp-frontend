import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '../components/Badge';
import { BOTON_PRIMARIO } from '../components/Button';
import { Card } from '../components/Card';

// Forma resumida de un proceso que devuelve GET /api/v1/procesos (dentro de
// `datos`). El backend no incluye tipo de caso ni abogado asignado en el
// listado -- eso solo esta en el detalle (GET /procesos/:id).
interface ProcesoResumen {
  id: number;
  placa: string;
  fechaAccidente: string;
  estado: string;
  creadoEn: string;
}

interface RespuestaListado {
  datos: ProcesoResumen[];
  total: number;
  limit: number;
  offset: number;
}

// Mapeo de nombre de estado a color del Badge. Es logica propia de esta
// vista (Badge.tsx no sabe nada de "estados de proceso"); cualquier estado
// que no este aqui cae en gris, el color por defecto de Badge.
function varianteEstado(estado: string): 'green' | 'amber' | 'gray' {
  if (estado === 'Abierto') return 'green';
  if (estado === 'En curso') return 'amber';
  return 'gray';
}

// Listado contra GET /api/v1/procesos. El backend ya filtra por rol: un
// admin ve todos los procesos, un abogado solo los que tiene asignados.
export function ProcesosListPage() {
  const navigate = useNavigate();
  const [procesos, setProcesos] = useState<ProcesoResumen[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch(`${import.meta.env.VITE_API_URL}/procesos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return null;
        }
        if (!res.ok) {
          throw new Error('No se pudo cargar el listado de procesos');
        }
        return res.json();
      })
      .then((data: RespuestaListado | null) => {
        if (data) setProcesos(data.datos);
      })
      .catch(() => setError('No se pudo cargar el listado de procesos'));
  }, [navigate]);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-gray-900">Procesos</h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {procesos === null && !error && <p className="text-sm text-gray-500">Cargando...</p>}

      {procesos !== null && (
        <Card
          titulo="Todos los procesos"
          accion={
            <Link to="/procesos/nuevo" className={BOTON_PRIMARIO}>
              + Nuevo proceso
            </Link>
          }
        >
          {procesos.length === 0 ? (
            <p className="px-6 py-4 text-sm text-gray-500">No hay procesos.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium">Placa</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Fecha del accidente</th>
                </tr>
              </thead>
              <tbody>
                {procesos.map((proceso) => (
                  <tr
                    key={proceso.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="p-0">
                      <Link
                        to={`/procesos/${proceso.id}`}
                        className="block px-6 py-3 font-medium text-blue-600 hover:underline"
                      >
                        {proceso.placa}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link to={`/procesos/${proceso.id}`} className="block px-6 py-3">
                        <Badge variant={varianteEstado(proceso.estado)}>{proceso.estado}</Badge>
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link to={`/procesos/${proceso.id}`} className="block px-6 py-3 text-gray-700">
                        {proceso.fechaAccidente}
                      </Link>
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
