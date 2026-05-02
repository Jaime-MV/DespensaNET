// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  /**
   * POST /api/auth/login
   * Body: { email, password }
   * Returns: { accessToken, user }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  /**
   * GET /api/auth/me
   * Requires: Bearer token
   * Returns: safe user profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req) {
    return this.auth.getProfile(req.user.id);
  }
}
