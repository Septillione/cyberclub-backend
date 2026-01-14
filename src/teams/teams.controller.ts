import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
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
  @Get()
  findAll(@Query('search') search: string) {
    return this.teamsService.findAll(search);
  }

  @UseGuards(AtGuard)
  @Get('my')
  getMyTeams(@Req() req) {
    const userId = req.user['sub'];
    return this.teamsService.findAllMyTeams(userId);
  }

  @UseGuards(AtGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  // Временный прямой вход (если нужен)
  // @UseGuards(AtGuard)
  // @Post(':id/join')
  // joinTeam(@Req() req, @Param('id') teamId: string) {
  //   return this.teamsService.joinTeam(req.user['sub'], teamId);
  // }

  @UseGuards(AtGuard)
  @Post(':id/leave')
  leaveTeam(@Req() req, @Param('id') teamId: string) {
    return this.teamsService.leaveTeam(req.user['sub'], teamId);
  }

  @UseGuards(AtGuard)
  @Post(':id/delete')
  deleteTeam(@Req() req, @Param('id') teamId: string) {
    return this.teamsService.deleteTeam(req.user['sub'], teamId);
  }

  @UseGuards(AtGuard)
  @Post(':id/request')
  requestJoin(@Req() req, @Param('id') teamId: string) {
    const userId = req.user['sub']
    return this.teamsService.requestJoin(userId, teamId);
  }

  @UseGuards(AtGuard)
  @Get(':id/requests')
  getRequests(@Param('id') teamId: string) {
    return this.teamsService.getRequests(teamId);
  }

  @UseGuards(AtGuard)
  @Post('requests/:id/accept')
  acceptRequest(@Req() req, @Param('id') requestId: string) {
    const captainId = req.user['sub'];
    return this.teamsService.acceptRequest(requestId, captainId);
  }

  @UseGuards(AtGuard)
  @Post('requests/:id/reject')
  rejectRequest(@Req() req, @Param('id') requestId: string) {
    const captainId = req.user['sub'];
    return this.teamsService.rejectRequest(requestId, captainId);
  }
}

// import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
// import { TeamsService } from './teams.service';
// import { AtGuard } from 'src/auth/guards/at.guard';
// import { CreateTeamDto } from './dto/create-team.dto';

// @Controller('teams')
// export class TeamsController {
//   constructor(private readonly teamsService: TeamsService) { }

//   @UseGuards(AtGuard)
//   @Post()
//   create(@Req() req, @Body() dto: CreateTeamDto) {
//     const userId = req.user['sub'];
//     return this.teamsService.create(userId, dto);
//   }

//   @UseGuards(AtGuard)
//   @Get('my')
//   getMyTeams(@Req() req) {
//     const userId = req.user['sub'];
//     return this.teamsService.findAllMyTeams(userId);
//   }

//   @UseGuards(AtGuard)
//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.teamsService.findOne(id);
//   }

//   @UseGuards(AtGuard)
//   @Post(':id/join')
//   joinTeam(@Req() req, @Param('id') teamId: string) {
//     return this.teamsService.joinTeam(req.user['sub'], teamId);
//   }

//   @UseGuards(AtGuard)
//   @Post(':id/leave')
//   leaveTeam(@Req() req, @Param('id') teamId: string) {
//     return this.teamsService.leaveTeam(req.user['sub'], teamId);
//   }
// }
