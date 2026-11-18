import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminChatDto, CreateMessageDto } from './dto';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@ApiHeader({ name: 'x-role', description: 'Operational roles may read/send coordination messages.', required: true })
@Roles('admin', 'superuser', 'vendor', 'client', 'staff')
@Controller('messages')
export class MessagesController {
  constructor(private readonly service: MessagesService) {}
  @Get() @Roles('admin', 'superuser') threads() { return this.service.threads(); }
  // Declared before ':threadId' so "unread" is not read as a thread id
  @Get('unread') unread(@Req() req: any) { return this.service.unread(req.user); }
  @Post(':threadId/read') markRead(@Param('threadId') threadId: string, @Req() req: any) { return this.service.markRead(threadId, req.user); }
  @Get(':threadId') thread(@Param('threadId') threadId: string, @Req() req: any) { return this.service.thread(threadId, req.user); }
  @Post() create(@Body() dto: CreateMessageDto, @Req() req: any) { return this.service.create(dto, req.user); }
}

// Admin support chat: each person sees only their own conversation with the
// admin team; admins see all of them and must address each reply.
@ApiTags('messages')
@Roles('admin', 'superuser', 'vendor', 'client', 'staff')
@Controller('admin-chat')
export class AdminChatController {
  constructor(private readonly service: MessagesService) {}
  @Get() list(@Req() req: any) { return this.service.adminChat(req.user); }
  @Post() post(@Body() dto: AdminChatDto, @Req() req: any) { return this.service.postAdminChat(dto, req.user); }
}
