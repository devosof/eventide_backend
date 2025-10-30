import { IsEmail, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { UserRole } from 'src/entities/user.entity';
import { CreateOrganizerProfileDto } from './user.dto';
export class CreateUserDto {
  @IsString()
  name: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole

  @IsOptional()
  @IsObject()
  organizerProfile?: CreateOrganizerProfileDto
}