import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto, FindEventsDto, EventResponseDto } from './dto/event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Role } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Role(UserRole.ORGANIZER)
  create(@Body() dto: CreateEventDto, @GetUser('userId') userId: number): Promise<EventResponseDto> {
    return this.eventsService.create(dto, userId);
  }

  @Get()
  findAll(@Query() dto: FindEventsDto) {
    return this.eventsService.findAll(dto);
  }

  @Get('my-events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Role(UserRole.ORGANIZER)
  getMyEvents(@GetUser('userId') userId: number): Promise<EventResponseDto[]> {
    return this.eventsService.getMyEvents(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<EventResponseDto> {
    return this.eventsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Role(UserRole.ORGANIZER)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventDto, @GetUser('userId') userId: number): Promise<EventResponseDto> {
    return this.eventsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Role(UserRole.ORGANIZER)
  remove(@Param('id', ParseIntPipe) id: number, @GetUser('userId') userId: number): Promise<void> {
    return this.eventsService.remove(id, userId);
  }
}