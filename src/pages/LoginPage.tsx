import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Clave propia en localStorage para el email recordado (no confundir con "token").
const EMAIL_RECORDADO_KEY = 'jsp_remembered_email';

// Login contra POST /api/v1/auth/login. Devuelve { token, usuario } si las
// credenciales son correctas; el token se guarda en localStorage y de ahi en
// adelante viaja en el header Authorization de cada request autenticado.
//
// El checkbox "Recordarme": si esta marcado al enviar, se manda `recordar: true`
// en el body (el backend lo usa para extender la duracion del token) y se
// guarda el email en localStorage para prellenar el campo la proxima vez. Si
// no esta marcado, no se manda el flag y no se guarda (ni se conserva) el email.
export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_RECORDADO_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [recordarme, setRecordarme] = useState(() => localStorage.getItem(EMAIL_RECORDADO_KEY) !== null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setEnviando(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordarme ? { email, password, recordar: true } : { email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Email o contraseña incorrectos');
        return;
      }

      localStorage.setItem('token', data.token);

      if (recordarme) {
        localStorage.setItem(EMAIL_RECORDADO_KEY, email);
      } else {
        localStorage.removeItem(EMAIL_RECORDADO_KEY);
      }

      navigate('/escritorio');
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm"
      >
        <h1 className="mb-6 text-xl font-semibold text-gray-900">JSP Abogados</h1>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />

        <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />

        <label className="mb-6 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={recordarme}
            onChange={(e) => setRecordarme(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Recordarme
        </label>

        <Button type="submit" disabled={enviando} className="w-full">
          {enviando ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </form>
    </div>
  );
}
