import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../db/schema';
import { QueryFreelancersDto } from './dto/query-freelancers.dto';
import { SetSkillsDto } from './dto/set-skills.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { UpdateFreelancerProfileDto } from './dto/update-freelancer-profile.dto';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  /** Profilul utilizatorului curent (în funcție de rol). */
  @Get('me')
  me(@CurrentUser() user: { id: string; role: UserRole }) {
    return this.profiles.getMyProfile(user.id, user.role);
  }

  @Roles('FREELANCER')
  @Put('freelancer')
  updateFreelancer(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateFreelancerProfileDto,
  ) {
    return this.profiles.updateFreelancer(userId, dto);
  }

  @Roles('FREELANCER')
  @Put('freelancer/skills')
  setSkills(@CurrentUser('id') userId: string, @Body() dto: SetSkillsDto) {
    return this.profiles.setSkills(userId, dto);
  }

  @Roles('CLIENT')
  @Put('client')
  updateClient(@CurrentUser('id') userId: string, @Body() dto: UpdateClientProfileDto) {
    return this.profiles.updateClient(userId, dto);
  }

  /** Listare + filtrare publică de freelanceri. */
  @Public()
  @Get('freelancers')
  listFreelancers(@Query() query: QueryFreelancersDto) {
    return this.profiles.listFreelancers(query);
  }

  /** Vizualizare publică după slug SEO (ex. ion-popescu). */
  @Public()
  @Get('freelancers/by-slug/:slug')
  publicFreelancerBySlug(@Param('slug') slug: string) {
    return this.profiles.getPublicFreelancerBySlug(slug);
  }

  /** Vizualizare publică a profilului unui freelancer după userId. */
  @Public()
  @Get('freelancers/:userId')
  publicFreelancer(@Param('userId') userId: string) {
    return this.profiles.getPublicFreelancer(userId);
  }
}
