import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { AtGuard } from 'src/auth/guards/at.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JoinTournamentDto } from './dto/join-tournament.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { FitlerTournamentsDto } from './dto/filter-tournaments.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { BanGuard } from 'src/ban/guard/ban.guard';
import { TeamBanGuard } from 'src/ban/guard/team_ban.guard';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) { }

  @Get()
  async findAll(@Query() filters: FitlerTournamentsDto) {
    const items = await this.tournamentsService.findAll(filters);
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
  @Roles('MANAGER', 'ADMIN')
  @Get('statistics')
  getAdminDashboardStats() {
    return this.tournamentsService.getAdminDashboardStats();
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

  @UseGuards(AtGuard, TeamBanGuard)
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
  @Post(':id/finish')
  finish(@Req() req, @Param('id') tournamentId: string) {
    const userId = req.user['sub'];
    return this.tournamentsService.finishTournament(tournamentId, userId);
  }

  @UseGuards(AtGuard)
  @Roles('MANAGER', 'ADMIN')
  @Patch(':id')
  updateTournament(@Req() req, @Param('id') tournamentId: string, @Body() dto: UpdateTournamentDto) {
    const userId = req.user['sub'];
    const userRole = req.user['role'];
    return this.tournamentsService.updateTournament(tournamentId, userId, userRole, dto)
  }

  @UseGuards(AtGuard)
  @Roles('MANAGER', 'ADMIN')
  @Patch(':id/cancel')
  cancel(@Req() req, @Param('id') tournamentId: string) {
    return this.tournamentsService.cancelTournament(tournamentId);
  }

  @UseGuards(AtGuard)
  @Roles('MANAGER', 'ADMIN')
  @Post('matches/:id')
  updateMatch(@Req() req, @Param('id') matchId: string, @Body() dto: UpdateMatchDto) {
    const userId = req.user['sub'];
    return this.tournamentsService.updateMatch(matchId, userId, dto.score1, dto.score2);
  }

  @UseGuards(AtGuard)
  @Roles('MANAGER', 'ADMIN')
  @Patch('matches/:id/disqualify')
  disqualify(@Req() req, @Param('id') matchId: string, @Body('loserPosition') loserPosition: number) {
    const userId = req.user['sub'];
    return this.tournamentsService.disqualifyParticipant(matchId, userId, loserPosition);
  }

  @UseGuards(AtGuard)
  @Roles('MANAGER', 'ADMIN')
  @Post()
  create(@Req() req, @Body() dto: CreateTournamentDto) {
    const userId = req.user['sub'];
    return this.tournamentsService.createTournament(dto, userId);
  }
}