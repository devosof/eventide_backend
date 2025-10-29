import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Event } from '../entities/event.entity';
import { EventLocation } from '../entities/event-location.entity';
import { EventImage } from '../entities/event-image.entity';
import { Ticket } from '../entities/ticket.entity';
import { Category } from '../entities/category.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateEventDto, UpdateEventDto, FindEventsDto, EventResponseDto } from './dto/event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(EventLocation) private locationRepo: Repository<EventLocation>,
    @InjectRepository(EventImage) private imageRepo: Repository<EventImage>,
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async create(dto: CreateEventDto, userId: number): Promise<EventResponseDto> {
    const organizer = await this.userRepo.findOne({ where: { id: userId } });
    if (!organizer || organizer.role !== UserRole.ORGANIZER) {
      throw new ForbiddenException('Only organizers can create events');
    }

    
    const location = await this.locationRepo.save(this.locationRepo.create(dto.location));
    const categories = dto.categoryIds ? await this.categoryRepo.findBy({ id: In(dto.categoryIds) }) : [];

    const event = await this.eventRepo.save(
      this.eventRepo.create({
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        organizer,
        location,
        categories,
      })
    );

    if (dto.imageUrls?.length) {
      await this.imageRepo.save(dto.imageUrls.map(url => this.imageRepo.create({ imageUrl: url, event })));
    }

    await this.ticketRepo.save(
      dto.tickets.map(t => this.ticketRepo.create({
        ...t,
        salesStartDate: new Date(t.salesStartDate),
        salesEndDate: new Date(t.salesEndDate),
        event,
      }))
    );

    return this.findOne(event.id);
  }

  async findAll(dto: FindEventsDto) {
    const { page = 1, limit = 10, search, city, categoryId, startDate, endDate } = dto;
    const query = this.eventRepo.createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .leftJoinAndSelect('event.location', 'location')
      .leftJoinAndSelect('event.images', 'images')
      .leftJoinAndSelect('event.categories', 'categories')
      // .leftJoinAndSelect('event.tickets', 'tickets');


    if (search) query.andWhere('(event.name ILIKE :search OR event.description ILIKE :search)', { search: `%${search}%` });
    if (city) query.andWhere('location.city ILIKE :city', { city: `%${city}%` });
    if (categoryId) query.andWhere('categories.id = :categoryId', { categoryId });
    if (startDate) query.andWhere('event.startDate >= :startDate', { startDate });
    if (endDate) query.andWhere('event.endDate <= :endDate', { endDate });

    const [items, total] = await query
      .orderBy('event.startDate', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map(e => this.toResponse(e)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<EventResponseDto> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['organizer','organizer.organizerProfile', 'location', 'images', 'tickets', 'categories'],
    });
    if (!event) throw new NotFoundException('Event not found');
    return this.toResponse(event);
    
  }

  async update(id: number, dto: UpdateEventDto, userId: number): Promise<EventResponseDto> {
    const event = await this.eventRepo.findOne({ where: { id }, relations: ['organizer', 'location'] });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizer.id !== userId) throw new ForbiddenException('Access denied');

    Object.assign(event, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : event.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : event.endDate,
    });

    if (dto.location) await this.locationRepo.update(event.location.id, dto.location);
    if (dto.categoryIds) event.categories = await this.categoryRepo.findBy({ id: In(dto.categoryIds) });
    
    if (dto.imageUrls) {
      await this.imageRepo.delete({ event: { id } });
      await this.imageRepo.save(dto.imageUrls.map(url => this.imageRepo.create({ imageUrl: url, event })));
    }

    await this.eventRepo.save(event);
    return this.findOne(id);
  }

  async remove(id: number, userId: number): Promise<void> {
    const event = await this.eventRepo.findOne({ where: { id }, relations: ['organizer'] });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizer.id !== userId) throw new ForbiddenException('Access denied');
    await this.eventRepo.remove(event);
  }

  async getMyEvents(userId: number): Promise<EventResponseDto[]> {
    const events = await this.eventRepo.find({
      where: { organizer: { id: userId } },
      relations: ['organizer', 'location', 'images', 'categories'],
      order: { createdAt: 'DESC' },
    });
    return events.map(e => this.toResponse(e));
  }

  private toResponse(event: Event): EventResponseDto {
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      capacity: event.capacity,
      organizer: { 
        id: event.organizer.id, 
        name: event.organizer.name, 
        email: event.organizer.email,
        organizerProfile: event.organizer.organizerProfile ? {
          organizationName: event.organizer.organizerProfile.organizationName,
          address: event.organizer.organizerProfile.address,
          city: event.organizer.organizerProfile.city,
          country: event.organizer.organizerProfile.country,
          state: event.organizer.organizerProfile.state,

        }: undefined 
      },
      location: { ...event.location },
      images: event.images?.map(i => ({ id: i.id, imageUrl: i.imageUrl })) || [],
      tickets: event.tickets?.map(t => ({ id: t.id, name: t.name, price: t.price, salesStartDate: t.salesStartDate, salesEndDate: t.salesEndDate })) || [],
      categories: event.categories?.map(c => ({ id: c.id, name: c.name })) || [],
      createdAt: event.createdAt,
    };
  }
}