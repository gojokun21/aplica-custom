import { IsInt, IsOptional, Max, MaxLength, Min } from 'class-validator';

export class CreateApplicationDto {
  @IsOptional()
  @MaxLength(5000)
  coverLetter?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  proposedRateCents?: number;
}
