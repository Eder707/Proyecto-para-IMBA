from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from dotenv import load_dotenv
import httpx
import os

load_dotenv()

app = FastAPI(title="VetInventory API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://proyecto-para-imba.vercel.app",
        "https://proyecto-para-imba-jsbq7mbar-eder707s-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

def db_url(table: str) -> str:
    return f"{SUPABASE_URL}/rest/v1/{table}"

class ProductCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=150)
    descripcion: Optional[str] = None
    stock_actual: int = Field(..., ge=0)
    stock_minimo: int = Field(..., ge=0)
    precio: float = Field(..., gt=0)
    categoria: str = Field(..., min_length=1, max_length=80)
    activo: Optional[bool] = True

class ProductUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    stock_actual: Optional[int] = Field(None, ge=0)
    stock_minimo: Optional[int] = Field(None, ge=0)
    precio: Optional[float] = Field(None, gt=0)
    categoria: Optional[str] = None
    activo: Optional[bool] = None

class MovimientoCreate(BaseModel):
    producto_id: int
    tipo: str = Field(..., pattern="^(entrada|salida)$")
    cantidad: int = Field(..., gt=0)
    notas: Optional[str] = None

@app.get("/productos", tags=["Productos"])
async def listar_productos(stock_bajo: Optional[bool] = None):
    async with httpx.AsyncClient() as client:
        r = await client.get(db_url("productos"), headers=headers(), params={"order": "nombre.asc"})
        productos = r.json()
    if stock_bajo is True:
        productos = [p for p in productos if p["stock_actual"] < p["stock_minimo"]]
    return productos

@app.post("/productos", status_code=201, tags=["Productos"])
async def crear_producto(producto: ProductCreate):
    async with httpx.AsyncClient() as client:
        # 1. Verificar si el nombre ya existe (ignora mayúsculas/minúsculas)
        check_r = await client.get(
            db_url("productos"), 
            headers=headers(), 
            params={"nombre": f"ilike.{producto.nombre}"}
        )
        if check_r.json():
            raise HTTPException(status_code=400, detail=f"El producto '{producto.nombre}' ya existe.")

        # 2. Proceder a crear
        data = producto.model_dump()
        data["updated_at"] = datetime.utcnow().isoformat()
        r = await client.post(db_url("productos"), headers=headers(), json=data)
    
    if r.status_code not in (200, 201):
        raise HTTPException(status_code=400, detail="Error al guardar en la base de datos.")
    return r.json()[0]

@app.get("/productos/{producto_id}", tags=["Productos"])
async def obtener_producto(producto_id: int):
    async with httpx.AsyncClient() as client:
        r = await client.get(db_url("productos"), headers=headers(), params={"id": f"eq.{producto_id}"})
    data = r.json()
    if not data:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    return data[0]

@app.put("/productos/{producto_id}", tags=["Productos"])
async def actualizar_producto(producto_id: int, producto: ProductUpdate):
    data = {k: v for k, v in producto.model_dump().items() if v is not None}
    data["updated_at"] = datetime.utcnow().isoformat()
    async with httpx.AsyncClient() as client:
        r = await client.patch(db_url("productos"), headers=headers(), params={"id": f"eq.{producto_id}"}, json=data)
    if not r.json():
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    return r.json()[0]

@app.delete("/productos/{producto_id}", status_code=204, tags=["Productos"])
async def eliminar_producto(producto_id: int):
    async with httpx.AsyncClient() as client:
        await client.delete(db_url("productos"), headers=headers(), params={"id": f"eq.{producto_id}"})

@app.post("/movimientos", status_code=201, tags=["Movimientos"])
async def registrar_movimiento(mov: MovimientoCreate):
    async with httpx.AsyncClient() as client:
        r = await client.get(db_url("productos"), headers=headers(), params={"id": f"eq.{mov.producto_id}"})
        if not r.json():
            raise HTTPException(status_code=404, detail="Producto no encontrado.")
        producto = r.json()[0]
        nuevo_stock = producto["stock_actual"]
        if mov.tipo == "entrada":
            nuevo_stock += mov.cantidad
        else:
            if producto["stock_actual"] < mov.cantidad:
                raise HTTPException(status_code=400, detail=f"Stock insuficiente. Disponible: {producto['stock_actual']}")
            nuevo_stock -= mov.cantidad
        mov_r = await client.post(db_url("movimientos"), headers=headers(), json=mov.model_dump())
        await client.patch(db_url("productos"), headers=headers(), params={"id": f"eq.{mov.producto_id}"}, json={"stock_actual": nuevo_stock, "updated_at": datetime.utcnow().isoformat()})
    return {**mov_r.json()[0], "stock_nuevo": nuevo_stock}

@app.get("/movimientos", tags=["Movimientos"])
async def listar_movimientos(limit: int = 50):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                db_url("movimientos"), 
                headers={**headers(), "Prefer": ""}, 
                params={"select": "*,productos(nombre)", "order": "created_at.desc", "limit": limit}
            )
            
            # Si Supabase nos manda un error (ej. tabla bloqueada), lo cachamos aquí
            if r.status_code != 200:
                raise HTTPException(status_code=r.status_code, detail="Error al consultar Supabase")

            data = r.json()
            movimientos = []
            
            # Verificamos que data sea una lista antes de iterar
            if isinstance(data, list):
                for m in data:
                    # Extraemos el nombre con cuidado por si viene vacío
                    prod_info = m.pop("productos", None) or {}
                    m["producto_nombre"] = prod_info.get("nombre", "—")
                    # Quitamos espacios en blanco al final por si acaso
                    if isinstance(m["producto_nombre"], str):
                        m["producto_nombre"] = m["producto_nombre"].strip()
                    movimientos.append(m)
            
            return movimientos

    except Exception as e:
        print(f"🔥 ERROR EN MOVIMIENTOS: {str(e)}") # Esto lo verás en los logs de Render
        raise HTTPException(status_code=500, detail="Error interno al procesar movimientos")


@app.get("/dashboard", tags=["Dashboard"])
async def dashboard():
    async with httpx.AsyncClient() as client:
        r = await client.get(db_url("productos"), headers=headers())
    productos = r.json()
    
    # Filtramos para que el dashboard solo cuente los productos activos
    productos_activos = [p for p in productos if p.get("activo") is not False]
    
    total = len(productos_activos)
    bajo_stock = sum(1 for p in productos_activos if p["stock_actual"] < p["stock_minimo"])
    valor_total = sum(p["stock_actual"] * p["precio"] for p in productos_activos)
    categorias = len({p["categoria"] for p in productos_activos})
    
    return {"total_productos": total, "productos_stock_bajo": bajo_stock, "valor_total_inventario": round(valor_total, 2), "categorias": categorias}



@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}



