import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { IsEnum } from 'class-validator';
import { User } from './user.entity';
import { Ticket } from './ticket.entity';
import { Event } from './event.entity';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.bookings)
  user: User;

  @ManyToOne(() => Ticket, (ticket) => ticket.bookings, { eager: true })
  ticket: Ticket;

  @ManyToOne(() => Event, (event) => event.bookings)
  event: Event;

  @Column({
    type: 'enum',
    enum: ['CONFIRMED', 'CANCELLED', 'WAITLISTED'],
    default: 'CONFIRMED',
  })
  @IsEnum(['CONFIRMED', 'CANCELLED', 'WAITLISTED'])
  status: 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';

  @CreateDateColumn()
  bookingDate: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
