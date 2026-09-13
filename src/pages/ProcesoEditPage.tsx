import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface ProcesoDetalle {
  id: number;
  placa: string;
  fechaAccidente: string;
  estado: string;
  abogadoAsignado: { id: number; nombre: string } | null;

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
}

interface EstadoProceso {
  id: number;
  nombre: string;
}

// Forma de GET /api/v1/auth/me (rol viene como string plano).
interface UsuarioActual {
  rol: string;
}

// Forma de cada elemento de GET /api/v1/usuarios (rol viene anidado).
interface Abogado {
  id: number;
  nombre: string;
  rol: { nombre: string };
}

const TIPOS_ASISTENCIA = ['IN_SITU', 'TELEFONICA'] as const;
const RESPONSABILIDADES = ['TERCERO', 'ASEGURADO', 'COMPARTIDA', 'POR_ESTABLECER'] as const;
const PRECONCEPTOS = ['ACUERDO_EN_SITIO', 'AUDIENCIA', 'DESISTIMIENTO', 'LIBERACION'] as const;

const hoy = new Date().toISOString().slice(0, 10);

// Edicion contra PATCH /api/v1/procesos/:id (solo admin -- el backend rechaza
// esta ruta a rol abogado). El schema de actualizacion (verificado en
// jsp-backend) acepta placa, fechaAccidente, estado, abogadoAsignadoId y toda
// la ficha de asistencia in situ, todos opcionales pero al menos uno; NO
// acepta tipoCaso, aseguradora, lugarAccidente ni descripcion (el backend no
// tiene forma de cambiarlos todavia). Se manda solo lo que realmente cambio.
export function ProcesoEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const [proceso, setProceso] = useState<ProcesoDetalle | null>(null);
  const [estados, setEstados] = useState<EstadoProceso[]>([]);
  const [abogados, setAbogados] = useState<Abogado[]>([]);

  const [placa, setPlaca] = useState('');
  const [fechaAccidente, setFechaAccidente] = useState('');
  const [estado, setEstado] = useState('');
  const [abogadoAsignadoId, setAbogadoAsignadoId] = useState('');
  const [numeroAsistencia, setNumeroAsistencia] = useState('');
  const [tipoAsistencia, setTipoAsistencia] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [informeTransito, setInformeTransito] = useState(false);
  const [codificacion, setCodificacion] = useState('');
  const [responsabilidad, setResponsabilidad] = useState('');
  const [preconcepto, setPreconcepto] = useState('');
  const [hechos, setHechos] = useState('');
  const [observacionesConcepto, setObservacionesConcepto] = useState('');
  const [conductorNombre, setConductorNombre] = useState('');
  const [conductorCedula, setConductorCedula] = useState('');
  const [conductorTelefono, setConductorTelefono] = useState('');
  const [conductorEmail, setConductorEmail] = useState('');

  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${import.meta.env.VITE_API_URL}/auth/me`, { headers })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return null;
        }
        return res.json();
      })
      .then((data: UsuarioActual | null) => {
        if (data) setAutorizado(data.rol === 'admin');
      });

    fetch(`${import.meta.env.VITE_API_URL}/procesos/${id}`, { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ProcesoDetalle | null) => {
        if (!data) return;
        setProceso(data);
        setPlaca(data.placa);
        setFechaAccidente(data.fechaAccidente);
        setEstado(data.estado);
        setAbogadoAsignadoId(data.abogadoAsignado ? String(data.abogadoAsignado.id) : '');
        setNumeroAsistencia(data.numeroAsistencia ?? '');
        setTipoAsistencia(data.tipoAsistencia ?? '');
        setCiudad(data.ciudad ?? '');
        setInformeTransito(data.informeTransito ?? false);
        setCodificacion(data.codificacion ?? '');
        setResponsabilidad(data.responsabilidad ?? '');
        setPreconcepto(data.preconcepto ?? '');
        setHechos(data.hechos ?? '');
        setObservacionesConcepto(data.observacionesConcepto ?? '');
        setConductorNombre(data.conductorNombre ?? '');
        setConductorCedula(data.conductorCedula ?? '');
        setConductorTelefono(data.conductorTelefono ?? '');
        setConductorEmail(data.conductorEmail ?? '');
      });

    fetch(`${import.meta.env.VITE_API_URL}/estados-procesos`, { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: EstadoProceso[]) => setEstados(data));

    fetch(`${import.meta.env.VITE_API_URL}/usuarios`, { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Abogado[]) => setAbogados(data.filter((u) => u.rol.nombre === 'abogado')));
  }, [id, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!proceso) return;
    setError('');
    setEnviando(true);

    // Solo se manda lo que cambio respecto a los valores originales del
    // proceso (PATCH es una actualizacion parcial).
    const cambios: Record<string, unknown> = {};

    if (placa.trim() !== proceso.placa) cambios.placa = placa.trim();
    if (fechaAccidente !== proceso.fechaAccidente) cambios.fechaAccidente = fechaAccidente;
    if (estado !== proceso.estado) cambios.estado = estado;

    const abogadoOriginal = proceso.abogadoAsignado ? String(proceso.abogadoAsignado.id) : '';
    if (abogadoAsignadoId && abogadoAsignadoId !== abogadoOriginal) {
      cambios.abogadoAsignadoId = Number(abogadoAsignadoId);
    }

    if (numeroAsistencia.trim() && numeroAsistencia.trim() !== (proceso.numeroAsistencia ?? '')) {
      cambios.numeroAsistencia = numeroAsistencia.trim();
    }
    if (tipoAsistencia && tipoAsistencia !== (proceso.tipoAsistencia ?? '')) {
      cambios.tipoAsistencia = tipoAsistencia;
    }
    if (ciudad.trim() && ciudad.trim() !== (proceso.ciudad ?? '')) {
      cambios.ciudad = ciudad.trim();
    }
    if (informeTransito !== (proceso.informeTransito ?? false)) {
      cambios.informeTransito = informeTransito;
    }
    if (codificacion.trim() && codificacion.trim() !== (proceso.codificacion ?? '')) {
      cambios.codificacion = codificacion.trim();
    }
    if (responsabilidad && responsabilidad !== (proceso.responsabilidad ?? '')) {
      cambios.responsabilidad = responsabilidad;
    }
    if (preconcepto && preconcepto !== (proceso.preconcepto ?? '')) {
      cambios.preconcepto = preconcepto;
    }
    if (hechos.trim() && hechos.trim() !== (proceso.hechos ?? '')) {
      cambios.hechos = hechos.trim();
    }
    if (
      observacionesConcepto.trim() &&
      observacionesConcepto.trim() !== (proceso.observacionesConcepto ?? '')
    ) {
      cambios.observacionesConcepto = observacionesConcepto.trim();
    }
    if (conductorNombre.trim() && conductorNombre.trim() !== (proceso.conductorNombre ?? '')) {
      cambios.conductorNombre = conductorNombre.trim();
    }
    if (conductorCedula.trim() && conductorCedula.trim() !== (proceso.conductorCedula ?? '')) {
      cambios.conductorCedula = conductorCedula.trim();
    }
    if (conductorTelefono.trim() && conductorTelefono.trim() !== (proceso.conductorTelefono ?? '')) {
      cambios.conductorTelefono = conductorTelefono.trim();
    }
    if (conductorEmail.trim() && conductorEmail.trim() !== (proceso.conductorEmail ?? '')) {
      cambios.conductorEmail = conductorEmail.trim();
    }

    if (Object.keys(cambios).length === 0) {
      navigate(`/procesos/${id}`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/procesos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(cambios),
      });

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!res.ok) {
        setError(data.error ?? 'No se pudo guardar el proceso');
        return;
      }

      navigate(`/procesos/${id}`);
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setEnviando(false);
    }
  }

  if (autorizado === false) {
    return (
      <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        No autorizado: solo un admin puede editar procesos.
      </p>
    );
  }

  if (autorizado === null || !proceso) {
    return <p className="text-sm text-gray-500">Cargando...</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-lg font-semibold text-gray-900">Editar proceso: {proceso.placa}</h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Datos del proceso</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="placa" className="mb-1 block text-sm font-medium text-gray-700">
                Placa
              </label>
              <input
                id="placa"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="fechaAccidente" className="mb-1 block text-sm font-medium text-gray-700">
                Fecha del accidente
              </label>
              <input
                id="fechaAccidente"
                type="date"
                max={hoy}
                value={fechaAccidente}
                onChange={(e) => setFechaAccidente(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="estado" className="mb-1 block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                id="estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              >
                {estados.map((e) => (
                  <option key={e.id} value={e.nombre}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="abogadoAsignadoId"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Abogado asignado
              </label>
              <select
                id="abogadoAsignadoId"
                value={abogadoAsignadoId}
                onChange={(e) => setAbogadoAsignadoId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              >
                <option value="">-- Sin asignar --</option>
                {abogados.map((abogado) => (
                  <option key={abogado.id} value={abogado.id}>
                    {abogado.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-1 text-sm font-semibold text-gray-900">Ficha de asistencia in situ</h2>
          <p className="mb-3 text-xs text-gray-500">
            Un campo que ya tiene valor no se puede vaciar desde aqui todavia; solo se puede
            cambiar por otro valor.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="numeroAsistencia" className="mb-1 block text-sm font-medium text-gray-700">
                Numero de asistencia
              </label>
              <input
                id="numeroAsistencia"
                value={numeroAsistencia}
                onChange={(e) => setNumeroAsistencia(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="tipoAsistencia" className="mb-1 block text-sm font-medium text-gray-700">
                Tipo de asistencia
              </label>
              <select
                id="tipoAsistencia"
                value={tipoAsistencia}
                onChange={(e) => setTipoAsistencia(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              >
                <option value="">-- Seleccionar --</option>
                {TIPOS_ASISTENCIA.map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ciudad" className="mb-1 block text-sm font-medium text-gray-700">
                Ciudad
              </label>
              <input
                id="ciudad"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="codificacion" className="mb-1 block text-sm font-medium text-gray-700">
                Codificacion
              </label>
              <input
                id="codificacion"
                value={codificacion}
                onChange={(e) => setCodificacion(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="responsabilidad" className="mb-1 block text-sm font-medium text-gray-700">
                Responsabilidad
              </label>
              <select
                id="responsabilidad"
                value={responsabilidad}
                onChange={(e) => setResponsabilidad(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              >
                <option value="">-- Seleccionar --</option>
                {RESPONSABILIDADES.map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="preconcepto" className="mb-1 block text-sm font-medium text-gray-700">
                Preconcepto
              </label>
              <select
                id="preconcepto"
                value={preconcepto}
                onChange={(e) => setPreconcepto(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              >
                <option value="">-- Seleccionar --</option>
                {PRECONCEPTOS.map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>
            </div>

            <label className="col-span-2 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={informeTransito}
                onChange={(e) => setInformeTransito(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Hay informe de transito
            </label>

            <div className="col-span-2">
              <label htmlFor="hechos" className="mb-1 block text-sm font-medium text-gray-700">
                Hechos
              </label>
              <textarea
                id="hechos"
                value={hechos}
                onChange={(e) => setHechos(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div className="col-span-2">
              <label
                htmlFor="observacionesConcepto"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Observaciones del concepto
              </label>
              <textarea
                id="observacionesConcepto"
                value={observacionesConcepto}
                onChange={(e) => setObservacionesConcepto(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Datos del conductor</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="conductorNombre" className="mb-1 block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                id="conductorNombre"
                value={conductorNombre}
                onChange={(e) => setConductorNombre(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="conductorCedula" className="mb-1 block text-sm font-medium text-gray-700">
                Cedula
              </label>
              <input
                id="conductorCedula"
                value={conductorCedula}
                onChange={(e) => setConductorCedula(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="conductorTelefono" className="mb-1 block text-sm font-medium text-gray-700">
                Telefono
              </label>
              <input
                id="conductorTelefono"
                value={conductorTelefono}
                onChange={(e) => setConductorTelefono(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="conductorEmail" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="conductorEmail"
                type="email"
                value={conductorEmail}
                onChange={(e) => setConductorEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {enviando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
