import { IsOptional, IsString, IsUrl, Length, MaxLength } from 'class-validator';

export class UpdateClientProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;
}
