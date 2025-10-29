import { IsString, IsNotEmpty, IsDateString, IsNumber, IsArray, ValidateNested, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Nested DTOs
export class LocationDto {
  @IsString() @IsNotEmpty() address: string;
  @IsString() @IsNotEmpty() city: string;
  @IsString() @IsNotEmpty() state: string;
  @IsString() @IsNotEmpty() country: string;
  @IsString() @IsNotEmpty() postalCode: string;
  @IsOptional() @IsString() googleMapsLink?: string;
}

export class TicketDto {
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() @Min(0) price: number;
  @IsDateString() salesStartDate: string;
  @IsDateString() salesEndDate: string;
}

// Base Event DTO
export class BaseEventDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() description: string;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsNumber() @Min(1) capacity: number;
}

// Create Event
export class CreateEventDto extends BaseEventDto {
  @ValidateNested() @Type(() => LocationDto) location: LocationDto;
  @IsOptional() @IsArray() @IsString({ each: true }) imageUrls?: string[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => TicketDto) tickets: TicketDto[];
  @IsOptional() @IsArray() @IsNumber({}, { each: true }) categoryIds?: number[];
}

// Update Event
export class UpdateEventDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsNumber() @Min(1) capacity?: number;
  @IsOptional() @ValidateNested() @Type(() => LocationDto) location?: LocationDto;
  @IsOptional() @IsArray() @IsString({ each: true }) imageUrls?: string[];
  @IsOptional() @IsArray() @IsNumber({}, { each: true }) categoryIds?: number[];
}

// Query
export class FindEventsDto {
  @IsOptional() @Type(() => Number) page?: number = 1;
  @IsOptional() @Type(() => Number) limit?: number = 10;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @Type(() => Number) categoryId?: number;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}

// Response
export class EventResponseDto {
  id: number;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
  organizer: {
    id: number; name: string; email: string,
    organizerProfile?: {
      organizationName: string;
      address: string;
      city: string;
      state: string;
      country: string;
    }
  };
  location: LocationDto & { id: number };
  images: { id: number; imageUrl: string }[];
  tickets: { id: number; name: string; price: number; salesStartDate: Date; salesEndDate: Date }[];
  categories: { id: number; name: string }[];
  createdAt: Date;
}