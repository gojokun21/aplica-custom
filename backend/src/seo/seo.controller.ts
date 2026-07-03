import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { SeoService } from './seo.service';

@Controller('seo')
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  /** Config SEO efectiv pentru o rută (folosit de frontend, SSR). */
  @Public()
  @Get()
  resolve(@Query('path') path?: string) {
    return this.seo.resolve(path ?? '/');
  }
}
