import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateJobDto } from './dto/create-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Roles('CLIENT')
  @Post()
  create(@CurrentUser('id') clientId: string, @Body() dto: CreateJobDto) {
    return this.jobs.create(clientId, dto);
  }

  @Public()
  @Get()
  list(@Query() query: QueryJobsDto) {
    return this.jobs.list(query);
  }

  /** Joburile clientului curent (înaintea rutei cu :id). */
  @Roles('CLIENT')
  @Get('mine')
  mine(@CurrentUser('id') clientId: string) {
    return this.jobs.listMine(clientId);
  }

  @Public()
  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobs.getById(id);
  }

  @Roles('CLIENT')
  @Put(':id')
  update(
    @CurrentUser('id') clientId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobs.update(clientId, id, dto);
  }

  @Roles('CLIENT')
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(@CurrentUser('id') clientId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.jobs.remove(clientId, id);
  }

  /** Freelancerul angajat marchează livrarea. */
  @Roles('FREELANCER')
  @HttpCode(HttpStatus.OK)
  @Post(':id/deliver')
  deliver(@CurrentUser('id') freelancerId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.jobs.markDelivered(freelancerId, id);
  }

  /** Clientul confirmă finalizarea. */
  @Roles('CLIENT')
  @HttpCode(HttpStatus.OK)
  @Post(':id/complete')
  complete(@CurrentUser('id') clientId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.jobs.complete(clientId, id);
  }
}
