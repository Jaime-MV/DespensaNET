// src/modules/sales/sales.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { pool } from '../../config/database';

@Injectable()
export class SalesService {
  /**
   * Search products by code (serial) for the POS scanner.
   * Also checks stock in the user's branch and any active offers.
   */
  async searchProducts(searchTerm: string, idSucursal: number) {
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
      WHERE (p.codigo = $1 OR p.nombre ILIKE $3) AND p.activo = TRUE
      ORDER BY p.nombre ASC
      LIMIT 20
    `;
    const result = await pool.query(query, [searchTerm, idSucursal, `%${searchTerm}%`]);
    return result.rows;
  }

  /**
   * Create a sale: inserts into venta + detalle_venta.
   * Returns the created sale ID and total.
   */
  async createSale(data: {
    idSucursal: number;
    idUsuario: number;
    metodoPago: string;
    items: Array<{
      idProducto: number;
      idOferta?: number | null;
      cantidad: number;
      precioUnitario: number;
      precioOriginal: number;
      subtotal: number;
    }>;
    total: number;
  }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Insert the sale header
      const ventaResult = await client.query(
        `INSERT INTO venta (id_sucursal, id_usuario, total, metodo_pago)
         VALUES ($1, $2, $3, $4) RETURNING id_venta, fecha_hora`,
        [data.idSucursal, data.idUsuario, data.total, data.metodoPago],
      );
      const idVenta = ventaResult.rows[0].id_venta;
      const fechaHora = ventaResult.rows[0].fecha_hora;

      // 2. Insert detail lines
      for (const item of data.items) {
        await client.query(
          `INSERT INTO detalle_venta
            (id_venta, id_producto, id_oferta, cantidad, precio_unitario, precio_original, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            idVenta,
            item.idProducto,
            item.idOferta ?? null,
            item.cantidad,
            item.precioUnitario,
            item.precioOriginal,
            item.subtotal,
          ],
        );

        // 3. Decrease stock
        await client.query(
          `UPDATE stock_sucursal
           SET cantidad_actual = cantidad_actual - $1,
               ultima_actualizacion = NOW()
           WHERE id_sucursal = $2 AND id_producto = $3`,
          [item.cantidad, data.idSucursal, item.idProducto],
        );
      }

      await client.query('COMMIT');

      return { idVenta, fechaHora, total: data.total };
    } catch (err) {
      await client.query('ROLLBACK');
      throw new BadRequestException(
        `Error al procesar la venta: ${(err as Error).message}`,
      );
    } finally {
      client.release();
    }
  }

  /**
   * Get today's sales for a given branch (historial).
   */
  async getTodaySales(idSucursal: number) {
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
    const result = await pool.query(query, [idSucursal]);
    return result.rows;
  }

  /**
   * Get active offers for a given branch (read-only for employees).
   */
  async getActiveOffers(idSucursal: number) {
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
    const result = await pool.query(query, [idSucursal]);
    return result.rows;
  }
}
