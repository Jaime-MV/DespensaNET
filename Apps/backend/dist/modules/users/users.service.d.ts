import { Role } from '../../common/decorators/roles.decorator';
export interface User {
    id: number;
    email: string;
    passwordHash: string;
    role: Role;
    nombre: string;
    sucursal: string | null;
}
export declare class UsersService {
    private readonly users;
    constructor();
    private seedDemoUsers;
    findByEmail(email: string): User | undefined;
    findById(id: number): User | undefined;
}
