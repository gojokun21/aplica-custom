import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { LegalService } from './legal.service';

@Controller('legal')
export class LegalController {
  constructor(private readonly legal: LegalService) {}

  /** Pagină legală după slug (ex. terms, privacy) — public. */
  @Public()
  @Get(':slug')
  getOne(@Param('slug') slug: string) {
    return this.legal.getBySlug(slug);
  }
}
