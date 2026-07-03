import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body: string;
}

@Controller('conversations')
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly gateway: ChatGateway,
  ) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.chat.listConversations(userId);
  }

  /** Total mesaje necitite (înaintea rutei cu :id). */
  @Get('unread-total')
  unreadTotal(@CurrentUser('id') userId: string) {
    return this.chat.unreadTotal(userId);
  }

  @Get(':id')
  getOne(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.chat.getConversation(userId, id);
  }

  @Get(':id/messages')
  messages(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.chat.listMessages(userId, id);
  }

  @Post(':id/messages')
  async send(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.chat.createMessage(userId, id, dto.body);
    // Notifică și clienții conectați prin WebSocket.
    await this.gateway.emitMessage(id, message);
    return message;
  }

  @HttpCode(HttpStatus.OK)
  @Post(':id/read')
  markRead(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.chat.markRead(userId, id);
  }
}
