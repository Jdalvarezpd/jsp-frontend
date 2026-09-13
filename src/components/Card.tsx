import type { ReactNode } from 'react';

interface CardProps {
  titulo?: string;
  accion?: ReactNode;
  children: ReactNode;
}

// Contenedor blanco con borde sutil, esquinas redondeadas y sombra suave.
// El encabezado (titulo a la izquierda, accion/boton a la derecha) es
// opcional -- si no se pasa ninguno de los dos, no se renderiza.
export function Card({ titulo, accion, children }: CardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {(titulo || accion) && (
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          {titulo && <h2 className="text-sm font-semibold text-gray-900">{titulo}</h2>}
          {accion}
        </div>
      )}
      {children}
    </div>
  );
}
