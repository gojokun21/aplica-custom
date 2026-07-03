import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ProfilesService } from './profiles.service';

@Controller('skills')
export class SkillsController {
  constructor(private readonly profiles: ProfilesService) {}

  /** Catalogul de skill-uri (public). */
  @Public()
  @Get()
  list() {
    return this.profiles.listSkills();
  }
}
