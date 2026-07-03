import { IsBoolean, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export class UpdateFreelancerProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  overview?: string;

  /** Tarif orar în cenți USD (ex. 5000 = $50.00). */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000_00)
  hourlyRateCents?: number;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
