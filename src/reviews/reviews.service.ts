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

  async create(dto: CreateReviewDto, userId: number): Promise<ReviewResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const event = await this.eventRepo.findOne({ where: { id: dto.eventId } });
    if (!event) throw new NotFoundException('Event not found');

    if (new Date() < event.endDate) {
      throw new BadRequestException('You can only review events that have ended');
    }

    const booking = await this.bookingRepo.findOne({
      where: { user: { id: userId }, event: { id: dto.eventId }, status: 'CONFIRMED' },
    });
    if (!booking) throw new BadRequestException('You can only review events you attended');

    const existing = await this.reviewRepo.findOne({
      where: { user: { id: userId }, event: { id: dto.eventId } },
    });
    if (existing) throw new BadRequestException('You already reviewed this event');

    const review = await this.reviewRepo.save(
      this.reviewRepo.create({ rating: dto.rating, comment: dto.comment, user, event })
    );

    return this.findOne(review.id);
  }

  async findEventReviews(eventId: number, dto: FindReviewsDto) {
    const { page = 1, limit = 10, rating } = dto;
    const query = this.reviewRepo.createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .where('review.event.id = :eventId', { eventId });

    if (rating) query.andWhere('review.rating = :rating', { rating });

    const [items, total] = await query
      .orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map(r => this.toResponse(r)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      stats: await this.getEventStats(eventId),
    };
  }

  async findMyReviews(userId: number): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewRepo.find({
      where: { user: { id: userId } },
      relations: ['event', 'event.location', 'event.images', 'user'],
      order: { createdAt: 'DESC' },
    });
    return reviews.map(r => this.toResponse(r));
  }

  async findOne(id: number): Promise<ReviewResponseDto> {
    const review = await this.reviewRepo.findOne({
      where: { id },
      relations: ['user', 'event', 'event.location', 'event.images'],
    });
    if (!review) throw new NotFoundException('Review not found');
    return this.toResponse(review);
  }

  async update(id: number, dto: UpdateReviewDto, userId: number): Promise<ReviewResponseDto> {
    const review = await this.reviewRepo.findOne({ where: { id }, relations: ['user'] });
    if (!review) throw new NotFoundException('Review not found');
    if (review.user.id !== userId) throw new ForbiddenException('Access denied');

    Object.assign(review, dto);
    await this.reviewRepo.save(review);
    return this.findOne(id);
  }

  async remove(id: number, userId: number): Promise<void> {
    const review = await this.reviewRepo.findOne({ where: { id }, relations: ['user'] });
    if (!review) throw new NotFoundException('Review not found');
    if (review.user.id !== userId) throw new ForbiddenException('Access denied');
    await this.reviewRepo.remove(review);
  }

  async getEventStats(eventId: number): Promise<ReviewStatsDto> {
    const reviews = await this.reviewRepo.find({ where: { event: { id: eventId } } });

    if (reviews.length === 0) {
      return { averageRating: 0, totalReviews: 0, ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }

    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    const ratings = reviews.reduce((acc, r) => { acc[r.rating]++; return acc; }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    return {
      averageRating: parseFloat((total / reviews.length).toFixed(2)),
      totalReviews: reviews.length,
      ratings,
    };
  }

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
        city: review.event.location.city,
        images: review.event.images?.map(i => ({ id: i.id, imageUrl: i.imageUrl })) || [],
      },
      createdAt: review.createdAt,
    };
  }
}