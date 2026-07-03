import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post('jobs/:jobId/reviews')
  create(
    @CurrentUser('id') reviewerId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.create(reviewerId, jobId, dto);
  }

  @Public()
  @Get('jobs/:jobId/reviews')
  listForJob(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.reviews.listForJob(jobId);
  }

  @Public()
  @Get('users/:userId/reviews')
  listForUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.reviews.listForUser(userId);
  }
}
