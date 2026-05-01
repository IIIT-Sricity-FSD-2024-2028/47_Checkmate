import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';
import { StateValueDto } from './state.dto';

@ApiTags('analytics')
@ApiHeader({ name: 'x-role', description: 'Summary/snapshot access for dashboards. Snapshot is readable by app roles to hydrate frontend stores.', required: true })
@Controller()
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}
  @Get('analytics/summary') @Roles('admin', 'superuser', 'vendor') summary() { return this.service.summary(); }
  @Get('snapshot') @Roles('admin', 'superuser', 'vendor', 'client', 'staff') snapshot() { return this.service.snapshot(); }
  @Get('state/:key') @Roles('admin', 'superuser', 'vendor', 'client', 'staff') stateKey(@Param('key') key: string) { return this.service.stateKey(key); }
  @Put('state/:key') @Roles('admin', 'superuser', 'vendor', 'client', 'staff') setStateKey(@Param('key') key: string, @Body() dto: StateValueDto) { return this.service.setStateKey(key, dto.value); }
}
