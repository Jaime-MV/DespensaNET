import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private users;
    private jwt;
    constructor(users: UsersService, jwt: JwtService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: number;
            email: string;
            nombre: string;
            role: import("../../common/decorators/roles.decorator").Role;
            sucursal: string | null;
            idSucursal: number | null;
        };
    }>;
    getProfile(userId: number): Promise<{
        id: number;
        email: string;
        role: import("../../common/decorators/roles.decorator").Role;
        nombre: string;
        sucursal: string | null;
        idSucursal: number | null;
    }>;
}
