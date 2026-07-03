import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';

@Controller()
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Roles('FREELANCER')
  @Post('jobs/:jobId/applications')
  apply(
    @CurrentUser('id') freelancerId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applications.apply(freelancerId, jobId, dto);
  }

  @Roles('CLIENT')
  @Get('jobs/:jobId/applications')
  listForJob(
    @CurrentUser('id') clientId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.applications.listForJob(clientId, jobId);
  }

  @Roles('FREELANCER')
  @Get('applications/mine')
  mine(@CurrentUser('id') freelancerId: string) {
    return this.applications.listMine(freelancerId);
  }

  @Roles('CLIENT')
  @HttpCode(HttpStatus.OK)
  @Post('applications/:id/accept')
  accept(@CurrentUser('id') clientId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.applications.accept(clientId, id);
  }

  @Roles('FREELANCER')
  @HttpCode(HttpStatus.OK)
  @Post('applications/:id/withdraw')
  withdraw(@CurrentUser('id') freelancerId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.applications.withdraw(freelancerId, id);
  }
}
