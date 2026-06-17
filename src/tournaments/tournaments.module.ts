import { Module } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [],
  controllers: [TournamentsController],
  providers: [TournamentsService],
})
export class TournamentsModule { }
