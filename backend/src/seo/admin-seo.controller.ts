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
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateSeoDto } from './dto/update-seo.dto';
import { UpsertSeoDto } from './dto/upsert-seo.dto';
import { SeoService } from './seo.service';

@Roles('ADMIN')
@Controller('admin/seo')
export class AdminSeoController {
  constructor(private readonly seo: SeoService) {}

  @Get()
  list() {
    return this.seo.list();
  }

  @Post()
  create(@Body() dto: UpsertSeoDto) {
    return this.seo.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSeoDto) {
    return this.seo.update(id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.seo.remove(id);
  }
}
