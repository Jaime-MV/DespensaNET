// src/modules/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { pool } from '../../config/database';
import { Role } from '../../common/decorators/roles.decorator';

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
}
