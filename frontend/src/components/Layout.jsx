import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth.js';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/clientes', label: 'Clientes', icon: '👥' },
  { path: '/productos', label: 'Productos', icon: '📦' },
  { path: '/facturas', label: 'Facturas', icon: '🧾' },
  { path: '/facturas/nueva', label: 'Nueva Factura', icon: '➕' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initials = user
    ? `${user.nombre?.[0] || ''}${user.apellido?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <div className="sidebar-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>🧾 Facturador</h1>
          <p>con NubeFact</p>
        </div>
        <ul className="sidebar-nav">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link to={item.path} className={location.pathname === item.path ? 'active' : ''}>
                <span className="icon">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <div className="main-content" style={{ flex: 1, minWidth: 0 }}>
        <div className="topbar">
          <div className="user-menu">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="name">{user?.nombre} {user?.apellido}</div>
              <div className="email">{user?.email}</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => { logout(); navigate('/login'); }}>
              Salir
            </button>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
