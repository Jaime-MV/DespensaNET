// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = this.users.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(payload);

    return {
      accessToken,
      user: {
        id:       user.id,
        email:    user.email,
        nombre:   user.nombre,
        role:     user.role,
        sucursal: user.sucursal,
      },
    };
  }

  /** Returns the authenticated user profile (used by /auth/me) */
  getProfile(userId: number) {
    const user = this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    const { passwordHash: _, ...safe } = user;
    return safe;
  }
}
