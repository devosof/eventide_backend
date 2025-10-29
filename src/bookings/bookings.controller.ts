import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, UpdateBookingDto, FindBookingsDto, BookingResponseDto } from './dto/booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Role } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() dto: CreateBookingDto, @GetUser('userId') userId: number): Promise<BookingResponseDto> {
    return this.bookingsService.create(dto, userId);
  }

  @Get('my-bookings')
  findMyBookings(@Query() dto: FindBookingsDto, @GetUser('userId') userId: number) {
    return this.bookingsService.findMyBookings(userId, dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser('userId') userId: number): Promise<BookingResponseDto> {
    return this.bookingsService.findOne(id, userId);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookingDto, @GetUser('userId') userId: number): Promise<BookingResponseDto> {
    return this.bookingsService.update(id, dto, userId);
  }

  @Delete(':id')
  cancel(@Param('id', ParseIntPipe) id: number, @GetUser('userId') userId: number): Promise<void> {
    return this.bookingsService.cancel(id, userId);
  }

  @UseGuards(RolesGuard)
  @Role(UserRole.ORGANIZER)
  @Get('event/:eventId')
  getEventBookings(@Param('eventId', ParseIntPipe) eventId: number, @GetUser('userId') userId: number) {
    return this.bookingsService.getEventBookings(eventId, userId);
  }
}