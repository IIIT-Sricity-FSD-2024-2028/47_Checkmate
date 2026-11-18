import { Body, Controller, Get, Param, Put, Req } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';
import { StateValueDto } from './state.dto';

@ApiTags('analytics')
@ApiHeader({ name: 'x-role', description: 'Summary/snapshot access for dashboards. Snapshot is readable by app roles to hydrate frontend stores.', required: true })
@Controller()
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  // The public landing page lists open roles and has nobody signed in, so this
  // one read is deliberately unauthenticated. It exposes job postings only.
  @Get('public/recruitments')
  @Public()
  publicRecruitments() {
    return this.service.stateKey('recruitments') || [];
  }

  @Get('analytics/summary')
  @Roles('admin', 'superuser', 'vendor')
  @ApiOperation({ summary: 'Get operational and financial summary metrics' })
  summary() {
    return this.service.summary();
  }

  @Get('analytics/financial-summary')
  @Roles('admin', 'superuser')
  @ApiOperation({ summary: 'Get executive financial summary with commission and payout breakdown' })
  financialSummary() {
    return this.service.financialSummary();
  }

  // The whole database: admins / superusers only. Other roles use endpoints
  // that return just their own data (e.g. /staff-profiles, /events).
  @Get('snapshot')
  @Roles('admin', 'superuser')
  snapshot() {
    return this.service.snapshot();
  }

  @Get('state/:key')
  @Roles('admin', 'superuser', 'vendor', 'client', 'staff')
  stateKey(@Param('key') key: string, @Req() req: any) {
    return this.service.stateKey(key, req.user);
  }

  @Put('state/:key')
  @Roles('admin', 'superuser', 'vendor', 'client', 'staff')
  setStateKey(@Param('key') key: string, @Body() dto: StateValueDto, @Req() req: any) {
    // req.user (from the verified token) decides which keys this caller may write
    return this.service.setStateKey(key, dto.value, req.user);
  }
}
