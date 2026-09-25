import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '@/components/ui/button';

// GET /api/v1/tipos-casos y GET /api/v1/aseguradoras (solo se usan id + nombre).
interface OpcionCatalogo {
  id: number;
  nombre: string;
}

// Forma de cada elemento de GET /api/v1/usuarios (solo admin).
interface Usuario {
  id: number;
  nombre: string;
  cedula: string;
  direccion: string | null;
  rol: { nombre: string };
}

// Forma de GET/POST /api/v1/vehiculos (solo los campos que se usan aqui).
interface Vehiculo {
  id: number;
  placa: string;
  propietarioId: number;
}

// Valores exactos del enum tipoAsistencia del backend.
const TIPOS_ASISTENCIA = [
  { valor: 'TELEFONICA', etiqueta: 'Telefónica' },
  { valor: 'IN_SITU', etiqueta: 'Abogado In Situ' },
  { valor: 'PRELIMINAR', etiqueta: 'Preliminar' },
  { valor: 'AUDIENCIA', etiqueta: 'Audiencia' },
];

interface PersonaForm {
  nombre: string;
  cedula: string;
  telefono: string;
  correo: string;
  direccion: string;
}

interface TerceroForm {
  placa: string;
  conductor: string;
  correo: string;
  telefono: string;
  aseguradora: string;
  conceptoResponsabilidad: string;
}

interface LesionadoForm {
  nombre: string;
  cedula: string;
  telefono: string;
}

// Lo que se muestra al terminar de guardar cuando algo fallo: que si quedo
// guardado y que no. Si `procesoId` viene, el proceso ya existe.
interface ResultadoGuardado {
  procesoId: number | null;
  guardado: string[];
  fallos: string[];
}

const personaVacia: PersonaForm = { nombre: '', cedula: '', telefono: '', correo: '', direccion: '' };
const terceroVacio: TerceroForm = {
  placa: '',
  conductor: '',
  correo: '',
  telefono: '',
  aseguradora: '',
  conceptoResponsabilidad: '',
};
const lesionadoVacio: LesionadoForm = { nombre: '', cedula: '', telefono: '' };

const hoy = new Date().toISOString().slice(0, 10);

const etiquetaClases = 'mb-1 block text-sm font-medium text-gray-700';
const inputClases =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none';

function hayDatos(valores: object): boolean {
  return Object.values(valores).some((valor) => String(valor).trim() !== '');
}

// Convierte la respuesta de error de la API en un texto legible: cuando es un
// error de validacion de Zod trae `detalles` por campo; si no, solo `error`.
function textoDeError(data: { error?: string; detalles?: Record<string, string[]> }): string {
  if (data.detalles) {
    const partes = Object.entries(data.detalles).map(([campo, mensajes]) => `${campo}: ${mensajes.join(', ')}`);
    if (partes.length > 0) return partes.join(' | ');
  }
  return data.error ?? 'Error desconocido';
}

