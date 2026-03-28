-- ============================================================
--  VetInventory — Schema para Supabase (PostgreSQL)
--  Ejecuta este script en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- ──────────────────────────────────────────────
--  TABLA: productos
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.productos (
    id            BIGSERIAL PRIMARY KEY,
    nombre        VARCHAR(150)   NOT NULL,
    descripcion   TEXT,
    stock_actual  INTEGER        NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo  INTEGER        NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    precio        NUMERIC(10, 2) NOT NULL CHECK (precio > 0),
    categoria     VARCHAR(80)    NOT NULL,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas por categoría
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos(categoria);

-- Índice para detectar stock bajo rápidamente
CREATE INDEX IF NOT EXISTS idx_productos_stock
    ON public.productos(stock_actual, stock_minimo);

COMMENT ON TABLE  public.productos            IS 'Inventario principal de productos veterinarios';
COMMENT ON COLUMN public.productos.stock_actual IS 'Unidades actuales en bodega';
COMMENT ON COLUMN public.productos.stock_minimo IS 'Umbral mínimo — por debajo se considera "Stock Bajo"';

-- ──────────────────────────────────────────────
--  TABLA: movimientos  (entradas / salidas)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.movimientos (
    id           BIGSERIAL PRIMARY KEY,
    producto_id  BIGINT         NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    tipo         VARCHAR(10)    NOT NULL CHECK (tipo IN ('entrada', 'salida')),
    cantidad     INTEGER        NOT NULL CHECK (cantidad > 0),
    notas        TEXT,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movimientos_producto  ON public.movimientos(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha     ON public.movimientos(created_at DESC);

COMMENT ON TABLE  public.movimientos        IS 'Historial de entradas y salidas de inventario';
COMMENT ON COLUMN public.movimientos.tipo   IS '"entrada" aumenta stock; "salida" lo reduce';

-- ──────────────────────────────────────────────
--  FUNCIÓN: actualiza updated_at automáticamente
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_productos_updated_at
    BEFORE UPDATE ON public.productos
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ──────────────────────────────────────────────
--  ROW LEVEL SECURITY (RLS)
--  Ajusta las políticas según tu flujo de autenticación
-- ──────────────────────────────────────────────
ALTER TABLE public.productos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;

-- Política permisiva para el anon key (MVP — restringe en producción)
CREATE POLICY "allow_all_productos"   ON public.productos   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_movimientos" ON public.movimientos FOR ALL USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
--  VISTA: stock_bajo  (útil para el dashboard)
-- ──────────────────────────────────────────────
CREATE OR REPLACE VIEW public.stock_bajo AS
SELECT
    id,
    nombre,
    categoria,
    stock_actual,
    stock_minimo,
    (stock_minimo - stock_actual) AS unidades_faltantes,
    precio
FROM public.productos
WHERE stock_actual < stock_minimo
ORDER BY unidades_faltantes DESC;

-- ──────────────────────────────────────────────
--  DATOS DE PRUEBA
-- ──────────────────────────────────────────────
INSERT INTO public.productos (nombre, descripcion, stock_actual, stock_minimo, precio, categoria) VALUES
('Amoxicilina 500mg',       'Antibiótico de amplio espectro',          45,  20, 125.00, 'Medicamentos'),
('Vacuna Antirrábica',       'Vacuna anual obligatoria caninos/felinos',  8,  15, 280.00, 'Vacunas'),
('Frontline Plus Perros',    'Antipulgas y garrapatas — 3 pipetas',     30,  10, 350.00, 'Antiparasitarios'),
('Jeringas 5ml c/100',       'Jeringas desechables estériles',           5,  10,  89.00, 'Insumos'),
('Royal Canin Renal 2kg',    'Dieta terapéutica renal felino',          12,   5, 420.00, 'Alimentos'),
('Guantes Látex c/100',      'Guantes de exploración talla M',           3,  10,  95.00, 'Insumos'),
('Dexametasona 4mg/ml',      'Corticoesteroide antiinflamatorio',       20,  10, 175.00, 'Medicamentos'),
('Ivermectina 1%',           'Antiparasitario inyectable',              15,   8, 140.00, 'Antiparasitarios');

INSERT INTO public.movimientos (producto_id, tipo, cantidad, notas) VALUES
(1, 'entrada', 50, 'Compra a proveedor Farvet'),
(1, 'salida',   5, 'Venta mostrador'),
(2, 'salida',   7, 'Campaña de vacunación marzo'),
(3, 'entrada', 30, 'Reabastecimiento mensual'),
(4, 'salida',   5, 'Uso clínica interna'),
(5, 'entrada', 12, 'Pedido especial nutrición'),
(6, 'salida',   7, 'Consumo quirófano'),
(7, 'entrada', 20, 'Compra directa laboratorio');
