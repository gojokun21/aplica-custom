import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { avatarMulterOptions } from './avatar.multer';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', avatarMulterOptions))
  uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.users.setAvatar(userId, file);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('me/avatar')
  removeAvatar(@CurrentUser('id') userId: string) {
    return this.users.removeAvatar(userId);
  }
}
