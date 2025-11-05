import * as path from 'path';
import { Booking } from 'src/entities/booking.entity';
import { Category } from 'src/entities/category.entity';
import { Event } from 'src/entities/event.entity';
import { EventImage } from 'src/entities/event-image.entity';
import { EventLocation } from 'src/entities/event-location.entity';
import { OrganizerProfile } from 'src/entities/organizer-profile.entity';
import { Review } from 'src/entities/review.entity';
import { Ticket } from 'src/entities/ticket.entity';
import { User } from 'src/entities/user.entity';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';

export default (): PostgresConnectionOptions => ({
  // TODO: access the url from the .env file after configuring the env later
  url: process.env.DATABASE_URL,
  type: 'postgres',
  port: 5432,
  entities: [
    User,
    Ticket,
    Review,
    OrganizerProfile,
    Event,
    EventLocation,
    EventImage,
    Category,
    Booking,
  ],
  synchronize: true, // this is only for development env (set to false for production)
  ssl: {
    rejectUnauthorized: false,
  },
});
