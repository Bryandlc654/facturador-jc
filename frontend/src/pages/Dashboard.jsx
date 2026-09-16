import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';

const stats = [
  { label: 'Total Facturas', key: 'totalFacturas', icon: '🧾', color: '#dbeafe', iconColor: '#2563eb' },
  { label: 'Total Boletas', key: 'totalBoletas', icon: '📋', color: '#d1fae5', iconColor: '#059669' },
  { label: 'Anuladas', key: 'totalAnuladas', icon: '❌', color: '#fee2e2', iconColor: '#dc2626' },
  { label: 'Monto Total', key: 'montoTotal', icon: '💰', color: '#fef3c7', iconColor: '#d97706', prefix: 'S/ ' },
  { label: 'Clientes', key: 'clientes', icon: '👥', color: '#ede9fe', iconColor: '#7c3aed' },
  { label: 'Productos', key: 'productos', icon: '📦', color: '#fce7f3', iconColor: '#db2777' },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/facturas/estadisticas'), api.get('/facturas?tipo=1&anulado=false')])
      .then(([res1, res2]) => {
        setData(res1.data);
        setFacturas(res2.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ color: '#6b7280', marginTop: '4px' }}>Resumen de tu actividad de facturación</p>
        </div>
        <div className="page-actions">
          <Link to="/facturas/nueva" className="btn btn-primary">➕ Nueva Factura</Link>
        </div>
      </div>

      <div className="stats-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="stat-card" style={{ opacity: 0.5 }}>
              <div className="stat-label">Cargando...</div>
              <div className="stat-value">—</div>
            </div>
          ))
        ) : (
          stats.map((s) => (
            <div key={s.key} className="stat-card">
              <div className="stat-icon" style={{ background: s.color, color: s.iconColor }}>{s.icon}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">
                {s.prefix || ''}
                {data?.[s.key] != null ? (typeof data[s.key] === 'number' && s.key === 'montoTotal' ? data[s.key].toFixed(2) : data[s.key]) : '0'}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Facturas recientes</h3>
          <Link to="/facturas" className="btn btn-link">Ver todas →</Link>
        </div>
        {!facturas.length ? (
          <div className="empty-state">
            <h3>Aún no tienes facturas</h3>
            <p>Crea tu primera factura electrónica ahora mismo</p>
            <Link to="/facturas/nueva" className="btn btn-primary">Crear Factura</Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Serie-Número</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado SUNAT</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 500 }}>{f.serie}-{String(f.numero).padStart(6, '0')}</td>
                  <td>{f.cliente?.denominacion}</td>
                  <td>{new Date(f.fecha_de_emision).toLocaleDateString('es-PE')}</td>
                  <td style={{ fontWeight: 600 }}>S/ {Number(f.total).toFixed(2)}</td>
                  <td>
                    {f.aceptada_por_sunat ? (
                      <span className="badge badge-success">Aceptada</span>
                    ) : (
                      <span className="badge badge-warning">Pendiente</span>
                    )}
                    {f.anulado && <span className="badge badge-danger" style={{ marginLeft: 4 }}>Anulada</span>}
                  </td>
                  <td>
                    {f.enlace_del_pdf ? (
                      <a href={f.enlace_del_pdf} target="_blank" rel="noreferrer" className="btn btn-link btn-sm">📄 Ver</a>
                    ) : f.enlace ? (
                      <a href={`${f.enlace}.pdf`} target="_blank" rel="noreferrer" className="btn btn-link btn-sm">📄 Ver</a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
