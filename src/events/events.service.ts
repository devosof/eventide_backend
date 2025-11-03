import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Event } from '../entities/event.entity';
import { EventLocation } from '../entities/event-location.entity';
import { EventImage } from '../entities/event-image.entity';
import { Ticket } from '../entities/ticket.entity';
import { Category } from '../entities/category.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateEventDto, UpdateEventDto, FindEventsDto, EventResponseDto } from './dto/event.dto';
import { Booking } from 'src/entities/booking.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(EventLocation) private locationRepo: Repository<EventLocation>,
    @InjectRepository(EventImage) private imageRepo: Repository<EventImage>,
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  // async create(dto: CreateEventDto, userId: number): Promise<EventResponseDto> {
  //   if (!userId) throw new BadRequestException('Invalid user ID');
  //   if (!dto) throw new BadRequestException('Event data is required');

  //   const organizer = await this.userRepo.findOne({ 
  //     where: { id: userId },
  //     relations: ['organizerProfile']
  //   });
    
  //   if (!organizer) throw new NotFoundException('User not found');
  //   if (organizer.role !== UserRole.ORGANIZER) {
  //     throw new ForbiddenException('Only organizers can create events');
  //   }

  //   // Validate dates
  //   const startDate = new Date(dto.startDate);
  //   const endDate = new Date(dto.endDate);
    
  //   if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
  //     throw new BadRequestException('Invalid date format');
  //   }
  //   if (startDate >= endDate) {
  //     throw new BadRequestException('End date must be after start date');
  //   }
  //   if (startDate < new Date()) {
  //     throw new BadRequestException('Start date must be in the future');
  //   }

  //   // Validate tickets
  //   if (!dto.tickets || dto.tickets.length === 0) {
  //     throw new BadRequestException('At least one ticket type is required');
  //   }

  //   try {
  //     const location = await this.locationRepo.save(this.locationRepo.create(dto.location));
      
  //     let categories: Category[] = [];
  //     if (dto.categoryIds && dto.categoryIds.length > 0) {
  //       categories = await this.categoryRepo.findBy({ id: In(dto.categoryIds) });
  //       if (categories.length !== dto.categoryIds.length) {
  //         throw new BadRequestException('One or more categories not found');
  //       }
  //     }

  //     const event = await this.eventRepo.save(
  //       this.eventRepo.create({
  //         name: dto.name,
  //         description: dto.description,
  //         startDate,
  //         endDate,
  //         capacity: dto.capacity,
  //         organizer,
  //         location,
  //         categories,
  //       })
  //     );

  //     if (dto.imageUrls && dto.imageUrls.length > 0) {
  //       const images = dto.imageUrls.map(url => this.imageRepo.create({ imageUrl: url, event }));
  //       await this.imageRepo.save(images);
  //     }

  //     const tickets = dto.tickets.map(t => {
  //       const salesStart = new Date(t.salesStartDate);
  //       const salesEnd = new Date(t.salesEndDate);
        
  //       if (salesStart >= salesEnd) {
  //         throw new BadRequestException('Ticket sales end date must be after start date');
  //       }
        
  //       return this.ticketRepo.create({
  //         name: t.name,
  //         price: t.price,
  //         salesStartDate: salesStart,
  //         salesEndDate: salesEnd,
  //         event,
  //       });
  //     });
      
  //     await this.ticketRepo.save(tickets);

  //     return this.findOne(event.id);
  //   } catch (error) {
  //     if (error instanceof BadRequestException || error instanceof NotFoundException) {
  //       throw error;
  //     }
  //     throw new BadRequestException('Failed to create event');
  //   }
  // }
  async create(dto: CreateEventDto, userId: number): Promise<EventResponseDto> {
    if (!userId) throw new BadRequestException('Invalid user ID');
    if (!dto) throw new BadRequestException('Event data is required');

    const organizer = await this.userRepo.findOne({ 
      where: { id: userId },
      relations: ['organizerProfile']
    });
    
    if (!organizer) throw new NotFoundException('User not found');
    if (organizer.role !== UserRole.ORGANIZER) {
      throw new ForbiddenException('Only organizers can create events');
    }

    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }
    if (startDate < new Date()) {
      throw new BadRequestException('Start date must be in the future');
    }

    // Validate tickets
    if (!dto.tickets || dto.tickets.length === 0) {
      throw new BadRequestException('At least one ticket type is required');
    }

    // Validate ticket dates
    for (const ticketDto of dto.tickets) {
      const salesStart = new Date(ticketDto.salesStartDate);
      const salesEnd = new Date(ticketDto.salesEndDate);
      
      if (salesStart >= salesEnd) {
        throw new BadRequestException(`Ticket "${ticketDto.name}": Sales end date must be after start date`);
      }
      if (salesEnd > startDate) {
        throw new BadRequestException(`Ticket "${ticketDto.name}": Sales must end before event starts`);
      }
    }

    try {
      const location = await this.locationRepo.save(this.locationRepo.create(dto.location));
      
      let categories: Category[] = [];
      if (dto.categoryIds && dto.categoryIds.length > 0) {
        categories = await this.categoryRepo.findBy({ id: In(dto.categoryIds) });
        if (categories.length !== dto.categoryIds.length) {
          throw new BadRequestException('One or more categories not found');
        }
      }

      const event = await this.eventRepo.save(
        this.eventRepo.create({
          name: dto.name,
          description: dto.description,
          startDate,
          endDate,
          capacity: dto.capacity,
          organizer,
          location,
          categories,
        })
      );

      if (dto.imageUrls && dto.imageUrls.length > 0) {
        const images = dto.imageUrls.map(url => this.imageRepo.create({ imageUrl: url, event }));
        await this.imageRepo.save(images);
      }

      const tickets = dto.tickets.map(t =>
        this.ticketRepo.create({
          name: t.name,
          price: t.price,
          salesStartDate: new Date(t.salesStartDate),
          salesEndDate: new Date(t.salesEndDate),
          event,
        })
      );
      
      await this.ticketRepo.save(tickets);

      return this.findOne(event.id);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to create event');
    }
  }

  // async findAll(dto: FindEventsDto) {
  //   const { page = 1, limit = 10, search, city, categoryId, startDate, endDate } = dto;
  //   const query = this.eventRepo.createQueryBuilder('event')
  //     .leftJoinAndSelect('event.organizer', 'organizer')
  //     .leftJoinAndSelect('event.location', 'location')
  //     .leftJoinAndSelect('event.images', 'images')
  //     .leftJoinAndSelect('event.categories', 'categories')
  //     // .leftJoinAndSelect('event.tickets', 'tickets');


  //   if (search) query.andWhere('(event.name ILIKE :search OR event.description ILIKE :search)', { search: `%${search}%` });
  //   if (city) query.andWhere('location.city ILIKE :city', { city: `%${city}%` });
  //   if (categoryId) query.andWhere('categories.id = :categoryId', { categoryId });
  //   if (startDate) query.andWhere('event.startDate >= :startDate', { startDate });
  //   if (endDate) query.andWhere('event.endDate <= :endDate', { endDate });

  //   const [items, total] = await query
  //     .orderBy('event.startDate', 'ASC')
  //     .skip((page - 1) * limit)
  //     .take(limit)
  //     .getManyAndCount();

  //   return {
  //     items: items.map(e => this.toResponse(e)),
  //     total,
  //     page,
  //     limit,
  //     pages: Math.ceil(total / limit),
  //   };
  // }
  async findAll(dto: FindEventsDto) {
    const { page = 1, limit = 10, search, city, categoryId, startDate, endDate } = dto;
    
    if (page < 1) throw new BadRequestException('Page must be greater than 0');
    if (limit < 1 || limit > 100) throw new BadRequestException('Limit must be between 1 and 100');

    const query = this.eventRepo.createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .leftJoinAndSelect('event.location', 'location')
      .leftJoinAndSelect('event.images', 'images')
      .leftJoinAndSelect('event.categories', 'categories');

    if (search) {
      query.andWhere('(event.name ILIKE :search OR event.description ILIKE :search)', 
        { search: `%${search}%` }
      );
    }
    if (city) query.andWhere('location.city ILIKE :city', { city: `%${city}%` });
    if (categoryId) query.andWhere('categories.id = :categoryId', { categoryId });
    if (startDate) query.andWhere('event.startDate >= :startDate', { startDate: new Date(startDate) });
    if (endDate) query.andWhere('event.endDate <= :endDate', { endDate: new Date(endDate) });

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


  // async findOne(id: number): Promise<EventResponseDto> {
  //   const event = await this.eventRepo.findOne({
  //     where: { id },
  //     relations: ['organizer','organizer.organizerProfile', 'location', 'images', 'tickets', 'categories'],
  //   });
  //   if (!event) throw new NotFoundException('Event not found');
  //   return this.toResponse(event);
    
  // }
    async findOne(id: number): Promise<EventResponseDto> {
    if (!id || id < 1) throw new BadRequestException('Invalid event ID');

    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['organizer', 'organizer.organizerProfile', 'location', 'images', 'tickets', 'categories'],
    });
    
    if (!event) throw new NotFoundException('Event not found');
    return this.toResponse(event);
  }

  // async update(id: number, dto: UpdateEventDto, userId: number): Promise<EventResponseDto> {
  //   const event = await this.eventRepo.findOne({ where: { id }, relations: ['organizer', 'location'] });
  //   if (!event) throw new NotFoundException('Event not found');
  //   if (event.organizer.id !== userId) throw new ForbiddenException('Access denied');

  //   Object.assign(event, {
  //     ...dto,
  //     startDate: dto.startDate ? new Date(dto.startDate) : event.startDate,
  //     endDate: dto.endDate ? new Date(dto.endDate) : event.endDate,
  //   });

  //   if (dto.location) await this.locationRepo.update(event.location.id, dto.location);
  //   if (dto.categoryIds) event.categories = await this.categoryRepo.findBy({ id: In(dto.categoryIds) });
    
  //   if (dto.imageUrls) {
  //     await this.imageRepo.delete({ event: { id } });
  //     await this.imageRepo.save(dto.imageUrls.map(url => this.imageRepo.create({ imageUrl: url, event })));
  //   }

  //   await this.eventRepo.save(event);
  //   return this.findOne(id);
  // }


  async update(id: number, dto: UpdateEventDto, userId: number): Promise<EventResponseDto> {
    if (!id || id < 1) throw new BadRequestException('Invalid event ID');
    if (!userId) throw new BadRequestException('Invalid user ID');
    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('Update data is required');
    }

    const event = await this.eventRepo.findOne({ 
      where: { id }, 
      relations: ['organizer', 'location', 'categories', 'tickets'] 
    });
    
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizer.id !== userId) throw new ForbiddenException('Access denied');

    // Check if event has started (can't update past/ongoing events)
    if (new Date() >= event.startDate) {
      throw new BadRequestException('Cannot update events that have started or ended');
    }

    // Validate and update dates
    if (dto.startDate || dto.endDate) {
      const startDate = dto.startDate ? new Date(dto.startDate) : event.startDate;
      const endDate = dto.endDate ? new Date(dto.endDate) : event.endDate;
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }
      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after start date');
      }
      if (startDate < new Date()) {
        throw new BadRequestException('Start date must be in the future');
      }
      
      event.startDate = startDate;
      event.endDate = endDate;
    }

    // Update basic fields
    if (dto.name) event.name = dto.name;
    if (dto.description) event.description = dto.description;
    if (dto.capacity) event.capacity = dto.capacity;

    // Update location
    if (dto.location) {
      await this.locationRepo.update(event.location.id, dto.location);
    }

    // Update categories
    if (dto.categoryIds) {
      const categories = await this.categoryRepo.findBy({ id: In(dto.categoryIds) });
      if (categories.length !== dto.categoryIds.length) {
        throw new BadRequestException('One or more categories not found');
      }
      event.categories = categories;
    }
    
    // Update images
    if (dto.imageUrls !== undefined) {
      await this.imageRepo.delete({ event: { id } });
      if (dto.imageUrls.length > 0) {
        const images = dto.imageUrls.map(url => this.imageRepo.create({ imageUrl: url, event }));
        await this.imageRepo.save(images);
      }
    }

    // Update tickets
    if (dto.tickets) {
      // Check if there are existing bookings
      const existingBookings = await this.bookingRepo.count({
        where: { event: { id }, status: In(['CONFIRMED', 'WAITLISTED']) }
      });

      if (existingBookings > 0) {
        throw new BadRequestException('Cannot update tickets when bookings exist. Cancel bookings first.');
      }

      // Delete old tickets and create new ones
      await this.ticketRepo.delete({ event: { id } });

      const tickets = dto.tickets.map(t => {
        const salesStart = new Date(t.salesStartDate);
        const salesEnd = new Date(t.salesEndDate);
        
        if (salesStart >= salesEnd) {
          throw new BadRequestException(`Ticket "${t.name}": Sales end date must be after start date`);
        }
        
        return this.ticketRepo.create({
          name: t.name,
          price: t.price,
          salesStartDate: salesStart,
          salesEndDate: salesEnd,
          event,
        });
      });

      await this.ticketRepo.save(tickets);
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

  // async getMyEvents(userId: number): Promise<EventResponseDto[]> {
  //   const events = await this.eventRepo.find({
  //     where: { organizer: { id: userId } },
  //     relations: ['organizer', 'location', 'images', 'categories'],
  //     order: { createdAt: 'DESC' },
  //   });
  //   return events.map(e => this.toResponse(e));
  // }


  // NEW: Get event analytics for organizer
    async getMyEvents(userId: number): Promise<EventResponseDto[]> {
    if (!userId) throw new BadRequestException('Invalid user ID');

    const events = await this.eventRepo.find({
      where: { organizer: { id: userId } },
      relations: ['organizer', 'organizer.organizerProfile', 'location', 'images', 'tickets', 'categories'],
      order: { createdAt: 'DESC' },
    });
    
    return events.map(e => this.toResponse(e));
  }
  
  
  async getEventAnalytics(eventId: number, userId: number) {
    if (!eventId || eventId < 1) throw new BadRequestException('Invalid event ID');
    if (!userId) throw new BadRequestException('Invalid user ID');

    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['organizer', 'tickets', 'bookings', 'bookings.ticket'],
    });

    if (!event) throw new NotFoundException('Event not found');
    if (event.organizer.id !== userId) throw new ForbiddenException('Access denied');

    const totalBookings = event.bookings?.length || 0;
    const confirmedBookings = event.bookings?.filter(b => b.status === 'CONFIRMED').length || 0;
    const cancelledBookings = event.bookings?.filter(b => b.status === 'CANCELLED').length || 0;

    const totalRevenue = event.bookings
      ?.filter(b => b.status === 'CONFIRMED')
      .reduce((sum, b) => sum + Number(b.ticket.price), 0) || 0;

    const ticketsSold = event.tickets?.map(ticket => {
      const sold = event.bookings
        ?.filter(b => b.ticket.id === ticket.id && b.status === 'CONFIRMED').length || 0;
      
      return {
        ticketName: ticket.name,
        price: ticket.price,
        sold,
        revenue: sold * Number(ticket.price),
      };
    }) || [];

    return {
      eventId: event.id,
      eventName: event.name,
      capacity: event.capacity,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      availableSpots: event.capacity - confirmedBookings,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      ticketsSold,
      eventStatus: this.getEventStatus(event),
    };
  }

  // NEW: Get organizer dashboard statistics
  async getOrganizerStats(userId: number) {
    if (!userId) throw new BadRequestException('Invalid user ID');

    const events = await this.eventRepo.find({
      where: { organizer: { id: userId } },
      relations: ['bookings', 'bookings.ticket'],
    });

    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => e.startDate > new Date()).length;
    const pastEvents = events.filter(e => e.endDate < new Date()).length;
    const ongoingEvents = events.filter(e => 
      e.startDate <= new Date() && e.endDate >= new Date()
    ).length;

    const totalRevenue = events.reduce((sum, event) => {
      const eventRevenue = event.bookings
        ?.filter(b => b.status === 'CONFIRMED')
        .reduce((s, b) => s + Number(b.ticket.price), 0) || 0;
      return sum + eventRevenue;
    }, 0);

    const totalBookings = events.reduce((sum, event) => 
      sum + (event.bookings?.filter(b => b.status === 'CONFIRMED').length || 0), 0
    );

    return {
      totalEvents,
      upcomingEvents,
      ongoingEvents,
      pastEvents,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalBookings,
    };
  }

  private getEventStatus(event: Event): string {
    const now = new Date();
    if (now < event.startDate) return 'UPCOMING';
    if (now >= event.startDate && now <= event.endDate) return 'ONGOING';
    return 'PAST';
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