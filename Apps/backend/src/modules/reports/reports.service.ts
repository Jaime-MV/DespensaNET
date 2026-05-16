import { Injectable } from '@nestjs/common';
import { pool } from '../../config/database';

@Injectable()
export class ReportsService {
  /**
   * Get all branches for the selector
   */
  async getSucursales() {
    const res = await pool.query(
      `SELECT id_sucursal, nombre FROM sucursal ORDER BY nombre ASC`
    );
    return res.rows;
  }

  /**
   * Main query: sales report between two dates, optionally filtered by branch
   */
  async getSalesReport(fechaInicio: string, fechaFin: string, idSucursal?: number) {
    const params: any[] = [fechaInicio, fechaFin];
    let branchFilter = '';
    if (idSucursal) {
      params.push(idSucursal);
      branchFilter = `AND v.id_sucursal = $${params.length}`;
    }

    // Summary per sale
    const ventasQuery = `
      SELECT
        v.id_venta,
        TO_CHAR(v.fecha_hora AT TIME ZONE 'America/Guatemala', 'DD/MM/YYYY HH24:MI') AS fecha,
        s.nombre AS sucursal,
        u.nombre AS cajero,
        v.metodo_pago,
        v.total,
        COUNT(dv.id_detalle) AS num_items
      FROM venta v
      JOIN sucursal s ON s.id_sucursal = v.id_sucursal
      JOIN usuario u ON u.id_usuario = v.id_usuario
      JOIN detalle_venta dv ON dv.id_venta = v.id_venta
      WHERE v.fecha_hora::date BETWEEN $1::date AND $2::date
      ${branchFilter}
      GROUP BY v.id_venta, s.nombre, u.nombre
      ORDER BY v.fecha_hora DESC
    `;

    // Top products sold
    const productosQuery = `
      SELECT
        p.codigo,
        p.nombre,
        p.categoria,
        SUM(dv.cantidad) AS total_vendido,
        SUM(dv.subtotal) AS total_ingresos
      FROM detalle_venta dv
      JOIN venta v ON v.id_venta = dv.id_venta
      JOIN producto p ON p.id_producto = dv.id_producto
      WHERE v.fecha_hora::date BETWEEN $1::date AND $2::date
      ${branchFilter}
      GROUP BY p.id_producto
      ORDER BY total_vendido DESC
      LIMIT 20
    `;

    // Totals summary
    const resumenQuery = `
      SELECT
        COUNT(DISTINCT v.id_venta) AS total_ventas,
        COALESCE(SUM(v.total), 0) AS ingresos_totales,
        COALESCE(AVG(v.total), 0) AS promedio_venta,
        COUNT(DISTINCT CASE WHEN v.metodo_pago = 'efectivo' THEN v.id_venta END) AS ventas_efectivo,
        COUNT(DISTINCT CASE WHEN v.metodo_pago = 'tarjeta'  THEN v.id_venta END) AS ventas_tarjeta,
        COUNT(DISTINCT CASE WHEN v.metodo_pago = 'otro'     THEN v.id_venta END) AS ventas_otro
      FROM venta v
      WHERE v.fecha_hora::date BETWEEN $1::date AND $2::date
      ${branchFilter}
    `;

    const [ventas, productos, resumen] = await Promise.all([
      pool.query(ventasQuery, params),
      pool.query(productosQuery, params),
      pool.query(resumenQuery, params),
    ]);

    return {
      resumen: resumen.rows[0],
      ventas: ventas.rows,
      productos: productos.rows,
      generadoEn: new Date().toISOString(),
      filtros: { fechaInicio, fechaFin, idSucursal: idSucursal ?? 'todas' },
    };
  }
}
