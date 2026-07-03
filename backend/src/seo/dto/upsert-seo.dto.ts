import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpsertSeoDto {
  /** Ruta de frontend (ex. "/", "/talent") sau "*" pentru valorile implicite. */
  @Matches(/^(\*|\/[\w\-/]*)$/, { message: 'Path invalid (ex. "/", "/talent" sau "*")' })
  @MaxLength(200)
  path: string;

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
