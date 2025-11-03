import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { Event } from '../entities/event.entity';
import { User } from '../entities/user.entity';
import { Booking } from '../entities/booking.entity';
import { CreateReviewDto, UpdateReviewDto, FindReviewsDto, ReviewResponseDto, ReviewStatsDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
  ) {}

  // async create(dto: CreateReviewDto, userId: number): Promise<ReviewResponseDto> {
  //   const user = await this.userRepo.findOne({ where: { id: userId } });
  //   if (!user) throw new NotFoundException('User not found');

  //   const event = await this.eventRepo.findOne({ where: { id: dto.eventId } });
  //   if (!event) throw new NotFoundException('Event not found');

  //   if (new Date() < event.endDate) {
  //     throw new BadRequestException('You can only review events that have ended');
  //   }

  //   const booking = await this.bookingRepo.findOne({
  //     where: { user: { id: userId }, event: { id: dto.eventId }, status: 'CONFIRMED' },
  //   });
  //   if (!booking) throw new BadRequestException('You can only review events you attended');

  //   const existing = await this.reviewRepo.findOne({
  //     where: { user: { id: userId }, event: { id: dto.eventId } },
  //   });
  //   if (existing) throw new BadRequestException('You already reviewed this event');

  //   const review = await this.reviewRepo.save(
  //     this.reviewRepo.create({ rating: dto.rating, comment: dto.comment, user, event })
  //   );

  //   return this.findOne(review.id);
  // }
  async create(dto: CreateReviewDto, userId: number): Promise<ReviewResponseDto> {
    if (!userId) throw new BadRequestException('Invalid user ID');
    if (!dto || !dto.eventId || !dto.rating || !dto.comment) {
      throw new BadRequestException('Event ID, rating, and comment are required');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const event = await this.eventRepo.findOne({ 
      where: { id: dto.eventId },
      relations: ['location']
    });
    if (!event) throw new NotFoundException('Event not found');

    // Check if event has ended
    if (new Date() < event.endDate) {
      throw new BadRequestException('You can only review events that have ended');
    }

    // Check if user attended the event
    const booking = await this.bookingRepo.findOne({
      where: { 
        user: { id: userId }, 
        event: { id: dto.eventId }, 
        status: 'CONFIRMED' 
      },
    });
    if (!booking) {
      throw new BadRequestException('You can only review events you attended');
    }

    // Check for existing review
    const existing = await this.reviewRepo.findOne({
      where: { user: { id: userId }, event: { id: dto.eventId } },
    });
    if (existing) {
      throw new BadRequestException('You have already reviewed this event');
    }

    try {
      const review = await this.reviewRepo.save(
        this.reviewRepo.create({ 
          rating: dto.rating, 
          comment: dto.comment, 
          user, 
          event 
        })
      );

      return this.findOne(review.id);
    } catch (error) {
      throw new BadRequestException('Failed to create review');
    }
  }

  // async findEventReviews(eventId: number, dto: FindReviewsDto) {
  //   const { page = 1, limit = 10, rating } = dto;
  //   const query = this.reviewRepo.createQueryBuilder('review')
  //     .leftJoinAndSelect('review.user', 'user')
  //     .where('review.event.id = :eventId', { eventId });

  //   if (rating) query.andWhere('review.rating = :rating', { rating });

  //   const [items, total] = await query
  //     .orderBy('review.createdAt', 'DESC')
  //     .skip((page - 1) * limit)
  //     .take(limit)
  //     .getManyAndCount();

  //   return {
  //     items: items.map(r => this.toResponse(r)),
  //     total,
  //     page,
  //     limit,
  //     pages: Math.ceil(total / limit),
  //     stats: await this.getEventStats(eventId),
  //   };
  // }
  async findEventReviews(eventId: number, dto: FindReviewsDto) {
    if (!eventId || eventId < 1) throw new BadRequestException('Invalid event ID');
    
    const { page = 1, limit = 10, rating } = dto;
    
    if (page < 1) throw new BadRequestException('Page must be greater than 0');
    if (limit < 1 || limit > 100) throw new BadRequestException('Limit must be between 1 and 100');

    // Verify event exists
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    try {
      const query = this.reviewRepo.createQueryBuilder('review')
        .leftJoinAndSelect('review.user', 'user')
        .where('review.event.id = :eventId', { eventId });

      if (rating && rating >= 1 && rating <= 5) {
        query.andWhere('review.rating = :rating', { rating });
      }

      const [items, total] = await query
        .orderBy('review.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return {
        items: items.map(r => this.toListResponse(r)),
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        stats: await this.getEventStats(eventId),
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch reviews');
    }
  }

  // async findMyReviews(userId: number): Promise<ReviewResponseDto[]> {
  //   const reviews = await this.reviewRepo.find({
  //     where: { user: { id: userId } },
  //     relations: ['event', 'event.location', 'event.images', 'user'],
  //     order: { createdAt: 'DESC' },
  //   });
  //   return reviews.map(r => this.toResponse(r));
  // }

  async findMyReviews(userId: number): Promise<ReviewResponseDto[]> {
    if (!userId) throw new BadRequestException('Invalid user ID');

    try {
      const reviews = await this.reviewRepo.find({
        where: { user: { id: userId } },
        relations: ['event', 'event.location', 'event.images', 'user'],
        order: { createdAt: 'DESC' },
      });
      
      return reviews.map(r => this.toResponse(r));
    } catch (error) {
      throw new BadRequestException('Failed to fetch your reviews');
    }
  }

  // async findOne(id: number): Promise<ReviewResponseDto> {
  //   const review = await this.reviewRepo.findOne({
  //     where: { id },
  //     relations: ['user', 'event', 'event.location', 'event.images'],
  //   });
  //   if (!review) throw new NotFoundException('Review not found');
  //   return this.toResponse(review);
  // }

  async findOne(id: number): Promise<ReviewResponseDto> {
    if (!id || id < 1) throw new BadRequestException('Invalid review ID');

    const review = await this.reviewRepo.findOne({
      where: { id },
      relations: ['user', 'event', 'event.location', 'event.images'],
    });
    
    if (!review) throw new NotFoundException('Review not found');
    return this.toResponse(review);
  }


  // async update(id: number, dto: UpdateReviewDto, userId: number): Promise<ReviewResponseDto> {
  //   const review = await this.reviewRepo.findOne({ where: { id }, relations: ['user'] });
  //   if (!review) throw new NotFoundException('Review not found');
  //   if (review.user.id !== userId) throw new ForbiddenException('Access denied');

  //   Object.assign(review, dto);
  //   await this.reviewRepo.save(review);
  //   return this.findOne(id);
  // }

  async update(id: number, dto: UpdateReviewDto, userId: number): Promise<ReviewResponseDto> {
    if (!id || id < 1) throw new BadRequestException('Invalid review ID');
    if (!userId) throw new BadRequestException('Invalid user ID');
    if (!dto || (!dto.rating && !dto.comment)) {
      throw new BadRequestException('Rating or comment is required');
    }

    const review = await this.reviewRepo.findOne({ 
      where: { id }, 
      relations: ['user'] 
    });
    
    if (!review) throw new NotFoundException('Review not found');
    if (review.user.id !== userId) throw new ForbiddenException('Access denied');

    if (dto.rating) review.rating = dto.rating;
    if (dto.comment) review.comment = dto.comment;

    await this.reviewRepo.save(review);
    return this.findOne(id);
  }


  // async remove(id: number, userId: number): Promise<void> {
  //   const review = await this.reviewRepo.findOne({ where: { id }, relations: ['user'] });
  //   if (!review) throw new NotFoundException('Review not found');
  //   if (review.user.id !== userId) throw new ForbiddenException('Access denied');
  //   await this.reviewRepo.remove(review);
  // }

  async remove(id: number, userId: number): Promise<void> {
    if (!id || id < 1) throw new BadRequestException('Invalid review ID');
    if (!userId) throw new BadRequestException('Invalid user ID');

    const review = await this.reviewRepo.findOne({ 
      where: { id }, 
      relations: ['user'] 
    });
    
    if (!review) throw new NotFoundException('Review not found');
    if (review.user.id !== userId) throw new ForbiddenException('Access denied');

    await this.reviewRepo.remove(review);
  }

  // async getEventStats(eventId: number): Promise<ReviewStatsDto> {
  //   const reviews = await this.reviewRepo.find({ where: { event: { id: eventId } } });

  //   if (reviews.length === 0) {
  //     return { averageRating: 0, totalReviews: 0, ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  //   }

  //   const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  //   const ratings = reviews.reduce((acc, r) => { acc[r.rating]++; return acc; }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  //   return {
  //     averageRating: parseFloat((total / reviews.length).toFixed(2)),
  //     totalReviews: reviews.length,
  //     ratings,
  //   };
  // }

   async getEventStats(eventId: number): Promise<ReviewStatsDto> {
    if (!eventId || eventId < 1) throw new BadRequestException('Invalid event ID');

    try {
      const reviews = await this.reviewRepo.find({ 
        where: { event: { id: eventId } } 
      });

      if (reviews.length === 0) {
        return { 
          averageRating: 0, 
          totalReviews: 0, 
          ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } 
        };
      }

      const total = reviews.reduce((sum, r) => sum + r.rating, 0);
      const ratings = reviews.reduce(
        (acc, r) => { 
          acc[r.rating]++; 
          return acc; 
        }, 
        { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      );

      return {
        averageRating: parseFloat((total / reviews.length).toFixed(2)),
        totalReviews: reviews.length,
        ratings,
      };
    } catch (error) {
      throw new BadRequestException('Failed to calculate event statistics');
    }
  }

  // private toResponse(review: Review): ReviewResponseDto {
  //   return {
  //     id: review.id,
  //     rating: review.rating,
  //     comment: review.comment,
  //     reviewer: { id: review.user.id, name: review.user.name },
  //     event: {
  //       id: review.event.id,
  //       name: review.event.name,
  //       startDate: review.event.startDate,
  //       city: review.event.location.city,
  //       images: review.event.images?.map(i => ({ id: i.id, imageUrl: i.imageUrl })) || [],
  //     },
  //     createdAt: review.createdAt,
  //   };
  // }


  private toResponse(review: Review): ReviewResponseDto {
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      reviewer: { id: review.user.id, name: review.user.name },
      event: {
        id: review.event.id,
        name: review.event.name,
        startDate: review.event.startDate,
        city: review.event.location?.city || 'N/A',
        images: review.event.images?.map(i => ({ id: i.id, imageUrl: i.imageUrl })) || [],
      },
      createdAt: review.createdAt,
    };
  }

  private toListResponse(review: Review): Omit<ReviewResponseDto, 'event'> & { event: undefined } {
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      reviewer: { id: review.user.id, name: review.user.name },
      event: undefined,
      createdAt: review.createdAt,
    };
  }
}
