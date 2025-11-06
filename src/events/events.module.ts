import { Module, UsePipes, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from '../entities/event.entity';
import { EventLocation } from '../entities/event-location.entity';
import { EventImage } from '../entities/event-image.entity';
import { Ticket } from '../entities/ticket.entity';
import { Category } from '../entities/category.entity';
import { User } from '../entities/user.entity';
import { APP_PIPE } from '@nestjs/core';
import { Booking } from 'src/entities/booking.entity';
import { UploadService } from 'src/upload/upload.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventLocation,
      EventImage,
      Ticket,
      Category,
      User,
      Booking,
    ]),

    
  ],
  controllers: [EventsController],
  providers: [EventsService, UploadService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true
      }),

    }
  ],
  exports: [EventsService],
})
export class EventsModule {}