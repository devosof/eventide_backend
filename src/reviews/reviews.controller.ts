import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto, FindReviewsDto, ReviewResponseDto, ReviewStatsDto } from './dto/review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateReviewDto, @GetUser('userId') userId: number): Promise<ReviewResponseDto> {
    return this.reviewsService.create(dto, userId);
  }

  @Get('event/:eventId')
  findEventReviews(@Param('eventId', ParseIntPipe) eventId: number, @Query() dto: FindReviewsDto) {
    return this.reviewsService.findEventReviews(eventId, dto);
  }

  @Get('event/:eventId/stats')
  getEventStats(@Param('eventId', ParseIntPipe) eventId: number): Promise<ReviewStatsDto> {
    return this.reviewsService.getEventStats(eventId);
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  findMyReviews(@GetUser('userId') userId: number): Promise<ReviewResponseDto[]> {
    return this.reviewsService.findMyReviews(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ReviewResponseDto> {
    return this.reviewsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReviewDto, @GetUser('userId') userId: number): Promise<ReviewResponseDto> {
    return this.reviewsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @GetUser('userId') userId: number): Promise<void> {
    return this.reviewsService.remove(id, userId);
  }
}