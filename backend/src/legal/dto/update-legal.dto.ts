import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLegalDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100_000)
  content?: string;
}
