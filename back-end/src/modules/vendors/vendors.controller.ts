import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { DecisionDto } from '../../common/dto/action.dto';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { CreateVendorApplicationDto, CreateVendorDto, UpdateVendorApplicationDto, UpdateVendorDto } from './dto';
import { VendorsService } from './vendors.service';

@ApiTags('vendors')
@ApiHeader({ name: 'x-role', description: 'Vendor applications are submitted by vendors and approved by admin/superuser. Vendor list is readable by operational roles.', required: true })
@Controller()
export class VendorsController {
  constructor(private readonly service: VendorsService) {}

  @Get('vendors')
  @Roles('admin', 'superuser', 'vendor', 'client')
  vendors() {
    return this.service.vendors();
  }

  @Get('vendors/:id/payouts')
  @Roles('admin', 'superuser', 'vendor')
  @ApiOperation({ summary: 'Get financial payouts and commission breakdown for a vendor' })
  findVendorPayouts(@Param() { id }: IdParamDto) {
    return this.service.getVendorPayouts(id);
  }

  @Get('vendors/:id')
  @Roles('admin', 'superuser', 'vendor', 'client')
  findVendor(@Param() { id }: IdParamDto) {
    return this.service.findVendor(id);
  }

  @Post('vendors')
  @Roles('admin', 'superuser')
  createVendor(@Body() dto: CreateVendorDto) {
    return this.service.createVendor(dto);
  }

  @Put('vendors/:id')
  @Roles('admin', 'superuser')
  updateVendorPut(@Param() { id }: IdParamDto, @Body() dto: UpdateVendorDto) {
    return this.service.updateVendor(id, dto);
  }

  @Patch('vendors/:id')
  @Roles('admin', 'superuser')
  updateVendor(@Param() { id }: IdParamDto, @Body() dto: UpdateVendorDto) {
    return this.service.updateVendor(id, dto);
  }

  @Delete('vendors/:id')
  @Roles('admin', 'superuser')
  removeVendor(@Param() { id }: IdParamDto) {
    return this.service.removeVendor(id);
  }

  @Get('vendor-applications')
  @Roles('admin', 'superuser', 'vendor')
  applications() {
    return this.service.applications();
  }

  @Get('vendor-applications/:id')
  @Roles('admin', 'superuser', 'vendor')
  findApplication(@Param() { id }: IdParamDto) {
    return this.service.findApplication(id);
  }

  @Post('vendor-applications')
  @Public()
  createApplication(@Body() dto: CreateVendorApplicationDto) {
    return this.service.createApplication(dto);
  }

  @Put('vendor-applications/:id')
  @Roles('vendor', 'admin', 'superuser')
  updateApplicationPut(@Param() { id }: IdParamDto, @Body() dto: UpdateVendorApplicationDto) {
    return this.service.updateApplication(id, dto);
  }

  @Patch('vendor-applications/:id')
  @Roles('vendor', 'admin', 'superuser')
  updateApplication(@Param() { id }: IdParamDto, @Body() dto: UpdateVendorApplicationDto) {
    return this.service.updateApplication(id, dto);
  }

  @Patch('vendor-applications/:id/decision')
  @Roles('admin', 'superuser')
  decideApplication(@Param() { id }: IdParamDto, @Body() dto: DecisionDto) {
    return this.service.decideApplication(id, dto);
  }

  @Delete('vendor-applications/:id')
  @Roles('admin', 'superuser')
  removeApplication(@Param() { id }: IdParamDto) {
    return this.service.removeApplication(id);
  }
}
