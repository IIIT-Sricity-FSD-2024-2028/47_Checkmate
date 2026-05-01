import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { StatusDto } from '../../common/dto/action.dto';
import { CreateEventDto, UpdateEventDto } from './dto';
import { EventsService } from './events.service';

@ApiTags('events')
@ApiHeader({ name: 'x-role', description: 'Use client for event requests; vendor/admin/superuser for approvals and management; staff may read.', required: true })
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}
  @Get() @Roles('admin', 'superuser', 'vendor', 'client', 'staff') findAll() { return this.service.findAll(); }
  @Get(':id') @Roles('admin', 'superuser', 'vendor', 'client', 'staff') findOne(@Param() { id }: IdParamDto) { return this.service.findOne(id); }
  @Post() @Roles('client', 'vendor', 'admin', 'superuser') create(@Body() dto: CreateEventDto) { return this.service.create(dto); }
  @Put(':id') @Roles('client', 'vendor', 'admin', 'superuser') updatePut(@Param() { id }: IdParamDto, @Body() dto: UpdateEventDto) { return this.service.update(id, dto); }
  @Patch(':id') @Roles('client', 'vendor', 'admin', 'superuser') update(@Param() { id }: IdParamDto, @Body() dto: UpdateEventDto) { return this.service.update(id, dto); }
  @Patch(':id/status') @Roles('vendor', 'admin', 'superuser') status(@Param() { id }: IdParamDto, @Body() dto: StatusDto) { return this.service.updateStatus(id, dto); }
  @Delete(':id') @Roles('vendor', 'admin', 'superuser', 'client') remove(@Param() { id }: IdParamDto) { return this.service.remove(id); }
}
