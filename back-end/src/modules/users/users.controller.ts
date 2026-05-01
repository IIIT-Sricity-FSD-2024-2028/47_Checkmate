import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiHeader({ name: 'x-role', description: 'Required role: admin or superuser', required: true })
@Roles('admin', 'superuser')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}
  @Get() @ApiOkResponse({ type: [CreateUserDto] }) findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param() { id }: IdParamDto) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateUserDto) { return this.service.create(dto); }
  @Put(':id') updatePut(@Param() { id }: IdParamDto, @Body() dto: UpdateUserDto) { return this.service.update(id, dto); }
  @Patch(':id') update(@Param() { id }: IdParamDto, @Body() dto: UpdateUserDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param() { id }: IdParamDto) { return this.service.remove(id); }
}
