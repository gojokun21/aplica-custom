import { Module } from '@nestjs/common';
import { ReviewsModule } from '../reviews/reviews.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { SkillsController } from './skills.controller';

@Module({
  imports: [ReviewsModule],
  controllers: [ProfilesController, SkillsController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
