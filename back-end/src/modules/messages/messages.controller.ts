import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateMessageDto } from './dto';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@ApiHeader({ name: 'x-role', description: 'Operational roles may read/send coordination messages.', required: true })
@Roles('admin', 'superuser', 'vendor', 'client', 'staff')
@Controller('messages')
export class MessagesController {
  constructor(private readonly service: MessagesService) {}
  @Get() @Roles('admin', 'superuser') threads() { return this.service.threads(); }
  @Get(':threadId') thread(@Param('threadId') threadId: string, @Req() req: any) { return this.service.thread(threadId, req.user); }
  @Post() create(@Body() dto: CreateMessageDto, @Req() req: any) { return this.service.create(dto, req.user); }
}
