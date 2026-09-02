import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, SettlePayoutDto, UpdateBookingDto } from './dto';

@ApiTags('bookings')
@ApiHeader({ name: 'x-role', description: 'Admins/superusers manage bookings; vendors and clients may read.', required: true })
@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Get('commissions')
  @Roles('admin', 'superuser', 'vendor')
  @ApiOperation({ summary: 'Get commission and payout ledger with financial aggregates' })
  @ApiQuery({ name: 'vendorId', required: false })
  @ApiQuery({ name: 'payoutStatus', required: false })
  @ApiQuery({ name: 'eventId', required: false })
  findCommissions(
    @Query('vendorId') vendorId?: string,
    @Query('payoutStatus') payoutStatus?: string,
    @Query('eventId') eventId?: string,
  ) {
    return this.service.findCommissions({ vendorId, payoutStatus, eventId });
  }

  @Get()
  @Roles('admin', 'superuser', 'vendor', 'client')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('admin', 'superuser', 'vendor', 'client')
  findOne(@Param() { id }: IdParamDto) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin', 'superuser', 'vendor')
  create(@Body() dto: CreateBookingDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles('admin', 'superuser', 'vendor')
  updatePut(@Param() { id }: IdParamDto, @Body() dto: UpdateBookingDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/settle')
  @Roles('admin', 'superuser')
  @ApiOperation({ summary: 'Settle and release vendor payout for a confirmed booking' })
  settlePayout(
    @Param() { id }: IdParamDto,
    @Body() dto: SettlePayoutDto,
    @Headers('x-user-id') adminUserId?: string,
  ) {
    return this.service.settlePayout(id, dto, adminUserId);
  }

  @Patch(':id')
  @Roles('admin', 'superuser', 'vendor')
  update(@Param() { id }: IdParamDto, @Body() dto: UpdateBookingDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'superuser')
  remove(@Param() { id }: IdParamDto) {
    return this.service.remove(id);
  }
}
