import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { CreateIssueDto, UpdateIssueDto } from './dto';
import { IssuesService } from './issues.service';

@ApiTags('issues')
@ApiHeader({ name: 'x-role', description: 'All roles may report/read issues; admin/superuser/vendor may update/delete.', required: true })
@Controller('issues')
export class IssuesController {
  constructor(private readonly service: IssuesService) {}
  @Get() @Roles('admin', 'superuser', 'vendor', 'client', 'staff') findAll() { return this.service.findAll(); }
  @Get(':id') @Roles('admin', 'superuser', 'vendor', 'client', 'staff') findOne(@Param() { id }: IdParamDto) { return this.service.findOne(id); }
  @Post() @Roles('admin', 'superuser', 'vendor', 'client', 'staff') create(@Body() dto: CreateIssueDto) { return this.service.create(dto); }
  @Put(':id') @Roles('admin', 'superuser', 'vendor') updatePut(@Param() { id }: IdParamDto, @Body() dto: UpdateIssueDto) { return this.service.update(id, dto); }
  @Patch(':id') @Roles('admin', 'superuser', 'vendor') update(@Param() { id }: IdParamDto, @Body() dto: UpdateIssueDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles('admin', 'superuser', 'vendor') remove(@Param() { id }: IdParamDto) { return this.service.remove(id); }
}
