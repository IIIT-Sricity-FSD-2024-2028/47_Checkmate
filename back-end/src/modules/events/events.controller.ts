import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { StatusDto } from '../../common/dto/action.dto';
import { CancelEventDto, CreateEventDto, UpdateEventDto } from './dto';
import { EventsService } from './events.service';

// Every module in this project follows this same controller shape, so reading
// this one explains all of them.
//   @ApiTags / @ApiHeader -> Swagger docs only, no runtime effect.
//   @Controller('events')  -> all routes below live under /api/events
//                             ('api' comes from setGlobalPrefix in main.ts).
@ApiTags('events')
@ApiHeader({ name: 'x-role', description: 'Use client for event requests; vendor/admin/superuser for approvals and management; staff may read.', required: true })
@Controller('events')
export class EventsController {
  // Nest dependency injection: naming EventsService here is enough, the
  // framework constructs and hands it over. No `new EventsService()` anywhere.
  constructor(private readonly service: EventsService) {}

  // @Get/@Post/... set the HTTP verb; @Roles(...) lists who may call it.
  // @Param() destructures the URL id and validates it via IdParamDto;
  // @Body() does the same for the JSON body. Validation happens automatically
  // because main.ts installs a global ValidationPipe.
  // A client only ever receives their own events (others' names, budgets and venues stay private)
  @Get() @Roles('admin', 'superuser', 'vendor', 'client', 'staff') findAll(@Req() req: any) { return this.service.findAll(req.user); }
  @Get(':id') @Roles('admin', 'superuser', 'vendor', 'client', 'staff') findOne(@Param() { id }: IdParamDto, @Req() req: any) { return this.service.findOne(id, req.user); }

  // Clients raise event requests; vendors/admins can also create them directly.
  @Post() @Roles('client', 'vendor', 'admin', 'superuser') create(@Body() dto: CreateEventDto, @Req() req: any) { return this.service.create(dto, req.user); }

  // req.user is passed on so the service can check that a client only touches
  // their own events. PUT and PATCH both map to the same partial update here -- the frontend uses
  // whichever it prefers, so both are accepted.
  @Put(':id') @Roles('client', 'vendor', 'admin', 'superuser') updatePut(@Param() { id }: IdParamDto, @Body() dto: UpdateEventDto, @Req() req: any) { return this.service.update(id, dto, req.user); }
  @Patch(':id') @Roles('client', 'vendor', 'admin', 'superuser') update(@Param() { id }: IdParamDto, @Body() dto: UpdateEventDto, @Req() req: any) { return this.service.update(id, dto, req.user); }

  // The approval step. Clients are deliberately excluded -- a client must not be
  // able to approve their own request. This is the call that triggers billing.
  @Patch(':id/status') @Roles('vendor', 'admin', 'superuser') status(@Param() { id }: IdParamDto, @Body() dto: StatusDto, @Req() req: any) { return this.service.updateStatus(id, dto, req.user); }

  @Patch(':id/cancel') @Roles('client') cancel(@Param() { id }: IdParamDto, @Body() dto: CancelEventDto, @Req() req: any) { return this.service.cancel(id, req.user, dto.reason); }

  @Delete(':id') @Roles('vendor', 'admin', 'superuser', 'client') remove(@Param() { id }: IdParamDto, @Req() req: any) { return this.service.remove(id, req.user); }
}
