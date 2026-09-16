import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api.js';

const TIPO_COMP = [
  { value: 1, label: 'FACTURA', serie: 'F001' },
  { value: 2, label: 'BOLETA', serie: 'B001' },
];
const MONEDA = [
  { value: 1, label: 'Soles (PEN)' },
  { value: 2, label: 'Dólares (USD)' },
  { value: 3, label: 'Euros (EUR)' },
];
const TIPO_IGV = [
  { value: 1, label: 'Gravado (18%)', pct: 0.18 },
  { value: 8, label: 'Exonerado (0%)', pct: 0 },
  { value: 9, label: 'Inafecto (0%)', pct: 0 },
];
const FORMATOS_PDF = [
  { value: 'A4', label: 'A4' },
  { value: 'A5', label: 'A5' },
  { value: 'TICKET', label: 'TICKET' },
];

function emptyItem() {
  return {
    productoId: null, codigo: '', codigo_producto_sunat: '10000000', descripcion: '',
    unidad_de_medida: 'NIU', cantidad: 1, valor_unitario: 0, precio_unitario: 0,
    descuento: '', subtotal: 0, tipo_de_igv: 1, igv: 0, total: 0,
  };
}

function calcItem(it) {
  const qty = Number(it.cantidad) || 0;
  const vu = Number(it.valor_unitario) || 0;
  const desc = Number(it.descuento) || 0;
  const tipo = TIPO_IGV.find(t => t.value === it.tipo_de_igv) || TIPO_IGV[0];
  const subt = (qty * vu) - desc;
  const igv = subt * tipo.pct;
  const pu = vu * (1 + tipo.pct);
  const total = subt + igv;
  return {
    ...it,
    cantidad: qty,
    valor_unitario: Number(vu.toFixed(10)),
    precio_unitario: Number(pu.toFixed(10)),
    descuento: it.descuento === '' ? '' : desc,
    subtotal: Number(subt.toFixed(2)),
    igv: Number(igv.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

export default function NuevaFactura() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const [tipoComprobante, setTipoComprobante] = useState(1);
  const [serie, setSerie] = useState('F001');
  const [moneda, setMoneda] = useState(1);
  const [clienteId, setClienteId] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().slice(0, 10));
  const [observaciones, setObservaciones] = useState('');
  const [condicionesDePago, setCondicionesDePago] = useState('');
  const [medioDePago, setMedioDePago] = useState('');
  const [formatoPdf, setFormatoPdf] = useState('A4');
  const [enviarSunat, setEnviarSunat] = useState(true);
  const [enviarCliente, setEnviarCliente] = useState(false);
  const [items, setItems] = useState([emptyItem()]);
  const [guardarSinNubefact, setGuardarSinNubefact] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/clientes'), api.get('/productos', { params: { activo: true } })])
      .then(([rc, rp]) => { setClientes(rc.data); setProductos(rp.data); })
      .finally(() => setLoadingInit(false));
  }, []);

  useEffect(() => {
    const conf = TIPO_COMP.find(t => t.value === tipoComprobante);
    if (conf) setSerie(conf.serie);
  }, [tipoComprobante]);

  const agregarItem = () => setItems([...items, emptyItem()]);
  const eliminarItem = (i) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };

  const setItemField = (i, field, value) => {
    const next = items.map((it, idx) => {
      if (idx !== i) return it;
      if (field === 'productoId' && value) {
        const prod = productos.find(p => p.id === Number(value));
        if (prod) return calcItem({
          ...it, productoId: prod.id, codigo: prod.codigo,
          codigo_producto_sunat: prod.codigo_producto_sunat || '10000000',
          descripcion: prod.descripcion, unidad_de_medida: prod.unidad_de_medida,
          valor_unitario: Number(prod.valor_unitario),
          tipo_de_igv: prod.tipo_de_igv,
        });
      }
      return calcItem({ ...it, [field]: value });
    });
    setItems(next);
  };

  const totales = useMemo(() => {
    const gravada = items.filter(i => i.tipo_de_igv === 1).reduce((s, i) => s + i.subtotal, 0);
    const inafecta = items.filter(i => i.tipo_de_igv === 9).reduce((s, i) => s + i.subtotal, 0);
    const exonerada = items.filter(i => i.tipo_de_igv === 8).reduce((s, i) => s + i.subtotal, 0);
    const igv = items.filter(i => i.tipo_de_igv === 1).reduce((s, i) => s + i.igv, 0);
    const total = items.reduce((s, i) => s + i.total, 0);
    return {
      gravada: Number(gravada.toFixed(2)),
      inafecta: Number(inafecta.toFixed(2)),
      exonerada: Number(exonerada.toFixed(2)),
      igv: Number(igv.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }, [items]);

  const submit = async (e) => {
    e.preventDefault();
    if (!clienteId) { setError('Selecciona un cliente'); return; }
    if (items.some(i => !i.productoId || i.cantidad <= 0 || i.total <= 0)) {
      setError('Revisa los items: todos deben tener producto, cantidad > 0 y total > 0');
      return;
    }
    try {
      setSending(true); setError('');
      const payload = {
        clienteId: Number(clienteId),
        tipo_de_comprobante: tipoComprobante,
        serie,
        moneda,
        sunat_transaction: 1,
        fecha_de_emision: new Date(fechaEmision),
        porcentaje_de_igv: 18.0,
        total_gravada: totales.gravada,
        total_inafecta: totales.inafecta,
        total_exonerada: totales.exonerada,
        total_igv: totales.igv,
        total: totales.total,
        observaciones,
        condiciones_de_pago: condicionesDePago,
        medio_de_pago: medioDePago,
        formato_de_pdf: formatoPdf,
        enviar_automaticamente_a_la_sunat: enviarSunat,
        enviar_automaticamente_al_cliente: enviarCliente,
        enviar_a_nubefact: !guardarSinNubefact,
        guardar_sin_nubefact: guardarSinNubefact,
        items: items.map(i => ({
          productoId: i.productoId, codigo: i.codigo,
          codigo_producto_sunat: i.codigo_producto_sunat, descripcion: i.descripcion,
          unidad_de_medida: i.unidad_de_medida, cantidad: i.cantidad,
          valor_unitario: i.valor_unitario, precio_unitario: i.precio_unitario,
          descuento: i.descuento === '' ? undefined : i.descuento,
          subtotal: i.subtotal, tipo_de_igv: i.tipo_de_igv, igv: i.igv, total: i.total,
        })),
      };
      const res = await api.post('/facturas', payload);
      navigate('/facturas');
    } catch (err) {
      const msg = err.response?.data?.errors
        || (typeof err.response?.data?.message === 'string' ? err.response.data.message : JSON.stringify(err.response?.data))
        || err.message;
      setError(msg);
    } finally { setSending(false); }
  };

  if (loadingInit) return <div className="card"><p>Cargando datos...</p></div>;

  const clienteSel = clientes.find(c => c.id === Number(clienteId));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nuevo Comprobante Electrónico</h1>
          <p style={{ color: '#6b7280', marginTop: 4 }}>Completa los datos para generar la factura/boleta</p>
        </div>
        <div className="page-actions">
          <Link to="/facturas" className="btn btn-secondary">← Volver al listado</Link>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Datos del comprobante</h3>
          <div className="row">
            <div className="col">
              <div className="form-group">
                <label className="form-label">Tipo de comprobante</label>
                <select className="form-select" value={tipoComprobante} onChange={(e) => setTipoComprobante(Number(e.target.value))}>
                  {TIPO_COMP.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label className="form-label">Serie</label>
                <input className="form-input" value={serie} onChange={(e) => setSerie(e.target.value.toUpperCase())} maxLength={4} />
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label className="form-label">Moneda</label>
                <select className="form-select" value={moneda} onChange={(e) => setMoneda(Number(e.target.value))}>
                  {MONEDA.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label className="form-label">Fecha de emisión</label>
                <input className="form-input" type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-3">
              <div className="form-group">
                <label className="form-label">Cliente</label>
                <select className="form-select" value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
                  <option value="">-- Selecciona un cliente --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.numero_de_documento} - {c.denominacion}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label className="form-label">Formato de impresión PDF</label>
                <select className="form-select" value={formatoPdf} onChange={(e) => setFormatoPdf(e.target.value)}>
                  {FORMATOS_PDF.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {clienteSel && (
            <div style={{ background: '#f9fafb', padding: 14, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
              <b>{clienteSel.denominacion}</b>
              {clienteSel.direccion && <div style={{ color: '#6b7280' }}>📍 {clienteSel.direccion}</div>}
              {clienteSel.email && <div style={{ color: '#6b7280' }}>✉ {clienteSel.email}</div>}
            </div>
          )}

          <div className="row">
            <div className="col">
              <div className="form-group">
                <label className="form-label">Condiciones de pago</label>
                <input className="form-input" placeholder="Ej: Contado, Crédito 15 días..." value={condicionesDePago} onChange={(e) => setCondicionesDePago(e.target.value)} />
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label className="form-label">Medio de pago</label>
                <input className="form-input" placeholder="Ej: Efectivo, Depósito, Tarjeta Visa OP: 12345..." value={medioDePago} onChange={(e) => setMedioDePago(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea className="form-textarea" placeholder="Observaciones o notas para el comprobante..." value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <input type="checkbox" checked={enviarSunat} onChange={(e) => setEnviarSunat(e.target.checked)} />
              Enviar automáticamente a SUNAT
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <input type="checkbox" checked={enviarCliente} onChange={(e) => setEnviarCliente(e.target.checked)} />
              Enviar PDF por email al cliente
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <input type="checkbox" checked={guardarSinNubefact} onChange={(e) => setGuardarSinNubefact(e.target.checked)} />
              Guardar sin enviar a NubeFact (modo prueba)
            </label>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Ítems del comprobante</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={agregarItem}>➕ Agregar línea</button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ minWidth: 200 }}>Producto / Servicio</th>
                  <th style={{ width: 90 }}>U.M.</th>
                  <th style={{ width: 90 }}>Cant.</th>
                  <th style={{ width: 120 }}>Valor Unit.</th>
                  <th style={{ width: 100 }}>Tipo IGV</th>
                  <th style={{ width: 90 }}>Desc.</th>
                  <th style={{ width: 120 }}>Subtotal</th>
                  <th style={{ width: 100 }}>IGV</th>
                  <th style={{ width: 120 }}>Total</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td>
                      <select
                        className="form-select"
                        value={it.productoId || ''}
                        onChange={(e) => setItemField(i, 'productoId', e.target.value)}
                      >
                        <option value="">-- Seleccionar --</option>
                        {productos.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.descripcion}</option>)}
                      </select>
                      <input
                        className="form-input"
                        style={{ marginTop: 4, fontSize: 12 }}
                        placeholder="Descripción"
                        value={it.descripcion}
                        onChange={(e) => setItemField(i, 'descripcion', e.target.value)}
                      />
                    </td>
                    <td>
                      <input className="form-input" value={it.unidad_de_medida} onChange={(e) => setItemField(i, 'unidad_de_medida', e.target.value.toUpperCase())} />
                    </td>
                    <td>
                      <input type="number" step="0.01" className="form-input" value={it.cantidad} onChange={(e) => setItemField(i, 'cantidad', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" step="0.000001" className="form-input" value={it.valor_unitario} onChange={(e) => setItemField(i, 'valor_unitario', e.target.value)} />
                    </td>
                    <td>
                      <select className="form-select" value={it.tipo_de_igv} onChange={(e) => setItemField(i, 'tipo_de_igv', Number(e.target.value))}>
                        {TIPO_IGV.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <input type="number" step="0.01" className="form-input" value={it.descuento === '' ? '' : it.descuento} onChange={(e) => setItemField(i, 'descuento', e.target.value)} placeholder="0.00" />
                    </td>
                    <td style={{ fontWeight: 500 }}>S/ {it.subtotal.toFixed(2)}</td>
                    <td>S/ {it.igv.toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: '#2563eb' }}>S/ {it.total.toFixed(2)}</td>
                    <td>
                      <button type="button" className="btn btn-link btn-link-danger" onClick={() => eliminarItem(i)} disabled={items.length === 1}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Resumen</h3>
          <div style={{ maxWidth: 360, marginLeft: 'auto' }}>
            <div className="row" style={{ marginBottom: 8 }}>
              <div className="col" style={{ color: '#6b7280' }}>Operación Gravada</div>
              <div className="col" style={{ textAlign: 'right' }}>S/ {totales.gravada.toFixed(2)}</div>
            </div>
            {totales.exonerada > 0 && (
              <div className="row" style={{ marginBottom: 8 }}>
                <div className="col" style={{ color: '#6b7280' }}>Operación Exonerada</div>
                <div className="col" style={{ textAlign: 'right' }}>S/ {totales.exonerada.toFixed(2)}</div>
              </div>
            )}
            {totales.inafecta > 0 && (
              <div className="row" style={{ marginBottom: 8 }}>
                <div className="col" style={{ color: '#6b7280' }}>Operación Inafecta</div>
                <div className="col" style={{ textAlign: 'right' }}>S/ {totales.inafecta.toFixed(2)}</div>
              </div>
            )}
            <div className="row" style={{ marginBottom: 8 }}>
              <div className="col" style={{ color: '#6b7280' }}>IGV (18%)</div>
              <div className="col" style={{ textAlign: 'right' }}>S/ {totales.igv.toFixed(2)}</div>
            </div>
            <div className="row" style={{ paddingTop: 12, borderTop: '1px solid #e5e7eb', paddingBottom: 10 }}>
              <div className="col" style={{ fontWeight: 700, fontSize: 18 }}>Total</div>
              <div className="col" style={{ textAlign: 'right', fontWeight: 700, fontSize: 22, color: '#2563eb' }}>
                S/ {totales.total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginTop: 20 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <Link to="/facturas" className="btn btn-secondary">Cancelar</Link>
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? <span><span className="spinner" style={{ marginRight: 8 }}/>Generando...</span> : '✓ Generar Comprobante'}
          </button>
        </div>
      </form>
    </div>
  );
}
