import { Injectable, BadRequestException } from '@nestjs/common';
import { pool } from '../../config/database';

@Injectable()
export class InventoryService {
  async getProducts(idSucursal?: number) {
    let query = '';
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
    } else {
      query = `
        SELECT p.id_producto, p.codigo, p.nombre, p.categoria, p.unidad_medida, p.precio_referencia, p.activo, p.fecha_caducidad,
               COALESCE(SUM(ss.cantidad_actual), 0) as stock, COALESCE(MAX(ss.stock_minimo), 0) as stock_minimo
        FROM producto p
        LEFT JOIN stock_sucursal ss ON ss.id_producto = p.id_producto
        GROUP BY p.id_producto
        ORDER BY p.nombre ASC
      `;
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
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Upsert stock
      const stockRes = await client.query(
        `INSERT INTO stock_sucursal (id_producto, id_sucursal, cantidad_actual, stock_minimo)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id_sucursal, id_producto)
         DO UPDATE SET cantidad_actual = $3, stock_minimo = $4, ultima_actualizacion = NOW()
         RETURNING *`,
        [idProducto, idSucursal, cantidad, stockMinimo]
      );
      const stock = stockRes.rows[0];

      // 2. Determinar tipo de alerta
      let alertType: string | null = null;
      let umbral = stockMinimo;

      if (stockMinimo > 0 && cantidad < stockMinimo) {
        // Stock por debajo del mínimo
        alertType = 'stock_minimo';
        umbral = stockMinimo;
      } else if (stockMinimo > 0 && cantidad > stockMinimo * 3) {
        // Sobreabastecimiento: más de 3 veces el mínimo
        alertType = 'sobreabastecimiento';
        umbral = stockMinimo * 3;
      }

      // 3. Insertar alerta solo si no existe una sin resolver del mismo tipo
      if (alertType) {
        await client.query(
          `INSERT INTO alerta_stock (id_stock, tipo, cantidad_al_momento, umbral_referencia)
           SELECT $1, $2, $3, $4
           WHERE NOT EXISTS (
             SELECT 1 FROM alerta_stock
             WHERE id_stock = $1 AND tipo = $2 AND resuelta = FALSE
           )`,
          [stock.id_stock, alertType, cantidad, umbral]
        );
      } else {
        // 4. Si el stock volvió a niveles normales, resolver alertas pendientes automáticamente
        await client.query(
          `UPDATE alerta_stock
           SET resuelta = TRUE
           WHERE id_stock = $1 AND resuelta = FALSE`,
          [stock.id_stock]
        );
      }

      await client.query('COMMIT');
      return stock;
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw new BadRequestException('Error al actualizar stock: ' + err.message);
    } finally {
      client.release();
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

  // ── ALERTS (Alertas de Stock) ──

  private async generateStockAlerts(idSucursal?: number): Promise<void> {
    const sucursalFilter = idSucursal ? `AND ss.id_sucursal = ${idSucursal}` : '';
    // stock mínimo
    await pool.query(`
      INSERT INTO alerta_stock (id_stock, tipo, cantidad_al_momento, umbral_referencia)
      SELECT ss.id_stock, 'stock_minimo', ss.cantidad_actual, ss.stock_minimo
      FROM stock_sucursal ss
      WHERE ss.stock_minimo > 0 AND ss.cantidad_actual < ss.stock_minimo
      ${sucursalFilter}
      AND NOT EXISTS (
        SELECT 1 FROM alerta_stock
        WHERE id_stock = ss.id_stock AND tipo = 'stock_minimo' AND resuelta = FALSE
      )
    `);
    // sobreabastecimiento
    await pool.query(`
      INSERT INTO alerta_stock (id_stock, tipo, cantidad_al_momento, umbral_referencia)
      SELECT ss.id_stock, 'sobreabastecimiento', ss.cantidad_actual, ss.stock_minimo * 3
      FROM stock_sucursal ss
      WHERE ss.stock_minimo > 0 AND ss.cantidad_actual > ss.stock_minimo * 3
      ${sucursalFilter}
      AND NOT EXISTS (
        SELECT 1 FROM alerta_stock
        WHERE id_stock = ss.id_stock AND tipo = 'sobreabastecimiento' AND resuelta = FALSE
      )
    `);
  }

  async getAlerts(idSucursal?: number) {
    await this.generateStockAlerts(idSucursal);
    let query = `
      SELECT
        a.id_alerta,
        a.tipo,
        a.cantidad_al_momento,
        a.umbral_referencia,
        a.resuelta,
        a.fecha_generada,
        p.nombre  AS producto_nombre,
        p.codigo  AS producto_codigo,
        s.nombre  AS sucursal_nombre
      FROM alerta_stock a
      JOIN stock_sucursal ss ON a.id_stock    = ss.id_stock
      JOIN producto       p  ON ss.id_producto = p.id_producto
      JOIN sucursal       s  ON ss.id_sucursal  = s.id_sucursal
    `;
    const params: any[] = [];
    if (idSucursal) {
      query += ` WHERE ss.id_sucursal = $1`;
      params.push(idSucursal);
    }
    query += ` ORDER BY a.resuelta ASC, a.fecha_generada DESC`;

    const res = await pool.query(query, params);
    return res.rows;
  }

  async resolveAlert(idAlerta: number) {
    try {
      const res = await pool.query(
        `UPDATE alerta_stock SET resuelta = TRUE WHERE id_alerta = $1 RETURNING *`,
        [idAlerta]
      );
      return res.rows[0];
    } catch (err: any) {
      throw new BadRequestException('Error al resolver alerta: ' + err.message);
    }
  }

  // ── EXPIRY ALERTS (Alertas de Caducidad) ──

  /**
   * Escanea todos los productos con fecha_caducidad que vencen en ≤ 30 días
   * (o ya vencieron) y que tienen stock > 0 en al menos una sucursal.
   * Inserta una alerta por combinación (producto, sucursal) si no existe
   * una alerta sin resolver para ese par.
   */
  private async generateExpiryAlerts(idSucursal?: number): Promise<void> {
    const sucursalFilter = idSucursal ? `AND ss.id_sucursal = ${idSucursal}` : '';

    await pool.query(`
      INSERT INTO alerta_caducidad
        (id_producto, id_sucursal, fecha_referencia, dias_restantes, estado)
      SELECT
        p.id_producto,
        ss.id_sucursal,
        p.fecha_caducidad,
        (p.fecha_caducidad - CURRENT_DATE)::INT          AS dias_restantes,
        CASE
          WHEN p.fecha_caducidad < CURRENT_DATE THEN 'vencido'
          ELSE 'por_vencer'
        END                                               AS estado
      FROM producto p
      JOIN stock_sucursal ss
        ON ss.id_producto = p.id_producto
       AND ss.cantidad_actual > 0
      WHERE p.fecha_caducidad IS NOT NULL
        AND p.activo = TRUE
        AND p.fecha_caducidad <= CURRENT_DATE + INTERVAL '30 days'
        ${sucursalFilter}
        AND NOT EXISTS (
          SELECT 1 FROM alerta_caducidad ac
          WHERE ac.id_producto  = p.id_producto
            AND ac.id_sucursal  = ss.id_sucursal
            AND ac.resuelta     = FALSE
        )
    `);
  }

  async getExpiryAlerts(idSucursal?: number) {
    // Primero generamos alertas pendientes (lazy)
    await this.generateExpiryAlerts(idSucursal);

    let query = `
      SELECT
        ac.id_alerta_caducidad,
        ac.fecha_referencia,
        ac.dias_restantes,
        ac.estado,
        ac.resuelta,
        ac.fecha_generada,
        p.nombre  AS producto_nombre,
        p.codigo  AS producto_codigo,
        s.nombre  AS sucursal_nombre
      FROM alerta_caducidad ac
      JOIN producto  p ON p.id_producto = ac.id_producto
      JOIN sucursal  s ON s.id_sucursal  = ac.id_sucursal
    `;
    const params: any[] = [];
    if (idSucursal) {
      query += ` WHERE ac.id_sucursal = $1`;
      params.push(idSucursal);
    }
    query += ` ORDER BY ac.resuelta ASC, ac.dias_restantes ASC`;

    const res = await pool.query(query, params);
    return res.rows;
  }

  async resolveExpiryAlert(idAlerta: number) {
    try {
      const res = await pool.query(
        `UPDATE alerta_caducidad
         SET resuelta = TRUE, estado = 'retirado'
         WHERE id_alerta_caducidad = $1
         RETURNING *`,
        [idAlerta]
      );
      return res.rows[0];
    } catch (err: any) {
      throw new BadRequestException('Error al resolver alerta de caducidad: ' + err.message);
    }
  }
}
