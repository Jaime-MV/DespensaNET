-- =============================================================
--  DespensaNET — Schema PostgreSQL
--  Versión: 1.1
--  Descripción: Script completo de creación de base de datos.
--               Sin ORM. Ejecutar en pgAdmin o psql sobre la
--               instancia de Render.
-- =============================================================

-- -------------------------------------------------------------
-- EXTENSIONES
-- -------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- para gen_random_uuid() si se necesita en el futuro

-- =============================================================
-- 1. ROL
-- =============================================================
CREATE TABLE rol (
    id_rol      SERIAL          PRIMARY KEY,
    nombre      VARCHAR(50)     NOT NULL UNIQUE
                                CHECK (nombre IN ('propietario', 'encargado', 'empleado')),
    descripcion VARCHAR(255)
);

INSERT INTO rol (nombre, descripcion) VALUES
    ('propietario', 'Acceso global a todas las sucursales y configuración del sistema'),
    ('encargado',   'Gestión de inventario, stock y autorización de traslados en su sucursal'),
    ('empleado',    'Registro de ventas y consulta de stock en su sucursal');

-- =============================================================
-- 2. SUCURSAL
-- =============================================================
CREATE TABLE sucursal (
    id_sucursal     SERIAL          PRIMARY KEY,
    nombre          VARCHAR(100)    NOT NULL,
    direccion       VARCHAR(255)    NOT NULL,
    activa          BOOLEAN         NOT NULL DEFAULT TRUE,
    fecha_registro  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 3. USUARIO
-- =============================================================
CREATE TABLE usuario (
    id_usuario      SERIAL          PRIMARY KEY,
    id_rol          INT             NOT NULL REFERENCES rol(id_rol),
    id_sucursal     INT             REFERENCES sucursal(id_sucursal),
                                    -- NULL solo cuando el rol es 'propietario'
    nombre          VARCHAR(100)    NOT NULL,
    correo          VARCHAR(150)    NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255)    NOT NULL,   -- bcrypt factor >= 10
    activo          BOOLEAN         NOT NULL DEFAULT TRUE,
    fecha_creacion  TIMESTAMPTZ     NOT NULL DEFAULT NOW()

    -- Nota: la validación de sucursal obligatoria según rol se aplica
    -- mediante el trigger trg_usuario_sucursal_por_rol (definido más abajo)
);


-- Trigger: encargado y empleado deben tener id_sucursal; propietario no.
CREATE OR REPLACE FUNCTION fn_validar_sucursal_por_rol()
RETURNS TRIGGER AS $$
DECLARE
    v_rol VARCHAR(50);
BEGIN
    SELECT nombre INTO v_rol FROM rol WHERE id_rol = NEW.id_rol;

    IF v_rol <> 'propietario' AND NEW.id_sucursal IS NULL THEN
        RAISE EXCEPTION 'El rol "%" requiere una sucursal asignada.', v_rol;
    END IF;

    IF v_rol = 'propietario' AND NEW.id_sucursal IS NOT NULL THEN
        RAISE EXCEPTION 'El rol "propietario" no debe tener sucursal asignada.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuario_sucursal_por_rol
    BEFORE INSERT OR UPDATE ON usuario
    FOR EACH ROW EXECUTE FUNCTION fn_validar_sucursal_por_rol();

