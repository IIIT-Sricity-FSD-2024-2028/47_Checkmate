import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { CreateResourceDto, UpdateResourceDto } from './dto';
import { ResourcesService } from './resources.service';

@ApiTags('resources')
@ApiHeader({ name: 'x-role', description: 'Required for RBAC. Vendors manage inventory; admins/superusers have full access; clients/staff may read.', required: true })
@Controller('resources')
export class ResourcesController {
  constructor(private readonly service: ResourcesService) {}
  @Get() @Roles('admin', 'superuser', 'vendor', 'client', 'staff') findAll() { return this.service.findAll(); }
  @Get(':id') @Roles('admin', 'superuser', 'vendor', 'client', 'staff') findOne(@Param() { id }: IdParamDto) { return this.service.findOne(id); }
  @Post() @Roles('vendor', 'admin', 'superuser') create(@Body() dto: CreateResourceDto) { return this.service.create(dto); }
  @Put(':id') @Roles('vendor', 'admin', 'superuser') updatePut(@Param() { id }: IdParamDto, @Body() dto: UpdateResourceDto) { return this.service.update(id, dto); }
  @Patch(':id') @Roles('vendor', 'admin', 'superuser') update(@Param() { id }: IdParamDto, @Body() dto: UpdateResourceDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles('vendor', 'admin', 'superuser') remove(@Param() { id }: IdParamDto) { return this.service.remove(id); }
}
