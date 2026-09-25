import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

// Forma de GET /api/v1/procesos/:id.
interface ProcesoDetalle {
  id: number;
  placa: string;
  fechaAccidente: string | null;
  estado: string | null;
  creadoEn: string;
  actualizadoEn: string;
  lugarAccidente: string | null;
  descripcion: string | null;
  tipoCaso: string | null;
  aseguradora: string | null;
  abogadoAsignado: { id: number; nombre: string } | null;
  creadoPor: { id: number; nombre: string };

  numeroAsistencia: string | null;
  tipoAsistencia: string | null;
  ciudad: string | null;
  informeTransito: boolean | null;
  codificacion: string | null;
  responsabilidad: string | null;
  preconcepto: string | null;
  hechos: string | null;
  observacionesConcepto: string | null;
  conductorNombre: string | null;
  conductorCedula: string | null;
  conductorTelefono: string | null;
  conductorEmail: string | null;
  conductorDireccion: string | null;
}

// Forma de cada elemento de GET /api/v1/procesos/:id/historial.
interface HistorialItem {
  id: number;
  estadoAnterior: string | null;
  estadoNuevo: string;
  cambiadoPor: { id: number; nombre: string } | null;
  cambiadoEn: string;
}

// Forma de cada elemento de GET /api/v1/procesos/:id/terceros.
interface Tercero {
  id: number;
  nombre: string | null;
  cedula: string | null;
  telefono: string | null;
  email: string | null;
  placa: string | null;
  aseguradora: string | null;
  conceptoResponsabilidad: string | null;
}

// Forma de cada elemento de GET /api/v1/procesos/:id/lesionados.
interface Lesionado {
  id: number;
  nombre: string | null;
  cedula: string | null;
  telefono: string | null;
}

// Forma de GET /api/v1/auth/me (solo se usa aqui para saber si mostrar "Editar").
interface Usuario {
  rol: string;
}

