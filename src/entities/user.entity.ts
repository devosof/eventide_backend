import {
  Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany,
  CreateDateColumn, UpdateDateColumn,
  BeforeInsert
} from 'typeorm';
import { IsEmail, IsNotEmpty, IsEnum, IsString, Length } from 'class-validator';
import { OrganizerProfile } from './organizer-profile.entity';
import { Booking } from './booking.entity';
import { Review } from './review.entity';
import { Event } from './event.entity';
import bcrypt from 'bcrypt'

export enum UserRole {
  ATTENDEE = 'ATTENDEE',
  ORGANIZER = 'ORGANIZER',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  @Length(2,100)
  name: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column()
  @IsNotEmpty()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ATTENDEE
  })
  @IsEnum(UserRole)
  role: UserRole

  @Column({
    type: 'text',
    nullable: true,
  })
  refreshTokenHash?: string | null;

  @OneToOne(() => OrganizerProfile, (profile) => profile.user, { cascade: true })
  organizerProfile: OrganizerProfile;

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => Event, (event) => event.organizer)
  events: Event[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // @BeforeInsert()
  // async hashPassword(){
  //   this.password = await bcrypt.hash(this.password, 10)
  // }
}
