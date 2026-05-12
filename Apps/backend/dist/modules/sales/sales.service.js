"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("../../config/database");
let SalesService = class SalesService {
    async searchProductByCode(code, idSucursal) {
        const query = `
      SELECT
        p.id_producto,
        p.codigo,
        p.nombre,
        p.categoria,
        p.unidad_medida,
        p.precio_referencia,
        COALESCE(ss.cantidad_actual, 0) AS stock,
        o.id_oferta,
        o.precio_oferta,
        o.porcentaje_desc
      FROM producto p
      LEFT JOIN stock_sucursal ss
        ON ss.id_producto = p.id_producto AND ss.id_sucursal = $2
      LEFT JOIN oferta o
        ON o.id_producto = p.id_producto
        AND o.activa = TRUE
        AND NOW() BETWEEN o.fecha_inicio AND o.fecha_fin
        AND (o.id_sucursal IS NULL OR o.id_sucursal = $2)
      WHERE p.codigo = $1 AND p.activo = TRUE
      LIMIT 1
    `;
        const result = await database_1.pool.query(query, [code, idSucursal]);
        return result.rows[0] ?? null;
    }
    async createSale(data) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            const ventaResult = await client.query(`INSERT INTO venta (id_sucursal, id_usuario, total, metodo_pago)
         VALUES ($1, $2, $3, $4) RETURNING id_venta, fecha_hora`, [data.idSucursal, data.idUsuario, data.total, data.metodoPago]);
            const idVenta = ventaResult.rows[0].id_venta;
            const fechaHora = ventaResult.rows[0].fecha_hora;
            for (const item of data.items) {
                await client.query(`INSERT INTO detalle_venta
            (id_venta, id_producto, id_oferta, cantidad, precio_unitario, precio_original, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                    idVenta,
                    item.idProducto,
                    item.idOferta ?? null,
                    item.cantidad,
                    item.precioUnitario,
                    item.precioOriginal,
                    item.subtotal,
                ]);
                await client.query(`UPDATE stock_sucursal
           SET cantidad_actual = cantidad_actual - $1,
               ultima_actualizacion = NOW()
           WHERE id_sucursal = $2 AND id_producto = $3`, [item.cantidad, data.idSucursal, item.idProducto]);
            }
            await client.query('COMMIT');
            return { idVenta, fechaHora, total: data.total };
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw new common_1.BadRequestException(`Error al procesar la venta: ${err.message}`);
        }
        finally {
            client.release();
        }
    }
    async getTodaySales(idSucursal) {
        const query = `
      SELECT
        v.id_venta,
        v.fecha_hora,
        v.total,
        v.metodo_pago,
        u.nombre AS usuario,
        (SELECT COUNT(*) FROM detalle_venta dv WHERE dv.id_venta = v.id_venta) AS items
      FROM venta v
      JOIN usuario u ON u.id_usuario = v.id_usuario
      WHERE v.id_sucursal = $1
        AND v.fecha_hora::date = CURRENT_DATE
      ORDER BY v.fecha_hora DESC
    `;
        const result = await database_1.pool.query(query, [idSucursal]);
        return result.rows;
    }
    async getActiveOffers(idSucursal) {
        const query = `
      SELECT
        o.id_oferta AS id,
        p.nombre,
        CASE
          WHEN o.porcentaje_desc IS NOT NULL AND o.porcentaje_desc > 0 THEN 'Porcentaje'
          ELSE 'Precio fijo'
        END AS tipo,
        COALESCE(o.porcentaje_desc || '%', 'Q ' || o.precio_oferta::TEXT) AS descuento,
        TO_CHAR(o.fecha_inicio, 'DD/MM/YYYY') || ' - ' || TO_CHAR(o.fecha_fin, 'DD/MM/YYYY') AS vigencia,
        CASE
          WHEN NOW() BETWEEN o.fecha_inicio AND o.fecha_fin AND o.activa THEN 'Activa'
          ELSE 'Inactiva'
        END AS estado
      FROM oferta o
      JOIN producto p ON p.id_producto = o.id_producto
      WHERE (o.id_sucursal IS NULL OR o.id_sucursal = $1)
        AND o.activa = TRUE
        AND o.fecha_fin >= NOW()
      ORDER BY o.fecha_fin ASC
    `;
        const result = await database_1.pool.query(query, [idSucursal]);
        return result.rows;
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)()
], SalesService);
//# sourceMappingURL=sales.service.js.map