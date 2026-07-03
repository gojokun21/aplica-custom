import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  /** Rolul ales la înregistrare. ADMIN nu se poate seta de aici. */
  @IsOptional()
  @IsIn(['CLIENT', 'FREELANCER'])
  role?: 'CLIENT' | 'FREELANCER';
}
