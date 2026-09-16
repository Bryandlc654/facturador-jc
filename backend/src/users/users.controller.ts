import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './users.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Request() req) {
    const { password, ...user } = req.user.user;
    return user;
  }

  @Get()
  findAll(@Request() req) {
    return this.usersService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    const userId = +id;
    if (userId !== req.user.userId) {
      throw new ForbiddenException('No tienes permisos para ver este usuario');
    }
    return this.usersService.findOne(userId);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const userId = +id;
    if (userId !== req.user.userId) {
      throw new ForbiddenException('No tienes permisos para editar este usuario');
    }
    return this.usersService.update(userId, updateUserDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const userId = +id;
    if (userId !== req.user.userId) {
      throw new ForbiddenException('No tienes permisos para eliminar este usuario');
    }
    return this.usersService.remove(userId);
  }
}