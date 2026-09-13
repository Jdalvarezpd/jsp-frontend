import { NavLink } from 'react-router-dom';

const enlaceBase =
  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900';
const enlaceActivo = 'bg-gray-100 text-gray-900';

interface SidebarProps {
  rol: string;
}

// Menu lateral compartido por todas las rutas protegidas. El link "Abogados"
// solo se muestra a rol admin -- el backend ya rechaza GET /usuarios para
// abogado (403), asi que aqui simplemente no se le ofrece el link.
export function Sidebar({ rol }: SidebarProps) {
  return (
    <nav className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">
          JSP
        </div>
        <span className="font-semibold text-gray-900">JSP Abogados</span>
      </div>

      <ul className="space-y-1 px-3 py-2">
        <li>
          <NavLink
            to="/escritorio"
            className={({ isActive }) => `${enlaceBase} ${isActive ? enlaceActivo : ''}`}
          >
            <IconoEscritorio />
            Escritorio
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/procesos"
            className={({ isActive }) => `${enlaceBase} ${isActive ? enlaceActivo : ''}`}
          >
            <IconoProcesos />
            Procesos
          </NavLink>
        </li>
        {rol === 'admin' && (
          <li>
            <NavLink
              to="/abogados"
              className={({ isActive }) => `${enlaceBase} ${isActive ? enlaceActivo : ''}`}
            >
              <IconoAbogados />
              Abogados
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  );
}

function IconoEscritorio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 shrink-0">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12l8.954-8.955a1.125 1.125 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

function IconoProcesos() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 shrink-0">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}

function IconoAbogados() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 shrink-0">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}
