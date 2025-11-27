import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { TournamentsModule } from './tournaments/tournaments.module';

@Module({
  imports: [PrismaModule, UsersModule, TournamentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
