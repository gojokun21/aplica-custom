import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApplicationsModule } from './applications/applications.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ChatModule } from './chat/chat.module';
import { DrizzleModule } from './db/drizzle.module';
import { JobsModule } from './jobs/jobs.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProfilesModule } from './profiles/profiles.module';
import { AdminModule } from './admin/admin.module';
import { LegalModule } from './legal/legal.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SeoModule } from './seo/seo.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    MailModule,
    AuthModule,
    ProfilesModule,
    JobsModule,
    ApplicationsModule,
    ChatModule,
    ReviewsModule,
    NotificationsModule,
    UsersModule,
    AdminModule,
    SeoModule,
    LegalModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Toate rutele sunt protejate implicit; folosește @Public() pentru excepții.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
