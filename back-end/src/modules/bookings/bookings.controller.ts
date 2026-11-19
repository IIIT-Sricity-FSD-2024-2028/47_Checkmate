import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { BookingsService } from './bookings.service';
import { CheckoutDto, ConfirmPaymentDto, CreateBookingDto, SettlePayoutDto, UpdateBookingDto } from './dto';
import { PaymentsService } from './payments.service';

@ApiTags('bookings')
@ApiHeader({ name: 'x-role', description: 'Admins/superusers manage bookings; vendors and clients may read.', required: true })
@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingsService, private readonly payments: PaymentsService) {}

  // Step 1 of the checkout: the client starts paying the balance due (simulated gateway)
  @Post(':id/checkout')
  @Roles('client')
  @ApiOperation({ summary: 'Start a checkout (simulated gateway) for the balance due' })
  checkout(@Param() { id }: IdParamDto, @Body() dto: CheckoutDto, @Req() req: any) {
    return this.payments.startCheckout(id, dto, req.user);
  }

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
    @Req() req?: any,
  ) {
    return this.service.findCommissions({ vendorId, payoutStatus, eventId }, req?.user);
  }

  @Get()
  @Roles('admin', 'superuser', 'vendor', 'client')
  findAll(@Req() req: any) {
    return this.service.findAll(req.user);
  }

  @Get(':id')
  @Roles('admin', 'superuser', 'vendor', 'client')
  findOne(@Param() { id }: IdParamDto, @Req() req: any) {
    return this.service.findOne(id, req.user);
  }

  // Bookings are created by the approval trigger (DataService). Only admins and
  // superusers may add or edit one by hand: a vendor changing cost or
  // commission here could cut the platform's fee to zero.
  @Post()
  @Roles('admin', 'superuser')
  create(@Body() dto: CreateBookingDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles('admin', 'superuser')
  updatePut(@Param() { id }: IdParamDto, @Body() dto: UpdateBookingDto) {
    return this.service.update(id, dto);
  }

  // Called by the client's Pay Now button. The gateway itself is still simulated.
  @Patch(':id/pay')
  @Roles('client')
  @ApiOperation({ summary: 'Record full payment of a booking by the client who owns it' })
  pay(@Param() { id }: IdParamDto, @Req() req: any) {
    return this.service.recordPayment(id, req.user);
  }

  @Patch(':id/settle')
  @Roles('admin', 'superuser')
  @ApiOperation({ summary: 'Settle and release vendor payout for a confirmed booking' })
  // settledBy comes from the signed-in admin (token), never from a header
  settlePayout(@Param() { id }: IdParamDto, @Body() dto: SettlePayoutDto, @Req() req: any) {
    return this.service.settlePayout(id, { ...dto, settledBy: req.user?.id }, req.user?.id);
  }

  @Patch(':id')
  @Roles('admin', 'superuser')
  update(@Param() { id }: IdParamDto, @Body() dto: UpdateBookingDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'superuser')
  remove(@Param() { id }: IdParamDto) {
    return this.service.remove(id);
  }
}

// Payment records: step 2 of the checkout and the payment history
@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @Roles('admin', 'superuser', 'vendor', 'client')
  list(@Req() req: any) {
    return this.payments.list(req.user);
  }

  @Post(':id/confirm')
  @Roles('client')
  confirm(@Param() { id }: IdParamDto, @Body() dto: ConfirmPaymentDto, @Req() req: any) {
    return this.payments.confirm(id, dto.outcome, req.user);
  }
}
