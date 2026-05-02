import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: number;
            email: string;
            nombre: string;
            role: import("../../common/decorators/roles.decorator").Role;
            sucursal: string | null;
        };
    }>;
    me(req: any): {
        id: number;
        email: string;
        role: import("../../common/decorators/roles.decorator").Role;
        nombre: string;
        sucursal: string | null;
    };
}
