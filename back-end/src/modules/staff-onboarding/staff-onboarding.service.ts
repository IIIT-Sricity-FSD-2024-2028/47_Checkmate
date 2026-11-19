import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { STAFF_DOCS_DIR } from '../../common/paths';
import { hashPassword } from '../../common/security/password';
import { DataService } from '../../database/data.service';
import { ApplicationDecisionDto, ApplyDto } from './dto';

const AVATARS = ['pink', 'teal', 'purple', 'green', 'orange'];

// How people become staff: the system offers one job per approved vendor, named
// after what that vendor does. A person applies from the public site, and that
// vendor reviews them. Approving creates the login and the staff record together,
// tied to that vendor only.
@Injectable()
export class StaffOnboardingService {
  constructor(private readonly data: DataService) {}

  /** The vendor behind a signed-in user. Admins and superusers see every vendor. */
  private async vendorIdFor(user: any): Promise<string | null> {
    if (['admin', 'superuser'].includes(user?.role)) return null;
    const vendor = (await this.data.collection('vendors')).find((v) => v.userId === user?.id);
    if (!vendor) throw new ForbiddenException('No vendor profile is linked to this account.');
    return vendor.id;
  }

  private async assertOwner(row: { vendorId: string }, user: any) {
    const vendorId = (await this.vendorIdFor(user));
    if (vendorId && row.vendorId !== vendorId) throw new ForbiddenException('This belongs to another vendor.');
  }

  /** The stored hash and file locations never leave the server. */
  private publicView(application: any) {
    const { passwordHash, documents = [], ...rest } = application;
    return { ...rest, documents: documents.map(({ storedName, ...doc }: any) => doc) };
  }

  private async approvedVendors() {
    return (await this.data.collection('vendors')).filter((v) => String(v.status).toLowerCase() === 'approved');
  }

  private designationOf(vendor: { category?: string }) {
    return vendor.category || 'Event Staff';
  }

  /** The work on offer comes straight from the vendors on the platform. */
  async designations() {
    return (await this.approvedVendors()).map((v) => ({
      vendorId: v.id,
      vendorName: v.name,
      designation: this.designationOf(v),
    }));
  }

  // ---- Applications ----
  private async assertEmailFree(email: string) {
    if ((await this.data.collection('users')).some((u) => u.email.toLowerCase() === email)) {
      throw new BadRequestException('This email is already registered. Please sign in instead.');
    }
  }

  private async assertCanApply(dto: ApplyDto, email: string, files: Express.Multer.File[]) {
    if (!files.length) throw new BadRequestException('Please attach at least one document.');
    await this.assertEmailFree(email);

    const isPending = (await this.data.collection('staffApplications')).some((a) => a.email === email && a.status === 'pending');
    if (isPending) throw new BadRequestException('You already have an application under review.');

    const digits = dto.phone.replace(/\D/g, '');
    if (digits.length < 10) throw new BadRequestException('Please enter a valid phone number.');
    const samePhone = (await this.data.collection('users')).filter((u) => String(u.phone || '').replace(/\D/g, '').endsWith(digits.slice(-10)));
    if (samePhone.length >= 2) {
      throw new BadRequestException('A maximum of 2 accounts can be registered with the same phone number.');
    }

    const vendor = (await this.approvedVendors()).find((v) => v.id === dto.vendorId);
    if (!vendor) throw new BadRequestException('This vendor is not available.');
    return vendor;
  }

  async apply(dto: ApplyDto, files: Express.Multer.File[] = []) {
    const email = dto.email.trim().toLowerCase();
    let vendor;
    try {
      vendor = (await this.assertCanApply(dto, email, files));
    } catch (err) {
      // Multer has already saved the files, so a refused application must not leave them behind
      await Promise.all(files.map((f) => unlink(f.path).catch(() => undefined)));
      throw err;
    }

    const application = (await this.data.create('staffApplications', 'SAP', {
      name: dto.name.trim(),
      email,
      phone: dto.phone.trim(),
      passwordHash: hashPassword(dto.password),
      designation: (await this.designationOf(vendor)),
      vendorId: vendor.id,
      vendorName: vendor.name,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      documents: files.map((f, index) => ({
        id: `DOC${index + 1}`,
        name: f.originalname,
        storedName: f.filename,
        mimeType: f.mimetype,
        size: f.size,
      })),
    } as any));
    return this.publicView(application);
  }

  async applications(user: any) {
    const vendorId = (await this.vendorIdFor(user));
    return (await this.data.collection('staffApplications'))
      .filter((a) => !vendorId || a.vendorId === vendorId)
      .map((a) => this.publicView(a));
  }

  async document(id: string, docId: string, user: any) {
    const application = (await this.data.find('staffApplications', id));
    await this.assertOwner(application, user);
    const doc = application.documents.find((d) => d.id === docId);
    if (!doc) throw new NotFoundException('Document not found.');
    return { path: join(STAFF_DOCS_DIR, doc.storedName), name: doc.name, mimeType: doc.mimeType };
  }

  async decide(id: string, dto: ApplicationDecisionDto, user: any) {
    const application = (await this.data.find('staffApplications', id));
    await this.assertOwner(application, user);
    if (application.status !== 'pending') throw new BadRequestException('This application has already been reviewed.');

    const outcome: Record<string, unknown> = {
      status: dto.status,
      note: dto.note,
      reviewedAt: new Date().toISOString(),
      reviewedBy: user?.id,
      passwordHash: undefined, // Finished with: it now lives on the user, or nowhere
    };

    if (dto.status === 'approved') {
      await this.assertEmailFree(application.email);
      const account = (await this.data.create('users', 'U', {
        name: application.name,
        email: application.email,
        phone: application.phone,
        role: 'Staff',
        status: 'Active',
        created: new Date().toISOString().slice(0, 10),
        passwordHash: application.passwordHash,
      } as any));
      const staff = (await this.data.create('staff', 'S', {
        userId: account.id,
        name: application.name,
        initials: application.name.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2),
        role: application.designation,
        vendor: application.vendorName,
        vendorId: application.vendorId,
        phone: application.phone,
        email: application.email,
        workload: 0,
        status: 'available',
        avail: 'Available',
        events: 0,
        avatar: AVATARS[(await this.data.collection('staff')).length % AVATARS.length],
        assignedEvents: [],
      } as any));
      outcome.userId = account.id;
      outcome.staffId = staff.id;
    }

    return this.publicView(await this.data.update('staffApplications', id, outcome as any));
  }
}
