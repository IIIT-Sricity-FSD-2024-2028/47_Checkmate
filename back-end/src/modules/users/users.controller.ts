import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Headers, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiHeader({ name: 'x-role', description: 'Required role: admin or superuser', required: true })
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('profile')
  @ApiHeader({ name: 'x-email', description: 'User email for profile lookup', required: true })
  getProfile(@Headers('x-email') email: string) {
    return this.service.getProfile(email);
  }

  @Put('profile')
  @ApiHeader({ name: 'x-email', description: 'User email for profile lookup', required: true })
  updateProfile(@Headers('x-email') email: string, @Body() dto: { 
    name?: string;
    bio?: string; 
    phone?: string;
    location?: string;
    address?: string;
    date_of_birth?: string;
    years_experience?: number;
    skills?: string;
    website_url?: string;
    linkedin_url?: string;
  }) {
    return this.service.updateProfile(email, dto);
  }

  @Post('profile/avatar')
  @ApiHeader({ name: 'x-email', description: 'User email for profile lookup', required: true })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './public/uploads',
      filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      }
    })
  }))
  uploadAvatar(@Headers('x-email') email: string, @UploadedFile() file: any) {
    return this.service.updateAvatar(email, `/uploads/${file.filename}`);
  }

  @Get() @Roles('admin', 'superuser') @ApiOkResponse({ type: [CreateUserDto] }) findAll() { return this.service.findAll(); }
  @Get(':id') @Roles('admin', 'superuser') findOne(@Param() { id }: IdParamDto) { return this.service.findOne(id); }
  @Post() @Roles('admin', 'superuser') create(@Body() dto: CreateUserDto) { return this.service.create(dto); }
  @Put(':id') @Roles('admin', 'superuser') updatePut(@Param() { id }: IdParamDto, @Body() dto: UpdateUserDto) { return this.service.update(id, dto); }
  @Patch(':id') @Roles('admin', 'superuser') update(@Param() { id }: IdParamDto, @Body() dto: UpdateUserDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles('admin', 'superuser') remove(@Param() { id }: IdParamDto) { return this.service.remove(id); }
}
