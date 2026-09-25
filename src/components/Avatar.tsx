interface AvatarProps {
  nombre: string;
  size?: number;
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  const primera = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primera + ultima).toUpperCase();
}

// Circulo con las iniciales del nombre. `size` en pixeles (por defecto 32).
export function Avatar({ nombre, size = 32 }: AvatarProps) {
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-white"
    >
      {iniciales(nombre)}
    </div>
  );
}
