import { Controller, Get, Patch, Body, Post, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@Req() req: any, @Body() data: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.userId, data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('organizer')
  upgradeToOrganizer(@Req() req: any, @Body() orgData: any) {
    return this.usersService.upgradeToOrganizer(req.user.userId, orgData);
  }
}
