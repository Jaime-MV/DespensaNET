import { Injectable, BadRequestException } from '@nestjs/common';
import { pool } from '../../config/database';

@Injectable()
export class InventoryService {
  async getProducts(idSucursal?: number) {
    // Si hay idSucursal (para encargado/empleado), mostramos el stock de su sucursal
    // Si no (para propietario), podemos mostrar el stock general o solo la lista de productos
    let query = `
      SELECT p.id_producto, p.codigo, p.nombre, p.categoria, p.unidad_medida, p.precio_referencia, p.activo, p.fecha_caducidad
      FROM producto p
      ORDER BY p.nombre ASC
    `;
    let params: any[] = [];

    if (idSucursal) {
      query = `
        SELECT p.id_producto, p.codigo, p.nombre, p.categoria, p.unidad_medida, p.precio_referencia, p.activo, p.fecha_caducidad,
               COALESCE(ss.cantidad_actual, 0) as stock, COALESCE(ss.stock_minimo, 0) as stock_minimo
        FROM producto p
        LEFT JOIN stock_sucursal ss ON ss.id_producto = p.id_producto AND ss.id_sucursal = $1
        ORDER BY p.nombre ASC
      `;
      params = [idSucursal];
    }

    const res = await pool.query(query, params);
    return res.rows;
  }

  async createProduct(data: any) {
    const { codigo, nombre, categoria, unidad_medida, precio_referencia, fecha_caducidad } = data;
    try {
      const res = await pool.query(
        `INSERT INTO producto (codigo, nombre, categoria, unidad_medida, precio_referencia, fecha_caducidad)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [codigo, nombre, categoria, unidad_medida, precio_referencia, fecha_caducidad || null]
      );
      return res.rows[0];
    } catch (err: any) {
      throw new BadRequestException('Error al crear producto: ' + err.message);
    }
  }

  async updateProduct(id: number, data: any) {
    const { codigo, nombre, categoria, unidad_medida, precio_referencia, activo, fecha_caducidad } = data;
    try {
      const res = await pool.query(
        `UPDATE producto
         SET codigo = $1, nombre = $2, categoria = $3, unidad_medida = $4, precio_referencia = $5, activo = $6, fecha_caducidad = $7
         WHERE id_producto = $8 RETURNING *`,
        [codigo, nombre, categoria, unidad_medida, precio_referencia, activo, fecha_caducidad || null, id]
      );
      return res.rows[0];
    } catch (err: any) {
      throw new BadRequestException('Error al actualizar producto: ' + err.message);
    }
  }

  async updateStock(idProducto: number, idSucursal: number, cantidad: number, stockMinimo: number) {
    try {
      const res = await pool.query(
        `INSERT INTO stock_sucursal (id_producto, id_sucursal, cantidad_actual, stock_minimo)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id_sucursal, id_producto)
         DO UPDATE SET cantidad_actual = $3, stock_minimo = $4, ultima_actualizacion = NOW()
         RETURNING *`,
        [idProducto, idSucursal, cantidad, stockMinimo]
      );
      return res.rows[0];
    } catch (err: any) {
      throw new BadRequestException('Error al actualizar stock: ' + err.message);
    }
  }

  async deleteProduct(id: number) {
    try {
      const res = await pool.query(
        `UPDATE producto SET activo = FALSE WHERE id_producto = $1 RETURNING *`,
        [id]
      );
      return res.rows[0];
    } catch (err: any) {
      throw new BadRequestException('Error al eliminar producto: ' + err.message);
    }
  }

  // ── OFFERS (Descuentos y Promociones) ──

  async getOffers(tipo?: string) {
    let query = `
      SELECT o.*, p.nombre as producto_nombre, p.codigo as producto_codigo 
      FROM oferta o
      JOIN producto p ON p.id_producto = o.id_producto
      WHERE o.activa = TRUE
    `;
    if (tipo === 'descuento') {
      query += ` AND o.porcentaje_desc > 0`;
    } else if (tipo === 'promocion') {
      query += ` AND (o.porcentaje_desc IS NULL OR o.porcentaje_desc = 0)`;
    }
    query += ` ORDER BY o.fecha_creacion DESC`;
    
    const res = await pool.query(query);
    return res.rows;
  }

  async createOffer(data: any, userId: number) {
    const { id_producto, id_sucursal, precio_oferta, porcentaje_desc, fecha_inicio, fecha_fin, descripcion } = data;
    try {
      const res = await pool.query(
        `INSERT INTO oferta (id_producto, id_sucursal, precio_oferta, porcentaje_desc, fecha_inicio, fecha_fin, descripcion, id_usuario_crea)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [id_producto, id_sucursal || null, precio_oferta || 0, porcentaje_desc || null, fecha_inicio, fecha_fin, descripcion, userId]
      );
      return res.rows[0];
    } catch (err: any) {
      throw new BadRequestException('Error al crear oferta: ' + err.message);
    }
  }

  async updateOffer(id: number, data: any) {
    const { precio_oferta, porcentaje_desc, fecha_inicio, fecha_fin, descripcion, activa } = data;
    try {
      const res = await pool.query(
        `UPDATE oferta
         SET precio_oferta = $1, porcentaje_desc = $2, fecha_inicio = $3, fecha_fin = $4, descripcion = $5, activa = $6
         WHERE id_oferta = $7 RETURNING *`,
        [precio_oferta || 0, porcentaje_desc || null, fecha_inicio, fecha_fin, descripcion, activa, id]
      );
      return res.rows[0];
    } catch (err: any) {
      throw new BadRequestException('Error al actualizar oferta: ' + err.message);
    }
  }

  async deleteOffer(id: number) {
    try {
      const res = await pool.query(
        `UPDATE oferta SET activa = FALSE WHERE id_oferta = $1 RETURNING *`,
        [id]
      );
      return res.rows[0];
    } catch (err: any) {
      throw new BadRequestException('Error al desactivar oferta: ' + err.message);
    }
  }
}
