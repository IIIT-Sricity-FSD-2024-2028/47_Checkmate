import { Injectable } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { CreateIssueDto, UpdateIssueDto } from './dto';

@Injectable()
export class IssuesService {
  constructor(private readonly data: DataService) {}
  findAll() { return this.data.collection('issues'); }
  findOne(id: string) { return this.data.find('issues', id); }
  create(dto: CreateIssueDto) {
    return this.data.create('issues', 'ISS', { status: 'open', createdAt: new Date().toISOString(), ...dto });
  }
  update(id: string, dto: UpdateIssueDto) { return this.data.update('issues', id, dto); }
  remove(id: string) { return this.data.remove('issues', id); }
}
