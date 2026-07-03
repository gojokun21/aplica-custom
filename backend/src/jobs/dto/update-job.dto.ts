import { IsIn, IsInt, IsOptional, Max, MaxLength, Min } from 'class-validator';

const MAX_CENTS = 100_000_000;

export class UpdateJobDto {
  @IsOptional()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @MaxLength(10_000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_CENTS)
  budgetCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_CENTS)
  minRateCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_CENTS)
  maxRateCents?: number;

  @IsOptional()
  @IsIn(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}
