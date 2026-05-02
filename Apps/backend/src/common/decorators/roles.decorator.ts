// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export type Role = 'Propietario' | 'Encargado' | 'Empleado';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
