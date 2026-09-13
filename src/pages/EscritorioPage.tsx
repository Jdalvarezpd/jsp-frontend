import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Forma de GET /api/v1/auth/me.
interface Usuario {
  id: number;
  nombre: string;
  cedula: string;
  email: string | null;
  rol: string;
  activo: boolean;
}

// Pagina de bienvenida, placeholder intencional -- se expande mas adelante
// cuando se decida que mas va en el escritorio (metricas, notificaciones, etc).
export function EscritorioPage() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

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

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900">
        Bienvenido{usuario ? `, ${usuario.nombre}` : ''}
      </h1>
    </div>
  );
}
