import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { CreatePackageDto, UpdatePackageDto } from './dto';
import { PackagesService } from './packages.service';

@ApiTags('packages')
@ApiHeader({ name: 'x-role', description: 'Clients may browse; vendors/admins/superusers manage packages.', required: true })
@Controller('packages')
export class PackagesController {
  constructor(private readonly service: PackagesService) {}
  @Get() @Roles('admin', 'superuser', 'vendor', 'client') findAll() { return this.service.findAll(); }
  @Get(':id') @Roles('admin', 'superuser', 'vendor', 'client') findOne(@Param() { id }: IdParamDto) { return this.service.findOne(id); }
  @Post() @Roles('vendor', 'admin', 'superuser') create(@Body() dto: CreatePackageDto) { return this.service.create(dto); }
  @Put(':id') @Roles('vendor', 'admin', 'superuser') updatePut(@Param() { id }: IdParamDto, @Body() dto: UpdatePackageDto) { return this.service.update(id, dto); }
  @Patch(':id') @Roles('vendor', 'admin', 'superuser') update(@Param() { id }: IdParamDto, @Body() dto: UpdatePackageDto) { return this.service.update(id, dto); }
  @Patch(':id/decision') @Roles('admin', 'superuser') decide(@Param() { id }: IdParamDto, @Body() body: { status: 'pending' | 'approved' | 'rejected' }) {
    return this.service.decidePackage(id, body);
  }
  @Delete(':id') @Roles('vendor', 'admin', 'superuser') remove(@Param() { id }: IdParamDto) { return this.service.remove(id); }
}
