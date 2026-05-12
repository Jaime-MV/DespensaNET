"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("../../config/database");
let UsersService = class UsersService {
    async findByEmail(email) {
        const query = `
      SELECT u.id_usuario as id, u.correo as email, u.contrasena_hash as "passwordHash", 
             r.nombre as role, u.nombre, s.nombre as sucursal, u.id_sucursal as "idSucursal"
      FROM usuario u
      JOIN rol r ON u.id_rol = r.id_rol
      LEFT JOIN sucursal s ON u.id_sucursal = s.id_sucursal
      WHERE u.correo = $1 AND u.activo = TRUE
    `;
        const result = await database_1.pool.query(query, [email]);
        if (!result.rows[0])
            return undefined;
        const row = result.rows[0];
        const roleMapping = {
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
    async findById(id) {
        const query = `
      SELECT u.id_usuario as id, u.correo as email, u.contrasena_hash as "passwordHash", 
             r.nombre as role, u.nombre, s.nombre as sucursal, u.id_sucursal as "idSucursal"
      FROM usuario u
      JOIN rol r ON u.id_rol = r.id_rol
      LEFT JOIN sucursal s ON u.id_sucursal = s.id_sucursal
      WHERE u.id_usuario = $1 AND u.activo = TRUE
    `;
        const result = await database_1.pool.query(query, [id]);
        if (!result.rows[0])
            return undefined;
        const row = result.rows[0];
        const roleMapping = {
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map