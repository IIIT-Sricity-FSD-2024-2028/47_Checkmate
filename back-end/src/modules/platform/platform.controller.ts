import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateAnnouncementDto, PlatformSettingsDto, SupportReplyDto } from './dto';
import { PlatformService } from './platform.service';

@ApiTags('platform')
@Controller()
export class PlatformController {
  constructor(private readonly service: PlatformService) {}

  // Public so the sign-in page can show the maintenance notice before anyone logs in.
  // Nothing in the settings is secret.
  @Get('settings') @Public() getSettings() { return this.service.getSettings(); }
  @Put('settings') @Roles('admin', 'superuser') updateSettings(@Body() dto: PlatformSettingsDto, @Req() req: any) { return this.service.updateSettings(dto, req.user); }

  @Get('announcements') @Roles('admin', 'superuser', 'vendor', 'client', 'staff') announcements(@Req() req: any) { return this.service.announcementsFor(req.user); }
  @Post('announcements') @Roles('admin', 'superuser') createAnnouncement(@Body() dto: CreateAnnouncementDto, @Req() req: any) { return this.service.createAnnouncement(dto, req.user); }
  @Delete('announcements/:id') @Roles('admin', 'superuser') deleteAnnouncement(@Param('id') id: string, @Req() req: any) { return this.service.deleteAnnouncement(id, req.user); }

  @Post('support/replies') @Roles('admin', 'superuser') reply(@Body() dto: SupportReplyDto, @Req() req: any) { return this.service.replyToClient(dto, req.user); }
}
