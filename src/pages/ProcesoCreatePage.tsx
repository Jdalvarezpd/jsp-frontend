import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

// Catalogo GET /api/v1/estados-procesos.
interface EstadoProceso {
  id: number;
  nombre: string;
}

// Enums exactos del schema de creacion (procesos.controller.ts en jsp-backend).
const TIPOS_ASISTENCIA = ['IN_SITU', 'TELEFONICA'] as const;
const RESPONSABILIDADES = ['TERCERO', 'ASEGURADO', 'COMPARTIDA', 'POR_ESTABLECER'] as const;
const PRECONCEPTOS = ['ACUERDO_EN_SITIO', 'AUDIENCIA', 'DESISTIMIENTO', 'LIBERACION'] as const;

const hoy = new Date().toISOString().slice(0, 10);

// Creacion contra POST /api/v1/procesos. El schema de creacion (verificado en
// jsp-backend) solo acepta: placa, fechaAccidente, estado (obligatorios) mas
// la ficha del informe de asistencia in situ (todos opcionales). NO acepta
// tipoCaso, aseguradora, lugarAccidente, descripcion ni abogadoAsignadoId --
// el backend asigna tipo de caso/aseguradora por defecto, y el abogado solo
// se puede asignar despues, editando el proceso ya creado.
export function ProcesoCreatePage() {
  const navigate = useNavigate();

  const [estados, setEstados] = useState<EstadoProceso[]>([]);
  const [placa, setPlaca] = useState('');
  const [fechaAccidente, setFechaAccidente] = useState('');
  const [estado, setEstado] = useState('');

  // Ficha de asistencia in situ (opcional).
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

    fetch(`${import.meta.env.VITE_API_URL}/estados-procesos`, {
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
      .then((data: EstadoProceso[] | null) => {
        if (data) setEstados(data);
      });
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setEnviando(true);

    // Solo se incluyen los campos opcionales de la ficha que el usuario
    // realmente lleno -- mandar un string vacio falla la validacion `.min(1)`
    // del backend en varios de estos campos.
    const body: Record<string, unknown> = { placa, fechaAccidente, estado, informeTransito };
    if (numeroAsistencia.trim()) body.numeroAsistencia = numeroAsistencia.trim();
    if (tipoAsistencia) body.tipoAsistencia = tipoAsistencia;
    if (ciudad.trim()) body.ciudad = ciudad.trim();
    if (codificacion.trim()) body.codificacion = codificacion.trim();
    if (responsabilidad) body.responsabilidad = responsabilidad;
    if (preconcepto) body.preconcepto = preconcepto;
    if (hechos.trim()) body.hechos = hechos.trim();
    if (observacionesConcepto.trim()) body.observacionesConcepto = observacionesConcepto.trim();
    if (conductorNombre.trim()) body.conductorNombre = conductorNombre.trim();
    if (conductorCedula.trim()) body.conductorCedula = conductorCedula.trim();
    if (conductorTelefono.trim()) body.conductorTelefono = conductorTelefono.trim();
    if (conductorEmail.trim()) body.conductorEmail = conductorEmail.trim();

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/procesos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!res.ok) {
        setError(data.error ?? 'No se pudo crear el proceso');
        return;
      }

      navigate(`/procesos/${data.id}`);
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-lg font-semibold text-gray-900">Nuevo proceso</h1>

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
                <option value="">-- Seleccionar --</option>
                {estados.map((e) => (
                  <option key={e.id} value={e.nombre}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-1 text-sm font-semibold text-gray-900">
            Ficha de asistencia in situ (opcional)
          </h2>
          <p className="mb-3 text-xs text-gray-500">
            Se puede completar ahora o mas adelante editando el proceso.
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
          {enviando ? 'Creando...' : 'Crear proceso'}
        </button>
      </form>
    </div>
  );
}
