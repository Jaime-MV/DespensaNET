// src/modules/users/users.service.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { pool } from '../../config/database';
import { Role } from '../../common/decorators/roles.decorator';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  role: Role;
  nombre: string;
  sucursal: string | null;
  idSucursal: number | null;
}

@Injectable()
export class UsersService {
  async findByEmail(email: string): Promise<User | undefined> {
    const query = `
      SELECT u.id_usuario as id, u.correo as email, u.contrasena_hash as "passwordHash", 
             r.nombre as role, u.nombre, s.nombre as sucursal, u.id_sucursal as "idSucursal"
      FROM usuario u
      JOIN rol r ON u.id_rol = r.id_rol
      LEFT JOIN sucursal s ON u.id_sucursal = s.id_sucursal
      WHERE u.correo = $1 AND u.activo = TRUE
    `;
    const result = await pool.query(query, [email]);
    if (!result.rows[0]) return undefined;

    const row = result.rows[0];
    const roleMapping: Record<string, Role> = {
      'propietario': 'Propietario',
      'encargado': 'Encargado',
      'empleado': 'Empleado'
    };

    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: roleMapping[row.role] || 'Empleado',
      nombre: row.nombre,
      sucursal: row.sucursal,
      idSucursal: row.idSucursal
    };
  }

  async findById(id: number): Promise<User | undefined> {
    const query = `
      SELECT u.id_usuario as id, u.correo as email, u.contrasena_hash as "passwordHash", 
             r.nombre as role, u.nombre, s.nombre as sucursal, u.id_sucursal as "idSucursal"
      FROM usuario u
      JOIN rol r ON u.id_rol = r.id_rol
      LEFT JOIN sucursal s ON u.id_sucursal = s.id_sucursal
      WHERE u.id_usuario = $1 AND u.activo = TRUE
    `;
    const result = await pool.query(query, [id]);
    if (!result.rows[0]) return undefined;

    const row = result.rows[0];
    const roleMapping: Record<string, Role> = {
      'propietario': 'Propietario',
      'encargado': 'Encargado',
      'empleado': 'Empleado'
    };

    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: roleMapping[row.role] || 'Empleado',
      nombre: row.nombre,
      sucursal: row.sucursal,
      idSucursal: row.idSucursal
    };
  }

  async getBranches() {
    const query = 'SELECT id_sucursal, nombre FROM sucursal WHERE activa = TRUE ORDER BY nombre ASC';
    const result = await pool.query(query);
    return result.rows;
  }

  // ==========================================
  // CRUD Methods
  // ==========================================

  async findAll(actorRole: Role, actorSucursal: number | null) {
    let query = `
      SELECT u.id_usuario, u.correo, u.nombre, u.activo, r.nombre as rol, s.nombre as sucursal, u.id_sucursal
      FROM usuario u
      JOIN rol r ON u.id_rol = r.id_rol
      LEFT JOIN sucursal s ON u.id_sucursal = s.id_sucursal
    `;
    const params: any[] = [];

    if (actorRole === 'Encargado') {
      query += ` WHERE u.id_sucursal = $1`;
      params.push(actorSucursal);
    }

    query += ` ORDER BY u.id_usuario DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async findOne(id: number, actorRole: Role, actorSucursal: number | null) {
    let query = `
      SELECT u.id_usuario, u.correo, u.nombre, u.activo, r.nombre as rol, s.nombre as sucursal, u.id_sucursal, u.id_rol
      FROM usuario u
      JOIN rol r ON u.id_rol = r.id_rol
      LEFT JOIN sucursal s ON u.id_sucursal = s.id_sucursal
      WHERE u.id_usuario = $1
    `;
    const params: any[] = [id];

    if (actorRole === 'Encargado') {
      query += ` AND u.id_sucursal = $2`;
      params.push(actorSucursal);
    }

    const result = await pool.query(query, params);
    if (!result.rows[0]) {
      throw new NotFoundException('Usuario no encontrado o no tiene permisos para verlo');
    }
    return result.rows[0];
  }

  async create(dto: CreateUserDto, actorRole: Role, actorSucursal: number | null) {
    if (actorRole === 'Encargado') {
      if (dto.id_rol) {
        throw new ForbiddenException('Un encargado no puede asignar roles');
      }
      if (dto.id_sucursal && dto.id_sucursal !== actorSucursal) {
        throw new ForbiddenException('Un encargado solo puede crear usuarios en su sucursal');
      }
      // Encargados default to creating Empleados in their own branch
      const resRol = await pool.query(`SELECT id_rol FROM rol WHERE nombre = 'empleado'`);
      dto.id_rol = resRol.rows[0].id_rol;
      dto.id_sucursal = actorSucursal !== null ? actorSucursal : undefined;
    }

    const hash = await bcrypt.hash(dto.contrasena, 10);

    const query = `
      INSERT INTO usuario (id_rol, id_sucursal, nombre, correo, contrasena_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_usuario, correo, nombre, activo
    `;
    const params = [
      dto.id_rol,
      dto.id_sucursal || null,
      dto.nombre,
      dto.correo,
      hash
    ];

    try {
      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ForbiddenException('El correo ya está en uso');
      }
      throw err;
    }
  }

  async update(id: number, dto: UpdateUserDto, actorRole: Role, actorSucursal: number | null) {
    // Check if exists and is allowed to edit
    await this.findOne(id, actorRole, actorSucursal);

    if (actorRole === 'Encargado') {
      if (dto.id_rol !== undefined) {
        throw new ForbiddenException('Un encargado no puede editar roles');
      }
      if (dto.id_sucursal !== undefined && dto.id_sucursal !== actorSucursal) {
        throw new ForbiddenException('Un encargado no puede cambiar la sucursal');
      }
      // Ensure the branch stays the same if somehow passed
      dto.id_sucursal = actorSucursal !== null ? actorSucursal : undefined;
    }

    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (dto.id_rol !== undefined) {
      fields.push(`id_rol = $${paramIndex++}`);
      params.push(dto.id_rol);
    }
    if (dto.id_sucursal !== undefined) {
      fields.push(`id_sucursal = $${paramIndex++}`);
      params.push(dto.id_sucursal);
    }
    if (dto.nombre !== undefined) {
      fields.push(`nombre = $${paramIndex++}`);
      params.push(dto.nombre);
    }
    if (dto.correo !== undefined) {
      fields.push(`correo = $${paramIndex++}`);
      params.push(dto.correo);
    }
    if (dto.activo !== undefined) {
      fields.push(`activo = $${paramIndex++}`);
      params.push(dto.activo);
    }
    if (dto.contrasena) {
      const hash = await bcrypt.hash(dto.contrasena, 10);
      fields.push(`contrasena_hash = $${paramIndex++}`);
      params.push(hash);
    }

    if (fields.length === 0) {
      return this.findOne(id, actorRole, actorSucursal);
    }

    params.push(id);
    const query = `
      UPDATE usuario
      SET ${fields.join(', ')}
      WHERE id_usuario = $${paramIndex}
      RETURNING id_usuario, correo, nombre, activo, id_sucursal, id_rol
    `;

    try {
      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ForbiddenException('El correo ya está en uso');
      }
      throw err;
    }
  }

  async remove(id: number, actorRole: Role, actorSucursal: number | null) {
    // Check if exists and is allowed to edit
    await this.findOne(id, actorRole, actorSucursal);

    // Soft delete -> deactivate
    const query = `
      UPDATE usuario
      SET activo = FALSE
      WHERE id_usuario = $1
      RETURNING id_usuario, correo, nombre, activo
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}
