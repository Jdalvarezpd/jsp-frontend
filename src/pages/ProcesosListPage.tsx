import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '../components/Badge';
import { BOTON_PRIMARIO } from '../components/Button';
import { Card } from '../components/Card';

// Forma de cada proceso que devuelve GET /api/v1/procesos (dentro de `datos`).
// Solo la placa es obligatoria al crear un proceso, asi que todo lo demas
// puede venir null. `aseguradora` y `abogadoAsignado` son solo el nombre.
interface ProcesoResumen {
  id: number;
  placa: string;
  fechaAccidente: string | null;
  estado: string | null;
  creadoEn: string;
  aseguradora: string | null;
  abogadoAsignado: string | null;
}

interface RespuestaListado {
  datos: ProcesoResumen[];
  total: number;
  limit: number;
  offset: number;
  periodo: string | null;
  desde: string | null;
  hasta: string | null;
}

// '' = sin filtro ("Todos"); los otros valores son los que acepta ?periodo=.
type Periodo = '' | 'dia' | 'semana' | 'mes';

const PESTANAS: { valor: Periodo; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'dia', etiqueta: 'Hoy' },
  { valor: 'semana', etiqueta: 'Semana' },
  { valor: 'mes', etiqueta: 'Mes' },
];

// Mapeo de nombre de estado a color del Badge. Es logica propia de esta
// vista (Badge.tsx no sabe nada de "estados de proceso"); cualquier estado
// que no este aqui cae en gris, el color por defecto de Badge.
function varianteEstado(estado: string | null): 'green' | 'amber' | 'gray' {
  if (estado === 'Abierto') return 'green';
  if (estado === 'En curso') return 'amber';
  return 'gray';
}

// Listado contra GET /api/v1/procesos (con ?periodo= cuando hay una pestana
// Hoy/Semana/Mes activa). El backend ya filtra por rol: un admin ve todos los
// procesos, un abogado solo los que tiene asignados.
export function ProcesosListPage() {
  const navigate = useNavigate();
  const [procesos, setProcesos] = useState<ProcesoResumen[] | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>('');
  const [desde, setDesde] = useState<string | null>(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { rol: string } | null) => {
        if (data) setEsAdmin(data.rol === 'admin');
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    // Si el usuario cambia de pestana antes de que llegue la respuesta, se
    // ignora la respuesta vieja.
    let cancelado = false;

    setProcesos(null);
    setError('');

    const consulta = periodo ? `?periodo=${periodo}` : '';

    fetch(`${import.meta.env.VITE_API_URL}/procesos${consulta}`, {
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
        if (data && !cancelado) {
          setProcesos(data.datos);
          setDesde(data.desde);
        }
      })
      .catch(() => {
        if (!cancelado) setError('No se pudo cargar el listado de procesos');
      });

    return () => {
      cancelado = true;
    };
  }, [periodo, navigate]);

  // Descarga el Excel del periodo activo. El backend devuelve el archivo con
  // Content-Disposition, pero el navegador no puede leer ese header (CORS no
  // lo expone), asi que el nombre se arma aqui igual que lo arma el backend:
  // procesos-<periodo>-<fecha de inicio del rango>.xlsx
  async function handleDescargarExcel() {
    setError('');
    setDescargando(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/reportes/procesos-excel?periodo=${periodo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'No se pudo descargar el Excel');
        return;
      }

      const archivo = await res.blob();
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `procesos-${periodo}-${desde ?? new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo descargar el Excel');
    } finally {
      setDescargando(false);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-gray-900">Procesos</h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <Card
        titulo="Procesos"
        accion={
          esAdmin ? (
            <Link to="/procesos/nuevo" className={BOTON_PRIMARIO}>
              + Nuevo proceso
            </Link>
          ) : undefined
        }
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
          <div className="flex gap-1">
            {PESTANAS.map((pestana) => (
              <button
                key={pestana.valor}
                onClick={() => setPeriodo(pestana.valor)}
                className={
                  periodo === pestana.valor
                    ? 'rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-900'
                    : 'rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }
              >
                {pestana.etiqueta}
              </button>
            ))}
          </div>

          {periodo !== '' && (
            <button
              onClick={handleDescargarExcel}
              disabled={descargando}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {descargando ? 'Descargando...' : 'Descargar Excel'}
            </button>
          )}
        </div>

        {procesos === null && !error && <p className="px-6 py-4 text-sm text-gray-500">Cargando...</p>}

        {procesos !== null && procesos.length === 0 && (
          <p className="px-6 py-4 text-sm text-gray-500">No hay procesos.</p>
        )}

        {procesos !== null && procesos.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Placa</th>
                <th className="px-6 py-3 font-medium">Aseguradora</th>
                <th className="px-6 py-3 font-medium">Abogado asignado</th>
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
                    <Link to={`/procesos/${proceso.id}`} className="block px-6 py-3 text-gray-700">
                      {proceso.aseguradora ?? '—'}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link to={`/procesos/${proceso.id}`} className="block px-6 py-3 text-gray-700">
                      {proceso.abogadoAsignado ?? '—'}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link to={`/procesos/${proceso.id}`} className="block px-6 py-3">
                      <Badge variant={varianteEstado(proceso.estado)}>
                        {proceso.estado ?? 'Sin estado'}
                      </Badge>
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link to={`/procesos/${proceso.id}`} className="block px-6 py-3 text-gray-700">
                      {proceso.fechaAccidente ?? '—'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
