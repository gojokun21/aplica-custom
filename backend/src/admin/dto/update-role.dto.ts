import { IsIn } from 'class-validator';

export class UpdateRoleDto {
  @IsIn(['CLIENT', 'FREELANCER', 'ADMIN'])
  role: 'CLIENT' | 'FREELANCER' | 'ADMIN';
}
