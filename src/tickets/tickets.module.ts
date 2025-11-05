import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { UsersService } from 'src/users/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from 'src/entities/ticket.entity';
import { OrganizerProfile } from 'src/entities/organizer-profile.entity';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      User,
      OrganizerProfile
    ])
  ],
  controllers: [TicketsController],
  providers: [TicketsService, UsersService],
})
export class TicketsModule {}
