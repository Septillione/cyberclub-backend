import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { AtGuard } from 'src/auth/guards/at.guard';
import { CreateTeamDto } from './dto/create-team.dto';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) { }

  @UseGuards(AtGuard)
  @Post()
  create(@Req() req, @Body() dto: CreateTeamDto) {
    const userId = req.user['sub'];
    return this.teamsService.create(userId, dto);
  }

  @UseGuards(AtGuard)
  @Get('my')
  getMyTeams(@Req() req) {
    const userId = req.user['sub'];
    return this.teamsService.findAllMyTeams(userId);
  }
}
