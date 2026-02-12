// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { PrismaModule } from './prisma/prisma.module';
// import { UsersModule } from './users/users.module';
// import { TournamentsModule } from './tournaments/tournaments.module';
// import { AuthModule } from './auth/auth.module';
// import { PrismaService } from './prisma/prisma.service';
// import { TeamsModule } from './teams/teams.module';
// import { ConfigModule } from '@nestjs/config';
// import { NotificationsModule } from './notifications/notifications.module';
// import { UploadsController } from './uploads/uploads.controller';
// import { UploadsService } from './uploads/uploads.service';
// import { UploadsModule } from './uploads/uploads.module';
// import { ServeStaticModule } from '@nestjs/serve-static';
// import { join } from 'path';
// import { AdminController } from './admin/admin.controller';
// import { AdminModule } from './admin/admin.module';
// import { BanService } from './ban/ban.service';
// import { BanController } from './ban/ban.controller';

// @Module({
//   imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, UsersModule, TournamentsModule, AuthModule, TeamsModule, NotificationsModule, UploadsModule,
//   ServeStaticModule.forRoot({
//     rootPath: join(__dirname, '..', 'uploads'),
//     serveRoot: '/uploads',
//   }),
//     AdminModule,
//   ],
//   controllers: [AppController, UploadsController, AdminController, BanController],
//   providers: [AppService, PrismaService, UploadsService, BanService],
// })
// export class AppModule { }


import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core'; // <--- ВАЖНО
import { ScheduleModule } from '@nestjs/schedule'; // <--- ВАЖНО для CRON

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
import { AtGuard } from './auth/guards/at.guard'; // <--- Проверьте путь
import { BanGuard } from './ban/guard/ban.guard'; // <--- Проверьте путь

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), // <--- ВАЖНО: Без этого не будет работать @Cron (авто-разбан)
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

    // --- ПОРЯДОК ОЧЕНЬ ВАЖЕН ---

    // 1. Сначала отрабатывает Auth Guard (расшифровывает токен)
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },

    // 2. Затем отрабатывает Ban Guard (проверяет статус в БД)
    // Он получит доступ к request.user, который создал AtGuard
    {
      provide: APP_GUARD,
      useClass: BanGuard,
    },
  ],
})
export class AppModule { }
