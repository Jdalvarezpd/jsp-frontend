import type { ReactNode } from 'react';

type BadgeVariant = 'green' | 'amber' | 'gray';

const CLASES_POR_VARIANTE: Record<BadgeVariant, string> = {
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-800',
  gray: 'bg-gray-100 text-gray-700',
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

// Pill de color generico, sin logica de negocio: quien lo usa decide la
// variante (ver por ejemplo `varianteEstado` en ProcesosListPage.tsx, que
// mapea cada nombre de estado a un color). Si no se pasa `variant`, usa gris
// -- ese es el color por defecto para cualquier valor que la vista no mapee.
export function Badge({ children, variant = 'gray' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASES_POR_VARIANTE[variant]}`}
    >
      {children}
    </span>
  );
}
