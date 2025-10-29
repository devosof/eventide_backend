import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review } from '../entities/review.entity';
import { Event } from '../entities/event.entity';
import { User } from '../entities/user.entity';
import { Booking } from '../entities/booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Event, User, Booking]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}