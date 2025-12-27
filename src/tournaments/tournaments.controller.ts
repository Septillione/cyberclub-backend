import { Body, Controller, Get, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { AtGuard } from 'src/auth/guards/at.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JoinTournamentDto } from './dto/join-tournament.dto';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) { }

  @Get()
  async findAll() {
    const items = await this.tournamentsService.findAll();
    return { items: items };
  }

  @UseGuards(AtGuard)
  @Roles('MANAGER', 'ADMIN')
  @Get('organized')
  findMyCreated(@Req() req) {
    const userId = req.user['sub'];
    return this.tournamentsService.findMyCreated(userId);
  }

  @UseGuards(AtGuard)
  @Get('my')
  findMyTournaments(@Req() req) {
    const userId = req.user['sub'];
    return this.tournamentsService.findUserTournaments(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const tournament = await this.tournamentsService.findOne(id);
    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }
    return tournament;
  }

  @UseGuards(AtGuard)
  @Post(':id/join')
  join(@Req() req, @Param('id') tournamentId: string, @Body() dto: JoinTournamentDto) {
    const userId = req.user['sub'];
    return this.tournamentsService.joinTournament(tournamentId, userId, dto.teamId);
  }

  @UseGuards(AtGuard)
  @Post(':id/start')
  start(@Req() req, @Param('id') tournamentId: string) {
    const userId = req.user['sub'];
    return this.tournamentsService.startTournament(tournamentId, userId);
  }

  @UseGuards(AtGuard)
  @Roles('MANAGER', 'ADMIN')
  @Post()
  create(@Req() req, @Body() dto: CreateTournamentDto) {
    const userId = req.user['sub'];
    return this.tournamentsService.createTournament(dto, userId);
  }
}