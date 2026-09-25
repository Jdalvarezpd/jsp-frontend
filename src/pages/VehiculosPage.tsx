import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Forma de cada elemento de GET /api/v1/vehiculos?placa= (solo los campos que se muestran).
interface Vehiculo {
  id: number;
  placa: string;
  marca: string | null;
  modelo: string | null;
  color: string | null;
}

// Resultado de la ultima busqueda. Guarda la placa consultada para saber si
// todavia corresponde a lo que hay escrito en el campo.
interface Resultado {
  placa: string;
  vehiculos: Vehiculo[] | null; // null = la consulta fallo
}

// El backend busca a partir de 2 caracteres, asi que no se consulta antes.
const LARGO_MINIMO_BUSQUEDA = 2;

// Buscador de vehiculos por placa (no hay listado completo). Consulta
// GET /api/v1/vehiculos?placa= mientras se escribe (con una pequeña espera
// para no pedir en cada tecla). El backend hace una busqueda parcial (la placa
// contiene lo escrito, sin distinguir mayusculas) y siempre responde un
// arreglo, maximo 50; vacio si no hay coincidencias.
export function VehiculosPage() {
  const navigate = useNavigate();
  const [placa, setPlaca] = useState('');
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const placaBuscada = placa.trim().toUpperCase();

  useEffect(() => {
    if (placaBuscada.length < LARGO_MINIMO_BUSQUEDA) return;

    const token = localStorage.getItem('token');
    // Si se sigue escribiendo antes de que llegue la respuesta, se ignora.
    let cancelado = false;

    const espera = setTimeout(() => {
      fetch(`${import.meta.env.VITE_API_URL}/vehiculos?placa=${encodeURIComponent(placaBuscada)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (res.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }

          if (res.ok) {
            const vehiculos: Vehiculo[] = await res.json();
            if (!cancelado) setResultado({ placa: placaBuscada, vehiculos });
          } else if (!cancelado) {
            setResultado({ placa: placaBuscada, vehiculos: null });
          }
        })
        .catch(() => {
          if (!cancelado) setResultado({ placa: placaBuscada, vehiculos: null });
        });
    }, 400);

    return () => {
      cancelado = true;
      clearTimeout(espera);
    };
  }, [placaBuscada, navigate]);

  // Lo que se muestra debajo del campo depende de lo escrito y de si ya hay
  // una respuesta para esa misma busqueda.
  let contenido;
  if (placaBuscada.length < LARGO_MINIMO_BUSQUEDA) {
    contenido = (
      <p className="px-6 text-sm text-muted-foreground">Escribe una placa para buscar un vehículo.</p>
    );
  } else if (resultado?.placa !== placaBuscada) {
    contenido = <p className="px-6 text-sm text-muted-foreground">Buscando...</p>;
  } else if (resultado.vehiculos === null) {
    contenido = <p className="px-6 text-sm text-red-600">No se pudo buscar el vehículo. Intenta de nuevo.</p>;
  } else if (resultado.vehiculos.length === 0) {
    contenido = (
      <p className="px-6 text-sm text-muted-foreground">No se encontraron vehículos con esa placa.</p>
    );
  } else {
    contenido = (
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-6">Placa</TableHead>
            <TableHead className="px-6">Marca</TableHead>
            <TableHead className="px-6">Modelo</TableHead>
            <TableHead className="px-6">Color</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resultado.vehiculos.map((vehiculo) => (
            <TableRow key={vehiculo.id}>
              <TableCell className="px-6 py-3 font-medium text-gray-900">{vehiculo.placa}</TableCell>
              <TableCell className="px-6 py-3 text-gray-700">{vehiculo.marca ?? '—'}</TableCell>
              <TableCell className="px-6 py-3 text-gray-700">{vehiculo.modelo ?? '—'}</TableCell>
              <TableCell className="px-6 py-3 text-gray-700">{vehiculo.color ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Vehículos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Buscar por placa</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            aria-label="Buscar por placa"
            placeholder="Buscar por placa"
            value={placa}
            onChange={(e) => setPlaca(e.target.value)}
            maxLength={10}
            autoFocus
          />
        </CardContent>
      </Card>

      <Card className="py-5">{contenido}</Card>
    </div>
  );
}
