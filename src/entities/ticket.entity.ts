import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { IsNotEmpty, IsString, IsNumber, IsDateString } from 'class-validator';
import { Event } from './event.entity';
import { Booking } from './booking.entity';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  price: number;

  @Column({ type: 'timestamp' })
  @IsDateString()
  salesStartDate: Date;

  @Column({ type: 'timestamp' })
  @IsDateString()
  salesEndDate: Date;

  @ManyToOne(() => Event, (event) => event.tickets, { onDelete: 'CASCADE' })
  event: Event;

  @OneToMany(() => Booking, (booking) => booking.ticket)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
