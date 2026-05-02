# Contexto del Proyecto: DespensaNET

## 1. Arquitectura y Entorno
*   **Estructura del Repositorio:** Monorepo gestionado con Turborepo (Frontend, Backend y Paquetes compartidos).
*   **Frontend:** React (Vite). Interfaz de usuario interactiva y panel de administración.
*   **Backend:** NestJS. API RESTful estructurada.
*   **Base de datos:** PostgreSQL alojada en Render o Supabase (Por definir).
*   **Seguridad de Acceso:** *(Característica aún en planteamiento)* Sistema alojado en la nube con validación de IP (o Cloudflare Zero Trust) para restringir el acceso operativo exclusivamente a la red local del establecimiento, permitiendo acceso remoto seguro únicamente al propietario/administrador.
*   **Autenticación:** Basada en tokens JWT (JSON Web Tokens), con un registro de sesiones en base de datos para permitir la invalidación manual o expiración segura.

---

## 2. Estructura de Carpetas Actual (Monorepo)

### `packages/shared/` (Código compartido)
├── dtos/            # Data Transfer Objects y validaciones (Zod/Class-validator) compartidos.
└── types/           # Interfaces TypeScript (ej. IUser, IProduct) usadas por Frontend y Backend.

### `Apps/frontend/src/` (React + Vite)
├── assets/          # Archivos estáticos como imágenes, logos de la empresa.
├── components/      # UI reutilizable. Ej: `Button`, `Modal`, `ProductCard`.
├── context/         # (o 'store') Estado global. Ej: `AuthContext`, `CartContext` (Para el POS).
├── hooks/           # Custom hooks. Ej: `useAuth`.
├── layouts/         # Estructuras de página. Ej: `AdminLayout`.
├── routes/          # Configuración de rutas.
├── services/        # Peticiones a la API (Axios/Fetch).
├── styles/          # Hojas de estilo globales.
├── views/           # Páginas completas (Dashboard, POS, Inventario).
├── App.css          # Estilos del componente principal.
├── App.jsx          # Componente principal.
├── index.css        # Estilos globales base.
└── main.jsx         # Punto de entrada de la aplicación de React.

### `Apps/backend/src/` (NestJS API)
├── common/          # Recursos globales compartidos.
│   ├── decorators/  # Decoradores personalizados (Ej: @Roles).
│   ├── filters/     # Manejo global de excepciones.
│   └── guards/      # Verificaciones de seguridad (Ej: JwtAuthGuard).
├── config/          # Variables de entorno y configuración de BD.
├── modules/         # Módulos de la aplicación (Arquitectura NestJS).
│   ├── auth/        # Lógica de Login y emisión de JWT.
│   ├── inventory/   # Productos, Stock, Alertas (Controlador, Servicio, Entidad).
│   ├── sales/       # Módulo de Ventas y Ofertas.
│   └── users/       # CRUD de Usuarios y Roles.
├── app.module.ts    # Módulo raíz que importa dependencias (modules).
└── main.ts          # Punto de entrada de la aplicación.

---

## 3. Módulos y Entidades Principales

### A. Usuarios y Seguridad (RBAC)
*   **Roles:** Propietario (Admin global), Encargado, Empleado.
*   **Usuarios:** Vinculados a un rol específico y a una sucursal (excepto los propietarios/admins que tienen alcance global). Contraseñas cifradas mediante `bcrypt` (factor >= 10).

### B. Gestión Multi-Sucursal
*   El sistema está diseñado para operar con múltiples **Sucursales**.
*   El catálogo de **Productos** es centralizado (código, nombre, categoría, unidad de medida, precio de referencia).
*   El **Stock** se maneja de forma independiente por sucursal (`STOCK_SUCURSAL`).

### C. Inventario y Abastecimiento
*   **Entradas de Inventario:** Registro de incremento de stock clasificado por tipo (compras a proveedores, traslados, ajustes, devoluciones).
*   **Traslados entre Sucursales:** Flujo de trabajo controlado. Un usuario solicita enviar inventario de la Sucursal A a la Sucursal B, y debe ser autorizado por otro usuario antes de completarse.
*   **Alertas de Stock:** Generación automática de alertas cuando el stock actual de un producto en una sucursal cae por debajo de su `stock_minimo`, o en casos de sobreabastecimiento.

### D. Ventas y Promociones (POS)
*   **Ventas:** Registro transaccional del total, método de pago, usuario que procesa la venta y sucursal.
*   **Detalle de Ventas:** Registro exacto de qué productos se vendieron, congelando el precio cobrado y el precio original para auditoría.
*   **Ofertas:** Descuentos aplicables a productos (por porcentaje o precio fijo). Pueden ser globales o específicas de una sucursal, con fecha de inicio y fin.

### E. Reportes y Analítica
*   Módulo de generación de informes para la toma de decisiones.
*   **Tipos de Reportes:** Ventas diarias/semanales/mensuales, ranking de productos más vendidos, y comparativa de rendimiento entre sucursales.
*   **Formatos de salida:** Exportación de datos en PDF o CSV.

---

## 4. Reglas de Negocio Clave
1.  **Independencia de Precios:** El precio de referencia de un producto es una base, pero las ventas registran el precio final cobrado (`precio_unitario`) junto con el precio de referencia histórico (`precio_original`) para evitar inconsistencias si el precio base cambia en el futuro.
2.  **Trazabilidad de Ofertas:** Si un producto se vende bajo una promoción, el detalle de la venta debe registrar el `id_oferta` para medir el éxito de las campañas.
3.  **Auditoría de Movimientos:** Todo aumento o disminución de inventario (ventas, entradas, traslados) está vinculado obligatoriamente al usuario que ejecutó la acción y a la sucursal donde ocurrió.
