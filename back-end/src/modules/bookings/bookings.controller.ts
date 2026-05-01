import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, UpdateBookingDto } from './dto';

@ApiTags('bookings')
@ApiHeader({ name: 'x-role', description: 'Admins/superusers manage bookings; vendors and clients may read.', required: true })
@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingsService) {}
  @Get() @Roles('admin', 'superuser', 'vendor', 'client') findAll() { return this.service.findAll(); }
  @Get(':id') @Roles('admin', 'superuser', 'vendor', 'client') findOne(@Param() { id }: IdParamDto) { return this.service.findOne(id); }
  @Post() @Roles('admin', 'superuser', 'vendor') create(@Body() dto: CreateBookingDto) { return this.service.create(dto); }
  @Put(':id') @Roles('admin', 'superuser', 'vendor') updatePut(@Param() { id }: IdParamDto, @Body() dto: UpdateBookingDto) { return this.service.update(id, dto); }
  @Patch(':id') @Roles('admin', 'superuser', 'vendor') update(@Param() { id }: IdParamDto, @Body() dto: UpdateBookingDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles('admin', 'superuser') remove(@Param() { id }: IdParamDto) { return this.service.remove(id); }
}
