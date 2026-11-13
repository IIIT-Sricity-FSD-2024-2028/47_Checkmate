import { Body, Controller, Get, Param, Patch, Post, Req, Res, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { staffDocumentMulterOptions } from '../../common/upload/multer.config';
import { ApplicationDecisionDto, ApplyDto } from './dto';
import { StaffOnboardingService } from './staff-onboarding.service';

@ApiTags('staff-onboarding')
@Controller()
export class StaffOnboardingController {
  constructor(private readonly service: StaffOnboardingService) {}

  @Get('public/staff-designations') @Public()
  designations() { return this.service.designations(); }

  @Post('staff-applications') @Public()
  @UseInterceptors(FilesInterceptor('documents', 3, staffDocumentMulterOptions))
  apply(@Body() dto: ApplyDto, @UploadedFiles() files: Express.Multer.File[]) { return this.service.apply(dto, files); }

  @Get('staff-applications') @Roles('vendor', 'admin', 'superuser')
  applications(@Req() req: any) { return this.service.applications(req.user); }

  // Documents stay outside public/, so this signed-in route is the only way to them.
  @Get('staff-applications/:id/documents/:docId') @Roles('vendor', 'admin', 'superuser')
  document(@Param('id') id: string, @Param('docId') docId: string, @Req() req: any, @Res() res: Response) {
    const doc = this.service.document(id, docId, req.user);
    res.type(doc.mimeType);
    res.download(doc.path, doc.name);
  }

  @Patch('staff-applications/:id/decision') @Roles('vendor', 'admin', 'superuser')
  decide(@Param() { id }: IdParamDto, @Body() dto: ApplicationDecisionDto, @Req() req: any) {
    return this.service.decide(id, dto, req.user);
  }
}
