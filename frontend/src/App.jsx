import { useState, useEffect, useCallback } from "react";

const API = "https://proyecto-para-imba.onrender.com";
const PAGE_SIZE = 10;

const CATEGORIAS = [
  "Medicamentos", "Vacunas", "Antiparasitarios",
  "Alimentos", "Insumos", "Equipos", "Otros",
];

const LIMITES = {
  nombre: 50,
  descripcion: 150,
  categoria: 40,
};

// ── ICONS ──────────────────────────────────────────────
const Icon = {
  Box: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5M12 22V12" /></svg>),
  Alert: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>),
  DollarSign: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>),
  Tag: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>),
  Plus: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M5 12h14M12 5v14" /></svg>),
  Edit: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>),
  Trash: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>),
  ArrowUp: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path d="m5 12 7-7 7 7M12 19V5" /></svg>),
  ArrowDown: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path d="m19 12-7 7-7-7M12 5v14" /></svg>),
  History: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></svg>),
  Paw: () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="4" cy="8" r="2" /><circle cx="6.5" cy="15.5" r="2" /><circle cx="17.5" cy="15.5" r="2" /><path d="M12 12c-2 0-4 1.5-5 4s-.5 5 2 5h6c2.5 0 3-3 2-5s-3-4-5-4z" /></svg>),
  X: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M18 6 6 18M6 6l12 12" /></svg>),
  Excel: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>),
  PowerOff: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>),
  Refresh: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>),
  ChevLeft: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="m15 18-6-6 6-6" /></svg>),
  ChevRight: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="m9 18 6-6-6-6" /></svg>),
};

