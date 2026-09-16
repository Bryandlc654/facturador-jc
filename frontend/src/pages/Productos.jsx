import { useState, useEffect } from 'react';
import api from '../lib/api.js';

const TIPO_IGV = [
  { value: 1, label: 'Gravado - Operación Onerosa' },
  { value: 8, label: 'Exonerado - Operación Onerosa' },
  { value: 9, label: 'Inafecto - Operación Onerosa' },
  { value: 16, label: 'Exportación' },
];

const UNIDADES = [
  { value: 'NIU', label: 'NIU - Producto' },
  { value: 'ZZ', label: 'ZZ - Servicio' },
];

function ProductoModal({ open, onClose, onSuccess, initial }) {
  const [form, setForm] = useState({
    codigo: '', codigo_producto_sunat: '10000000', descripcion: '',
    unidad_de_medida: 'NIU', valor_unitario: 0, precio_unitario: 0,
    tipo_de_igv: 1, stock: 0, activo: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) setForm({ ...form, ...initial });
    else setForm({ codigo: '', codigo_producto_sunat: '10000000', descripcion: '', unidad_de_medida: 'NIU', valor_unitario: 0, precio_unitario: 0, tipo_de_igv: 1, stock: 0, activo: true });
  }, [initial, open]);

  if (!open) return null;

  const calcPrecio = (val) => {
    const v = Number(val) || 0;
    setForm({ ...form, valor_unitario: v, precio_unitario: Number((v * 1.18).toFixed(2)) });
  };
  const calcValor = (val) => {
    const p = Number(val) || 0;
    setForm({ ...form, precio_unitario: p, valor_unitario: Number((p / 1.18).toFixed(2)) });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true); setError('');
      const pay = { ...form, valor_unitario: Number(form.valor_unitario), precio_unitario: Number(form.precio_unitario), tipo_de_igv: Number(form.tipo_de_igv), stock: Number(form.stock) };
      if (initial) await api.patch(`/productos/${initial.id}`, pay);
      else await api.post('/productos', pay);
      onSuccess(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{initial ? 'Editar Producto' : 'Nuevo Producto / Servicio'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="form-label">Código</label>
                  <input className="form-input" name="codigo" value={form.codigo} onChange={handleChange} required />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="form-label">Código SUNAT</label>
                  <input className="form-input" name="codigo_producto_sunat" value={form.codigo_producto_sunat} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input className="form-input" name="descripcion" value={form.descripcion} onChange={handleChange} required />
            </div>
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="form-label">Unidad de Medida</label>
                  <select className="form-select" name="unidad_de_medida" value={form.unidad_de_medida} onChange={handleChange}>
                    {UNIDADES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="form-label">Tipo de IGV</label>
                  <select className="form-select" name="tipo_de_igv" value={form.tipo_de_igv} onChange={handleChange}>
                    {TIPO_IGV.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="form-label">Valor Unitario (sin IGV)</label>
                  <input className="form-input" type="number" step="0.01" name="valor_unitario" value={form.valor_unitario} onChange={(e) => calcPrecio(e.target.value)} />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="form-label">Precio Unitario (con IGV)</label>
                  <input className="form-input" type="number" step="0.01" name="precio_unitario" value={form.precio_unitario} onChange={(e) => calcValor(e.target.value)} />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="form-label">Stock</label>
                  <input className="form-input" type="number" name="stock" value={form.stock} onChange={handleChange} />
                </div>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
              Producto activo
            </label>
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

export default function Productos() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/productos', { params: { search } })
      .then(r => setItems(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [search]);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await api.delete(`/productos/${id}`);
      load();
      setSuccess('Producto eliminado');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) { alert('Error al eliminar'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Productos y Servicios</h1>
        <div className="page-actions">
          <input className="form-input" style={{ width: 260 }} placeholder="🔍 Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>➕ Nuevo Producto</button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        {loading ? <p>Cargando...</p> : !items.length ? (
          <div className="empty-state">
            <h3>No hay productos registrados</h3>
            <p>Agrega tus productos y servicios para usarlos en las facturas</p>
            <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>Agregar Producto</button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>U.M.</th>
                <th>Valor Unit.</th>
                <th>Precio Unit.</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace' }}>{p.codigo}</td>
                  <td>{p.descripcion}</td>
                  <td><span className="badge badge-default">{p.unidad_de_medida}</span></td>
                  <td>S/ {Number(p.valor_unitario).toFixed(2)}</td>
                  <td style={{ fontWeight: 600 }}>S/ {Number(p.precio_unitario).toFixed(2)}</td>
                  <td>{p.stock}</td>
                  <td>{p.activo ? <span className="badge badge-success">Activo</span> : <span className="badge badge-danger">Inactivo</span>}</td>
                  <td className="table-actions">
                    <button className="btn btn-link" onClick={() => { setEditing(p); setModalOpen(true); }}>Editar</button>
                    <button className="btn btn-link btn-link-danger" onClick={() => handleDelete(p.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ProductoModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={load} initial={editing} />
    </div>
  );
}
