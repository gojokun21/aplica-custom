import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class QueryFreelancersDto {
  /** Căutare text în nume, titlu și descriere. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  /** Slug de skill (ex. "react"). */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  skill?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 12;
}
