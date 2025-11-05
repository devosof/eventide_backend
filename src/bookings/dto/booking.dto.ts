import { IsNumber, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @IsNumber() @IsNotEmpty() eventId: number;
  @IsNumber() @IsNotEmpty() ticketId: number;
}

export class UpdateBookingDto {
  @IsEnum(['CONFIRMED', 'CANCELLED', 'WAITLISTED'])
  status: 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';
}

export class FindBookingsDto {
  @IsOptional() @Type(() => Number) page?: number = 1;
  @IsOptional() @Type(() => Number) limit?: number = 10;
  @IsOptional() @IsEnum(['CONFIRMED', 'CANCELLED', 'WAITLISTED']) status?: string;
}

export class BookingResponseDto {
  id: number;
  status: string;
  user: { id: number; name: string; email: string };
  event: {
    id: number;
    name: string;
    startDate: Date;
    endDate: Date;
    city: string;
    images: { id: number; imageUrl: string }[];
  };
  ticket: { id: number; name: string; price: number };
  bookingDate: Date;
}