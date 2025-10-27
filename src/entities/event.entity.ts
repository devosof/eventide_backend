import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn,
  OneToMany, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import {
  IsNotEmpty, IsString, IsOptional, IsDateString, IsNumber
} from 'class-validator';
import { User } from './user.entity';
import { EventLocation } from './event-location.entity';
import { EventImage } from './event-image.entity';
import { Ticket } from './ticket.entity';
import { Category } from './category.entity';
import { Booking } from './booking.entity';
import { Review } from './review.entity';

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column({ type: 'text' })
  @IsNotEmpty()
  description: string;

  @Column({ type: 'timestamp' })
  @IsDateString()
  startDate: Date;

  @Column({ type: 'timestamp' })
  @IsDateString()
  endDate: Date;

  @Column('int')
  @IsNumber()
  capacity: number;

  @ManyToOne(() => User, (user) => user.events, { eager: true })
  organizer: User;

  @OneToOne(() => EventLocation, (location) => location.event, { cascade: true })
  @JoinColumn()
  location: EventLocation;

  @OneToMany(() => EventImage, (image) => image.event, { cascade: true })
  images: EventImage[];

  @OneToMany(() => Ticket, (ticket) => ticket.event, { cascade: true })
  tickets: Ticket[];

  @OneToMany(() => Booking, (booking) => booking.event)
  bookings: Booking[];

  @OneToMany(() => Review, (review) => review.event)
  reviews: Review[];

  @ManyToMany(() => Category, (category) => category.events, { eager: true })
  @JoinTable()
  categories: Category[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