// Creacion de un proceso (solo admin). El admin ve un solo formulario, pero
// al guardar se hacen varias llamadas en orden:
//   1. vehiculo: GET /vehiculos?placa= (si no existe, POST /vehiculos)
//   2. asegurado (si se lleno): GET /usuarios?cedula= (si no existe, POST
//      /usuarios rol cliente; si existe, PATCH direccion si cambio) y se
//      vincula como propietario con PATCH /vehiculos/:id
//   3. POST /procesos
//   4. abogado asignado (POST /procesos no lo acepta): PATCH /procesos/:id
//   5. terceros y lesionados: POST /procesos/:id/terceros y /lesionados
// Nada se deshace si un paso falla: al final se muestra que si se guardo y
// que no.
export function ProcesoCreatePage() {
  const navigate = useNavigate();

  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const [tiposCasos, setTiposCasos] = useState<OpcionCatalogo[]>([]);
  const [aseguradoras, setAseguradoras] = useState<OpcionCatalogo[]>([]);
  const [abogados, setAbogados] = useState<Usuario[]>([]);

  const [tipoAsistencia, setTipoAsistencia] = useState('');

  const [aseguradoraId, setAseguradoraId] = useState('');
  const [numeroAsistencia, setNumeroAsistencia] = useState('');
  const [placa, setPlaca] = useState('');
  const [fechaAccidente, setFechaAccidente] = useState('');
  const [abogadoAsignadoId, setAbogadoAsignadoId] = useState('');

  const [tipoCasoId, setTipoCasoId] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [lugarAccidente, setLugarAccidente] = useState('');
  const [asegurado, setAsegurado] = useState<PersonaForm>(personaVacia);
  const [conductor, setConductor] = useState<PersonaForm>(personaVacia);
  const [hechos, setHechos] = useState('');
  const [observacionesConcepto, setObservacionesConcepto] = useState('');

  const [terceros, setTerceros] = useState<TerceroForm[]>([]);
  const [lesionados, setLesionados] = useState<LesionadoForm[]>([]);

  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<ResultadoGuardado | null>(null);
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
      .then((data: { rol: string } | null) => {
        if (data) setAutorizado(data.rol === 'admin');
      });

    fetch(`${import.meta.env.VITE_API_URL}/tipos-casos`, { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: OpcionCatalogo[]) => setTiposCasos(data));

    fetch(`${import.meta.env.VITE_API_URL}/aseguradoras`, { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: OpcionCatalogo[]) => setAseguradoras(data));

    fetch(`${import.meta.env.VITE_API_URL}/usuarios`, { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Usuario[]) => setAbogados(data.filter((u) => u.rol.nombre === 'abogado')));
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setResultado(null);

    const placaLimpia = placa.trim();
    const hayAsegurado = hayDatos(asegurado);
    const cedulaAsegurado = asegurado.cedula.trim();

    if (hayAsegurado && !cedulaAsegurado) {
      setError('Para guardar los datos del asegurado hace falta al menos su cédula.');
      return;
    }

    setEnviando(true);

    const API = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const headersJson = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const guardado: string[] = [];
    const fallos: string[] = [];

    function sesionExpirada() {
      localStorage.removeItem('token');
      navigate('/login');
    }

    // Se usa cuando falla un paso previo a crear el proceso: se detiene todo
    // y el formulario queda editable para corregir y reintentar (lo que ya
    // se guardo, vehiculo o cliente, se reutiliza al reintentar).
    function detenerConError(mensaje: string) {
      setResultado({ procesoId: null, guardado, fallos: [mensaje] });
    }

    try {
      // --- 1. Vehiculo ---
      let vehiculo: Vehiculo;

      const resBuscaVehiculo = await fetch(`${API}/vehiculos?placa=${encodeURIComponent(placaLimpia)}`, {
        headers,
      });
      if (resBuscaVehiculo.status === 401) return sesionExpirada();

      if (!resBuscaVehiculo.ok) {
        const dataError = await resBuscaVehiculo.json();
        return detenerConError(`No se pudo buscar el vehículo: ${textoDeError(dataError)}`);
      }

      // La busqueda es parcial (contiene) y siempre devuelve un arreglo: buscar
      // "ABC123" tambien trae "ABC1234". Solo sirve el que tenga exactamente
      // esa placa (sin distinguir mayusculas, igual que el backend).
      const coincidencias: Vehiculo[] = await resBuscaVehiculo.json();
      const existente = coincidencias.find((v) => v.placa.toUpperCase() === placaLimpia.toUpperCase());

      if (existente) {
        vehiculo = existente;
        guardado.push(`Vehículo ${vehiculo.placa}: ya existía`);
      } else {
        const resCreaVehiculo = await fetch(`${API}/vehiculos`, {
          method: 'POST',
          headers: headersJson,
          body: JSON.stringify({ placa: placaLimpia }),
        });
        if (resCreaVehiculo.status === 401) return sesionExpirada();
        const dataVehiculo = await resCreaVehiculo.json();
        if (!resCreaVehiculo.ok) {
          return detenerConError(`No se pudo crear el vehículo: ${textoDeError(dataVehiculo)}`);
        }
        vehiculo = dataVehiculo;
        guardado.push(`Vehículo ${vehiculo.placa}: creado`);
      }

      // --- 2. Asegurado (propietario del vehiculo) ---
      if (hayAsegurado) {
        let cliente: Usuario;

        const resBuscaCliente = await fetch(`${API}/usuarios?cedula=${encodeURIComponent(cedulaAsegurado)}`, {
          headers,
        });
        if (resBuscaCliente.status === 401) return sesionExpirada();
        const dataBusqueda = await resBuscaCliente.json();
        if (!resBuscaCliente.ok) {
          return detenerConError(`No se pudo buscar al asegurado: ${textoDeError(dataBusqueda)}`);
        }

        // Este endpoint devuelve un array de 0 o 1 usuarios y no filtra por
        // rol, asi que hay que confirmar que sea un cliente.
        const existente: Usuario | undefined = dataBusqueda[0];

        if (existente) {
          if (existente.rol.nombre !== 'cliente') {
            return detenerConError(
              `La cédula ${cedulaAsegurado} pertenece a un usuario con rol "${existente.rol.nombre}", no a un cliente.`,
            );
          }
          cliente = existente;
          guardado.push(`Asegurado ${cliente.nombre}: ya existía`);

          const direccionNueva = asegurado.direccion.trim();
          if (direccionNueva && direccionNueva !== (cliente.direccion ?? '')) {
            const resDireccion = await fetch(`${API}/usuarios/${cliente.id}`, {
              method: 'PATCH',
              headers: headersJson,
              body: JSON.stringify({ direccion: direccionNueva }),
            });
            if (resDireccion.status === 401) return sesionExpirada();
            if (!resDireccion.ok) {
              const dataDireccion = await resDireccion.json();
              return detenerConError(
                `No se pudo actualizar la dirección del asegurado: ${textoDeError(dataDireccion)}`,
              );
            }
            guardado.push('Dirección del asegurado: actualizada');
          }
        } else {
          if (!asegurado.nombre.trim()) {
            return detenerConError(
              'No existe un cliente con esa cédula y falta el nombre del asegurado para poder crearlo.',
            );
          }

          const cuerpoCliente: Record<string, string> = {
            nombre: asegurado.nombre.trim(),
            cedula: cedulaAsegurado,
            rol: 'cliente',
          };
          if (asegurado.telefono.trim()) cuerpoCliente.telefono = asegurado.telefono.trim();
          if (asegurado.correo.trim()) cuerpoCliente.email = asegurado.correo.trim();
          if (asegurado.direccion.trim()) cuerpoCliente.direccion = asegurado.direccion.trim();

          const resCreaCliente = await fetch(`${API}/usuarios`, {
            method: 'POST',
            headers: headersJson,
            body: JSON.stringify(cuerpoCliente),
          });
          if (resCreaCliente.status === 401) return sesionExpirada();
          const dataCliente = await resCreaCliente.json();
          if (!resCreaCliente.ok) {
            return detenerConError(`No se pudo crear al asegurado: ${textoDeError(dataCliente)}`);
          }
          cliente = dataCliente;
          guardado.push(`Asegurado ${cliente.nombre}: creado`);
        }

        if (vehiculo.propietarioId !== cliente.id) {
          const resPropietario = await fetch(`${API}/vehiculos/${vehiculo.id}`, {
            method: 'PATCH',
            headers: headersJson,
            body: JSON.stringify({ propietarioId: cliente.id }),
          });
          if (resPropietario.status === 401) return sesionExpirada();
          if (!resPropietario.ok) {
            const dataPropietario = await resPropietario.json();
            return detenerConError(
              `No se pudo vincular al asegurado como propietario del vehículo: ${textoDeError(dataPropietario)}`,
            );
          }
          guardado.push('Asegurado vinculado como propietario del vehículo');
        }
      }

      // --- 3. Proceso ---
      // Solo se mandan los campos con valor: varios campos opcionales del
      // backend rechazan un string vacio.
      const cuerpoProceso: Record<string, string | number> = { placa: placaLimpia };
      if (tipoAsistencia) cuerpoProceso.tipoAsistencia = tipoAsistencia;
      if (aseguradoraId) cuerpoProceso.aseguradoraId = Number(aseguradoraId);
      if (numeroAsistencia.trim()) cuerpoProceso.numeroAsistencia = numeroAsistencia.trim();
      if (fechaAccidente) cuerpoProceso.fechaAccidente = fechaAccidente;
      if (tipoCasoId) cuerpoProceso.tipoCasoId = Number(tipoCasoId);
      if (ciudad.trim()) cuerpoProceso.ciudad = ciudad.trim();
      if (lugarAccidente.trim()) cuerpoProceso.lugarAccidente = lugarAccidente.trim();
      if (conductor.nombre.trim()) cuerpoProceso.conductorNombre = conductor.nombre.trim();
      if (conductor.cedula.trim()) cuerpoProceso.conductorCedula = conductor.cedula.trim();
      if (conductor.telefono.trim()) cuerpoProceso.conductorTelefono = conductor.telefono.trim();
      if (conductor.correo.trim()) cuerpoProceso.conductorEmail = conductor.correo.trim();
      if (conductor.direccion.trim()) cuerpoProceso.conductorDireccion = conductor.direccion.trim();
      if (hechos.trim()) cuerpoProceso.hechos = hechos.trim();
      if (observacionesConcepto.trim()) cuerpoProceso.observacionesConcepto = observacionesConcepto.trim();

      const resProceso = await fetch(`${API}/procesos`, {
        method: 'POST',
        headers: headersJson,
        body: JSON.stringify(cuerpoProceso),
      });
      if (resProceso.status === 401) return sesionExpirada();
      const dataProceso = await resProceso.json();
      if (!resProceso.ok) {
        return detenerConError(`No se pudo crear el proceso: ${textoDeError(dataProceso)}`);
      }
      const procesoId: number = dataProceso.id;
      guardado.push(`Proceso #${procesoId}: creado`);

      // --- 4. Abogado asignado ---
      if (abogadoAsignadoId) {
        const resAbogado = await fetch(`${API}/procesos/${procesoId}`, {
          method: 'PATCH',
          headers: headersJson,
          body: JSON.stringify({ abogadoAsignadoId: Number(abogadoAsignadoId) }),
        });
        if (resAbogado.status === 401) return sesionExpirada();
        if (resAbogado.ok) {
          guardado.push('Abogado asignado');
        } else {
          const dataAbogado = await resAbogado.json();
          fallos.push(`No se pudo asignar el abogado: ${textoDeError(dataAbogado)}`);
        }
      }

      // --- 5. Terceros ---
      for (let i = 0; i < terceros.length; i++) {
        const tercero = terceros[i];
        if (!hayDatos(tercero)) continue;

        const cuerpoTercero: Record<string, string> = {};
        if (tercero.placa.trim()) cuerpoTercero.placa = tercero.placa.trim();
        if (tercero.conductor.trim()) cuerpoTercero.nombre = tercero.conductor.trim();
        if (tercero.correo.trim()) cuerpoTercero.email = tercero.correo.trim();
        if (tercero.telefono.trim()) cuerpoTercero.telefono = tercero.telefono.trim();
        if (tercero.aseguradora.trim()) cuerpoTercero.aseguradora = tercero.aseguradora.trim();
        if (tercero.conceptoResponsabilidad.trim()) {
          cuerpoTercero.conceptoResponsabilidad = tercero.conceptoResponsabilidad.trim();
        }

        const resTercero = await fetch(`${API}/procesos/${procesoId}/terceros`, {
          method: 'POST',
          headers: headersJson,
          body: JSON.stringify(cuerpoTercero),
        });
        if (resTercero.status === 401) return sesionExpirada();
        if (resTercero.ok) {
          guardado.push(`Tercero ${i + 1}: guardado`);
        } else {
          const dataTercero = await resTercero.json();
          fallos.push(`Tercero ${i + 1} no se guardó: ${textoDeError(dataTercero)}`);
        }
      }

      // --- 5. Lesionados ---
      for (let i = 0; i < lesionados.length; i++) {
        const lesionado = lesionados[i];
        if (!hayDatos(lesionado)) continue;

        const cuerpoLesionado: Record<string, string> = {};
        if (lesionado.nombre.trim()) cuerpoLesionado.nombre = lesionado.nombre.trim();
        if (lesionado.cedula.trim()) cuerpoLesionado.cedula = lesionado.cedula.trim();
        if (lesionado.telefono.trim()) cuerpoLesionado.telefono = lesionado.telefono.trim();

        const resLesionado = await fetch(`${API}/procesos/${procesoId}/lesionados`, {
          method: 'POST',
          headers: headersJson,
          body: JSON.stringify(cuerpoLesionado),
        });
        if (resLesionado.status === 401) return sesionExpirada();
        if (resLesionado.ok) {
          guardado.push(`Lesionado ${i + 1}: guardado`);
        } else {
          const dataLesionado = await resLesionado.json();
          fallos.push(`Lesionado ${i + 1} no se guardó: ${textoDeError(dataLesionado)}`);
        }
      }

      if (fallos.length === 0) {
        navigate(`/procesos/${procesoId}`);
      } else {
        setResultado({ procesoId, guardado, fallos });
      }
    } catch {
      setResultado({ procesoId: null, guardado, fallos: ['No se pudo conectar con el servidor.'] });
    } finally {
      setEnviando(false);
    }
  }

  function actualizarTercero(indice: number, campo: keyof TerceroForm, valor: string) {
    setTerceros(terceros.map((t, i) => (i === indice ? { ...t, [campo]: valor } : t)));
  }

  function actualizarLesionado(indice: number, campo: keyof LesionadoForm, valor: string) {
    setLesionados(lesionados.map((l, i) => (i === indice ? { ...l, [campo]: valor } : l)));
  }

  if (autorizado === false) {
    return (
      <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        No autorizado: solo un admin puede crear procesos.
      </p>
    );
  }

  if (autorizado === null) {
    return <p className="text-sm text-gray-500">Cargando...</p>;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-4 text-lg font-semibold text-gray-900">Nuevo proceso</h1>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {resultado && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="mb-2 font-semibold text-amber-900">
            {resultado.procesoId
              ? `El proceso #${resultado.procesoId} se creó, pero algunos datos no se guardaron.`
              : 'No se pudo completar el guardado.'}
          </p>

          {resultado.guardado.length > 0 && (
            <>
              <p className="font-medium text-gray-900">Sí se guardó:</p>
              <ul className="mb-2 list-disc pl-5 text-gray-700">
                {resultado.guardado.map((texto) => (
                  <li key={texto}>{texto}</li>
                ))}
              </ul>
            </>
          )}

          <p className="font-medium text-red-800">No se guardó:</p>
          <ul className="mb-3 list-disc pl-5 text-red-700">
            {resultado.fallos.map((texto) => (
              <li key={texto}>{texto}</li>
            ))}
          </ul>

          {resultado.procesoId ? (
            <Button asChild>
              <Link to={`/procesos/${resultado.procesoId}`}>Ver proceso</Link>
            </Button>
          ) : (
            <p className="text-gray-600">
              Corrige el problema y vuelve a guardar: lo que ya existe (vehículo, asegurado) se reutiliza.
            </p>
          )}
        </div>
      )}

      {!resultado?.procesoId && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Tipo de asistencia */}
          <Card titulo="Tipo de asistencia">
            <div className="p-6">
              <select
                aria-label="Tipo de asistencia"
                value={tipoAsistencia}
                onChange={(e) => setTipoAsistencia(e.target.value)}
                className={inputClases}
              >
                <option value="">-- Seleccionar --</option>
                {TIPOS_ASISTENCIA.map((tipo) => (
                  <option key={tipo.valor} value={tipo.valor}>
                    {tipo.etiqueta}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* 2. Informacion general */}
          <Card titulo="Información general">
            <div className="grid grid-cols-2 gap-4 p-6">
              <div>
                <label htmlFor="aseguradoraId" className={etiquetaClases}>
                  Aseguradora
                </label>
                <select
                  id="aseguradoraId"
                  value={aseguradoraId}
                  onChange={(e) => setAseguradoraId(e.target.value)}
                  className={inputClases}
                >
                  <option value="">-- Seleccionar --</option>
                  {aseguradoras.map((aseguradora) => (
                    <option key={aseguradora.id} value={aseguradora.id}>
                      {aseguradora.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="numeroAsistencia" className={etiquetaClases}>
                  Número de asistencia
                </label>
                <input
                  id="numeroAsistencia"
                  value={numeroAsistencia}
                  onChange={(e) => setNumeroAsistencia(e.target.value)}
                  maxLength={50}
                  className={inputClases}
                />
              </div>

              <div>
                <label htmlFor="placa" className={etiquetaClases}>
                  Placa <span className="text-red-600">*</span>
                </label>
                <input
                  id="placa"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                  required
                  minLength={5}
                  maxLength={10}
                  className={inputClases}
                />
              </div>

              <div>
                <label htmlFor="fechaAccidente" className={etiquetaClases}>
                  Fecha del accidente
                </label>
                <input
                  id="fechaAccidente"
                  type="date"
                  max={hoy}
                  value={fechaAccidente}
                  onChange={(e) => setFechaAccidente(e.target.value)}
                  className={inputClases}
                />
              </div>

              <div className="col-span-2">
                <label htmlFor="abogadoAsignadoId" className={etiquetaClases}>
                  Abogado asignado
                </label>
                <select
                  id="abogadoAsignadoId"
                  value={abogadoAsignadoId}
                  onChange={(e) => setAbogadoAsignadoId(e.target.value)}
                  className={inputClases}
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
          </Card>

          {/* 3. Resto de campos, por sub-seccion */}
          <Card titulo="Caso">
            <div className="grid grid-cols-2 gap-4 p-6">
              <div>
                <label htmlFor="tipoCasoId" className={etiquetaClases}>
                  Tipo de caso
                </label>
                <select
                  id="tipoCasoId"
                  value={tipoCasoId}
                  onChange={(e) => setTipoCasoId(e.target.value)}
                  className={inputClases}
                >
                  <option value="">-- Seleccionar --</option>
                  {tiposCasos.map((tipoCaso) => (
                    <option key={tipoCaso.id} value={tipoCaso.id}>
                      {tipoCaso.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ciudad" className={etiquetaClases}>
                  Ciudad
                </label>
                <input
                  id="ciudad"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  maxLength={100}
                  className={inputClases}
                />
              </div>

              <div className="col-span-2">
                <label htmlFor="lugarAccidente" className={etiquetaClases}>
                  Dirección del siniestro
                </label>
                <input
                  id="lugarAccidente"
                  value={lugarAccidente}
                  onChange={(e) => setLugarAccidente(e.target.value)}
                  maxLength={255}
                  className={inputClases}
                />
              </div>
            </div>
          </Card>

          <Card titulo="Datos del asegurado">
            <div className="grid grid-cols-2 gap-4 p-6">
              <div>
                <label htmlFor="aseguradoNombre" className={etiquetaClases}>
                  Nombre
                </label>
                <input
                  id="aseguradoNombre"
                  value={asegurado.nombre}
                  onChange={(e) => setAsegurado({ ...asegurado, nombre: e.target.value })}
                  maxLength={150}
                  className={inputClases}
                />
              </div>
              <div>
                <label htmlFor="aseguradoCedula" className={etiquetaClases}>
                  Cédula
                </label>
                <input
                  id="aseguradoCedula"
                  value={asegurado.cedula}
                  onChange={(e) => setAsegurado({ ...asegurado, cedula: e.target.value })}
                  maxLength={20}
                  className={inputClases}
                />
              </div>
              <div>
                <label htmlFor="aseguradoTelefono" className={etiquetaClases}>
                  Teléfono
                </label>
                <input
                  id="aseguradoTelefono"
                  value={asegurado.telefono}
                  onChange={(e) => setAsegurado({ ...asegurado, telefono: e.target.value })}
                  maxLength={20}
                  className={inputClases}
                />
              </div>
              <div>
                <label htmlFor="aseguradoCorreo" className={etiquetaClases}>
                  Correo
                </label>
                <input
                  id="aseguradoCorreo"
                  type="email"
                  value={asegurado.correo}
                  onChange={(e) => setAsegurado({ ...asegurado, correo: e.target.value })}
                  maxLength={150}
                  className={inputClases}
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="aseguradoDireccion" className={etiquetaClases}>
                  Dirección
                </label>
                <input
                  id="aseguradoDireccion"
                  value={asegurado.direccion}
                  onChange={(e) => setAsegurado({ ...asegurado, direccion: e.target.value })}
                  maxLength={255}
                  className={inputClases}
                />
              </div>
            </div>
          </Card>

          <Card titulo="Datos del conductor">
            <div className="grid grid-cols-2 gap-4 p-6">
              <div>
                <label htmlFor="conductorNombre" className={etiquetaClases}>
                  Nombre
                </label>
                <input
                  id="conductorNombre"
                  value={conductor.nombre}
                  onChange={(e) => setConductor({ ...conductor, nombre: e.target.value })}
                  maxLength={150}
                  className={inputClases}
                />
              </div>
              <div>
                <label htmlFor="conductorCedula" className={etiquetaClases}>
                  Cédula
                </label>
                <input
                  id="conductorCedula"
                  value={conductor.cedula}
                  onChange={(e) => setConductor({ ...conductor, cedula: e.target.value })}
                  maxLength={20}
                  className={inputClases}
                />
              </div>
              <div>
                <label htmlFor="conductorTelefono" className={etiquetaClases}>
                  Teléfono
                </label>
                <input
                  id="conductorTelefono"
                  value={conductor.telefono}
                  onChange={(e) => setConductor({ ...conductor, telefono: e.target.value })}
                  maxLength={20}
                  className={inputClases}
                />
              </div>
              <div>
                <label htmlFor="conductorCorreo" className={etiquetaClases}>
                  Correo
                </label>
                <input
                  id="conductorCorreo"
                  type="email"
                  value={conductor.correo}
                  onChange={(e) => setConductor({ ...conductor, correo: e.target.value })}
                  maxLength={100}
                  className={inputClases}
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="conductorDireccion" className={etiquetaClases}>
                  Dirección
                </label>
                <input
                  id="conductorDireccion"
                  value={conductor.direccion}
                  onChange={(e) => setConductor({ ...conductor, direccion: e.target.value })}
                  maxLength={255}
                  className={inputClases}
                />
              </div>
            </div>
          </Card>

          <Card titulo="Hechos y observaciones">
            <div className="space-y-4 p-6">
              <div>
                <label htmlFor="hechos" className={etiquetaClases}>
                  Descripción de los hechos
                </label>
                <textarea
                  id="hechos"
                  value={hechos}
                  onChange={(e) => setHechos(e.target.value)}
                  rows={4}
                  className={inputClases}
                />
              </div>
              <div>
                <label htmlFor="observacionesConcepto" className={etiquetaClases}>
                  Observaciones adicionales
                </label>
                <textarea
                  id="observacionesConcepto"
                  value={observacionesConcepto}
                  onChange={(e) => setObservacionesConcepto(e.target.value)}
                  rows={4}
                  className={inputClases}
                />
              </div>
            </div>
          </Card>

          {/* 4. Terceros */}
          <Card
            titulo="Terceros"
            accion={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTerceros([...terceros, terceroVacio])}
              >
                + Agregar tercero
              </Button>
            }
          >
            {terceros.length === 0 ? (
              <p className="px-6 py-4 text-sm text-gray-500">Sin terceros.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {terceros.map((tercero, indice) => (
                  <div key={indice} className="p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Tercero {indice + 1}</h3>
                      <button
                        type="button"
                        onClick={() => setTerceros(terceros.filter((_, i) => i !== indice))}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor={`terceroPlaca${indice}`} className={etiquetaClases}>
                          Placa
                        </label>
                        <input
                          id={`terceroPlaca${indice}`}
                          value={tercero.placa}
                          onChange={(e) => actualizarTercero(indice, 'placa', e.target.value)}
                          maxLength={10}
                          className={inputClases}
                        />
                      </div>
                      <div>
                        <label htmlFor={`terceroConductor${indice}`} className={etiquetaClases}>
                          Conductor
                        </label>
                        <input
                          id={`terceroConductor${indice}`}
                          value={tercero.conductor}
                          onChange={(e) => actualizarTercero(indice, 'conductor', e.target.value)}
                          maxLength={150}
                          className={inputClases}
                        />
                      </div>
                      <div>
                        <label htmlFor={`terceroCorreo${indice}`} className={etiquetaClases}>
                          Correo
                        </label>
                        <input
                          id={`terceroCorreo${indice}`}
                          type="email"
                          value={tercero.correo}
                          onChange={(e) => actualizarTercero(indice, 'correo', e.target.value)}
                          maxLength={150}
                          className={inputClases}
                        />
                      </div>
                      <div>
                        <label htmlFor={`terceroTelefono${indice}`} className={etiquetaClases}>
                          Teléfono
                        </label>
                        <input
                          id={`terceroTelefono${indice}`}
                          value={tercero.telefono}
                          onChange={(e) => actualizarTercero(indice, 'telefono', e.target.value)}
                          maxLength={20}
                          className={inputClases}
                        />
                      </div>
                      <div className="col-span-2">
                        <label htmlFor={`terceroAseguradora${indice}`} className={etiquetaClases}>
                          Aseguradora
                        </label>
                        <input
                          id={`terceroAseguradora${indice}`}
                          value={tercero.aseguradora}
                          onChange={(e) => actualizarTercero(indice, 'aseguradora', e.target.value)}
                          maxLength={150}
                          className={inputClases}
                        />
                      </div>
                      <div className="col-span-2">
                        <label htmlFor={`terceroConcepto${indice}`} className={etiquetaClases}>
                          Concepto de responsabilidad
                        </label>
                        <textarea
                          id={`terceroConcepto${indice}`}
                          value={tercero.conceptoResponsabilidad}
                          onChange={(e) =>
                            actualizarTercero(indice, 'conceptoResponsabilidad', e.target.value)
                          }
                          rows={3}
                          className={inputClases}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 5. Lesionados */}
          <Card
            titulo="Lesionados"
            accion={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLesionados([...lesionados, lesionadoVacio])}
              >
                + Agregar lesionado
              </Button>
            }
          >
            {lesionados.length === 0 ? (
              <p className="px-6 py-4 text-sm text-gray-500">Sin lesionados.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {lesionados.map((lesionado, indice) => (
                  <div key={indice} className="p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Lesionado {indice + 1}</h3>
                      <button
                        type="button"
                        onClick={() => setLesionados(lesionados.filter((_, i) => i !== indice))}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label htmlFor={`lesionadoNombre${indice}`} className={etiquetaClases}>
                          Nombre
                        </label>
                        <input
                          id={`lesionadoNombre${indice}`}
                          value={lesionado.nombre}
                          onChange={(e) => actualizarLesionado(indice, 'nombre', e.target.value)}
                          maxLength={150}
                          className={inputClases}
                        />
                      </div>
                      <div>
                        <label htmlFor={`lesionadoCedula${indice}`} className={etiquetaClases}>
                          Cédula
                        </label>
                        <input
                          id={`lesionadoCedula${indice}`}
                          value={lesionado.cedula}
                          onChange={(e) => actualizarLesionado(indice, 'cedula', e.target.value)}
                          maxLength={20}
                          className={inputClases}
                        />
                      </div>
                      <div>
                        <label htmlFor={`lesionadoTelefono${indice}`} className={etiquetaClases}>
                          Teléfono
                        </label>
                        <input
                          id={`lesionadoTelefono${indice}`}
                          value={lesionado.telefono}
                          onChange={(e) => actualizarLesionado(indice, 'telefono', e.target.value)}
                          maxLength={20}
                          className={inputClases}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Button type="submit" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Crear proceso'}
          </Button>
        </form>
      )}
    </div>
  );
}
