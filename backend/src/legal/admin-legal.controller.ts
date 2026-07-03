import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateLegalDto } from './dto/update-legal.dto';
import { LegalService } from './legal.service';

@Roles('ADMIN')
@Controller('admin/legal')
export class AdminLegalController {
  constructor(private readonly legal: LegalService) {}

  @Get()
  list() {
    return this.legal.list();
  }

  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() dto: UpdateLegalDto) {
    return this.legal.update(slug, dto);
  }
}
