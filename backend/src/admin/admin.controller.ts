import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { AdminQueryDto } from './dto/admin-query.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  /* Users */
  @Get('users')
  listUsers(@Query() query: AdminQueryDto) {
    return this.admin.listUsers(query);
  }

  @Patch('users/:id/role')
  updateRole(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.admin.updateUserRole(adminId, id, dto.role);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('users/:id/block')
  block(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BlockUserDto,
  ) {
    return this.admin.setBlocked(adminId, id, dto.blocked);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('users/:id')
  deleteUser(@CurrentUser('id') adminId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.deleteUser(adminId, id);
  }

  /* Jobs */
  @Get('jobs')
  listJobs(@Query() query: AdminQueryDto) {
    return this.admin.listJobs(query);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('jobs/:id')
  deleteJob(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.deleteJob(id);
  }

  /* Reviews */
  @Get('reviews')
  listReviews(@Query() query: AdminQueryDto) {
    return this.admin.listReviews(query);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('reviews/:id')
  deleteReview(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.deleteReview(id);
  }
}
