import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { DRIZZLE } from '../db/drizzle.constants';
import type { DrizzleDB } from '../db/drizzle.module';
import { User, users } from '../db/schema';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async setAvatar(userId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Niciun fișier încărcat');
    }
    const existing = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { avatarUrl: true },
    });
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    const [updated] = await this.db
      .update(users)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!updated) {
      throw new NotFoundException();
    }
    this.deleteFileByUrl(existing?.avatarUrl);
    return this.sanitize(updated);
  }

  async removeAvatar(userId: string) {
    const existing = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { avatarUrl: true },
    });
    const [updated] = await this.db
      .update(users)
      .set({ avatarUrl: null, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!updated) {
      throw new NotFoundException();
    }
    this.deleteFileByUrl(existing?.avatarUrl);
    return this.sanitize(updated);
  }

  /** Șterge de pe disc un fișier avatar după URL-ul stocat. */
  private deleteFileByUrl(url?: string | null) {
    if (!url || !url.startsWith('/uploads/')) return;
    const path = join(process.cwd(), url.replace(/^\//, ''));
    try {
      if (existsSync(path)) unlinkSync(path);
    } catch {
      /* best-effort */
    }
  }

  private sanitize(user: User) {
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }
}
