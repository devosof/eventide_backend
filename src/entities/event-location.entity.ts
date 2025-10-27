import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';
import { Event } from './event.entity';

@Entity()
export class EventLocation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  address: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  city: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  state: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  country: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  postalCode: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsUrl()
  googleMapsLink?: string;

  @OneToOne(() => Event, (event) => event.location, { onDelete: 'CASCADE' })
  event: Event;
}
