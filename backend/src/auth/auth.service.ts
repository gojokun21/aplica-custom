import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes, randomUUID } from 'crypto';
import { and, desc, eq, ne } from 'drizzle-orm';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { MailService } from '../mail/mail.service';
import { DRIZZLE } from '../db/drizzle.constants';
import type { DrizzleDB } from '../db/drizzle.module';
import {
  authTokens,
  AuthTokenType,
  clientProfiles,
  freelancerProfiles,
  refreshTokens,
  User,
  UserRole,
  users,
} from '../db/schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1h
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto, userAgent?: string) {
    const email = dto.email.toLowerCase();
    const existing = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existing) {
      throw new ConflictException('Există deja un cont cu acest email');
    }

    const passwordHash = await argon2.hash(dto.password);
    const role: UserRole = dto.role ?? 'CLIENT';

    const [user] = await this.db
      .insert(users)
      .values({
        email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role,
      })
      .returning();

    // Creează profilul gol corespunzător rolului.
    if (role === 'FREELANCER') {
      await this.db.insert(freelancerProfiles).values({ userId: user.id });
    } else if (role === 'CLIENT') {
      await this.db.insert(clientProfiles).values({ userId: user.id });
    }

    // Trimite emailul de verificare (best-effort).
    await this.sendEmailVerification(user.id, user.email);

    const tokens = await this.issueTokens(user.id, user.email, user.role, userAgent);
    return { user: this.sanitize(user), ...tokens };
  }

  async login(dto: LoginDto, userAgent?: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, dto.email.toLowerCase()),
    });
    if (!user) {
      throw new UnauthorizedException('Email sau parolă incorecte');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Email sau parolă incorecte');
    }
    if (user.blockedAt) {
      throw new ForbiddenException('Acest cont a fost blocat.');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role, userAgent);
    return { user: this.sanitize(user), ...tokens };
  }

  /**
   * Rotire de refresh token: verifică sesiunea, o șterge și emite o pereche
   * nouă. Un refresh valid semnat al cărui `jti` nu mai există => reutilizare
   * (furt) => revocăm toate sesiunile utilizatorului.
   */
  async refresh(userId: string, jti: string, presentedToken: string, userAgent?: string) {
    const session = await this.db.query.refreshTokens.findFirst({
      where: and(eq(refreshTokens.id, jti), eq(refreshTokens.userId, userId)),
    });
    if (!session) {
      await this.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
      throw new ForbiddenException('Sesiune invalidă');
    }

    if (session.expiresAt < new Date()) {
      await this.db.delete(refreshTokens).where(eq(refreshTokens.id, jti));
      throw new ForbiddenException('Sesiune expirată');
    }

    const matches = await argon2.verify(session.tokenHash, presentedToken);
    if (!matches) {
      await this.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
      throw new ForbiddenException('Sesiune invalidă');
    }

    await this.db.delete(refreshTokens).where(eq(refreshTokens.id, jti));

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user) {
      throw new ForbiddenException('Utilizator inexistent');
    }

    return this.issueTokens(user.id, user.email, user.role, userAgent);
  }

  async logout(userId: string, jti: string) {
    await this.db
      .delete(refreshTokens)
      .where(and(eq(refreshTokens.id, jti), eq(refreshTokens.userId, userId)));
    return { success: true };
  }

  /** Revocă toate sesiunile active (logout de pe toate dispozitivele). */
  async logoutAll(userId: string) {
    await this.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.sanitize(user);
  }

  /* ------------------------------- Account --------------------------------- */

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) {
      throw new UnauthorizedException();
    }
    const valid = await argon2.verify(user.passwordHash, currentPassword);
    if (!valid) {
      throw new BadRequestException('Parola curentă este incorectă');
    }
    const passwordHash = await argon2.hash(newPassword);
    await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return { success: true };
  }

  async deleteAccount(userId: string, password: string) {
    const user = await this.db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) {
      throw new UnauthorizedException();
    }
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw new BadRequestException('Parolă incorectă');
    }
    this.deleteAvatarFile(user.avatarUrl);
    // Ștergerea userului cascadează pe profiluri, joburi, aplicări, chat, recenzii etc.
    await this.db.delete(users).where(eq(users.id, userId));
    return { success: true };
  }

  /* ------------------------------- Sessions -------------------------------- */

  listSessions(userId: string) {
    return this.db.query.refreshTokens.findMany({
      where: eq(refreshTokens.userId, userId),
      orderBy: desc(refreshTokens.createdAt),
      columns: { id: true, userAgent: true, createdAt: true, expiresAt: true },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.db
      .delete(refreshTokens)
      .where(and(eq(refreshTokens.id, sessionId), eq(refreshTokens.userId, userId)));
    return { success: true };
  }

  /** Revocă toate sesiunile în afară de cea curentă (identificată prin jti). */
  async logoutOthers(userId: string, currentJti: string) {
    await this.db
      .delete(refreshTokens)
      .where(and(eq(refreshTokens.userId, userId), ne(refreshTokens.id, currentJti)));
    return { success: true };
  }

  private deleteAvatarFile(url?: string | null) {
    if (!url || !url.startsWith('/uploads/')) return;
    try {
      const path = join(process.cwd(), url.replace(/^\//, ''));
      if (existsSync(path)) unlinkSync(path);
    } catch {
      /* best-effort */
    }
  }

  /* ------------------------------ Email verify ----------------------------- */

  /** Re-trimite emailul de verificare pentru userul autentificat. */
  async resendEmailVerification(userId: string) {
    const user = await this.db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) {
      throw new UnauthorizedException();
    }
    if (user.emailVerifiedAt) {
      return { success: true, alreadyVerified: true };
    }
    await this.sendEmailVerification(user.id, user.email);
    return { success: true };
  }

  async verifyEmail(rawToken: string) {
    const userId = await this.consumeAuthToken(rawToken, 'EMAIL_VERIFICATION');
    await this.db
      .update(users)
      .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));
    return { success: true };
  }

  private async sendEmailVerification(userId: string, email: string) {
    // Invalidează token-urile de verificare anterioare.
    await this.db
      .delete(authTokens)
      .where(and(eq(authTokens.userId, userId), eq(authTokens.type, 'EMAIL_VERIFICATION')));
    const token = await this.issueAuthToken(userId, 'EMAIL_VERIFICATION', EMAIL_VERIFICATION_TTL_MS);
    // Fire-and-forget: înregistrarea nu depinde de livrarea email-ului.
    void this.mail.sendEmailVerification(email, token);
  }

  /* ----------------------------- Password reset ---------------------------- */

  /** Nu dezvăluie dacă emailul există (anti user-enumeration). */
  async forgotPassword(email: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });
    if (user) {
      await this.db
        .delete(authTokens)
        .where(and(eq(authTokens.userId, user.id), eq(authTokens.type, 'PASSWORD_RESET')));
      const token = await this.issueAuthToken(user.id, 'PASSWORD_RESET', PASSWORD_RESET_TTL_MS);
      // Fire-and-forget: răspunsul nu depinde de livrarea email-ului.
      void this.mail.sendPasswordReset(user.email, token);
    }
    return { success: true };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const userId = await this.consumeAuthToken(rawToken, 'PASSWORD_RESET');
    const passwordHash = await argon2.hash(newPassword);
    await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
    // Din motive de securitate, invalidăm toate sesiunile existente.
    await this.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
    return { success: true };
  }

  /* -------------------------------- Helpers -------------------------------- */

  private async issueTokens(userId: string, email: string, role: UserRole, userAgent?: string) {
    const jti = randomUUID();

    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m'),
      } as JwtSignOptions,
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, jti },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_TTL', '7d'),
      } as JwtSignOptions,
    );

    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    const tokenHash = await argon2.hash(refreshToken);
    await this.db.insert(refreshTokens).values({
      id: jti,
      userId,
      tokenHash,
      userAgent: userAgent?.slice(0, 400),
      expiresAt: new Date(decoded.exp * 1000),
    });

    return { accessToken, refreshToken };
  }

  /** Emite un token de unică folosință de forma `id.secret`. */
  private async issueAuthToken(userId: string, type: AuthTokenType, ttlMs: number) {
    const id = randomUUID();
    const secret = randomBytes(32).toString('hex');
    const tokenHash = await argon2.hash(secret);
    await this.db.insert(authTokens).values({
      id,
      userId,
      type,
      tokenHash,
      expiresAt: new Date(Date.now() + ttlMs),
    });
    return `${id}.${secret}`;
  }

  /** Validează și consumă (șterge) un token `id.secret`. */
  private async consumeAuthToken(rawToken: string, type: AuthTokenType): Promise<string> {
    const [id, secret] = rawToken.split('.');
    // `id` trebuie să fie UUID valid, altfel query-ul pe coloana uuid ar arunca 500.
    if (!id || !secret || !UUID_REGEX.test(id)) {
      throw new BadRequestException('Token invalid');
    }
    const row = await this.db.query.authTokens.findFirst({
      where: and(eq(authTokens.id, id), eq(authTokens.type, type)),
    });
    if (!row) {
      throw new BadRequestException('Token invalid sau deja folosit');
    }
    if (row.expiresAt < new Date()) {
      await this.db.delete(authTokens).where(eq(authTokens.id, id));
      throw new BadRequestException('Token expirat');
    }
    const valid = await argon2.verify(row.tokenHash, secret);
    if (!valid) {
      throw new BadRequestException('Token invalid');
    }
    await this.db.delete(authTokens).where(eq(authTokens.id, id));
    return row.userId;
  }

  private sanitize(user: User) {
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }
}
