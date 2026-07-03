import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class SetSkillsDto {
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  skillIds: string[];
}
