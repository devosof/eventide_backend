import {
  Entity, PrimaryGeneratedColumn, Column, ManyToMany,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { IsNotEmpty, IsString } from 'class-validator';
import { Event } from './event.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ManyToMany(() => Event, (event) => event.categories)
  events: Event[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
