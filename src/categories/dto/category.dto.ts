import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCategoryDto {
  @IsString() @IsNotEmpty() name: string;
}

export class CategoryResponseDto {
  id: number;
  name: string;
  createdAt: Date;
}