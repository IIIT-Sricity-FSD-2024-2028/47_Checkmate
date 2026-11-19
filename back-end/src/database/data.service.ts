import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppData, Booking, EventRecord, VendorApplication } from '../domain/models';
import { seedData } from './seed';
import { calculateCommissionSplit, cancellationFeeFromPercent, commissionRateFromPercent, DEFAULT_COMMISSION_RATE } from '../common/constants/finance.constants';
import { syncBookingWithEvent } from './booking-rules';
import { DEMO_ASSIGNMENTS, DEMO_STAFF_RATINGS, DEMO_VENDOR_FEEDBACK } from './demo-ratings';
import { PrismaService } from './prisma.service';
import { fromRow, requiredColumnsOf, toRow } from './record-mapper';

export type ArrayCollectionName =
  | 'users'
  | 'events'
  | 'resources'
  | 'staff'
  | 'packages'
  | 'issues'
  | 'staffAssignments'
  | 'vendorApplications'
  | 'staffApplications'
  | 'vendors'
  | 'bookings'
  | 'venues'
  | 'notifications'
  | 'activityLogs'
  | 'staffTasks'
  | 'staffRatings'
  | 'vendorFeedback'
  | 'payments'
  | 'adminChatMessages';

// Collection name used by the services -> Prisma model (table) behind it
const MODELS: Record<ArrayCollectionName, string> = {
  users: 'User',
  events: 'Event',
  resources: 'Resource',
  staff: 'Staff',
  packages: 'Package',
  issues: 'Issue',
  staffAssignments: 'StaffAssignment',
  vendorApplications: 'VendorApplication',
  staffApplications: 'StaffApplication',
  vendors: 'Vendor',
  bookings: 'Booking',
  venues: 'Venue',
  notifications: 'Notification',
  activityLogs: 'ActivityLog',
  staffTasks: 'StaffTask',
  staffRatings: 'StaffRating',
  vendorFeedback: 'VendorFeedback',
  payments: 'Payment',
  adminChatMessages: 'AdminChatMessage',
};

// Table load order for imports (a row only after the rows it points to)
const IMPORT_ORDER: ArrayCollectionName[] = [
  'users', 'vendors', 'staff', 'events', 'resources', 'packages', 'venues', 'vendorApplications', 'staffApplications',
  'bookings', 'payments', 'staffAssignments', 'staffRatings', 'vendorFeedback', 'issues', 'notifications',
  'activityLogs', 'staffTasks', 'adminChatMessages',
];

// Prisma client or the transaction client inside $transaction
type Db = Prisma.TransactionClient | PrismaService;

const delegate = (db: Db, model: string) => (db as any)[model.charAt(0).toLowerCase() + model.slice(1)];
const isCollection = (name: string): name is ArrayCollectionName => name in MODELS;

// Ids like EVT012 are sorted by their number, so lists come back in creation order
function byIdNumber(a: { id: string }, b: { id: string }) {
  const na = Number(String(a.id).replace(/\D/g, '')) || 0;
  const nb = Number(String(b.id).replace(/\D/g, '')) || 0;
  return na - nb || String(a.id).localeCompare(String(b.id));
}

/**
 * THE DATA LAYER — PostgreSQL through Prisma.
 *
 * It keeps the method names the services already used with the old JSON file
 * (collection / find / create / update / remove / getValue / setValue), but every
 * method is now async and reads/writes real tables (prisma/schema.prisma).
 *
 * The "triggers" (what used to happen automatically after a change) now run in
 * the SAME database transaction as the change itself:
 *   - an event becoming confirmed creates its booking (commission split)
 *   - an event finishing (completed / cancelled / rejected) releases its
 *     resources and staff and applies the cancellation fee to its booking
 *   - an approved vendor application creates the vendor + its login
 *   - assignment changes recompute the staff member's workload
 * If any step fails, Postgres rolls the whole change back, so the data can never
 * be half-updated (e.g. a confirmed event without its booking).
 */
@Injectable()
export class DataService implements OnModuleInit {
  private readonly logger = new Logger(DataService.name);

  constructor(private readonly prisma: PrismaService) {}

  // On start: an empty database is seeded (same 5 accounts + demo data), then the
  // values the app calculates (workloads, stock, bookings) are rebuilt.
  async onModuleInit() {
    if ((await this.prisma.user.count()) === 0) {
      const report = await this.importAppData(structuredClone(seedData));
      this.logger.log(`Empty database seeded (${report.total} rows).`);
    }
    await this.housekeeping();
    this.logger.log('EMS Persistence Engine active. Database: PostgreSQL (Prisma)');
  }

  // ── Reading ───────────────────────────────────────────────────────────────

  /** Every row of a collection as plain objects, in creation order. */
  async collection<K extends ArrayCollectionName>(name: K, db: Db = this.prisma): Promise<AppData[K]> {
    const rows = await delegate(db, MODELS[name]).findMany();
    return rows.map((r: any) => fromRow(MODELS[name], r)).sort(byIdNumber) as AppData[K];
  }

