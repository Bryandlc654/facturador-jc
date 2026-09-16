import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LuReceipt, LuLayoutDashboard, LuUsers, LuPackage, LuPlus, LuLogOut } from 'react-icons/lu';
import useAuthStore from '../store/auth.js';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', Icon: LuLayoutDashboard },
  { path: '/clientes', label: 'Clientes', Icon: LuUsers },
  { path: '/productos', label: 'Productos', Icon: LuPackage },
  { path: '/facturas', label: 'Facturas', Icon: LuReceipt },
  { path: '/facturas/nueva', label: 'Nueva Factura', Icon: LuPlus },
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
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LuReceipt size={20} /> Facturador
          </h1>
          <p>con NubeFact</p>
        </div>
        <ul className="sidebar-nav">
          {navItems.map(({ path, label, Icon }) => (
            <li key={path}>
              <Link to={path} className={location.pathname === path ? 'active' : ''}>
                <span className="icon">
                  <Icon size={18} />
                </span>
                {label}
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
              <LuLogOut size={14} style={{ marginRight: 6 }} /> Salir
            </button>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}