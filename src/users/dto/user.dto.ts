import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() name?: string;
}

export class CreateOrganizerProfileDto {
  @IsString() @IsNotEmpty() organizationName: string;
  @IsString() @IsNotEmpty() address: string;
  @IsString() @IsNotEmpty() city: string;
  @IsString() @IsNotEmpty() state: string;
  @IsString() @IsNotEmpty() country: string;
  @IsString() @IsNotEmpty() zipCode: string;
}

export class UserResponseDto {
  id: number;
  name: string;
  email: string;
  role: string;
  organizerProfile?: {
    id: number;
    organizationName: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  createdAt: Date;
}