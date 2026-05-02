// src/modules/users/users.service.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/decorators/roles.decorator';

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  role: Role;
  nombre: string;
  sucursal: string | null;
}

/**
 * UsersService
 * In-memory user store for development.
 * Replace with a TypeORM/Prisma repository backed by PostgreSQL
 * when the database (Render/Supabase) is configured.
 */
@Injectable()
export class UsersService {
  private readonly users: User[] = [];

  constructor() {
    // Seed demo users on startup (matches frontend demo credentials)
    void this.seedDemoUsers();
  }

  private async seedDemoUsers() {
    const demos: Omit<User, 'id' | 'passwordHash'>[] = [
      { email: 'propietario@despensanet.com', role: 'Propietario', nombre: 'Admin Propietario', sucursal: null },
      { email: 'encargado@despensanet.com',   role: 'Encargado',   nombre: 'Juan Encargado',    sucursal: 'Sucursal Central' },
      { email: 'empleado@despensanet.com',    role: 'Empleado',    nombre: 'María Empleada',    sucursal: 'Sucursal Norte' },
    ];

    const passwords = ['Admin2024!', 'Manager2024!', 'Staff2024!'];

    for (let i = 0; i < demos.length; i++) {
      const hash = await bcrypt.hash(passwords[i], 10);
      this.users.push({ id: i + 1, ...demos[i], passwordHash: hash });
    }
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  findById(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }
}
