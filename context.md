**v1.1 · Mayo 2025**

## 1. Arquitectura y Entorno

| Componente | Tecnología / Decisión |
| :--- | :--- |
| **Gestión de monorepo** | Turborepo |
| **Frontend** | React + Vite |
| **Backend** | NestJS (API RESTful) |
| **Base de datos** | PostgreSQL — alojada en Render, administrada con pgAdmin |
| **ORM** | Sin ORM — consultas SQL directas (por definir driver: `pg` / `postgres.js`) |
| **Autenticación** | JWT con tabla `SESION_JWT` para invalidación manual |
| **Seguridad de acceso** | Pendiente de definición (restricción de red / IP) |
| **Dominio / CDN** | Sin dominio propio por el momento — Cloudflare descartado |

---

## 2. Estructura de Carpetas (Monorepo)

### `packages/shared/`
- `dtos/`: Data Transfer Objects y validaciones (Zod / Class-validator).
- `types/`: Interfaces TypeScript compartidas (`IUser`, `IProduct`, etc.).

### `apps/frontend/src/` (React + Vite)
- `assets/`: Imágenes y estáticos.
- `components/`: UI reutilizable (`Button`, `Modal`, `ProductCard`).
- `context/`: Estado global (`AuthContext`, `CartContext`).
- `hooks/`: Custom hooks (`useAuth`, etc.).
- `layouts/`: Estructuras de página (`AdminLayout`).
- `routes/`: Configuración de rutas.
- `services/`: Peticiones a la API (Axios / Fetch).
- `styles/`: Hojas de estilo globales.
- `views/`: Páginas completas (`Dashboard`, `POS`, `Inventario`).

### `apps/backend/src/` (NestJS)
- `common/decorators/`: Decoradores personalizados (`@Roles`).
- `common/filters/`: Manejo global de excepciones.
- `common/guards/`: Guardias de seguridad (`JwtAuthGuard`).
- `config/`: Variables de entorno y configuración de BD.
- `modules/auth/`: Login y emisión de JWT.
- `modules/inventory/`: Productos, Stock, Alertas.
- `modules/sales/`: Ventas y Ofertas (POS).
- `modules/users/`: CRUD de Usuarios y Roles.
- `modules/transfers/`: Traslados entre Sucursales.
- `modules/reports/`: Generación de reportes.
- `app.module.ts`: Módulo raíz.
- `main.ts`: Punto de entrada.

---

## 3. Módulos y Entidades Principales

### A. Usuarios y Seguridad (RBAC)
| Rol | Alcance | Permisos clave |
| :--- | :--- | :--- |
| **Propietario** | Global (todas las sucursales) | Acceso total, reportes globales, gestión de usuarios |
| **Encargado** | Sucursal asignada | Autorizar traslados, gestionar stock e inventario de su sucursal |
| **Empleado** | Sucursal asignada | Registrar ventas, consultar stock |

- Contraseñas cifradas con `bcrypt` (factor >= 10).
- Sesiones JWT registradas en BD — permite invalidación manual.

### B. Gestión Multi-Sucursal
- El catálogo de **Productos** es centralizado (código, nombre, categoría, precio de referencia).
- El **Stock** se gestiona de forma independiente por sucursal (tabla `STOCK_SUCURSAL`).
- Los usuarios Encargado y Empleado están vinculados a una única sucursal.

### C. Inventario y Abastecimiento
#### Entradas de Inventario
Registro del incremento de stock clasificado por tipo:
- `compra_proveedor`: Mercancía recibida de un proveedor externo.
- `traslado`: Stock recibido desde otra sucursal (automático al completar traslado).
- `ajuste`: Corrección manual de inventario.
- `devolucion`: Mercancía devuelta al stock.
- ⚠️ *No existe módulo de Proveedores.* Solo se registra el movimiento sin vincular entidad externa.

#### Traslados entre Sucursales
1. **Solicitud**: Encargado/Propietario crea solicitud (origen, destino, items).
2. **Autorización**: Encargado/Propietario de origen autoriza o rechaza.
3. **Ejecución**: Al autorizar, se descuenta en origen y se genera `ENTRADA_INVENTARIO` en destino.
4. ⚠️ El campo `id_traslado` en `ENTRADA_INVENTARIO` garantiza trazabilidad.

#### Alertas de Stock
- Disparo cuando `cantidad_actual < stock_minimo` o en sobreabastecimiento.
- La alerta guarda `cantidad_al_momento` y `umbral_referencia` para contexto histórico.

### D. Ventas y Promociones (POS)
- **VENTA**: Registro de total, método de pago, usuario y sucursal.
- **DETALLE_VENTA**: Producto, cantidad, `precio_unitario` (cobrado) y `precio_original` (referencia).
- **OFERTA**: Descuentos globales o por sucursal, con vigencia. Registro de `id_oferta` en el detalle si aplica.

### E. Reportes y Analítica
| Tipo de Reporte | Descripción | Formato |
| :--- | :--- | :--- |
| `ventas_diarias` | Resumen del día por sucursal | PDF / CSV |
| `ventas_semanales` | Consolidado semanal | PDF / CSV |
| `ventas_mensuales` | Consolidado mensual | PDF / CSV |
| `ranking_productos` | Productos más vendidos (cantidad/ingresos) | PDF / CSV |
| `comparativa_sucursales` | Rendimiento comparativo | PDF / CSV |

- ⚠️ La tabla `REPORTE` guarda solo metadatos; los datos se calculan en tiempo real.

---

## 4. Reglas de Negocio Clave

| # | Regla | Implementación |
| :--- | :--- | :--- |
| 1 | **Independencia de Precios** | `DETALLE_VENTA` guarda precio cobrado y original. Cambios futuros al precio base no afectan histórico. |
| 2 | **Trazabilidad de Ofertas** | Si hay promoción activa, se vincula el `id_oferta` en `DETALLE_VENTA`. |
| 3 | **Auditoría de Movimientos** | Todo movimiento (venta, entrada, traslado) tiene `id_usuario` e `id_sucursal`. |
| 4 | **Traslado controlado** | Solo descuenta stock y genera entrada cuando el estado cambia a 'autorizado'. |
| 5 | **Sin módulo de Proveedores** | Las compras se registran como entradas de tipo `compra_proveedor` sin entidad proveedor. |
| 6 | **Contexto de alertas** | Se guarda el valor del umbral al momento de la alerta para evitar inconsistencias por cambios posteriores. |

---

## 5. Decisiones Pendientes

| Tema | Estado | Impacto |
| :--- | :--- | :--- |
| **Driver de PostgreSQL** | Por definir | Afecta la capa de acceso a datos en NestJS sin ORM. |
| **Seguridad de acceso (IP)** | Por definir | Restricción del sistema a red local del establecimiento. |
| **Estrategia de migración** | Por definir | Gestión de cambios al schema (scripts manuales vs herramientas). |