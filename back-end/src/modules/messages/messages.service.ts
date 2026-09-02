import { Injectable, NotFoundException } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { CreateMessageDto } from './dto';

@Injectable()
export class MessagesService {
  constructor(private readonly data: DataService) {}
  threads() { return this.data.getValue('messages'); }
  thread(id: string) {
    const messages = (this.data.getValue('messages') as Record<string, any[]>)[id];
    if (!messages) throw new NotFoundException(`Message thread ${id} was not found.`);
    return messages;
  }
  create(dto: CreateMessageDto) {
    const all = this.data.getValue('messages') as Record<string, any[]>;
    all[dto.threadId] = all[dto.threadId] || [];
    const item = { ...dto, id: `MSG${String(all[dto.threadId].length + 1).padStart(3, '0')}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    all[dto.threadId].push(item);
    // getValue() hands back the live object, so the push above only changed
    // memory. Without this the message is lost on restart -- it would survive
    // only if some unrelated write happened to flush the file first.
    this.data.save();
    return item;
  }
}
