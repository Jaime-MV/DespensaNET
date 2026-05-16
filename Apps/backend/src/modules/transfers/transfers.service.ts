import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateTransferDto, UpdateTransferStatusDto } from './dto/transfers.dto';
import { pool } from '../../config/database';

@Injectable()
export class TransfersService {
  private pool = pool;
  constructor() {}

  // ── Product search with stock across all branches ──
  async searchProductsWithStock(query: string) {
    if (!query || query.trim().length < 2) return [];

    const sql = `
      SELECT p.id_producto, p.codigo, p.nombre, p.categoria,
             s.id_sucursal, s.nombre AS sucursal_nombre,
             COALESCE(ss.cantidad_actual, 0)::int AS stock,
             COALESCE(ss.stock_minimo, 0)::int    AS stock_minimo
      FROM producto p
      CROSS JOIN sucursal s
      LEFT JOIN stock_sucursal ss
        ON ss.id_producto = p.id_producto AND ss.id_sucursal = s.id_sucursal
      WHERE p.activo = TRUE AND s.activa = TRUE
        AND (p.nombre ILIKE $1 OR p.codigo ILIKE $1)
      ORDER BY p.nombre, s.nombre
      LIMIT 60
    `;
    const { rows } = await this.pool.query(sql, [`%${query.trim()}%`]);

    const grouped: Record<number, any> = {};
    for (const r of rows) {
      if (!grouped[r.id_producto]) {
        grouped[r.id_producto] = {
          id_producto: r.id_producto,
          codigo: r.codigo,
          nombre: r.nombre,
          categoria: r.categoria,
          sucursales: [],
        };
      }
      grouped[r.id_producto].sucursales.push({
        id_sucursal: r.id_sucursal,
        nombre: r.sucursal_nombre,
        stock: r.stock,
        stock_minimo: r.stock_minimo,
      });
    }
    return Object.values(grouped);
  }

  // ── Create transfer ──
  async create(dto: CreateTransferDto, userId: number) {
    const { id_sucursal_origen, id_sucursal_destino, items, observaciones } = dto;

    if (id_sucursal_origen === id_sucursal_destino) {
      throw new BadRequestException('La sucursal de origen y destino no pueden ser la misma.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const trasladoRes = await client.query(
        `INSERT INTO traslado (id_sucursal_origen, id_sucursal_destino, id_usuario_solicitante, observaciones, estado)
         VALUES ($1, $2, $3, $4, 'pendiente') RETURNING id_traslado`,
        [id_sucursal_origen, id_sucursal_destino, userId, observaciones || null],
      );
      const id_traslado = trasladoRes.rows[0].id_traslado;

      for (const item of items) {
        await client.query(
          `INSERT INTO detalle_traslado (id_traslado, id_producto, cantidad) VALUES ($1, $2, $3)`,
          [id_traslado, item.id_producto, item.cantidad],
        );
      }

      await client.query('COMMIT');
      return { success: true, message: 'Traslado solicitado con éxito', id_traslado };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al crear traslado:', error);
      throw new InternalServerErrorException('Error al registrar la solicitud de traslado');
    } finally {
      client.release();
    }
  }

  // ── List transfers (scoped by role) ──
  async findAll(user: any) {
    let query = `
      SELECT t.*,
             so.nombre  AS origen_nombre,
             sd.nombre  AS destino_nombre,
             u.nombre   AS solicitante_nombre
      FROM traslado t
      JOIN sucursal so ON t.id_sucursal_origen  = so.id_sucursal
      JOIN sucursal sd ON t.id_sucursal_destino = sd.id_sucursal
      JOIN usuario u   ON t.id_usuario_solicitante = u.id_usuario
    `;
    const params: any[] = [];

    if (user.role !== 'Propietario' && user.idSucursal) {
      query += ` WHERE t.id_sucursal_origen = $1 OR t.id_sucursal_destino = $1`;
      params.push(user.idSucursal);
    }

    query += ' ORDER BY t.fecha_solicitud DESC';

    const { rows } = await this.pool.query(query, params);

    for (const row of rows) {
      const { rows: details } = await this.pool.query(
        `SELECT dt.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo
         FROM detalle_traslado dt
         JOIN producto p ON dt.id_producto = p.id_producto
         WHERE dt.id_traslado = $1`,
        [row.id_traslado],
      );
      row.items = details;
    }

    return rows;
  }

  // ── Approve / Reject ──
  async updateStatus(id: number, updateDto: UpdateTransferStatusDto, userId: number) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: trasladoRows } = await client.query(
        `SELECT * FROM traslado WHERE id_traslado = $1 FOR UPDATE`,
        [id],
      );
      if (trasladoRows.length === 0) throw new BadRequestException('Traslado no encontrado');

      const traslado = trasladoRows[0];
      if (traslado.estado !== 'pendiente') throw new BadRequestException('El traslado ya fue procesado');

      if (updateDto.estado === 'rechazado') {
        await client.query(
          `UPDATE traslado SET estado = 'rechazado', id_usuario_autorizador = $1, fecha_autorizacion = NOW() WHERE id_traslado = $2`,
          [userId, id],
        );
        await client.query('COMMIT');
        return { success: true, message: 'Traslado rechazado' };
      }

      // Authorize + move stock
      await client.query(
        `UPDATE traslado SET estado = 'autorizado', id_usuario_autorizador = $1, fecha_autorizacion = NOW() WHERE id_traslado = $2`,
        [userId, id],
      );

      const { rows: detalleRows } = await client.query(
        `SELECT id_producto, cantidad FROM detalle_traslado WHERE id_traslado = $1`,
        [id],
      );

      const entradaRes = await client.query(
        `INSERT INTO entrada_inventario (id_sucursal, id_usuario, tipo, id_traslado) VALUES ($1, $2, 'traslado', $3) RETURNING id_entrada`,
        [traslado.id_sucursal_destino, userId, id],
      );
      const id_entrada = entradaRes.rows[0].id_entrada;

      for (const item of detalleRows) {
        const restar = await client.query(
          `UPDATE stock_sucursal SET cantidad_actual = cantidad_actual - $1
           WHERE id_sucursal = $2 AND id_producto = $3 AND cantidad_actual >= $1
           RETURNING id_stock`,
          [item.cantidad, traslado.id_sucursal_origen, item.id_producto],
        );
        if (restar.rowCount === 0) {
          throw new BadRequestException(`Stock insuficiente en origen para producto ID ${item.id_producto}`);
        }

        await client.query(
          `INSERT INTO stock_sucursal (id_sucursal, id_producto, cantidad_actual, stock_minimo) VALUES ($1, $2, $3, 0)
           ON CONFLICT (id_sucursal, id_producto) DO UPDATE SET cantidad_actual = stock_sucursal.cantidad_actual + EXCLUDED.cantidad_actual`,
          [traslado.id_sucursal_destino, item.id_producto, item.cantidad],
        );

        await client.query(
          `INSERT INTO detalle_entrada (id_entrada, id_producto, cantidad) VALUES ($1, $2, $3)`,
          [id_entrada, item.id_producto, item.cantidad],
        );
      }

      await client.query('COMMIT');
      return { success: true, message: 'Traslado autorizado y procesado con éxito' };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al actualizar estado del traslado:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Error al procesar el traslado');
    } finally {
      client.release();
    }
  }
}
