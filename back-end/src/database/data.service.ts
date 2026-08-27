import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppData, ActivityLog, EventRecord, Resource, StaffMember, VendorApplication } from '../domain/models';
import { seedData } from './seed';

export type ArrayCollectionName =
  | 'users'
  | 'events'
  | 'resources'
  | 'staff'
  | 'packages'
  | 'issues'
  | 'staffAssignments'
  | 'vendorApplications'
  | 'vendors'
  | 'bookings'
  | 'venues'
  | 'notifications'
  | 'activityLogs'
  | 'staffTasks';

@Injectable()
export class DataService implements OnModuleInit {
  private readonly logger = new Logger(DataService.name);
  private readonly dataDir = join(__dirname, '..', '..', 'data');
  private readonly dbFilePath = join(this.dataDir, 'database.json');

  private data: AppData;

  constructor() {
    this.data = this.loadPersistentData();
    this.ensureStaffAccounts();
  }

  onModuleInit() {
    this.save();
    this.logger.log(`EMS Persistence Engine active. Database file: ${this.dbFilePath}`);
  }

  /**
   * Loads data from disk or initializes from seed
   */
  private loadPersistentData(): AppData {
    try {
      if (!existsSync(this.dataDir)) {
        mkdirSync(this.dataDir, { recursive: true });
      }

      if (existsSync(this.dbFilePath)) {
        const raw = readFileSync(this.dbFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        const merged: AppData = {
          ...structuredClone(seedData),
          ...parsed,
          venues: parsed.venues || seedData.venues || [],
          notifications: parsed.notifications || seedData.notifications || [],
          activityLogs: parsed.activityLogs || seedData.activityLogs || [],
          messages: { ...seedData.messages, ...(parsed.messages || {}) },
          resourceAllocations: { ...seedData.resourceAllocations, ...(parsed.resourceAllocations || {}) },
          monitorProgress: { ...seedData.monitorProgress, ...(parsed.monitorProgress || {}) },
          contingencyPlans: { ...seedData.contingencyPlans, ...(parsed.contingencyPlans || {}) },
        };
        return merged;
      }
    } catch (err: any) {
      this.logger.warn(`Failed to read database.json (${err.message}). Re-initializing from seed.`);
    }

    return structuredClone(seedData);
  }

  /**
   * Directly and safely persists data to disk
   */
  public save(): void {
    try {
      if (!existsSync(this.dataDir)) {
        mkdirSync(this.dataDir, { recursive: true });
      }
      const json = JSON.stringify(this.data, null, 2);
      writeFileSync(this.dbFilePath, json, 'utf8');
    } catch (err: any) {
      this.logger.error(`Failed to persist database state: ${err.message}`);
    }
  }

  /**
   * Auto-provisions Staff records for users with Staff role
   */
  private ensureStaffAccounts() {
    const avatars = ['pink', 'teal', 'purple', 'green', 'orange'];
    const staffUsers = this.data.users.filter(
      (u) => u.role === 'Staff' && !this.data.staff.some((s) => s.email?.toLowerCase() === u.email.toLowerCase()),
    );
    staffUsers.forEach((u) => {
      const initials = u.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
      this.data.staff.push({
        id: this.nextId(this.data.staff, 'S'),
        userId: u.id,
        name: u.name,
        initials,
        role: 'Staff Member',
        phone: u.phone || '',
        email: u.email,
        workload: 0,
        status: 'available',
        avail: 'Available',
        events: 0,
        avatar: avatars[this.data.staff.length % avatars.length],
        assignedEvents: [],
      });
    });
  }

  snapshot(): AppData {
    return structuredClone(this.data);
  }

  collection<K extends ArrayCollectionName>(name: K): AppData[K] {
    return this.data[name];
  }

  find<K extends ArrayCollectionName>(name: K, id: string): AppData[K][number] {
    const list = this.data[name] as Array<{ id: string }>;
    const row = list.find((item) => String(item.id).toLowerCase() === String(id).toLowerCase());
    if (!row) throw new NotFoundException(`${String(name)} item ${id} was not found.`);
    return row as any;
  }

  create<K extends ArrayCollectionName>(
    name: K,
    prefix: string,
    payload: Omit<AppData[K][number], 'id'> & { id?: string },
  ): AppData[K][number] {
    const list = this.data[name] as Array<{ id: string }>;
    const item = { ...payload, id: payload.id || this.nextId(list, prefix) } as any;
    list.push(item);

    if (name === 'events') {
      this.triggerEventCreated(item as EventRecord);
    } else if (name === 'staffAssignments') {
      this.triggerStaffAssignmentChanged(item.staffId);
    }

    this.save();
    return structuredClone(item) as any;
  }

  update<K extends ArrayCollectionName>(
    name: K,
    id: string,
    patch: Partial<AppData[K][number]>,
  ): AppData[K][number] {
    const list = this.data[name] as Array<{ id: string }>;
    const index = list.findIndex((item) => String(item.id).toLowerCase() === String(id).toLowerCase());
    if (index < 0) throw new NotFoundException(`${String(name)} item ${id} was not found.`);

    const oldItem = structuredClone(list[index]) as any;
    list[index] = { ...list[index], ...patch };
    const newItem = list[index] as any;

    if (name === 'events') {
      this.triggerEventUpdated(oldItem as EventRecord, newItem as EventRecord);
    } else if (name === 'staffAssignments') {
      this.triggerStaffAssignmentChanged(newItem.staffId);
      if (oldItem.staffId && oldItem.staffId !== newItem.staffId) {
        this.triggerStaffAssignmentChanged(oldItem.staffId);
      }
    } else if (name === 'vendorApplications') {
      this.triggerVendorApplicationUpdated(oldItem as VendorApplication, newItem as VendorApplication);
    }

    this.save();
    return structuredClone(list[index]) as any;
  }

  remove<K extends ArrayCollectionName>(name: K, id: string): { id: string; deleted: true } {
    const list = this.data[name] as Array<{ id: string }>;
    const index = list.findIndex((item) => String(item.id).toLowerCase() === String(id).toLowerCase());
    if (index < 0) throw new NotFoundException(`${String(name)} item ${id} was not found.`);

    const removedItem = list[index] as any;
    list.splice(index, 1);

    if (name === 'events') {
      this.cascadeDeleteEvent(id);
    } else if (name === 'staffAssignments') {
      this.triggerStaffAssignmentChanged(removedItem.staffId);
    } else if (name === 'staff') {
      this.cascadeDeleteStaff(id);
    }

    this.save();
    return { id, deleted: true };
  }

  getValue(name: string): unknown {
    return (this.data as any)[name];
  }

  setValue(name: string, value: unknown): unknown {
    (this.data as any)[name] = value;

    if (name === 'resourceAllocations') {
      this.triggerAllResourceAllocations();
    }

    this.save();
    return (this.data as any)[name];
  }

  public nextId(list: Array<{ id: string }>, prefix: string): string {
    const max = list.reduce((acc, item) => {
      const numeric = Number(String(item.id).replace(/\D/g, ''));
      return Number.isFinite(numeric) ? Math.max(acc, numeric) : acc;
    }, 0);
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  }

  // ==========================================================================
  // AUTOMATED DATABASE TRIGGERS & REFERENTIAL INTEGRITY IMPLEMENTATION
  // ==========================================================================

  private triggerEventCreated(event: EventRecord) {
    if (!this.data.monitorProgress[event.id]) {
      this.data.monitorProgress[event.id] = { setup: 0, registration: 0, event: 0, breakdown: 0 };
    }

    this.logActivity('EVENT_CREATED', 'EVENT', event.id, {
      name: event.name,
      type: event.type,
      date: event.date,
      budget: event.budget,
    });
  }

  private triggerEventUpdated(oldEvent: EventRecord, newEvent: EventRecord) {
    const confirmedStatuses = ['confirmed', 'approved', 'Confirmed', 'Approved'];

    if (confirmedStatuses.includes(String(newEvent.status)) && !confirmedStatuses.includes(String(oldEvent.status))) {
      const existingBooking = this.data.bookings.find((b) => b.eventName === newEvent.name || (b as any).eventId === newEvent.id);
      if (!existingBooking) {
        const cost = newEvent.budget || newEvent.estimatedCost || 0;
        this.data.bookings.push({
          id: this.nextId(this.data.bookings, 'BK'),
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
          created: new Date().toISOString().slice(0, 10),
        });
      }
    }

    if (String(newEvent.status).toLowerCase() === 'completed' && String(oldEvent.status).toLowerCase() !== 'completed') {
      this.releaseEventAllocations(newEvent.id);
    }

    if (oldEvent.status !== newEvent.status) {
      this.logActivity('EVENT_STATUS_CHANGED', 'EVENT', newEvent.id, {
        oldStatus: oldEvent.status,
        newStatus: newEvent.status,
        eventName: newEvent.name,
      });
    }
  }

  private triggerVendorApplicationUpdated(oldApp: VendorApplication, newApp: VendorApplication) {
    if (newApp.status === 'approved' && oldApp.status !== 'approved') {
      const vendorExists = this.data.vendors.some((v) => v.name.toLowerCase() === newApp.businessName.toLowerCase());
      if (!vendorExists) {
        this.data.vendors.push({
          id: this.nextId(this.data.vendors, 'V'),
          name: newApp.businessName,
          businessName: newApp.businessName,
          category: newApp.category || 'General',
          status: 'Approved',
          rating: 5.0,
          created: new Date().toISOString().slice(0, 10),
        });
      }

      const userExists = this.data.users.some((u) => u.email.toLowerCase() === newApp.email.toLowerCase());
      if (!userExists) {
        this.data.users.push({
          id: this.nextId(this.data.users, 'U'),
          name: newApp.vendorName,
          email: newApp.email,
          phone: newApp.phone,
          role: 'Vendor',
          status: 'Active',
          created: new Date().toISOString().slice(0, 10),
          // By the time this trigger fires, passwordHash should already be properly hashed
          // by vendors.service.ts decideApplication(). Use it as-is.
          passwordHash: newApp.passwordHash || '',
        });
      }

      this.logActivity('VENDOR_APPLICATION_APPROVED', 'VENDOR_APPLICATION', newApp.id, {
        businessName: newApp.businessName,
        vendorName: newApp.vendorName,
      });
    }
  }

  public triggerStaffAssignmentChanged(staffId: string) {
    if (!staffId) return;
    const staff = this.data.staff.find((s) => s.id === staffId || s.name === staffId);
    if (!staff) return;

    const activeAssignments = this.data.staffAssignments.filter(
      (a) => (a.staffId === staff.id || a.staffName === staff.name) && ['assigned', 'accepted', 'in_progress'].includes(String(a.status).toLowerCase()),
    );

    const activeCount = activeAssignments.length;
    staff.events = activeCount;
    staff.workload = Math.min(100, activeCount * 25);
    staff.status = activeCount > 0 ? 'assigned' : 'available';
    staff.avail = activeCount > 0 ? 'Assigned' : 'Available';
    staff.assignedEvents = activeAssignments.map((a) => a.eventId || a.eventName);
  }

  public triggerAllResourceAllocations() {
    const allocatedTotals: Record<string, number> = {};

    Object.values(this.data.resourceAllocations).forEach((list) => {
      list.forEach((item) => {
        if (!item.status || item.status === 'allocated') {
          allocatedTotals[item.resourceId] = (allocatedTotals[item.resourceId] || 0) + Number(item.quantity || 0);
        }
      });
    });

    this.data.resources.forEach((res) => {
      const total = res.total ?? res.quantity ?? 0;
      const allocated = allocatedTotals[res.id] || 0;
      const avail = Math.max(0, total - allocated);

      res.avail = avail;
      res.quantityAvailable = avail;
      res.available = avail > 0 && res.conditionStatus !== 'Maintenance' && res.conditionStatus !== 'Damaged';
    });
  }

  public releaseEventAllocations(eventId: string) {
    if (this.data.resourceAllocations[eventId]) {
      this.data.resourceAllocations[eventId].forEach((item) => {
        item.status = 'released';
        item.releasedAt = new Date().toISOString();
      });
      this.triggerAllResourceAllocations();
    }

    this.data.staffAssignments
      .filter((a) => a.eventId === eventId || a.eventName === eventId)
      .forEach((a) => {
        a.status = 'completed';
        a.completedAt = new Date().toISOString();
        this.triggerStaffAssignmentChanged(a.staffId);
      });

    if (this.data.monitorProgress[eventId]) {
      this.data.monitorProgress[eventId] = { setup: 100, registration: 100, event: 100, breakdown: 100 };
    }
  }

  private cascadeDeleteEvent(eventId: string) {
    delete this.data.resourceAllocations[eventId];
    delete this.data.monitorProgress[eventId];

    const affectedStaffIds = new Set<string>();
    this.data.staffAssignments = this.data.staffAssignments.filter((a) => {
      if (a.eventId === eventId || a.eventName === eventId) {
        if (a.staffId) affectedStaffIds.add(a.staffId);
        return false;
      }
      return true;
    });

    this.data.staffTasks = this.data.staffTasks.filter((t) => t.eventId !== eventId);
    this.data.bookings = this.data.bookings.filter((b) => (b as any).eventId !== eventId);

    affectedStaffIds.forEach((sid) => this.triggerStaffAssignmentChanged(sid));
    this.triggerAllResourceAllocations();

    this.logActivity('EVENT_DELETED', 'EVENT', eventId, { eventId });
  }

  private cascadeDeleteStaff(staffId: string) {
    this.data.staffAssignments = this.data.staffAssignments.filter((a) => a.staffId !== staffId);
    this.data.staffTasks = this.data.staffTasks.filter((t) => t.staffId !== staffId);
  }

  public logActivity(action: string, entityType: string, entityId: string, details?: Record<string, unknown>, userId?: string, userRole?: string) {
    if (!this.data.activityLogs) {
      this.data.activityLogs = [];
    }

    const log: ActivityLog = {
      id: this.nextId(this.data.activityLogs as any, 'LOG'),
      userId: userId || 'SYS',
      userRole: userRole || 'System',
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    };

    this.data.activityLogs.push(log);
  }
}