  /** One row by id (case-insensitive, like before); 404 when it does not exist. */
  async find<K extends ArrayCollectionName>(name: K, id: string, db: Db = this.prisma): Promise<AppData[K][number]> {
    const row = await delegate(db, MODELS[name]).findFirst({ where: { id: { equals: String(id), mode: 'insensitive' } } });
    if (!row) throw new NotFoundException(`${String(name)} item ${id} was not found.`);
    return fromRow(MODELS[name], row);
  }

  // ── Writing (each one is a transaction: the change + its triggers) ──────────

  async create<K extends ArrayCollectionName>(name: K, prefix: string, payload: Record<string, any>): Promise<any> {
    // Two requests at the same moment can pick the same next id (EVT012). When
    // the id was generated here, that clash is retried with a fresh id.
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.createOnce(name, prefix, payload);
      } catch (err: any) {
        const idClash = err?.code === 'P2002' && (err.meta?.target || []).includes('id');
        if (idClash && !payload.id && attempt < 3) continue;
        if (idClash) throw new BadRequestException(`${String(name)} ${payload.id || ''} already exists.`);
        throw err;
      }
    }
  }

  private async createOnce<K extends ArrayCollectionName>(name: K, prefix: string, payload: Record<string, any>): Promise<any> {
    return this.run(() =>
      this.prisma.$transaction(async (tx) => {
        const item: any = { ...payload, id: payload.id || (await this.nextIdIn(name, prefix, tx)) };
        await this.write(name, item, tx, 'create');
        if (name === 'events') await this.triggerEventCreated(item as EventRecord, tx);
        else if (name === 'staffAssignments') await this.triggerStaffAssignmentChanged(item.staffId, tx);
        return structuredClone(item);
      }),
    );
  }

  async update<K extends ArrayCollectionName>(name: K, id: string, patch: Record<string, any>): Promise<any> {
    return this.run(() =>
      this.prisma.$transaction(async (tx) => {
        const oldItem: any = await this.find(name, id, tx);
        const newItem: any = { ...oldItem, ...patch, id: oldItem.id };
        await this.write(name, newItem, tx, 'update');
        if (name === 'events') await this.triggerEventUpdated(oldItem, newItem, tx);
        else if (name === 'staffAssignments') {
          await this.triggerStaffAssignmentChanged(newItem.staffId, tx);
          if (oldItem.staffId && oldItem.staffId !== newItem.staffId) await this.triggerStaffAssignmentChanged(oldItem.staffId, tx);
        } else if (name === 'vendorApplications') await this.triggerVendorApplicationUpdated(oldItem, newItem, tx);
        return this.find(name, id, tx);
      }),
    );
  }

  async remove<K extends ArrayCollectionName>(name: K, id: string): Promise<{ id: string; deleted: true }> {
    return this.run(() =>
      this.prisma.$transaction(async (tx) => {
        const item: any = await this.find(name, id, tx);
        // Foreign keys with ON DELETE CASCADE remove an event's allocations,
        // assignments, booking, ratings and feedback in the same statement.
        await delegate(tx, MODELS[name]).delete({ where: { id: item.id } });
        if (name === 'events') await this.cascadeDeleteEvent(item.id, tx);
        else if (name === 'staffAssignments') await this.triggerStaffAssignmentChanged(item.staffId, tx);
        else if (name === 'staff') await tx.staffTask.deleteMany({ where: { staffId: item.id } });
        return { id, deleted: true as const };
      }),
    );
  }

  // Inserts or replaces one plain object in its table
  private async write(name: ArrayCollectionName, item: Record<string, any>, db: Db, mode: 'create' | 'update') {
    const model = MODELS[name];
    const data = toRow(model, item);
    if (mode === 'create') await delegate(db, model).create({ data });
    else await delegate(db, model).update({ where: { id: item.id }, data });
  }

  // Turns database errors into clear 400s instead of a 500
  private async run<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (err: any) {
      if (err?.code === 'P2002' && (err.meta?.target || []).includes('id')) throw err; // create() retries this one
      if (err?.code === 'P2002') throw new BadRequestException(`That already exists (${(err.meta?.target || []).join(', ') || 'unique value'}).`);
      if (err?.code === 'P2003') throw new BadRequestException(`It refers to something that does not exist (${err.meta?.field_name || 'link'}).`);
      if (err?.code === 'P2025') throw new NotFoundException('Record not found.');
      throw err;
    }
  }

  // ── Loose key/value data (old "state" keys) ─────────────────────────────────
  // A few keys have real tables; everything else lives in the `settings` table.

  async getValue(name: string, db: Db = this.prisma): Promise<any> {
    if (name === 'resourceAllocations') return this.allocationMap(db);
    if (name === 'messages') return this.threadMap(db);
    if (name === 'messageReads') return this.readsMap(db);
    if (isCollection(name)) return this.collection(name, db);
    const row = await db.setting.findUnique({ where: { key: name } });
    if (row) return row.value;
    return structuredClone((seedData as any)[name] ?? null);
  }

  async setValue(name: string, value: unknown, db?: Db): Promise<any> {
    const work = async (tx: Db) => {
      if (name === 'resourceAllocations') {
        await this.replaceAllocations(value as Record<string, any[]>, tx);
        await this.triggerAllResourceAllocations(tx);
      } else if (isCollection(name)) {
        // Whole-list replace (notifications / admin chat saved by the old /state API)
        await this.replaceCollection(name, Array.isArray(value) ? value : [], tx);
      } else {
        await tx.setting.upsert({ where: { key: name }, create: { key: name, value: value as any }, update: { value: value as any } });
      }
      return this.getValue(name, tx);
    };
    return db ? work(db) : this.run(() => this.prisma.$transaction(work));
  }

  /** Kept for old callers: every change is already saved by its transaction. */
  save(): void {
    /* nothing to do with PostgreSQL */
  }

  // Replaces a whole table's rows with the given list (one transaction)
  private async replaceCollection(name: ArrayCollectionName, list: any[], db: Db) {
    const model = MODELS[name];
    await delegate(db, model).deleteMany({});
    const rows = list.filter((r) => r && r.id).map((r) => toRow(model, r));
    if (rows.length) await delegate(db, model).createMany({ data: rows });
  }

  // resourceAllocations map { eventId: [{ resourceId, quantity, status, ... }] }
  private async allocationMap(db: Db) {
    const rows = await db.allocation.findMany({ orderBy: { id: 'asc' } });
    const map: Record<string, any[]> = {};
    rows.forEach((r) => {
      const item = { ...(r.extra as any), resourceId: r.resourceId, quantity: r.quantity, status: r.status, ...(r.releasedAt ? { releasedAt: r.releasedAt.toISOString() } : {}) };
      (map[r.eventId] = map[r.eventId] || []).push(item);
    });
    return map;
  }

  private async replaceAllocations(map: Record<string, any[]>, db: Db) {
    await db.allocation.deleteMany({});
    const rows: any[] = [];
    Object.entries(map || {}).forEach(([eventId, list]) =>
      (list || []).forEach((item: any) => {
        const { resourceId, quantity, qty, status, releasedAt, ...extra } = item || {};
        const amount = Number(quantity ?? qty ?? 0);
        if (!resourceId || !(amount > 0)) return;
        rows.push({ eventId, resourceId, quantity: Math.round(amount), status: status || 'allocated', releasedAt: releasedAt ? new Date(releasedAt) : null, extra });
      }),
    );
    if (rows.length) await db.allocation.createMany({ data: rows });
  }

  // messages map { threadId: [message, ...] }
  private async threadMap(db: Db) {
    const rows = await db.message.findMany({ orderBy: [{ threadId: 'asc' }, { id: 'asc' }] });
    const map: Record<string, any[]> = {};
    rows.forEach((r) => (map[r.threadId] = map[r.threadId] || []).push(this.messageFromRow(r)));
    return map;
  }

  private messageFromRow(r: any) {
    return { ...(r.extra || {}), id: r.messageId, threadId: r.threadId, sender: r.sender ?? undefined, senderId: r.senderId ?? undefined, text: r.text, createdAt: r.createdAt.toISOString() };
  }

  /** One conversation, oldest first. */
  async threadMessages(threadId: string) {
    const rows = await this.prisma.message.findMany({ where: { threadId }, orderBy: { id: 'asc' } });
    return rows.map((r) => this.messageFromRow(r));
  }

  /** Adds one message to a conversation (gets the next MSG number in that thread). */
  async addThreadMessage(threadId: string, message: Record<string, any>) {
    const count = await this.prisma.message.count({ where: { threadId } });
    const { id, sender, senderId, text, createdAt, threadId: _t, ...extra } = message;
    const messageId = id || `MSG${String(count + 1).padStart(3, '0')}`;
    const row = await this.prisma.message.create({
      data: { messageId, threadId, sender, senderId, text: String(text), createdAt: new Date(createdAt || Date.now()), extra },
    });
    return this.messageFromRow(row);
  }

  // messageReads map { userId: { threadKey: ISO time } }
  private async readsMap(db: Db) {
    const rows = await db.messageRead.findMany();
    const map: Record<string, Record<string, string>> = {};
    rows.forEach((r) => ((map[r.userId] = map[r.userId] || {})[r.threadKey] = r.readAt.toISOString()));
    return map;
  }

  /** When this user last opened each conversation: { threadKey: ISO time }. */
  async readsFor(userId: string) {
    return (await this.readsMap(this.prisma))[userId] || {};
  }

  /** Remembers that this user opened a conversation now. */
  async markRead(userId: string, threadKey: string, at = new Date()) {
    await this.prisma.messageRead.upsert({
      where: { userId_threadKey: { userId, threadKey } },
      create: { userId, threadKey, readAt: at },
      update: { readAt: at },
    });
    return at.toISOString();
  }

  /** The whole database as plain objects (admin snapshot + analytics). */
  async snapshot(): Promise<AppData> {
    const result: Record<string, any> = {};
    for (const name of Object.keys(MODELS) as ArrayCollectionName[]) result[name] = await this.collection(name);
    for (const s of await this.prisma.setting.findMany()) result[s.key] = s.value;
    result.resourceAllocations = await this.allocationMap(this.prisma);
    result.messages = await this.threadMap(this.prisma);
    result.monitorProgress = result.monitorProgress || {};
    result.contingencyPlans = result.contingencyPlans || {};
    return result as AppData;
  }

  // Builds the next id like EVT012 / U007: the highest number in use + 1
  public nextId(list: Array<{ id: string }>, prefix: string): string {
    const max = list.reduce((acc, item) => {
      const numeric = Number(String(item.id).replace(/\D/g, ''));
      return Number.isFinite(numeric) ? Math.max(acc, numeric) : acc;
    }, 0);
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  }

  private async nextIdIn(name: ArrayCollectionName, prefix: string, db: Db) {
    const ids = await delegate(db, MODELS[name]).findMany({ select: { id: true } });
    return this.nextId(ids, prefix);
  }

  // ── Small helpers used by several services ─────────────────────────────────

  /** The rate an admin set on Global Settings, as a fraction (12% -> 0.12). */
  async getCommissionRate(db: Db = this.prisma): Promise<number> {
    const settings = (await this.getValue('platformSettings', db)) as { commissionRate?: unknown } | null;
    return commissionRateFromPercent(settings?.commissionRate);
  }

  /** Global Settings "Cancellation fee %" as a fraction (0 when not set). */
  async getCancellationFeeRate(db: Db = this.prisma): Promise<number> {
    const settings = (await this.getValue('platformSettings', db)) as { cancellationFeePercent?: unknown } | null;
    return cancellationFeeFromPercent(settings?.cancellationFeePercent);
  }

  /** Drops a bell notification for one user (no-op without a user id). */
  async notifyUser(userId: string | undefined, title: string, message: string, type: 'success' | 'error' | 'info' = 'info', linkUrl?: string) {
    if (!userId) return;
    if (!(await this.prisma.user.findUnique({ where: { id: userId } }))) return;
    await this.create('notifications', 'NOTIF', { userId, title, message, type, isRead: false, linkUrl, createdAt: new Date().toISOString() });
  }

  /** The login (user id) of a vendor company, if it has one. */
  async vendorUserId(vendorId?: string): Promise<string | undefined> {
    if (!vendorId) return undefined;
    return (await this.prisma.vendor.findUnique({ where: { id: vendorId } }))?.userId || undefined;
  }

  async logActivity(action: string, entityType: string, entityId: string, details?: Record<string, unknown>, userId?: string, userRole?: string, db: Db = this.prisma) {
    // Logs are written constantly (every change); a time-based id never clashes
    const id = `LOG${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    await this.write('activityLogs', { id, userId: userId || 'SYS', userRole: userRole || 'System', action, entityType, entityId, details, createdAt: new Date().toISOString() }, db, 'create');
  }

  // ==========================================================================
  // TRIGGERS — run inside the transaction of the change that caused them
  // ==========================================================================

  private async triggerEventCreated(event: EventRecord, db: Db) {
    const progress = ((await this.getValue('monitorProgress', db)) as Record<string, any>) || {};
    if (!progress[event.id]) {
      progress[event.id] = { setup: 0, registration: 0, event: 0, breakdown: 0 };
      await this.setValue('monitorProgress', progress, db);
    }
    await this.logActivity('EVENT_CREATED', 'EVENT', event.id, { name: event.name, type: event.type, date: event.date, budget: event.budget }, undefined, undefined, db);
  }

  // Shares a booking between vendors in proportion to the value of the items each
  // supplied. Returns undefined when one vendor supplied everything.
  private async buildVendorSplits(eventId: string, cost: number, rate: number, db: Db) {
    const allocations = (await this.allocationMap(db))[eventId] || [];
    const resources = await this.collection('resources', db);
    const values = new Map<string, { vendor: string; value: number }>();
    allocations.forEach((item: any) => {
      const resource: any = resources.find((r) => r.id === item.resourceId);
      if (!resource?.vendorId) return;
      const entry = values.get(resource.vendorId) || { vendor: resource.vendor, value: 0 };
      entry.value += Number(item.quantity || 0) * Number(resource.price || 0);
      values.set(resource.vendorId, entry);
    });
    if (values.size < 2) return undefined;
    const totalValue = [...values.values()].reduce((sum, v) => sum + v.value, 0);
    if (totalValue <= 0) return undefined;
    let remaining = cost;
    return [...values.entries()].map(([vendorId, entry], index) => {
      const share = index === values.size - 1 ? remaining : Number(((cost * entry.value) / totalValue).toFixed(2));
      remaining = Number((remaining - share).toFixed(2));
      const { commissionAmount, vendorPayoutAmount } = calculateCommissionSplit(share, rate);
      return { vendorId, vendor: entry.vendor, cost: share, commissionAmount, vendorPayoutAmount };
    });
  }

  // THE REVENUE RULE. When an event becomes confirmed/approved for the first time,
  // its booking is created in the same transaction (so it can never be missing).
  // A finished event releases its stock and staff; the booking follows the event.
  private async triggerEventUpdated(oldEvent: EventRecord, newEvent: EventRecord, db: Db) {
    const confirmed = ['confirmed', 'approved'];
    const oldStatus = String(oldEvent.status).toLowerCase();
    const newStatus = String(newEvent.status).toLowerCase();

    if (confirmed.includes(newStatus) && !confirmed.includes(oldStatus)) {
      const existing = await db.booking.findUnique({ where: { eventId: newEvent.id } });
      if (!existing) {
        const cost = Number(newEvent.quotedPrice || newEvent.budget || newEvent.estimatedCost || 0) || 0;
        const split = calculateCommissionSplit(cost, await this.getCommissionRate(db));
        const id = await this.nextIdIn('bookings', 'BK', db);
        await this.write('bookings', {
          id,
          eventId: newEvent.id,
          eventName: newEvent.name,
          client: newEvent.client || 'Client',
          clientId: newEvent.clientId,
          vendor: newEvent.vendor || 'Vendor',
          vendorId: newEvent.vendorId,
          status: 'Confirmed',
          cost,
          advancePaid: 0,
          paymentStatus: 'unpaid',
          commissionRate: split.commissionRate,
          commissionAmount: split.commissionAmount,
          vendorPayoutAmount: split.vendorPayoutAmount,
          payoutStatus: 'pending',
          vendorSplits: await this.buildVendorSplits(newEvent.id, cost, split.commissionRate, db),
          created: new Date().toISOString().slice(0, 10),
        }, db, 'create');
      }
    }

    if (oldStatus !== newStatus) await this.syncEventBooking(newEvent, db);

    const finished = ['completed', 'rejected', 'cancelled'];
    if (finished.includes(newStatus) && !finished.includes(oldStatus)) await this.releaseEventAllocations(newEvent.id, db);

    if (oldEvent.status !== newEvent.status) {
      await this.logActivity('EVENT_STATUS_CHANGED', 'EVENT', newEvent.id, { oldStatus: oldEvent.status, newStatus: newEvent.status, eventName: newEvent.name }, undefined, undefined, db);
    }
  }

  // The booking (if any) follows its event: In Progress / Completed / Cancelled (fee)
  private async syncEventBooking(event: EventRecord, db: Db) {
    const row = await db.booking.findUnique({ where: { eventId: event.id } });
    if (!row) return;
    const booking = fromRow('Booking', row) as Booking;
    const patch = syncBookingWithEvent(booking, String(event.status), await this.getCancellationFeeRate(db));
    if (Object.keys(patch).length) await this.write('bookings', { ...booking, ...patch }, db, 'update');
  }

  // Approving a vendor application creates the vendor company and its login
  private async triggerVendorApplicationUpdated(oldApp: VendorApplication, newApp: VendorApplication, db: Db) {
    if (newApp.status !== 'approved' || oldApp.status === 'approved') return;
    const vendors = await this.collection('vendors', db);
    const users = await this.collection('users', db);
    let user = users.find((u) => u.email.toLowerCase() === newApp.email.toLowerCase());
    if (!user) {
      user = {
        id: this.nextId(users, 'U'),
        name: newApp.vendorName,
        email: newApp.email,
        phone: newApp.phone,
        role: 'Vendor',
        status: 'Active',
        created: new Date().toISOString().slice(0, 10),
        passwordHash: newApp.passwordHash || '',
      };
      await this.write('users', user, db, 'create');
    }
    if (!vendors.some((v) => v.name.toLowerCase() === newApp.businessName.toLowerCase())) {
      await this.write('vendors', {
        id: this.nextId(vendors, 'V'),
        name: newApp.businessName,
        businessName: newApp.businessName,
        category: newApp.category || 'General',
        status: 'Approved',
        rating: 5.0,
        userId: user.id,
        created: new Date().toISOString().slice(0, 10),
      }, db, 'create');
    }
    await this.logActivity('VENDOR_APPLICATION_APPROVED', 'VENDOR_APPLICATION', newApp.id, { businessName: newApp.businessName, vendorName: newApp.vendorName }, undefined, undefined, db);
  }

  // A staff member's workload comes from their open assignments (never typed in)
  public async triggerStaffAssignmentChanged(staffId: string, db: Db = this.prisma) {
    if (!staffId) return;
    const row = await db.staff.findUnique({ where: { id: staffId } });
    if (!row) return;
    const staff = fromRow('Staff', row);
    const open = (await this.collection('staffAssignments', db)).filter(
      (a) => a.staffId === staff.id && ['pending', 'assigned', 'accepted', 'in_progress'].includes(String(a.status).toLowerCase()),
    );
    await this.write('staff', {
      ...staff,
      events: open.length,
      workload: Math.min(100, open.length * 25),
      status: open.length > 0 ? 'assigned' : 'available',
      avail: open.length > 0 ? 'Assigned' : 'Available',
      assignedEvents: open.map((a) => a.eventId || a.eventName),
    }, db, 'update');
  }

  // Date-less stock summary for dashboards (date-based availability is in
  // modules/resources/resource-availability.ts)
  public async triggerAllResourceAllocations(db: Db = this.prisma) {
    const allocations = await db.allocation.findMany({ where: { status: 'allocated' } });
    const held: Record<string, number> = {};
    allocations.forEach((a) => (held[a.resourceId] = (held[a.resourceId] || 0) + a.quantity));
    for (const res of await this.collection('resources', db)) {
      const total = Number(res.total ?? res.quantity ?? 0);
      const avail = Math.max(0, total - (held[res.id] || 0));
      await this.write('resources', {
        ...res,
        avail,
        quantityAvailable: avail,
        available: total > 0 && res.conditionStatus !== 'Maintenance' && res.conditionStatus !== 'Damaged',
      }, db, 'update');
    }
  }

  // After an event: stock back to the pool, assignments closed, progress at 100%.
  // Declined assignments stay declined (that person never worked the event).
  public async releaseEventAllocations(eventId: string, db: Db = this.prisma) {
    const now = new Date();
    await db.allocation.updateMany({ where: { eventId, status: 'allocated' }, data: { status: 'released', releasedAt: now } });
    await this.triggerAllResourceAllocations(db);

    const assignments = (await this.collection('staffAssignments', db)).filter(
      (a) => a.eventId === eventId && !['rejected', 'declined'].includes(String(a.status).toLowerCase()),
    );
    for (const a of assignments) {
      await this.write('staffAssignments', { ...a, status: 'completed', completedAt: now.toISOString() }, db, 'update');
      await this.triggerStaffAssignmentChanged(a.staffId, db);
    }

    const progress = ((await this.getValue('monitorProgress', db)) as Record<string, any>) || {};
    if (progress[eventId]) {
      progress[eventId] = { setup: 100, registration: 100, event: 100, breakdown: 100 };
      await this.setValue('monitorProgress', progress, db);
    }
  }

  // Deleting an event: the database cascades its rows; tidy the rest
  private async cascadeDeleteEvent(eventId: string, db: Db) {
    const progress = ((await this.getValue('monitorProgress', db)) as Record<string, any>) || {};
    if (progress[eventId]) {
      delete progress[eventId];
      await this.setValue('monitorProgress', progress, db);
    }
    await db.staffTask.deleteMany({ where: { eventId } });
    for (const s of await db.staff.findMany({ select: { id: true } })) await this.triggerStaffAssignmentChanged(s.id, db);
    await this.triggerAllResourceAllocations(db);
    await this.logActivity('EVENT_DELETED', 'EVENT', eventId, { eventId }, undefined, undefined, db);
  }

  // ==========================================================================
  // HOUSEKEEPING at start (same jobs the JSON version did when loading the file)
  // ==========================================================================

  private async housekeeping() {
    await this.prisma.$transaction(async (tx) => {
      await this.ensureStaffAccounts(tx);
      await this.fillMissingStaffProfiles(tx);
      await this.addDemoRatingsIfNone(tx);
      await this.normalizeBookingCommissions(tx);
      for (const s of await tx.staff.findMany({ select: { id: true } })) await this.triggerStaffAssignmentChanged(s.id, tx);
      await this.triggerAllResourceAllocations(tx);
      for (const e of await this.collection('events', tx)) await this.syncEventBooking(e, tx);
    }, { timeout: 60000 });
  }

  // Every Staff login gets an operational staff row
  private async ensureStaffAccounts(db: Db) {
    const avatars = ['pink', 'teal', 'purple', 'green', 'orange'];
    const staff = await this.collection('staff', db);
    const users = (await this.collection('users', db)).filter(
      (u) => u.role === 'Staff' && !staff.some((s) => s.email?.toLowerCase() === u.email.toLowerCase()),
    );
    for (const u of users) {
      const initials = u.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
      const row = { id: this.nextId(staff, 'S'), userId: u.id, name: u.name, initials, role: 'Staff Member', phone: u.phone || '', email: u.email, workload: 0, status: 'available', avail: 'Available', events: 0, avatar: avatars[staff.length % avatars.length], assignedEvents: [] };
      staff.push(row);
      await this.write('staff', row, db, 'create');
    }
  }

  // Staff rows saved before profiles existed get the seed's experience/skills/bio
  private async fillMissingStaffProfiles(db: Db) {
    for (const member of await this.collection('staff', db)) {
      const seedRow: any = seedData.staff.find((s) => s.id === member.id);
      if (!seedRow || (member.experienceYears !== undefined && member.skills?.length && member.bio)) continue;
      await this.write('staff', {
        ...member,
        experienceYears: member.experienceYears ?? seedRow.experienceYears,
        skills: member.skills?.length ? member.skills : seedRow.skills,
        bio: member.bio || seedRow.bio,
      }, db, 'update');
    }
  }

  // Demo ratings/feedback (demo-ratings.ts) only while there are NONE at all
  private async addDemoRatingsIfNone(db: Db) {
    const events = await this.collection('events', db);
    const completed = (id: string) => events.some((e) => e.id === id && String(e.status).toLowerCase() === 'completed');
    if ((await db.vendorFeedback.count()) === 0) {
      for (const f of DEMO_VENDOR_FEEDBACK) {
        const ev = events.find((e) => e.id === f.eventId && completed(e.id) && e.clientId === f.clientId);
        if (ev && (await db.vendor.findUnique({ where: { id: f.vendorId } }))) await this.write('vendorFeedback', { ...f }, db, 'create');
      }
    }
    if ((await db.staffRating.count()) > 0) return;
    const staffIds = new Set((await db.staff.findMany({ select: { id: true } })).map((s) => s.id));
    const assignments = await this.collection('staffAssignments', db);
    for (const a of DEMO_ASSIGNMENTS) {
      if (!assignments.some((x) => x.staffId === a.staffId && x.eventId === a.eventId) && completed(a.eventId) && staffIds.has(a.staffId)) {
        await this.write('staffAssignments', { ...a }, db, 'create');
        assignments.push(a);
      }
    }
    for (const r of DEMO_STAFF_RATINGS) {
      const worked = assignments.some((x) => x.staffId === r.staffId && x.eventId === r.eventId);
      if (completed(r.eventId) && staffIds.has(r.staffId) && worked) await this.write('staffRatings', { ...r }, db, 'create');
    }
  }

  // Bookings missing a commission split get one
  private async normalizeBookingCommissions(db: Db) {
    for (const b of await this.collection('bookings', db)) {
      if (b.commissionAmount !== undefined && b.vendorPayoutAmount !== undefined && b.payoutStatus) continue;
      const split = calculateCommissionSplit(b.cost, b.commissionRate || DEFAULT_COMMISSION_RATE);
      await this.write('bookings', {
        ...b,
        commissionRate: b.commissionRate ?? split.commissionRate,
        commissionAmount: b.commissionAmount ?? split.commissionAmount,
        vendorPayoutAmount: b.vendorPayoutAmount ?? split.vendorPayoutAmount,
        payoutStatus: b.payoutStatus || (String(b.status).toLowerCase() === 'completed' && b.paymentStatus === 'paid' ? 'settled' : 'pending'),
      }, db, 'update');
    }
  }

  // ==========================================================================
  // IMPORT — fills an EMPTIED database from a JSON-shaped object (seed.ts or a
  // backup of the old database.json). Rows that point at something missing
  // are skipped and listed in the report instead of failing the whole import.
  // ==========================================================================

  async importAppData(app: Record<string, any>) {
    const skipped: string[] = [];
    const filled: string[] = [];
    const counts: Record<string, number> = {};
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        'TRUNCATE users, vendors, vendor_applications, staff_applications, staff, events, resources, allocations, staff_assignments, bookings, payments, staff_ratings, vendor_feedback, packages, issues, venues, staff_tasks, messages, admin_chat_messages, message_reads, notifications, activity_logs, settings CASCADE',
      );
      const ids: Record<string, Set<string>> = {};
      const has = (name: string, id?: string) => !id || ids[name]?.has(id);
      for (const name of IMPORT_ORDER) {
        const list: any[] = Array.isArray(app[name]) ? app[name] : [];
        const kept: any[] = [];
        const seen = new Set<string>();
        for (const original of list) {
          if (!original?.id || seen.has(String(original.id))) continue;
          const r = { ...original };
          // Old records may miss a required value (e.g. a chat message with only
          // `timestamp`): fill it and say so in the report, never silently
          for (const col of requiredColumnsOf(MODELS[name])) {
            if (r[col.name] !== undefined && r[col.name] !== null && r[col.name] !== '') continue;
            if (col.type === 'DateTime') r[col.name] = r.timestamp || r.created || r.createdAt || new Date().toISOString();
            else if (col.type === 'String') r[col.name] = '';
            else if (col.type === 'Int' || col.type === 'Decimal') r[col.name] = 0;
            else continue;
            filled.push(`${name} ${r.id}: ${col.name} was empty, set to "${r[col.name]}"`);
          }
          const why = this.importProblem(name, r, has, kept);
          if (why) {
            skipped.push(`${name} ${r.id}: ${why}`);
            continue;
          }
          seen.add(String(r.id));
          kept.push(r);
        }
        if (kept.length) await delegate(tx, MODELS[name]).createMany({ data: kept.map((r) => toRow(MODELS[name], r)) });
        ids[name] = new Set(kept.map((r) => String(r.id)));
        counts[name] = kept.length;
      }
      // Allocation map -> rows (only for events + resources that exist)
      const allocations: Record<string, any[]> = {};
      Object.entries(app.resourceAllocations || {}).forEach(([eventId, list]) => {
        const ok = (list as any[]).filter((i) => has('events', eventId) && has('resources', i?.resourceId));
        if (ok.length !== (list as any[]).length) skipped.push(`allocations for ${eventId}: ${(list as any[]).length - ok.length} skipped (missing event/resource)`);
        if (ok.length) allocations[eventId] = ok;
      });
      await this.replaceAllocations(allocations, tx);
      counts.allocations = await tx.allocation.count();
      // Conversations
      for (const [threadId, list] of Object.entries(app.messages || {})) {
        let n = 0;
        for (const m of (list as any[]) || []) {
          n++;
          const { id, sender, senderId, text, createdAt, threadId: _t, ...extra } = m || {};
          await tx.message.create({ data: { messageId: id || `MSG${String(n).padStart(3, '0')}`, threadId, sender, senderId, text: String(text ?? ''), createdAt: new Date(createdAt || m?.timestamp || Date.now()), extra } });
        }
      }
      counts.messages = await tx.message.count();
      // Read markers
      for (const [userId, threads] of Object.entries(app.messageReads || {})) {
        for (const [threadKey, at] of Object.entries(threads as Record<string, string>)) {
          await tx.messageRead.create({ data: { userId, threadKey, readAt: new Date(at) } });
        }
      }
      // Everything else -> settings
      const tableKeys = new Set<string>([...IMPORT_ORDER, 'resourceAllocations', 'messages', 'messageReads']);
      for (const [key, value] of Object.entries(app)) {
        if (tableKeys.has(key) || value === undefined) continue;
        await tx.setting.create({ data: { key, value: value as any } });
      }
      counts.settings = await tx.setting.count();
    }, { timeout: 120000 });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return { counts, skipped, filled, total };
  }

  // Why a row cannot be imported (missing link / duplicate), or "" when it is fine.
  // Optional links that are missing are cleared instead of skipping the row.
  private importProblem(name: ArrayCollectionName, r: any, has: (n: string, id?: string) => boolean | undefined, kept: any[]): string {
    const clear = (field: string, table: string) => { if (r[field] && !has(table, r[field])) r[field] = undefined; };
    switch (name) {
      case 'users':
        return kept.some((u) => String(u.email).toLowerCase() === String(r.email).toLowerCase()) ? 'duplicate email' : '';
      case 'vendors': clear('userId', 'users'); return '';
      case 'staff': clear('vendorId', 'vendors'); clear('userId', 'users'); return '';
      case 'events': clear('clientId', 'users'); clear('vendorId', 'vendors'); return '';
      case 'resources': case 'packages': clear('vendorId', 'vendors'); return '';
      case 'bookings':
        clear('eventId', 'events'); clear('vendorId', 'vendors');
        return r.eventId && kept.some((b) => b.eventId === r.eventId) ? 'second booking for the same event' : '';
      case 'payments': return has('bookings', r.bookingId) && has('users', r.clientId) ? '' : 'booking or client missing';
      case 'staffAssignments': return has('staff', r.staffId) && has('events', r.eventId) ? '' : 'staff or event missing';
      case 'staffRatings':
        if (!has('staff', r.staffId) || !has('events', r.eventId) || !has('vendors', r.vendorId)) return 'staff, event or vendor missing';
        return kept.some((x) => x.vendorId === r.vendorId && x.staffId === r.staffId && x.eventId === r.eventId) ? 'duplicate rating' : '';
      case 'vendorFeedback':
        if (!has('vendors', r.vendorId) || !has('events', r.eventId) || !has('users', r.clientId)) return 'vendor, event or client missing';
        return kept.some((x) => x.eventId === r.eventId) ? 'second feedback for the same event' : '';
      case 'issues': clear('eventId', 'events'); return '';
      case 'notifications': return r.userId && !has('users', r.userId) ? 'user missing' : '';
      default: return '';
    }
  }
}
