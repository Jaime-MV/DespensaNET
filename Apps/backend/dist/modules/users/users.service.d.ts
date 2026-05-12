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
export declare class UsersService {
    findByEmail(email: string): Promise<User | undefined>;
    findById(id: number): Promise<User | undefined>;
}
