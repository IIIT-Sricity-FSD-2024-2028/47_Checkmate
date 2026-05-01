import { Injectable } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { CreateStaffAssignmentDto, CreateStaffDto, UpdateStaffAssignmentDto, UpdateStaffDto } from './dto';

@Injectable()
export class StaffService {
  constructor(private readonly data: DataService) {}
  findAll() { return this.data.collection('staff'); }
  findOne(id: string) { return this.data.find('staff', id); }
  create(dto: CreateStaffDto) { return this.data.create('staff', 'S', dto); }
  update(id: string, dto: UpdateStaffDto) { return this.data.update('staff', id, dto); }
  remove(id: string) { return this.data.remove('staff', id); }
  assignments() { return this.data.collection('staffAssignments'); }
  createAssignment(dto: CreateStaffAssignmentDto) {
    return this.data.create('staffAssignments', 'A', { status: 'assigned', assignedAt: new Date().toISOString(), ...dto });
  }
  updateAssignment(id: string, dto: UpdateStaffAssignmentDto) { return this.data.update('staffAssignments', id, dto); }
  removeAssignment(id: string) { return this.data.remove('staffAssignments', id); }
}
