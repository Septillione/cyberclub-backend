import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto, UpdateUserDto } from './dto/update-user.dto';
import { AtGuard } from 'src/auth/guards/at.guard';
import { BanGuard } from 'src/ban/guard/ban.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AtGuard)
  @Get()
  findAll(@Query('search') search: string) {
    return this.usersService.findAll(search);
  }

  @UseGuards(AtGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(AtGuard)
  @Patch('me')
  updateProfile(@Req() req, @Body() dto: UpdateUserDto) {
    const userId = req.user['sub'];
    return this.usersService.updateProfile(userId, dto);
  }

  @UseGuards(AtGuard)
  @Patch('me/password')
  changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    const userId = req.user['sub'];
    return this.usersService.changePassword(userId, dto);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.usersService.update(+id, updateUserDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.usersService.remove(+id);
  // }
}
