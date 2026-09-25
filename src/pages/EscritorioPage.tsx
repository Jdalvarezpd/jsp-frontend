import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// El Card propio (con titulo/accion) se usa para "Actividad reciente"; el Card
// de shadcn (ui/card) para las tarjetas de numeros.
import { Card as CardConTitulo } from '../components/Card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Forma de GET /api/v1/dashboard/metricas (solo se usan procesosHoy y procesosMes).
// Un abogado recibe los numeros de sus propios procesos.
interface Metricas {
  procesosHoy: { total: number; deltaVsAyer: number };
  procesosMes: { total: number; deltaVsMesAnterior: number };
}

// Forma de GET /api/v1/auth/me.
interface Usuario {
  id: number;
  nombre: string;
  cedula: string;
  email: string | null;
  rol: string;
  activo: boolean;
}

// Forma de cada elemento de GET /api/v1/auditoria/reciente (solo admin).
interface AccionReciente {
  id: number;
  usuario: string | null; // null si la accion la hizo el sistema
  accion: string; // ver | crear | editar | eliminar | exportar
  entidad: string; // nombre de la tabla afectada, ej. "procesos"
  entidadId: number;
  creadoEn: string; // fecha-hora ISO
}

// Accion registrada -> verbo en lenguaje natural.
const VERBOS: Record<string, string> = {
  crear: 'creó',
  editar: 'editó',
  eliminar: 'eliminó',
  exportar: 'exportó',
  ver: 'consultó',
};

// Nombre de tabla -> como se nombra en una frase ("el proceso #482").
const ENTIDADES: Record<string, string> = {
  procesos: 'el proceso',
  vehiculos: 'el vehículo',
  usuarios: 'el usuario',
  aseguradoras: 'la aseguradora',
  archivos: 'el archivo',
  terceros_proceso: 'el tercero',
  lesionados_proceso: 'el lesionado',
  notificaciones: 'la notificación',
  tipos_casos: 'el tipo de caso',
  estados_procesos: 'el estado',
  tipos_archivos: 'el tipo de archivo',
};

const formatoRelativo = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

// "hace 5 minutos", "hace 2 horas", "ayer", "hace 3 días"; pasado el mes,
// la fecha normal.
function tiempoRelativo(iso: string): string {
  const fecha = new Date(iso);
  const minutos = Math.round((Date.now() - fecha.getTime()) / 60000);

  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return formatoRelativo.format(-minutos, 'minute');

  const horas = Math.round(minutos / 60);
  if (horas < 24) return formatoRelativo.format(-horas, 'hour');

  // Los dias se cuentan por dia de calendario, para que "ayer" sea ayer de verdad.
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const inicioFecha = new Date(fecha);
  inicioFecha.setHours(0, 0, 0, 0);
  const dias = Math.max(1, Math.round((inicioHoy.getTime() - inicioFecha.getTime()) / 86400000));

  if (dias < 30) return formatoRelativo.format(-dias, 'day');
  return fecha.toLocaleDateString('es');
}

// Tarjeta de un numero con su comparacion en texto (sin grafica): el total
// grande y debajo el delta -- verde si subio, rojo si bajo, gris si igual.
function TarjetaMetrica({
  etiqueta,
  total,
  delta,
  sufijo,
  textoIgual,
}: {
  etiqueta: string;
  total: number | null;
  delta: number | null;
  sufijo: string;
  textoIgual: string;
}) {
  let textoDelta = '';
  let colorDelta = 'text-gray-500';

  if (delta !== null && delta > 0) {
    textoDelta = `+${delta} ${sufijo}`;
    colorDelta = 'text-green-600';
  } else if (delta !== null && delta < 0) {
    textoDelta = `${delta} ${sufijo}`;
    colorDelta = 'text-red-600';
  } else if (delta === 0) {
    textoDelta = textoIgual;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{etiqueta}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-gray-900">{total ?? '—'}</p>
        <p className={`mt-1 min-h-5 text-sm ${colorDelta}`}>{textoDelta}</p>
      </CardContent>
    </Card>
  );
}

// Pagina de bienvenida: tarjetas con los procesos de hoy y del mes
// (GET /api/v1/dashboard/metricas, admin y abogado) y, solo para el admin, un
// vistazo de la actividad reciente del sistema (GET /api/v1/auditoria/reciente:
// a un abogado el backend le respondería 403, por eso ni se pide ni se muestra).
export function EscritorioPage() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [errorMetricas, setErrorMetricas] = useState('');
  const [actividad, setActividad] = useState<AccionReciente[] | null>(null);
  const [errorActividad, setErrorActividad] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch(`${import.meta.env.VITE_API_URL}/dashboard/metricas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return null;
        }
        if (!res.ok) {
          throw new Error('No se pudieron cargar las métricas');
        }
        return res.json();
      })
      .then((data: Metricas | null) => {
        if (data) setMetricas(data);
      })
      .catch(() => setErrorMetricas('No se pudieron cargar las métricas.'));
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');

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
      });
  }, [navigate]);

  const esAdmin = usuario?.rol === 'admin';

  useEffect(() => {
    if (!esAdmin) return;

    const token = localStorage.getItem('token');

    fetch(`${import.meta.env.VITE_API_URL}/auditoria/reciente?limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return null;
        }
        if (!res.ok) {
          throw new Error('No se pudo cargar la actividad reciente');
        }
        return res.json();
      })
      .then((data: AccionReciente[] | null) => {
        if (data) setActividad(data);
      })
      .catch(() => setErrorActividad('No se pudo cargar la actividad reciente.'));
  }, [esAdmin, navigate]);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">
        Bienvenido{usuario ? `, ${usuario.nombre}` : ''}
      </h1>

      {errorMetricas ? (
        <p className="text-sm text-red-600">{errorMetricas}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <TarjetaMetrica
            etiqueta="Procesos de hoy"
            total={metricas?.procesosHoy.total ?? null}
            delta={metricas?.procesosHoy.deltaVsAyer ?? null}
            sufijo="vs ayer"
            textoIgual="Igual que ayer"
          />
          <TarjetaMetrica
            etiqueta="Procesos del mes"
            total={metricas?.procesosMes.total ?? null}
            delta={metricas?.procesosMes.deltaVsMesAnterior ?? null}
            sufijo="vs mes anterior"
            textoIgual="Igual que el mes anterior"
          />
        </div>
      )}

      {esAdmin && (
        <CardConTitulo titulo="Actividad reciente">
          {errorActividad ? (
            <p className="px-6 py-4 text-sm text-red-600">{errorActividad}</p>
          ) : actividad === null ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">Cargando...</p>
          ) : actividad.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">Sin actividad reciente.</p>
          ) : (
            <ul className="divide-y divide-border">
              {actividad.map((registro) => (
                <li key={registro.id} className="flex items-baseline justify-between gap-4 px-6 py-3 text-sm">
                  <span className="text-gray-700">
                    <span className="font-medium text-gray-900">{registro.usuario ?? 'El sistema'}</span>{' '}
                    {VERBOS[registro.accion] ?? registro.accion}{' '}
                    {ENTIDADES[registro.entidad] ?? registro.entidad.replace(/_/g, ' ')} #{registro.entidadId}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {tiempoRelativo(registro.creadoEn)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardConTitulo>
      )}
    </div>
  );
}
