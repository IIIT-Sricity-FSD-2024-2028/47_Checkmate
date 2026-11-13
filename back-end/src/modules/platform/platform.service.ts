import { Injectable, NotFoundException } from '@nestjs/common';
import { DataService } from '../../database/data.service';
import { CreateAnnouncementDto, PlatformSettingsDto, SupportReplyDto } from './dto';

export interface PlatformSettings {
  commissionRate: number;
  minEventBudget: number;
  autoApproveVendors: boolean;
  maintenanceMode: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: 'all' | 'client' | 'vendor' | 'staff';
  createdBy: string;
  createdAt: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  commissionRate: 10,
  minEventBudget: 0,
  autoApproveVendors: false,
  maintenanceMode: false,
};

type SignedInUser = { id: string; name?: string; email?: string; role: string };

// The admin's platform controls: Global Settings, announcements, and replies to
// client support messages. Settings live under the `platformSettings` key, which
// DataService (commission rate), EventsService (minimum budget), VendorsService
// (auto-approve) and MaintenanceGuard all read.
@Injectable()
export class PlatformService {
  constructor(private readonly data: DataService) {}

  // ── Settings ──
  getSettings(): PlatformSettings {
    const saved = (this.data.getValue('platformSettings') as Partial<PlatformSettings>) || {};
    return { ...DEFAULT_SETTINGS, ...saved };
  }

  updateSettings(dto: PlatformSettingsDto, user: SignedInUser) {
    const updated = { ...this.getSettings(), ...dto };
    this.data.setValue('platformSettings', updated);
    this.data.logActivity('SETTINGS_UPDATED', 'SETTINGS', 'platformSettings', { ...dto }, user.id, user.role);
    return updated;
  }

  // ── Announcements ──
  private allAnnouncements(): Announcement[] {
    return (this.data.getValue('announcements') as Announcement[]) || [];
  }

  // Admins see every announcement; everyone else only the ones meant for them.
  announcementsFor(user: SignedInUser) {
    const isAdmin = user.role === 'admin' || user.role === 'superuser';
    return this.allAnnouncements()
      .filter((a) => isAdmin || a.audience === 'all' || a.audience === user.role)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  createAnnouncement(dto: CreateAnnouncementDto, user: SignedInUser) {
    const list = this.allAnnouncements();
    const announcement: Announcement = {
      id: this.data.nextId(list, 'ANN'),
      title: dto.title.trim(),
      message: dto.message.trim(),
      audience: dto.audience,
      createdBy: user.name || 'Admin',
      createdAt: new Date().toISOString(),
    };
    this.data.setValue('announcements', [...list, announcement]);
    this.data.logActivity('ANNOUNCEMENT_POSTED', 'ANNOUNCEMENT', announcement.id, { title: announcement.title, audience: announcement.audience }, user.id, user.role);
    return announcement;
  }

  deleteAnnouncement(id: string, user: SignedInUser) {
    const list = this.allAnnouncements();
    if (!list.some((a) => a.id === id)) throw new NotFoundException(`Announcement ${id} was not found.`);
    this.data.setValue('announcements', list.filter((a) => a.id !== id));
    this.data.logActivity('ANNOUNCEMENT_REMOVED', 'ANNOUNCEMENT', id, {}, user.id, user.role);
    return { id, deleted: true };
  }

  // ── Support replies ──
  // Clients write to the admins through their Messages page (adminChatMessages).
  // A reply carries recipientEmail, which is how the client's page finds it.
  replyToClient(dto: SupportReplyDto, user: SignedInUser) {
    const messages = (this.data.getValue('adminChatMessages') as any[]) || [];
    const message = {
      id: `msg_${Date.now()}`,
      sender: user.name || 'Admin',
      senderRole: 'Admin',
      senderEmail: user.email,
      recipientEmail: dto.recipientEmail.trim().toLowerCase(),
      text: dto.text.trim(),
      timestamp: new Date().toISOString(),
      type: 'message',
    };
    this.data.setValue('adminChatMessages', [...messages, message]);
    return message;
  }
}
