// src/modules/dashboard/dashboard.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { pool } from '../../config/database';

@Injectable()
export class DashboardService {
  async getGlobalDashboard() {
    // ──────────────────────────────────────────────
    // Todas las consultas se ejecutan CONCURRENTEMENTE
    // para minimizar la latencia total del endpoint.
    // ──────────────────────────────────────────────
    try {
      const [
        kpiVentasHoy,
        kpiAlertasActivas,
        kpiTrasladosPendientes,
        kpiVentasConOfertaHoy,
        grafVentas7Dias,
        grafIngresosPorSucursalHoy,
        grafTop5Productos,
        tablaTop5RotacionInventario,
        tablaUltimas10Alertas,
      ] = await Promise.all([
        // ── KPI 1: Ventas totales y transacciones de hoy ──
        pool.query<{ total_ventas: string; total_transacciones: string }>(`
          SELECT
            COALESCE(SUM(total), 0)  AS total_ventas,
            COUNT(*)                 AS total_transacciones
          FROM venta
          WHERE fecha_hora >= CURRENT_DATE
            AND fecha_hora <  CURRENT_DATE + INTERVAL '1 day'
        `),

        // ── KPI 2: Alertas de stock activas (no resueltas) ──
        pool.query<{ alertas_activas: string }>(`
          SELECT COUNT(*) AS alertas_activas
          FROM alerta_stock
          WHERE resuelta = FALSE
        `),

        // ── KPI 3: Traslados en estado 'pendiente' ──
        pool.query<{ traslados_pendientes: string }>(`
          SELECT COUNT(*) AS traslados_pendientes
          FROM traslado
          WHERE estado = 'pendiente'
        `),

        // ── KPI 4: Ventas con oferta aplicada hoy ──
        pool.query<{ ventas_con_oferta: string }>(`
          SELECT COUNT(DISTINCT v.id_venta) AS ventas_con_oferta
          FROM venta v
          INNER JOIN detalle_venta dv ON dv.id_venta = v.id_venta
          WHERE dv.id_oferta IS NOT NULL
            AND v.fecha_hora >= CURRENT_DATE
            AND v.fecha_hora <  CURRENT_DATE + INTERVAL '1 day'
        `),

        // ── GRÁFICO 1: Ventas de los últimos 7 días ──
        pool.query<{ fecha: string; total_ventas: string; transacciones: string }>(`
          SELECT
            DATE(fecha_hora)       AS fecha,
            SUM(total)             AS total_ventas,
            COUNT(*)               AS transacciones
          FROM venta
          WHERE fecha_hora >= CURRENT_DATE - INTERVAL '6 days'
            AND fecha_hora <  CURRENT_DATE + INTERVAL '1 day'
          GROUP BY DATE(fecha_hora)
          ORDER BY fecha ASC
        `),

        // ── GRÁFICO 2: Ingresos por sucursal hoy ──
        pool.query<{ id_sucursal: number; sucursal: string; ingresos: string; transacciones: string }>(`
          SELECT
            s.id_sucursal,
            s.nombre                AS sucursal,
            COALESCE(SUM(v.total), 0) AS ingresos,
            COUNT(v.id_venta)       AS transacciones
          FROM sucursal s
          LEFT JOIN venta v
            ON v.id_sucursal = s.id_sucursal
           AND v.fecha_hora >= CURRENT_DATE
           AND v.fecha_hora <  CURRENT_DATE + INTERVAL '1 day'
          WHERE s.activa = TRUE
          GROUP BY s.id_sucursal, s.nombre
          ORDER BY ingresos DESC
        `),

        // ── GRÁFICO 3: Top 5 productos más vendidos (últimos 7 días) ──
        pool.query<{ id_producto: number; producto: string; unidades_vendidas: string; ingresos: string }>(`
          SELECT
            p.id_producto,
            p.nombre                  AS producto,
            SUM(dv.cantidad)          AS unidades_vendidas,
            SUM(dv.subtotal)          AS ingresos
          FROM detalle_venta dv
          INNER JOIN venta v    ON v.id_venta    = dv.id_venta
          INNER JOIN producto p ON p.id_producto = dv.id_producto
          WHERE v.fecha_hora >= CURRENT_DATE - INTERVAL '6 days'
            AND v.fecha_hora <  CURRENT_DATE + INTERVAL '1 day'
          GROUP BY p.id_producto, p.nombre
          ORDER BY unidades_vendidas DESC
          LIMIT 5
        `),

        // ── TABLA 1: Top 5 sucursales con mayor rotación de inventario ──
        // Rotación = total de unidades vendidas en los últimos 7 días / stock actual promedio
        pool.query<{
          id_sucursal: number;
          sucursal: string;
          unidades_vendidas: string;
          stock_promedio: string;
          indice_rotacion: string;
        }>(`
          WITH ventas_sucursal AS (
            SELECT
              v.id_sucursal,
              SUM(dv.cantidad) AS unidades_vendidas
            FROM detalle_venta dv
            INNER JOIN venta v ON v.id_venta = dv.id_venta
            WHERE v.fecha_hora >= CURRENT_DATE - INTERVAL '6 days'
              AND v.fecha_hora <  CURRENT_DATE + INTERVAL '1 day'
            GROUP BY v.id_sucursal
          ),
          stock_sucursal AS (
            SELECT
              id_sucursal,
              AVG(cantidad_actual) AS stock_promedio
            FROM stock_sucursal
            GROUP BY id_sucursal
          )
          SELECT
            s.id_sucursal,
            s.nombre                                                       AS sucursal,
            COALESCE(vs.unidades_vendidas, 0)                              AS unidades_vendidas,
            ROUND(COALESCE(ss.stock_promedio, 0), 2)                      AS stock_promedio,
            CASE
              WHEN COALESCE(ss.stock_promedio, 0) = 0 THEN 0
              ELSE ROUND(COALESCE(vs.unidades_vendidas, 0)::NUMERIC
                         / ss.stock_promedio, 4)
            END                                                            AS indice_rotacion
          FROM sucursal s
          LEFT JOIN ventas_sucursal vs ON vs.id_sucursal = s.id_sucursal
          LEFT JOIN stock_sucursal  ss ON ss.id_sucursal = s.id_sucursal
          WHERE s.activa = TRUE
          ORDER BY indice_rotacion DESC
          LIMIT 5
        `),

        // ── TABLA 2: Últimas 10 alertas generadas ──
        pool.query<{
          id_alerta: number;
          tipo: string;
          sucursal: string;
          producto: string;
          cantidad_al_momento: number;
          umbral_referencia: number;
          resuelta: boolean;
          fecha_generada: string;
        }>(`
          SELECT
            a.id_alerta,
            a.tipo,
            s.nombre       AS sucursal,
            p.nombre       AS producto,
            a.cantidad_al_momento,
            a.umbral_referencia,
            a.resuelta,
            a.fecha_generada
          FROM alerta_stock a
          INNER JOIN stock_sucursal ss ON ss.id_stock   = a.id_stock
          INNER JOIN sucursal       s  ON s.id_sucursal = ss.id_sucursal
          INNER JOIN producto       p  ON p.id_producto = ss.id_producto
          ORDER BY a.fecha_generada DESC
          LIMIT 10
        `),
      ]);

      // ──────────────────────────────────────────────
      // Construcción del JSON de respuesta consolidado
      // ──────────────────────────────────────────────
      return {
        kpis: {
          ventas_hoy: {
            total:        parseFloat(kpiVentasHoy.rows[0].total_ventas),
            transacciones: parseInt(kpiVentasHoy.rows[0].total_transacciones, 10),
          },
          alertas_stock_activas:   parseInt(kpiAlertasActivas.rows[0].alertas_activas, 10),
          traslados_pendientes:    parseInt(kpiTrasladosPendientes.rows[0].traslados_pendientes, 10),
          ventas_con_oferta_hoy:   parseInt(kpiVentasConOfertaHoy.rows[0].ventas_con_oferta, 10),
        },
        graficos: {
          ventas_7_dias: grafVentas7Dias.rows.map((r) => ({
            fecha:        r.fecha,
            total_ventas: parseFloat(r.total_ventas),
            transacciones: parseInt(r.transacciones, 10),
          })),
          ingresos_por_sucursal_hoy: grafIngresosPorSucursalHoy.rows.map((r) => ({
            id_sucursal:  r.id_sucursal,
            sucursal:     r.sucursal,
            ingresos:     parseFloat(r.ingresos),
            transacciones: parseInt(r.transacciones, 10),
          })),
          top5_productos: grafTop5Productos.rows.map((r) => ({
            id_producto:      r.id_producto,
            producto:         r.producto,
            unidades_vendidas: parseInt(r.unidades_vendidas, 10),
            ingresos:          parseFloat(r.ingresos),
          })),
        },
        tablas: {
          top5_rotacion_inventario: tablaTop5RotacionInventario.rows.map((r) => ({
            id_sucursal:      r.id_sucursal,
            sucursal:         r.sucursal,
            unidades_vendidas: parseInt(r.unidades_vendidas, 10),
            stock_promedio:   parseFloat(r.stock_promedio),
            indice_rotacion:  parseFloat(r.indice_rotacion),
          })),
          ultimas_10_alertas: tablaUltimas10Alertas.rows,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener datos del dashboard',
        { cause: error },
      );
    }
  }
}
