import {
  Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn
} from 'typeorm';
import { IsNotEmpty, IsString } from 'class-validator';
import { User } from './user.entity';

@Entity()
export class OrganizerProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.organizerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({name:'user_id', referencedColumnName:'id'})
  user: User;

  @Column()
  @IsNotEmpty()
  @IsString()
  organizationName: string;

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
  zipCode: string;
}
