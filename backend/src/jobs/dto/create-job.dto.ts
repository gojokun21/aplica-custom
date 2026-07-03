import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const MAX_CENTS = 100_000_000; // $1.000.000

export class CreateJobDto {
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @IsNotEmpty()
  @MaxLength(10_000)
  description: string;

  @IsIn(['FIXED', 'HOURLY'])
  budgetType: 'FIXED' | 'HOURLY';

  /** Obligatoriu pentru FIXED. */
  @ValidateIf((o) => o.budgetType === 'FIXED')
  @IsInt()
  @Min(0)
  @Max(MAX_CENTS)
  budgetCents?: number;

  /** Obligatorii pentru HOURLY. */
  @ValidateIf((o) => o.budgetType === 'HOURLY')
  @IsInt()
  @Min(0)
  @Max(MAX_CENTS)
  minRateCents?: number;

  @ValidateIf((o) => o.budgetType === 'HOURLY')
  @IsInt()
  @Min(0)
  @Max(MAX_CENTS)
  maxRateCents?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  skillIds?: string[];
}
