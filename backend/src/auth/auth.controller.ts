import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

const ua = (req: Request) => req.headers['user-agent'];

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.auth.register(dto, ua(req));
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, ua(req));
  }

  /** Necesită refresh token în header-ul Authorization: Bearer <refreshToken>. */
  @Public()
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(
    @CurrentUser() user: { id: string; jti: string; refreshToken: string },
    @Req() req: Request,
  ) {
    return this.auth.refresh(user.id, user.jti, user.refreshToken, ua(req));
  }

  /** Revocă sesiunea curentă (trimite refresh token-ul). */
  @Public()
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@CurrentUser() user: { id: string; jti: string }) {
    return this.auth.logout(user.id, user.jti);
  }

  /** Revocă toate sesiunile (necesită access token). */
  @HttpCode(HttpStatus.OK)
  @Post('logout-all')
  logoutAll(@CurrentUser('id') userId: string) {
    return this.auth.logoutAll(userId);
  }

  /** Profilul utilizatorului autentificat (necesită access token). */
  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.auth.me(userId);
  }

  /* ------------------------------- Account --------------------------------- */

  @HttpCode(HttpStatus.OK)
  @Post('password/change')
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  @HttpCode(HttpStatus.OK)
  @Post('account/delete')
  deleteAccount(@CurrentUser('id') userId: string, @Body() dto: DeleteAccountDto) {
    return this.auth.deleteAccount(userId, dto.password);
  }

  /* ------------------------------- Sessions -------------------------------- */

  @Get('sessions')
  sessions(@CurrentUser('id') userId: string) {
    return this.auth.listSessions(userId);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('sessions/:id')
  revokeSession(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.auth.revokeSession(userId, id);
  }

  /** Deconectare de pe toate celelalte dispozitive (păstrează sesiunea curentă). */
  @Public()
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout-others')
  logoutOthers(@CurrentUser() user: { id: string; jti: string }) {
    return this.auth.logoutOthers(user.id, user.jti);
  }

  /* ------------------------------ Email verify ----------------------------- */

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('email/verify')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('email/resend')
  resendEmail(@CurrentUser('id') userId: string) {
    return this.auth.resendEmailVerification(userId);
  }

  /* ----------------------------- Password reset ---------------------------- */

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('password/forgot')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('password/reset')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }
}
