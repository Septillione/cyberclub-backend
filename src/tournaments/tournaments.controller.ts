import { Body, Controller, Get, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { AtGuard } from 'src/auth/guards/at.guard';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) { }

  @Get()
  async findAll() {
    const items = await this.tournamentsService.findAll();
    return { items: items };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const tournament = await this.tournamentsService.findOne(id);
    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }
    return tournament;
  }

  @Post()
  create(@Body() dto: CreateTournamentDto) {
    return this.tournamentsService.create(dto);
  }

  @UseGuards(AtGuard)
  @Get('my')
  findMyTournaments(@Req() req) {
    const userId = req.user['sub'];
    return this.tournamentsService.findUserTournaments(userId);
  }
}
