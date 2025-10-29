import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Event } from '../entities/event.entity';
import { Ticket } from '../entities/ticket.entity';
import { User } from '../entities/user.entity';
import { CreateBookingDto, UpdateBookingDto, FindBookingsDto, BookingResponseDto } from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async create(dto: CreateBookingDto, userId: number): Promise<BookingResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const event = await this.eventRepo.findOne({ where: { id: dto.eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const ticket = await this.ticketRepo.findOne({ where: { id: dto.ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const existing = await this.bookingRepo.findOne({
      where: { user: { id: userId }, event: { id: dto.eventId } },
    });
    if (existing) throw new BadRequestException('You already have a booking for this event');

    const booking = await this.bookingRepo.save(
      this.bookingRepo.create({ user, event, ticket, status: 'CONFIRMED' })
    );

    return this.findOne(booking.id, userId);
  }

  async findMyBookings(userId: number, dto: FindBookingsDto) {
    const { page = 1, limit = 10, status } = dto;
    const query = this.bookingRepo.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.event', 'event')
      .leftJoinAndSelect('event.location', 'location')
      .leftJoinAndSelect('event.images', 'images')
      .leftJoinAndSelect('booking.ticket', 'ticket')
      .where('booking.user.id = :userId', { userId });

    if (status) query.andWhere('booking.status = :status', { status });

    const [items, total] = await query
      .orderBy('booking.bookingDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map(b => this.toResponse(b)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, userId: number): Promise<BookingResponseDto> {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['user', 'event', 'event.location', 'event.images', 'ticket'],
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.user.id !== userId) throw new ForbiddenException('Access denied');
    return this.toResponse(booking);
  }

  async update(id: number, dto: UpdateBookingDto, userId: number): Promise<BookingResponseDto> {
    const booking = await this.bookingRepo.findOne({ where: { id }, relations: ['user'] });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.user.id !== userId) throw new ForbiddenException('Access denied');

    booking.status = dto.status;
    await this.bookingRepo.save(booking);
    return this.findOne(id, userId);
  }

  async cancel(id: number, userId: number): Promise<void> {
    const booking = await this.bookingRepo.findOne({ where: { id }, relations: ['user'] });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.user.id !== userId) throw new ForbiddenException('Access denied');
    if (booking.status === 'CANCELLED') throw new BadRequestException('Already cancelled');

    booking.status = 'CANCELLED';
    await this.bookingRepo.save(booking);
  }

  async getEventBookings(eventId: number, userId: number) {
    const event = await this.eventRepo.findOne({ where: { id: eventId }, relations: ['organizer'] });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizer.id !== userId) throw new ForbiddenException('Access denied');

    const bookings = await this.bookingRepo.find({
      where: { event: { id: eventId } },
      relations: ['user', 'ticket'],
      order: { bookingDate: 'DESC' },
    });

    return bookings.map(b => ({
      id: b.id,
      status: b.status,
      user: { id: b.user.id, name: b.user.name, email: b.user.email },
      ticket: { id: b.ticket.id, name: b.ticket.name, price: b.ticket.price },
      bookingDate: b.bookingDate,
    }));
  }

  private toResponse(booking: Booking): BookingResponseDto {
    return {
      id: booking.id,
      status: booking.status,
      user: { id: booking.user.id, name: booking.user.name, email: booking.user.email },
      event: {
        id: booking.event.id,
        name: booking.event.name,
        startDate: booking.event.startDate,
        city: booking.event.location.city,
        images: booking.event.images?.map(i => ({ id: i.id, imageUrl: i.imageUrl })) || [],
      },
      ticket: { id: booking.ticket.id, name: booking.ticket.name, price: booking.ticket.price },
      bookingDate: booking.bookingDate,
    };
  }
}