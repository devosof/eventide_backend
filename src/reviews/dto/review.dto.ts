import { IsNumber, IsString, IsNotEmpty, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsNumber() @IsNotEmpty() eventId: number;
  @IsNumber() @Min(1) @Max(5) rating: number;
  @IsString() @IsNotEmpty() comment: string;
}

export class UpdateReviewDto {
  @IsOptional() @IsNumber() @Min(1) @Max(5) rating?: number;
  @IsOptional() @IsString() @IsNotEmpty() comment?: string;
}

export class FindReviewsDto {
  @IsOptional() @Type(() => Number) page?: number = 1;
  @IsOptional() @Type(() => Number) limit?: number = 10;
  @IsOptional() @Type(() => Number) @Min(1) @Max(5) rating?: number;
}

export class ReviewResponseDto {
  id: number;
  rating: number;
  comment: string;
  reviewer: { id: number; name: string };
  event: {
    id: number;
    name: string;
    startDate: Date;
    city: string;
    images: { id: number; imageUrl: string }[];
  };
  createdAt: Date;
}

export class ReviewStatsDto {
  averageRating: number;
  totalReviews: number;
  ratings: { 1: number; 2: number; 3: number; 4: number; 5: number };
}