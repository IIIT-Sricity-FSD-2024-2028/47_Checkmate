import { Injectable } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { CreateIssueDto, UpdateIssueDto } from './dto';

@Injectable()
export class IssuesService {
  constructor(private readonly data: DataService) {}
  findAll() { return this.data.collection('issues'); }
  findOne(id: string) { return this.data.find('issues', id); }
  create(dto: CreateIssueDto) {
    return this.data.create('issues', 'ISS', { status: 'open', createdAt: new Date().toISOString(), ...dto } as any);
  }
  update(id: string, dto: UpdateIssueDto) {
    const before = this.data.find('issues', id) as any;
    const updated = this.data.update('issues', id, dto) as any;
    if (dto.status && dto.status !== before.status) this.tellReporter(updated);
    return updated;
  }
  remove(id: string) { return this.data.remove('issues', id); }

  // Drops a "System" message into the reporter's support chat (adminChatMessages),
  // which the client sees on their Messages page. Done here on the server so two
  // admins updating at once can't overwrite each other's messages.
  private tellReporter(issue: { id: string; title?: string; status: string; email?: string }) {
    if (!issue.email) return;
    const status = String(issue.status).replace(/_/g, ' ');
    const messages = (this.data.getValue('adminChatMessages') as any[]) || [];
    this.data.setValue('adminChatMessages', [
      ...messages,
      {
        id: `msg_${Date.now()}`,
        sender: 'System',
        senderRole: 'Admin',
        recipientEmail: issue.email,
        text: `Issue "${issue.title || issue.id}" status updated to: ${status.charAt(0).toUpperCase()}${status.slice(1)}`,
        timestamp: new Date().toISOString(),
        type: 'system',
      },
    ]);
  }
}