-- =============================================================
-- 4. SESION_JWT
-- =============================================================
CREATE TABLE sesion_jwt (
    id_sesion           SERIAL          PRIMARY KEY,
    id_usuario          INT             NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    token               TEXT            NOT NULL UNIQUE,
    fecha_emision       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    fecha_expiracion    TIMESTAMPTZ     NOT NULL,
    invalidado          BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sesion_usuario ON sesion_jwt(id_usuario);
CREATE INDEX idx_sesion_token   ON sesion_jwt(token);

-- =============================================================
-- 5. PRODUCTO
-- =============================================================
CREATE TABLE producto (
    id_producto         SERIAL          PRIMARY KEY,
    codigo              VARCHAR(50)     NOT NULL UNIQUE,
    nombre              VARCHAR(150)    NOT NULL,
    categoria           VARCHAR(100),
    unidad_medida       VARCHAR(30),    -- ej: 'unidad', 'kg', 'litro'
    precio_referencia   NUMERIC(10,2)   CHECK (precio_referencia >= 0),
    activo              BOOLEAN         NOT NULL DEFAULT TRUE
);

-- =============================================================
-- 6. OFERTA
-- =============================================================
CREATE TABLE oferta (
    id_oferta           SERIAL          PRIMARY KEY,
    id_producto         INT             NOT NULL REFERENCES producto(id_producto),
    id_sucursal         INT             REFERENCES sucursal(id_sucursal),
                                        -- NULL = aplica a todas las sucursales
    precio_oferta       NUMERIC(10,2)   NOT NULL CHECK (precio_oferta >= 0),
    porcentaje_desc     NUMERIC(5,2)    CHECK (porcentaje_desc >= 0 AND porcentaje_desc <= 100),
    fecha_inicio        TIMESTAMPTZ     NOT NULL,
    fecha_fin           TIMESTAMPTZ     NOT NULL,
    activa              BOOLEAN         NOT NULL DEFAULT TRUE,
    descripcion         VARCHAR(255),
    id_usuario_crea     INT             NOT NULL REFERENCES usuario(id_usuario),
    fecha_creacion      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_fechas_oferta CHECK (fecha_fin > fecha_inicio)
);

CREATE INDEX idx_oferta_producto  ON oferta(id_producto);
CREATE INDEX idx_oferta_sucursal  ON oferta(id_sucursal);
CREATE INDEX idx_oferta_vigencia  ON oferta(fecha_inicio, fecha_fin);

-- =============================================================
-- 7. STOCK_SUCURSAL
-- =============================================================
CREATE TABLE stock_sucursal (
    id_stock                SERIAL          PRIMARY KEY,
    id_sucursal             INT             NOT NULL REFERENCES sucursal(id_sucursal),
    id_producto             INT             NOT NULL REFERENCES producto(id_producto),
    cantidad_actual         INT             NOT NULL DEFAULT 0 CHECK (cantidad_actual >= 0),
    stock_minimo            INT             NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    ultima_actualizacion    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_stock_sucursal_producto UNIQUE (id_sucursal, id_producto)
);

CREATE INDEX idx_stock_sucursal ON stock_sucursal(id_sucursal);
CREATE INDEX idx_stock_producto ON stock_sucursal(id_producto);

-- =============================================================
-- 8. ALERTA_STOCK
-- =============================================================
CREATE TABLE alerta_stock (
    id_alerta           SERIAL          PRIMARY KEY,
    id_stock            INT             NOT NULL REFERENCES stock_sucursal(id_stock),
    tipo                VARCHAR(30)     NOT NULL
                                        CHECK (tipo IN ('stock_minimo', 'sobreabastecimiento')),
    -- Contexto histórico para auditoría (los umbrales pueden cambiar)
    cantidad_al_momento INT             NOT NULL,
    umbral_referencia   INT             NOT NULL,
    fecha_generada      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    resuelta            BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_alerta_stock    ON alerta_stock(id_stock);
CREATE INDEX idx_alerta_resuelta ON alerta_stock(resuelta);

-- =============================================================
-- 9. VENTA
-- =============================================================
CREATE TABLE venta (
    id_venta    SERIAL          PRIMARY KEY,
    id_sucursal INT             NOT NULL REFERENCES sucursal(id_sucursal),
    id_usuario  INT             NOT NULL REFERENCES usuario(id_usuario),
    fecha_hora  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    total       NUMERIC(12,2)   NOT NULL CHECK (total >= 0),
    metodo_pago VARCHAR(20)     NOT NULL
                                CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'otro'))
);

