import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { EventsService } from './events.service';
import {
  CreateEventDto,
  UpdateEventDto,
  FindEventsDto,
  EventResponseDto,
} from './dto/event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Role } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { GetUser } from '../common/decorators/get-user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FilesValidationPipe } from 'src/common/pipes/multiple-files-validation.pipe';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Role(UserRole.ORGANIZER)
  @UseInterceptors(FilesInterceptor('files', 5))
  create(
    @Body() dto: CreateEventDto,
    @GetUser('userId') userId: number,
    @UploadedFiles(
      new FilesValidationPipe({
        maxSize: 2 * 1024 * 1024,
        allowedTypes: ['image/png', 'image/jpeg'],
      }),
    )
    files: Express.Multer.File[],
  ): Promise<EventResponseDto> {
    return this.eventsService.create(dto, userId, files);
  }

  @Get()
  findAll(@Query() dto: FindEventsDto): Promise<{
    items: EventResponseDto[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    return this.eventsService.findAll(dto);
  }

  @Get('my-events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Role(UserRole.ORGANIZER)
  getMyEvents(@GetUser('userId') userId: number): Promise<EventResponseDto[]> {
    return this.eventsService.getMyEvents(userId);
  }

  @Get('organizer-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Role(UserRole.ORGANIZER)
  getOrganizerStats(@GetUser('userId') userId: number) {
    console.log('user id', userId);
    return this.eventsService.getOrganizerStats(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<EventResponseDto> {
    return this.eventsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Role(UserRole.ORGANIZER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @GetUser('userId') userId: number,
  ): Promise<EventResponseDto> {
    return this.eventsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Role(UserRole.ORGANIZER)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('userId') userId: number,
  ): Promise<void> {
    return this.eventsService.remove(id, userId);
  }
}