// Detalle completo de un proceso: datos generales, ficha de asistencia in
// situ (si tiene datos), historial de estados, terceros y lesionados
// (listas de solo lectura por ahora).
export function ProcesoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [proceso, setProceso] = useState<ProcesoDetalle | null>(null);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [lesionados, setLesionados] = useState<Lesionado[]>([]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${import.meta.env.VITE_API_URL}/procesos/${id}`, { headers })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return null;
        }
        if (!res.ok) {
          throw new Error('No existe este proceso o no tienes acceso a el');
        }
        return res.json();
      })
      .then((data) => {
        if (data) setProceso(data);
      })
      .catch(() => setError('No existe este proceso o no tienes acceso a el'));

    fetch(`${import.meta.env.VITE_API_URL}/procesos/${id}/historial`, { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: HistorialItem[]) => setHistorial(data));

    fetch(`${import.meta.env.VITE_API_URL}/procesos/${id}/terceros`, { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Tercero[]) => setTerceros(data));

    fetch(`${import.meta.env.VITE_API_URL}/procesos/${id}/lesionados`, { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Lesionado[]) => setLesionados(data));

    fetch(`${import.meta.env.VITE_API_URL}/auth/me`, { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Usuario | null) => {
        if (data) setUsuario(data);
      });
  }, [id, navigate]);

  if (error) {
    return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  }

  if (!proceso) {
    return <p className="text-sm text-gray-500">Cargando...</p>;
  }

  const tieneFichaAsistencia =
    proceso.numeroAsistencia ||
    proceso.tipoAsistencia ||
    proceso.ciudad ||
    proceso.informeTransito !== null ||
    proceso.codificacion ||
    proceso.responsabilidad ||
    proceso.preconcepto ||
    proceso.hechos ||
    proceso.observacionesConcepto ||
    proceso.conductorNombre ||
    proceso.conductorCedula ||
    proceso.conductorTelefono ||
    proceso.conductorEmail ||
    proceso.conductorDireccion;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Proceso: {proceso.placa}</h1>
        {usuario?.rol === 'admin' && (
          <Link
            to={`/procesos/${proceso.id}/editar`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            Editar
          </Link>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Datos generales</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Campo etiqueta="Placa" valor={proceso.placa} />
          <Campo etiqueta="Estado" valor={proceso.estado} />
          <Campo etiqueta="Fecha del accidente" valor={proceso.fechaAccidente} />
          <Campo etiqueta="Tipo de caso" valor={proceso.tipoCaso} />
          <Campo etiqueta="Aseguradora" valor={proceso.aseguradora} />
          <Campo etiqueta="Abogado asignado" valor={proceso.abogadoAsignado?.nombre ?? null} />
          <Campo etiqueta="Lugar del accidente" valor={proceso.lugarAccidente} />
          <Campo etiqueta="Descripcion" valor={proceso.descripcion} />
          <Campo etiqueta="Creado por" valor={proceso.creadoPor.nombre} />
          <Campo etiqueta="Creado en" valor={new Date(proceso.creadoEn).toLocaleString()} />
        </dl>
      </div>

      {tieneFichaAsistencia && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Ficha de asistencia in situ</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Campo etiqueta="Numero de asistencia" valor={proceso.numeroAsistencia} />
            <Campo etiqueta="Tipo de asistencia" valor={proceso.tipoAsistencia} />
            <Campo etiqueta="Ciudad" valor={proceso.ciudad} />
            <Campo
              etiqueta="Informe de transito"
              valor={proceso.informeTransito === null ? null : proceso.informeTransito ? 'Si' : 'No'}
            />
            <Campo etiqueta="Codificacion" valor={proceso.codificacion} />
            <Campo etiqueta="Responsabilidad" valor={proceso.responsabilidad} />
            <Campo etiqueta="Preconcepto" valor={proceso.preconcepto} />
            <Campo etiqueta="Hechos" valor={proceso.hechos} />
            <Campo etiqueta="Observaciones del concepto" valor={proceso.observacionesConcepto} />
            <Campo etiqueta="Conductor" valor={proceso.conductorNombre} />
            <Campo etiqueta="Cedula del conductor" valor={proceso.conductorCedula} />
            <Campo etiqueta="Telefono del conductor" valor={proceso.conductorTelefono} />
            <Campo etiqueta="Email del conductor" valor={proceso.conductorEmail} />
            <Campo etiqueta="Direccion del conductor" valor={proceso.conductorDireccion} />
          </dl>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Historial de estados</h2>
        {historial.length === 0 ? (
          <p className="text-sm text-gray-500">Sin cambios de estado todavia.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {historial.map((item) => (
              <li key={item.id} className="border-b border-gray-100 pb-2 last:border-0">
                <span className="text-gray-900">
                  {item.estadoAnterior ?? 'Sin estado previo'} &rarr; {item.estadoNuevo}
                </span>
                <span className="block text-xs text-gray-500">
                  {item.cambiadoPor?.nombre ?? 'Sistema'} &middot;{' '}
                  {new Date(item.cambiadoEn).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Terceros</h2>
        {terceros.length === 0 ? (
          <p className="text-sm text-gray-500">Sin terceros registrados.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {terceros.map((tercero) => (
              <li key={tercero.id} className="border-b border-gray-100 pb-2 last:border-0">
                <span className="text-gray-900">{tercero.nombre ?? '—'}</span>
                <span className="block text-xs text-gray-500">
                  Cedula: {tercero.cedula ?? '—'} &middot; Telefono: {tercero.telefono ?? '—'}{' '}
                  &middot; Email: {tercero.email ?? '—'} &middot; Placa: {tercero.placa ?? '—'}{' '}
                  &middot; Aseguradora: {tercero.aseguradora ?? '—'}
                </span>
                {tercero.conceptoResponsabilidad && (
                  <span className="mt-1 block text-xs text-gray-500">
                    Concepto de responsabilidad: {tercero.conceptoResponsabilidad}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Lesionados</h2>
        {lesionados.length === 0 ? (
          <p className="text-sm text-gray-500">Sin lesionados registrados.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {lesionados.map((lesionado) => (
              <li key={lesionado.id} className="border-b border-gray-100 pb-2 last:border-0">
                <span className="text-gray-900">{lesionado.nombre ?? '—'}</span>
                <span className="block text-xs text-gray-500">
                  Cedula: {lesionado.cedula ?? '—'} &middot; Telefono: {lesionado.telefono ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{etiqueta}</dt>
      <dd className="text-gray-900">{valor ?? '—'}</dd>
    </div>
  );
}