CREATE INDEX idx_venta_sucursal   ON venta(id_sucursal);
CREATE INDEX idx_venta_fecha_hora ON venta(fecha_hora);
CREATE INDEX idx_venta_usuario    ON venta(id_usuario);

-- =============================================================
-- 10. DETALLE_VENTA
-- =============================================================
CREATE TABLE detalle_venta (
    id_detalle          SERIAL          PRIMARY KEY,
    id_venta            INT             NOT NULL REFERENCES venta(id_venta) ON DELETE CASCADE,
    id_producto         INT             NOT NULL REFERENCES producto(id_producto),
    id_oferta           INT             REFERENCES oferta(id_oferta),
                                        -- NULL si no hubo oferta aplicada
    cantidad            INT             NOT NULL CHECK (cantidad > 0),
    precio_unitario     NUMERIC(10,2)   NOT NULL CHECK (precio_unitario >= 0),
                                        -- Precio real cobrado (ya con descuento si aplica)
    precio_original     NUMERIC(10,2)   NOT NULL CHECK (precio_original >= 0),
                                        -- precio_referencia del producto al momento de la venta
    subtotal            NUMERIC(12,2)   NOT NULL CHECK (subtotal >= 0)
                                        -- precio_unitario * cantidad
);

CREATE INDEX idx_detalle_venta_venta    ON detalle_venta(id_venta);
CREATE INDEX idx_detalle_venta_producto ON detalle_venta(id_producto);

-- =============================================================
-- 11. TRASLADO
-- =============================================================
CREATE TABLE traslado (
    id_traslado                 SERIAL          PRIMARY KEY,
    id_sucursal_origen          INT             NOT NULL REFERENCES sucursal(id_sucursal),
    id_sucursal_destino         INT             NOT NULL REFERENCES sucursal(id_sucursal),
    id_usuario_solicitante      INT             NOT NULL REFERENCES usuario(id_usuario),
    id_usuario_autorizador      INT             REFERENCES usuario(id_usuario),
                                                -- NULL hasta ser autorizado o rechazado
    estado                      VARCHAR(20)     NOT NULL DEFAULT 'pendiente'
                                                CHECK (estado IN ('pendiente','autorizado','rechazado','completado')),
    fecha_solicitud             TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    fecha_autorizacion          TIMESTAMPTZ,    -- NULL hasta decisión
    observaciones               TEXT,

    CONSTRAINT chk_sucursales_distintas CHECK (id_sucursal_origen <> id_sucursal_destino)
);

CREATE INDEX idx_traslado_origen  ON traslado(id_sucursal_origen);
CREATE INDEX idx_traslado_destino ON traslado(id_sucursal_destino);
CREATE INDEX idx_traslado_estado  ON traslado(estado);

-- =============================================================
-- 12. DETALLE_TRASLADO
-- =============================================================
CREATE TABLE detalle_traslado (
    id_detalle_traslado SERIAL  PRIMARY KEY,
    id_traslado         INT     NOT NULL REFERENCES traslado(id_traslado) ON DELETE CASCADE,
    id_producto         INT     NOT NULL REFERENCES producto(id_producto),
    cantidad            INT     NOT NULL CHECK (cantidad > 0),

    CONSTRAINT uq_traslado_producto UNIQUE (id_traslado, id_producto)
);

CREATE INDEX idx_detalle_traslado_traslado ON detalle_traslado(id_traslado);

-- =============================================================
-- 13. ENTRADA_INVENTARIO
-- =============================================================
CREATE TABLE entrada_inventario (
    id_entrada      SERIAL          PRIMARY KEY,
    id_sucursal     INT             NOT NULL REFERENCES sucursal(id_sucursal),
    id_usuario      INT             NOT NULL REFERENCES usuario(id_usuario),
    tipo            VARCHAR(30)     NOT NULL
                                    CHECK (tipo IN ('compra_proveedor','traslado','ajuste','devolucion')),
    id_traslado     INT             REFERENCES traslado(id_traslado),
                                    -- Solo se popula cuando tipo = 'traslado'
    fecha_hora      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    observaciones   TEXT,

    -- Si el tipo es 'traslado', debe referenciar un traslado existente
    CONSTRAINT chk_traslado_ref CHECK (
        (tipo = 'traslado' AND id_traslado IS NOT NULL)
        OR (tipo <> 'traslado' AND id_traslado IS NULL)
    )
);

