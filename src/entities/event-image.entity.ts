import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { IsUrl, IsNotEmpty } from 'class-validator';
import { Event } from './event.entity';

@Entity()
export class EventImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;

  @ManyToOne(() => Event, (event) => event.images, { onDelete: 'CASCADE' })
  event: Event;
}
