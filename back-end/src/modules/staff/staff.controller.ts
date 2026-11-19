import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { CreateStaffAssignmentDto, CreateStaffDto, RateStaffDto, StaffLoginDto, StaffProfilesQueryDto, UpdateStaffAssignmentDto, UpdateStaffDto, StaffProgressDto } from './dto';
import { StaffService } from './staff.service';

@ApiTags('staff')
@ApiHeader({ name: 'x-role', description: 'Vendors/admins/superusers manage staff. Staff may read assignments.', required: true })
@Controller()
export class StaffController {
  constructor(private readonly service: StaffService) {}
  // Public staff profiles (no phone/email). ?date=&time=&endTime= marks who is busy then.
  @Get('staff-profiles') @Roles('admin', 'superuser', 'vendor', 'client', 'staff') profiles(@Query() query: StaffProfilesQueryDto) { return this.service.profiles(query); }
  @Get('staff-profiles/:id') @Roles('admin', 'superuser', 'vendor', 'client', 'staff') profile(@Param() { id }: IdParamDto) { return this.service.profile(id); }
  // Ratings: vendors only (every other role gets 403 from the RolesGuard)
  @Post('staff/:id/ratings') @Roles('vendor') rate(@Param() { id }: IdParamDto, @Body() dto: RateStaffDto, @Req() req: any) { return this.service.rate(id, dto, req.user); }
  // Edit your own rating for that staff member + event (vendor only)
  @Patch('staff/:id/ratings') @Roles('vendor') editRating(@Param() { id }: IdParamDto, @Body() dto: RateStaffDto, @Req() req: any) { return this.service.editRating(id, dto, req.user); }
  @Get('events/:id/staff-ratings') @Roles('vendor', 'admin', 'superuser') ratingsForEvent(@Param() { id }: IdParamDto) { return this.service.ratingsForEvent(id); }

  @Get('staff') @Roles('admin', 'superuser', 'vendor', 'staff') findAll() { return this.service.findAll(); }
  @Get('staff/:id') @Roles('admin', 'superuser', 'vendor', 'staff') findOne(@Param() { id }: IdParamDto) { return this.service.findOne(id); }
  @Post('staff') @Roles('admin', 'superuser') create(@Body() dto: CreateStaffDto) { return this.service.create(dto); }
  @Put('staff/:id') @Roles('vendor', 'admin', 'superuser') updatePut(@Param() { id }: IdParamDto, @Body() dto: UpdateStaffDto, @Req() req: any) { return this.service.update(id, dto, req.user); }
  @Patch('staff/:id') @Roles('vendor', 'admin', 'superuser', 'staff') update(@Param() { id }: IdParamDto, @Body() dto: UpdateStaffDto, @Req() req: any) { return this.service.update(id, dto, req.user); }
  @Delete('staff/:id') @Roles('vendor', 'admin', 'superuser') remove(@Param() { id }: IdParamDto, @Req() req: any) { return this.service.remove(id, req.user); }

  @Post('staff/login') @Public() login(@Body() dto: StaffLoginDto) { return this.service.login(dto); }
  @Get('staff/profile/:email') @Roles('admin', 'superuser', 'vendor', 'staff') getProfile(@Param('email') email: string) { return this.service.getProfile(email); }

  @Get('staff-assignments') @Roles('admin', 'superuser', 'vendor', 'staff', 'client') assignments() { return this.service.assignments(); }
  @Post('staff-assignments') @Roles('vendor', 'admin', 'superuser') createAssignment(@Body() dto: CreateStaffAssignmentDto) { return this.service.createAssignment(dto); }
  @Patch('staff-assignments/:id/progress') @Roles('staff') updateProgress(@Param() { id }: IdParamDto, @Body() dto: StaffProgressDto, @Req() req: any) { return this.service.updateProgress(id, dto, req.user); }
  @Patch('staff-assignments/:id') @Roles('vendor', 'admin', 'superuser', 'staff') updateAssignment(@Param() { id }: IdParamDto, @Body() dto: UpdateStaffAssignmentDto, @Req() req: any) { return this.service.updateAssignment(id, dto, req.user); }
  @Put('staff-assignments/:id') @Roles('vendor', 'admin', 'superuser', 'staff') updateAssignmentPut(@Param() { id }: IdParamDto, @Body() dto: UpdateStaffAssignmentDto, @Req() req: any) { return this.service.updateAssignment(id, dto, req.user); }
  @Delete('staff-assignments/:id') @Roles('vendor', 'admin', 'superuser') removeAssignment(@Param() { id }: IdParamDto) { return this.service.removeAssignment(id); }
}
