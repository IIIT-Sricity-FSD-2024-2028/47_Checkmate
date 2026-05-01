import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';

@Module({ imports: [DatabaseModule], controllers: [IssuesController], providers: [IssuesService] })
export class IssuesModule {}
