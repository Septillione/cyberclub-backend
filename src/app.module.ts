import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

// Импорты модулей
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadsModule } from './uploads/uploads.module';
import { AdminModule } from './admin/admin.module';

// Импорты контроллеров и сервисов
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { UploadsController } from './uploads/uploads.controller';
import { UploadsService } from './uploads/uploads.service';
import { AdminController } from './admin/admin.controller';
import { BanService } from './ban/ban.service';
import { BanController } from './ban/ban.controller';

// Импорты Гвардов
import { AtGuard } from './auth/guards/at.guard';
import { BanGuard } from './ban/guard/ban.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    TournamentsModule,
    AuthModule,
    TeamsModule,
    NotificationsModule,
    UploadsModule,
    AdminModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [
    AppController,
    UploadsController,
    AdminController,
    BanController
  ],
  providers: [
    AppService,
    PrismaService,
    UploadsService,
    BanService,

    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },

    {
      provide: APP_GUARD,
      useClass: BanGuard,
    },
  ],
})
export class AppModule { }
