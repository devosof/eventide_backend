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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventLocation,
      EventImage,
      Ticket,
      Category,
      User,
    ]),

    
  ],
  controllers: [EventsController],
  providers: [EventsService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe
    }
  ],
  exports: [EventsService],
})
export class EventsModule {}