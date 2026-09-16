import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';

const TIPO_COMP = { 1: 'Factura', 2: 'Boleta', 3: 'Nota Crédito', 4: 'Nota Débito' };
const MONEDA = { 1: 'PEN (S/)', 2: 'USD ($)', 3: 'EUR', 4: 'GBP' };

function AnularModal({ open, onClose, factura, onSuccess }) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (open) { setMotivo(''); setError(''); } }, [open]);
  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!motivo.trim()) { setError('Ingresa un motivo'); return; }
    try {
      setLoading(true);
      await api.post(`/facturas/${factura.id}/anular`, { motivo, enviar_a_nubefact: true });
      onSuccess(); onClose();
    } catch (err) {
      setError(err.response?.data?.errors || err.response?.data?.message || 'Error al anular');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Anular Comprobante</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <p style={{ marginBottom: 16 }}>
              Estás a punto de anular <b>{TIPO_COMP[factura.tipo_de_comprobante]}</b> <b>{factura.serie}-{factura.numero}</b>
            </p>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Motivo de anulación</label>
              <textarea className="form-textarea" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: Error de sistema, anulación de operación..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Anular Comprobante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Facturas() {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('todos');
  const [anularModal, setAnularModal] = useState(null);
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (tab === 'facturas') params.tipo = 1;
    if (tab === 'boletas') params.tipo = 2;
    if (tab === 'anuladas') params.anulado = true;
    if (tab === 'activas') params.anulado = false;
    api.get('/facturas', { params })
      .then(r => setFacturas(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [tab]);

  const consultarSunat = async (f) => {
    try {
      await api.post(`/facturas/${f.id}/consultar`, {});
      load();
      setSuccess('Estado SUNAT actualizado');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) { alert('Error al consultar SUNAT: ' + (e.response?.data?.errors || e.response?.data?.message || e.message)); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Facturas y Boletas</h1>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/facturas/nueva')} style={{ marginRight: 8 }}>➕ Boleta</button>
          <button className="btn btn-primary" onClick={() => navigate('/facturas/nueva')}>➕ Nueva Factura</button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div className="tabs">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'facturas', label: 'Facturas' },
          { id: 'boletas', label: 'Boletas' },
          { id: 'activas', label: 'Activas' },
          { id: 'anuladas', label: 'Anuladas' },
        ].map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? <p>Cargando...</p> : !facturas.length ? (
          <div className="empty-state">
            <h3>No hay comprobantes en esta sección</h3>
            <p>Crea tu primera factura o boleta electrónica</p>
            <Link to="/facturas/nueva" className="btn btn-primary">Crear Factura</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Serie-Número</th>
                  <th>Cliente</th>
                  <th>Fecha Emisión</th>
                  <th>Moneda</th>
                  <th>Total</th>
                  <th>SUNAT</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <span className={`badge ${f.tipo_de_comprobante === 1 ? 'badge-info' : 'badge-default'}`}>
                        {TIPO_COMP[f.tipo_de_comprobante]}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {f.serie}-{String(f.numero).padStart(6, '0')}
                    </td>
                    <td>{f.cliente?.denominacion}</td>
                    <td>{new Date(f.fecha_de_emision).toLocaleDateString('es-PE')}</td>
                    <td>{MONEDA[f.moneda] || 'PEN'}</td>
                    <td style={{ fontWeight: 600 }}>S/ {Number(f.total).toFixed(2)}</td>
                    <td>
                      {f.aceptada_por_sunat ? (
                        <span className="badge badge-success">✓ Aceptada</span>
                      ) : (
                        <span className="badge badge-warning">Pendiente</span>
                      )}
                    </td>
                    <td>
                      {f.anulado ? (
                        <span className="badge badge-danger">Anulada</span>
                      ) : (
                        <span className="badge badge-success">Vigente</span>
                      )}
                    </td>
                    <td className="table-actions">
                      {f.enlace_del_pdf ? (
                        <a href={f.enlace_del_pdf} target="_blank" rel="noreferrer" className="btn btn-link">📄 PDF</a>
                      ) : f.enlace ? (
                        <a href={`${f.enlace}.pdf`} target="_blank" rel="noreferrer" className="btn btn-link">📄 PDF</a>
                      ) : null}
                      {f.enlace_del_xml && (
                        <a href={f.enlace_del_xml} target="_blank" rel="noreferrer" className="btn btn-link">📎 XML</a>
                      )}
                      {!f.anulado && (
                        <>
                          <button className="btn btn-link" onClick={() => consultarSunat(f)}>🔄 Consultar</button>
                          <button className="btn btn-link btn-link-danger" onClick={() => setAnularModal(f)}>🗑 Anular</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnularModal open={!!anularModal} factura={anularModal} onClose={() => setAnularModal(null)} onSuccess={load} />
    </div>
  );
}
