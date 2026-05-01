import { Injectable, NotFoundException } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { CreateMessageDto } from './dto';

@Injectable()
export class MessagesService {
  constructor(private readonly data: DataService) {}
  threads() { return this.data.getValue('messages'); }
  thread(id: string) {
    const messages = this.data.getValue('messages')[id];
    if (!messages) throw new NotFoundException(`Message thread ${id} was not found.`);
    return messages;
  }
  create(dto: CreateMessageDto) {
    const all = this.data.getValue('messages');
    all[dto.threadId] = all[dto.threadId] || [];
    const item = { ...dto, id: `MSG${String(all[dto.threadId].length + 1).padStart(3, '0')}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    all[dto.threadId].push(item);
    return item;
  }
}
