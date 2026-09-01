import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { CreateStaffAssignmentDto, CreateStaffDto, StaffLoginDto, StaffSignupDto, UpdateStaffAssignmentDto, UpdateStaffDto } from './dto';
import { StaffService } from './staff.service';

@ApiTags('staff')
@ApiHeader({ name: 'x-role', description: 'Vendors/admins/superusers manage staff. Staff may read assignments.', required: true })
@Controller()
export class StaffController {
  constructor(private readonly service: StaffService) {}
  @Get('staff') @Roles('admin', 'superuser', 'vendor', 'staff') findAll() { return this.service.findAll(); }
  @Get('staff/:id') @Roles('admin', 'superuser', 'vendor', 'staff') findOne(@Param() { id }: IdParamDto) { return this.service.findOne(id); }
  @Post('staff') @Roles('vendor', 'admin', 'superuser') create(@Body() dto: CreateStaffDto) { return this.service.create(dto); }
  @Put('staff/:id') @Roles('vendor', 'admin', 'superuser') updatePut(@Param() { id }: IdParamDto, @Body() dto: UpdateStaffDto) { return this.service.update(id, dto); }
  @Patch('staff/:id') @Roles('vendor', 'admin', 'superuser', 'staff') update(@Param() { id }: IdParamDto, @Body() dto: UpdateStaffDto) { return this.service.update(id, dto); }
  @Delete('staff/:id') @Roles('vendor', 'admin', 'superuser') remove(@Param() { id }: IdParamDto) { return this.service.remove(id); }

  @Post('staff/signup') @Public() signup(@Body() dto: StaffSignupDto) { return this.service.signup(dto); }
  @Post('staff/login') @Public() login(@Body() dto: StaffLoginDto) { return this.service.login(dto); }
  @Get('staff/profile/:email') @Roles('admin', 'superuser', 'vendor', 'staff') getProfile(@Param('email') email: string) { return this.service.getProfile(email); }

  @Get('staff-assignments') @Roles('admin', 'superuser', 'vendor', 'staff', 'client') assignments() { return this.service.assignments(); }
  @Post('staff-assignments') @Roles('vendor', 'admin', 'superuser') createAssignment(@Body() dto: CreateStaffAssignmentDto) { return this.service.createAssignment(dto); }
  @Patch('staff-assignments/:id') @Roles('vendor', 'admin', 'superuser', 'staff') updateAssignment(@Param() { id }: IdParamDto, @Body() dto: UpdateStaffAssignmentDto) { return this.service.updateAssignment(id, dto); }
  @Put('staff-assignments/:id') @Roles('vendor', 'admin', 'superuser', 'staff') updateAssignmentPut(@Param() { id }: IdParamDto, @Body() dto: UpdateStaffAssignmentDto) { return this.service.updateAssignment(id, dto); }
  @Delete('staff-assignments/:id') @Roles('vendor', 'admin', 'superuser') removeAssignment(@Param() { id }: IdParamDto) { return this.service.removeAssignment(id); }
}
