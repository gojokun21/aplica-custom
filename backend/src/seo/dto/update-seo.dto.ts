import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSeoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  keywords?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ogImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  titleTemplate?: string;

  @IsOptional()
  @IsBoolean()
  noindex?: boolean;
}