// ── API ────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error de red" }));
    throw new Error(err.detail || "Error desconocido");
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── EXCEL EXPORT ───────────────────────────────────────
function exportToExcel(productos) {
  const headers = ["ID", "Nombre", "Descripción", "Categoría", "Stock Actual", "Stock Mínimo", "Precio", "Estado"];
  const rows = productos.map(p => [
    p.id, p.nombre, p.descripcion || "", p.categoria,
    p.stock_actual, p.stock_minimo, p.precio.toFixed(2),
    !p.activo ? "Baja" : p.stock_actual < p.stock_minimo ? "Stock Bajo" : "OK"
  ]);
  let csv = "\uFEFF";
  csv += headers.join(",") + "\n";
  rows.forEach(r => { csv += r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\n"; });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventario_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── VALIDATE FORM ──────────────────────────────────────
function validateForm(form) {
  const errors = {};
  if (!form.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
  else if (form.nombre.trim().length > LIMITES.nombre) errors.nombre = `Máximo ${LIMITES.nombre} caracteres.`;
  if (form.descripcion && form.descripcion.length > LIMITES.descripcion) errors.descripcion = `Máximo ${LIMITES.descripcion} caracteres.`;
  if (!form.precio || form.precio <= 0) errors.precio = "El precio debe ser mayor a 0.";
  if (form.stock_actual < 0) errors.stock_actual = "No puede ser negativo.";
  if (form.stock_minimo < 0) errors.stock_minimo = "No puede ser negativo.";
  return errors;
}

// ── DUPLICATE CONFIRM MODAL ────────────────────────────
function DuplicateModal({ nombre, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-center gap-3">
          <span className="text-amber-500"><Icon.Alert /></span>
          <h3 className="font-bold text-amber-800">Producto duplicado</h3>
        </div>
        <div className="px-6 py-5">
          <p className="text-slate-600 text-sm">Ya existe un producto llamado <span className="font-bold text-slate-800">"{nombre}"</span>.</p>
          <p className="text-slate-500 text-sm mt-2">¿Deseas crearlo de todas formas como un producto adicional?</p>
        </div>
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition">Sí, crear igual</button>
        </div>
      </div>
    </div>
  );
}

// ── STAT CARD ──────────────────────────────────────────
function StatCard({ icon, label, value, accent, sublabel }) {
  return (
    <div className="relative bg-white rounded-2xl p-5 border border-slate-100 shadow-sm overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-10 ${accent}`} />
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${accent} bg-opacity-10`}>
        <span className={`${accent.replace("bg-", "text-")}`}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm font-medium text-slate-500 mt-0.5">{label}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
    </div>
  );
}

function Badge({ text, variant = "neutral" }) {
  const map = { neutral: "bg-slate-100 text-slate-600", danger: "bg-red-50 text-red-600 border border-red-200", success: "bg-emerald-50 text-emerald-600 border border-emerald-200", warning: "bg-amber-50 text-amber-600 border border-amber-200", info: "bg-sky-50 text-sky-600 border border-sky-200", inactive: "bg-slate-100 text-slate-400 border border-slate-200" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[variant]}`}>{text}</span>;
}

// ── FIELD WITH COUNTER ─────────────────────────────────
function FieldCounter({ value, max }) {
  const over = value.length > max;
  return (
    <span className={`text-xs ${over ? "text-red-500 font-semibold" : "text-slate-400"}`}>
      {value.length}/{max}
    </span>
  );
}

// ── PRODUCT MODAL ──────────────────────────────────────
function ProductModal({ product, allProductos, onSave, onClose }) {
  const isEdit = !!product?.id;
  const [form, setForm] = useState(product ?? { nombre: "", descripcion: "", stock_actual: 0, stock_minimo: 0, precio: 0, categoria: CATEGORIAS[0] });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showDupModal, setShowDupModal] = useState(false);

  const set = (key) => (e) => {
    const val = e.target.type === "number" ? +e.target.value : e.target.value;
    setForm(f => ({ ...f, [key]: val }));
    setErrors(er => ({ ...er, [key]: undefined }));
  };

  function checkAndSubmit() {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    // Verificar duplicado solo en creación
    if (!isEdit) {
      const existe = allProductos.some(p => p.nombre.toLowerCase().trim() === form.nombre.toLowerCase().trim() && p.id !== product?.id);
      if (existe) { setShowDupModal(true); return; }
    }
    doSave();
  }

  async function doSave(forzar = false) {
    setShowDupModal(false);
    setLoading(true); setApiError("");
    try {
      const payload = { ...form };
      if (forzar) payload._forzar = true;
      if (isEdit) await apiFetch(`/productos/${product.id}`, { method: "PUT", body: JSON.stringify(form) });
      else await apiFetch("/productos", { method: "POST", body: JSON.stringify({ ...form, _skip_check: forzar }) });
      onSave();
    } catch (e) { setApiError(e.message); } finally { setLoading(false); }
  }

  const inp = (field) => `w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition ${errors[field] ? "border-red-400 focus:ring-red-300" : "border-slate-200 focus:ring-sky-400"}`;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-sky-600 to-blue-700 px-6 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-white text-lg font-bold">{isEdit ? "Editar Producto" : "Nuevo Producto"}</h2>
              <p className="text-sky-200 text-xs mt-0.5">{isEdit ? "Modifica los campos necesarios" : "Completa la información del producto"}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition"><Icon.X /></button>
          </div>

          <div className="p-6 space-y-4">
            {apiError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{apiError}</div>}

            <div className="grid grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="col-span-2">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre *</label>
                  <FieldCounter value={form.nombre} max={LIMITES.nombre} />
                </div>
                <input className={inp("nombre")} value={form.nombre} onChange={set("nombre")} maxLength={LIMITES.nombre + 10} placeholder="Ej. Amoxicilina 500mg" />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
              </div>

              {/* Descripción */}
              <div className="col-span-2">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Descripción</label>
                  <FieldCounter value={form.descripcion ?? ""} max={LIMITES.descripcion} />
                </div>
                <textarea className={inp("descripcion")} rows={2} value={form.descripcion ?? ""} onChange={set("descripcion")} maxLength={LIMITES.descripcion + 10} placeholder="Descripción breve del producto" />
                {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion}</p>}
              </div>

              {/* Categoría */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Categoría *</label>
                <select className={inp("categoria")} value={form.categoria} onChange={set("categoria")}>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Precio */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Precio (MXN) *</label>
                <input type="number" className={inp("precio")} value={form.precio} onChange={set("precio")} min={0} step={0.01} />
                {errors.precio && <p className="text-red-500 text-xs mt-1">{errors.precio}</p>}
              </div>

              {/* Stock actual */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Stock Actual *</label>
                <input type="number" className={inp("stock_actual")} value={form.stock_actual} onChange={set("stock_actual")} min={0} />
                {errors.stock_actual && <p className="text-red-500 text-xs mt-1">{errors.stock_actual}</p>}
              </div>

              {/* Stock mínimo */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Stock Mínimo *</label>
                <input type="number" className={inp("stock_minimo")} value={form.stock_minimo} onChange={set("stock_minimo")} min={0} />
                {errors.stock_minimo && <p className="text-red-500 text-xs mt-1">{errors.stock_minimo}</p>}
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-3 justify-end">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancelar</button>
            <button onClick={checkAndSubmit} disabled={loading} className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition disabled:opacity-50">
              {loading ? "Guardando…" : isEdit ? "Guardar Cambios" : "Crear Producto"}
            </button>
          </div>
        </div>
      </div>

      {showDupModal && (
        <DuplicateModal
          nombre={form.nombre}
          onConfirm={() => doSave(true)}
          onCancel={() => setShowDupModal(false)}
        />
      )}
    </>
  );
}

// ── MOVEMENT MODAL ─────────────────────────────────────
function MovModal({ product, onSave, onClose }) {
  const [form, setForm] = useState({ tipo: "entrada", cantidad: 1, notas: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true); setError("");
    try {
      await apiFetch("/movimientos", { method: "POST", body: JSON.stringify({ producto_id: product.id, ...form }) });
      onSave();
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-700 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white text-lg font-bold">Registrar Movimiento</h2>
            <p className="text-teal-100 text-xs mt-0.5 truncate max-w-52">{product.nombre}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition"><Icon.X /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {["entrada", "salida"].map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, tipo: t }))}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition ${form.tipo === t ? (t === "entrada" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-red-400 bg-red-50 text-red-600") : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                  {t === "entrada" ? "↑ Entrada" : "↓ Salida"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Cantidad</label>
            <input type="number" className={inp} min={1} value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: +e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Notas</label>
            <input className={inp} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Motivo, proveedor, etc." />
          </div>
          <div className="text-xs text-slate-400 bg-slate-50 rounded-xl px-3 py-2">
            Stock actual: <span className="font-bold text-slate-600">{product.stock_actual}</span>
            {form.tipo === "entrada"
              ? <> → <span className="text-emerald-600 font-bold">{product.stock_actual + form.cantidad}</span></>
              : <> → <span className={`font-bold ${product.stock_actual - form.cantidad < 0 ? "text-red-600" : "text-slate-600"}`}>{product.stock_actual - form.cantidad}</span></>}
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition disabled:opacity-50">
            {loading ? "Guardando…" : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PAGINATION ─────────────────────────────────────────
function Pagination({ total, page, onPage }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-2 py-3">
      <p className="text-xs text-slate-400">
        Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} de <span className="font-semibold text-slate-600">{total}</span> productos
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <Icon.ChevLeft />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => onPage(n)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${n === page ? "bg-sky-600 text-white" : "border border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
            {n}
          </button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <Icon.ChevRight />
        </button>
      </div>
    </div>
  );
}

// ── DASHBOARD ──────────────────────────────────────────
function DashboardTab({ stats, productosBajos }) {
  if (!stats) return <div className="text-center py-16 text-slate-400 text-sm">Cargando estadísticas…</div>;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Icon.Box />} label="Total Productos" value={stats.total_productos} accent="bg-sky-500" />
        <StatCard icon={<Icon.Alert />} label="Stock Bajo" value={stats.productos_stock_bajo} accent="bg-red-500" sublabel="Requieren reabastecimiento" />
        <StatCard icon={<Icon.DollarSign />} label="Valor Inventario" value={`$${stats.valor_total_inventario.toLocaleString("es-MX")}`} accent="bg-emerald-500" />
        <StatCard icon={<Icon.Tag />} label="Categorías" value={stats.categorias} accent="bg-violet-500" />
      </div>
      {productosBajos.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-red-100 bg-red-50">
            <span className="text-red-500"><Icon.Alert /></span>
            <h3 className="text-sm font-bold text-red-700">Productos con Stock Bajo ({productosBajos.length})</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {productosBajos.map(p => (
              <div key={p.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{p.nombre}</p>
                  <p className="text-xs text-slate-400">{p.categoria}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-500">{p.stock_actual} <span className="text-slate-400 font-normal">/ mín {p.stock_minimo}</span></p>
                  <p className="text-xs text-red-400">Faltan {p.stock_minimo - p.stock_actual} unidades</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── PRODUCTOS TAB ──────────────────────────────────────
function ProductosTab({ productos, onRefresh }) {
  const [modal, setModal] = useState(null);
  const [movModal, setMovModal] = useState(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Todas");
  const [mostrarBajas, setMostrarBajas] = useState(false);
  const [page, setPage] = useState(1);

  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar este producto permanentemente?")) return;
    try { await apiFetch(`/productos/${id}`, { method: "DELETE" }); onRefresh(); }
    catch (e) { alert(e.message); }
  }

  async function handleBaja(p) {
    const accion = p.activo ? "dar de baja" : "reactivar";
    if (!window.confirm(`¿Deseas ${accion} "${p.nombre}"?`)) return;
    try {
      await apiFetch(`/productos/${p.id}`, { method: "PUT", body: JSON.stringify({ activo: !p.activo }) });
      onRefresh();
    } catch (e) { alert(e.message); }
  }

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, catFilter, mostrarBajas]);

  const filtered = productos.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "Todas" || p.categoria === catFilter;
    const matchBaja = mostrarBajas ? true : p.activo !== false;
    return matchSearch && matchCat && matchBaja;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const cats = ["Todas", ...new Set(productos.map(p => p.categoria))];

  const stockStatus = (p) => {
    if (!p.activo) return { label: "Baja", v: "inactive" };
    if (p.stock_actual === 0) return { label: "Sin Stock", v: "danger" };
    if (p.stock_actual < p.stock_minimo) return { label: "Stock Bajo", v: "warning" };
    return { label: "OK", v: "success" };
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <input className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          placeholder="Buscar por nombre…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => setMostrarBajas(b => !b)}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition ${mostrarBajas ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
          {mostrarBajas ? "Ocultar bajas" : "Ver bajas"}
        </button>
        <button onClick={() => exportToExcel(filtered)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">
          <Icon.Excel /> Exportar Excel
        </button>
        <button onClick={() => setModal("create")}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm shadow-sky-200">
          <Icon.Plus /> Nuevo Producto
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {["Producto", "Categoría", "Stock", "Precio", "Estado", "Acciones"].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginated.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-slate-400 py-12 text-sm">Sin resultados</td></tr>
            ) : paginated.map(p => {
              const st = stockStatus(p);
              const inactivo = p.activo === false;
              return (
                <tr key={p.id} className={`hover:bg-slate-50/60 transition ${inactivo ? "opacity-50" : ""}`}>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-800">{p.nombre}</p>
                    {p.descripcion && <p className="text-xs text-slate-400 truncate max-w-48">{p.descripcion}</p>}
                  </td>
                  <td className="px-5 py-3.5"><Badge text={p.categoria} variant="info" /></td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-slate-700">{p.stock_actual}</span>
                    <span className="text-slate-400 text-xs"> / mín {p.stock_minimo}</span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-700">${p.precio.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-3.5"><Badge text={st.label} variant={st.v} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {!inactivo && (
                        <button onClick={() => setMovModal(p)} title="Movimiento"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold transition">
                          <Icon.ArrowUp /> Stock
                        </button>
                      )}
                      <button onClick={() => setModal(p)} title="Editar"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold transition">
                        <Icon.Edit /> Editar
                      </button>
                      <button onClick={() => handleBaja(p)} title={inactivo ? "Reactivar" : "Dar de baja"}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-semibold transition ${inactivo ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"}`}>
                        {inactivo ? <><Icon.Refresh /> Activar</> : <><Icon.PowerOff /> Baja</>}
                      </button>
                      <button onClick={() => handleDelete(p.id)} title="Eliminar"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition">
                        <Icon.Trash /> Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t border-slate-100 px-3">
          <Pagination total={filtered.length} page={page} onPage={setPage} />
        </div>
      </div>

      {modal && <ProductModal product={modal === "create" ? null : modal} allProductos={productos} onSave={() => { setModal(null); onRefresh(); }} onClose={() => setModal(null)} />}
      {movModal && <MovModal product={movModal} onSave={() => { setMovModal(null); onRefresh(); }} onClose={() => setMovModal(null)} />}
    </div>
  );
}

// ── HISTORIAL ──────────────────────────────────────────
function HistorialTab({ movimientos }) {
  const fmt = iso => new Date(iso).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {["Fecha", "Producto", "Tipo", "Cantidad", "Notas"].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {movimientos.length === 0 ? (
            <tr><td colSpan={5} className="text-center text-slate-400 py-12 text-sm">Sin movimientos registrados</td></tr>
          ) : movimientos.map(m => (
            <tr key={m.id} className="hover:bg-slate-50/60 transition">
              <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{fmt(m.created_at)}</td>
              <td className="px-5 py-3.5 font-medium text-slate-700">{m.producto_nombre}</td>
              <td className="px-5 py-3.5">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${m.tipo === "entrada" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {m.tipo === "entrada" ? <><Icon.ArrowUp /> Entrada</> : <><Icon.ArrowDown /> Salida</>}
                </span>
              </td>
              <td className="px-5 py-3.5 font-bold text-slate-700">{m.cantidad}</td>
              <td className="px-5 py-3.5 text-slate-400 text-xs">{m.notas || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── APP ROOT ───────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [prods, movs, dash] = await Promise.all([
        apiFetch("/productos"),
        apiFetch("/movimientos"),
        apiFetch("/dashboard"),
      ]);
      setProductos(prods);
      setMovimientos(movs);
      setStats(dash);
    } catch (e) {
      setError("No se pudo conectar con el servidor. Verifica que el backend esté activo.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const productosBajos = productos.filter(p => p.activo !== false && p.stock_actual < p.stock_minimo);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <Icon.Box /> },
    { id: "productos", label: `Inventario (${productos.filter(p => p.activo !== false).length})`, icon: <Icon.Tag /> },
    { id: "historial", label: "Historial", icon: <Icon.History /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <aside className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 flex-col z-30 hidden lg:flex">
        <div className="px-6 py-7 flex items-center gap-3 border-b border-white/10">
          <img src="/logo-imba.png" alt="Logo Veterinaria" className="w-10 h-10 object-contain" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">IMBA veterinaria</p>
            <p className="text-slate-400 text-xs">Sistema de Inventario</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === t.id ? "bg-sky-600 text-white shadow-lg shadow-sky-900/40" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
              {t.icon} {t.label}
              {t.id === "dashboard" && stats?.productos_stock_bajo > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{stats.productos_stock_bajo}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-6 py-5 border-t border-white/10">
          <p className="text-xs text-slate-500">MVP v1.0 · FastAPI + Supabase</p>
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo-imba.png" alt="Logo Veterinaria" className="w-8 h-8 object-contain" />
          <span className="font-bold text-slate-800 text-sm">IMBA veterinaria</span>
        </div>
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${tab === t.id ? "bg-sky-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
              {t.id === "dashboard" ? "Stats" : t.id === "productos" ? "Inventario" : "Historial"}
            </button>
          ))}
        </div>
      </header>

      <main className="lg:pl-64 min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {tab === "dashboard" && "Dashboard"}
                {tab === "productos" && "Inventario"}
                {tab === "historial" && "Historial de Movimientos"}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {tab === "dashboard" && "Resumen general del inventario"}
                {tab === "productos" && "Gestión de productos y stock"}
                {tab === "historial" && "Registro de entradas y salidas"}
              </p>
            </div>
            <button onClick={fetchAll} className="hidden sm:inline-flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 border border-slate-200 hover:border-sky-300 px-4 py-2 rounded-xl transition bg-white">
              ↻ Actualizar
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Cargando datos…</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
              <button onClick={fetchAll} className="mt-4 text-sm text-red-500 underline">Reintentar</button>
            </div>
          ) : (
            <>
              {tab === "dashboard" && <DashboardTab stats={stats} productosBajos={productosBajos} />}
              {tab === "productos" && <ProductosTab productos={productos} onRefresh={fetchAll} />}
              {tab === "historial" && <HistorialTab movimientos={movimientos} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
