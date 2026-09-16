import { useState, useEffect } from 'react';
import api from '../lib/api.js';

const TIPO_DOC = [
  { value: '6', label: 'RUC' },
  { value: '1', label: 'DNI' },
  { value: '4', label: 'Carnet Extranjeria' },
  { value: '7', label: 'Pasaporte' },
  { value: '-', label: 'Varios' },
  { value: '0', label: 'No Domiciliado' },
];

function ClienteModal({ open, onClose, onSuccess, initial }) {
  const [form, setForm] = useState({
    tipo_de_documento: '6', numero_de_documento: '', denominacion: '',
    direccion: '', email: '', telefono: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) setForm({ ...form, ...initial });
    else setForm({ tipo_de_documento: '6', numero_de_documento: '', denominacion: '', direccion: '', email: '', telefono: '' });
  }, [initial, open]);

  if (!open) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true); setError('');
      if (initial) await api.patch(`/clientes/${initial.id}`, form);
      else await api.post('/clientes', form);
      onSuccess(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{initial ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="form-label">Tipo de Documento</label>
                  <select className="form-select" name="tipo_de_documento" value={form.tipo_de_documento} onChange={handleChange}>
                    {TIPO_DOC.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="form-label">Número</label>
                  <input className="form-input" name="numero_de_documento" value={form.numero_de_documento} onChange={handleChange} required />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Razón Social / Denominación</label>
              <input className="form-input" name="denominacion" value={form.denominacion} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Dirección</label>
              <input className="form-input" name="direccion" value={form.direccion} onChange={handleChange} />
            </div>
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input className="form-input" name="telefono" value={form.telefono} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/clientes', { params: { search } })
      .then(r => setClientes(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [search]);

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    try {
      await api.delete(`/clientes/${id}`);
      load();
      setSuccess('Cliente eliminado');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      alert('Error al eliminar');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <div className="page-actions">
          <input className="form-input" style={{ width: 260 }} placeholder="🔍 Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>➕ Nuevo Cliente</button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        {loading ? <p>Cargando...</p> : !clientes.length ? (
          <div className="empty-state">
            <h3>No hay clientes registrados</h3>
            <p>Agrega tus primeros clientes para empezar a facturar</p>
            <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>Agregar Cliente</button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tipo Doc.</th>
                <th>Número</th>
                <th>Denominación</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td>{TIPO_DOC.find(t => t.value === c.tipo_de_documento)?.label || c.tipo_de_documento}</td>
                  <td style={{ fontWeight: 500 }}>{c.numero_de_documento}</td>
                  <td>{c.denominacion}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.telefono || '—'}</td>
                  <td className="table-actions">
                    <button className="btn btn-link" onClick={() => { setEditing(c); setModalOpen(true); }}>Editar</button>
                    <button className="btn btn-link btn-link-danger" onClick={() => handleDelete(c.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ClienteModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={load} initial={editing} />
    </div>
  );
}
