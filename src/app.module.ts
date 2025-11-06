import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from './events/events.module';
import { TicketsModule } from './tickets/tickets.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CategoriesModule } from './categories/categories.module';
import { UploadModule } from './upload/upload.module';
import dbConfig from './config/dbConfig';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [dbConfig]
    }),
    TypeOrmModule.forRootAsync({
      useFactory: dbConfig
    }),
    UploadModule,
    UsersModule,
    AuthModule, 
    EventsModule, 
    TicketsModule, 
    BookingsModule, 
    ReviewsModule, 
    CategoriesModule, UploadModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