CREATE INDEX idx_entrada_sucursal  ON entrada_inventario(id_sucursal);
CREATE INDEX idx_entrada_fecha     ON entrada_inventario(fecha_hora);
CREATE INDEX idx_entrada_traslado  ON entrada_inventario(id_traslado);

-- =============================================================
-- 14. DETALLE_ENTRADA
-- =============================================================
CREATE TABLE detalle_entrada (
    id_detalle_entrada  SERIAL          PRIMARY KEY,
    id_entrada          INT             NOT NULL REFERENCES entrada_inventario(id_entrada) ON DELETE CASCADE,
    id_producto         INT             NOT NULL REFERENCES producto(id_producto),
    cantidad            INT             NOT NULL CHECK (cantidad > 0),
    costo_unitario      NUMERIC(10,2)   CHECK (costo_unitario >= 0)
                                        -- Opcional: para compras con precio conocido
);

CREATE INDEX idx_detalle_entrada_entrada  ON detalle_entrada(id_entrada);
CREATE INDEX idx_detalle_entrada_producto ON detalle_entrada(id_producto);

-- =============================================================
-- 15. REPORTE
--     Guarda metadatos de reportes generados (datos calculados
--     en tiempo real desde las tablas transaccionales).
-- =============================================================
CREATE TABLE reporte (
    id_reporte          SERIAL          PRIMARY KEY,
    id_usuario          INT             NOT NULL REFERENCES usuario(id_usuario),
    tipo                VARCHAR(50)     NOT NULL
                                        CHECK (tipo IN (
                                            'ventas_diarias',
                                            'ventas_semanales',
                                            'ventas_mensuales',
                                            'ranking_productos',
                                            'comparativa_sucursales'
                                        )),
    periodo             VARCHAR(50),    -- ej: '2025-05', '2025-W20', '2025-05-12'
    fecha_generacion    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    formato             VARCHAR(10)     NOT NULL CHECK (formato IN ('PDF', 'CSV'))
);

CREATE INDEX idx_reporte_usuario ON reporte(id_usuario);
CREATE INDEX idx_reporte_tipo    ON reporte(tipo);

-- =============================================================
-- COMENTARIOS EN COLUMNAS CLAVE (documentación inline)
-- =============================================================
COMMENT ON COLUMN usuario.id_sucursal           IS 'NULL únicamente para rol propietario';
COMMENT ON COLUMN oferta.id_sucursal            IS 'NULL = oferta aplica a todas las sucursales';
COMMENT ON COLUMN oferta.porcentaje_desc        IS 'Calculado o manual. Ej: 15.00 = 15%';
COMMENT ON COLUMN detalle_venta.precio_unitario IS 'Precio real cobrado, ya con descuento si aplica';
COMMENT ON COLUMN detalle_venta.precio_original IS 'precio_referencia del producto al momento de la venta';
COMMENT ON COLUMN traslado.id_usuario_autorizador IS 'NULL hasta que se tome una decisión';
COMMENT ON COLUMN entrada_inventario.id_traslado  IS 'Vincula la entrada al traslado que la originó (solo tipo traslado)';
COMMENT ON COLUMN alerta_stock.cantidad_al_momento IS 'Stock real cuando se generó la alerta, para auditoría histórica';
COMMENT ON COLUMN alerta_stock.umbral_referencia   IS 'stock_minimo vigente cuando se generó la alerta';
COMMENT ON COLUMN reporte.periodo               IS 'Formato libre según tipo: YYYY-MM, YYYY-Www, YYYY-MM-DD';