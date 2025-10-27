import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  Unique, CreateDateColumn, UpdateDateColumn,
  JoinColumn
} from 'typeorm';
import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';
import { User } from './user.entity';
import { Event } from './event.entity';

@Entity()
@Unique(['user', 'event'])
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @Column('text')
  @IsNotEmpty()
  @IsString()
  comment: string;

  @ManyToOne(() => User, (user) => user.reviews)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Event, (event) => event.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
