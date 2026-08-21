import { DataService } from './data.service';

describe('DataService Persistence & Trigger Integrity', () => {
  let service: DataService;

  beforeEach(() => {
    service = new DataService();
    service.onModuleInit();
  });

  it('should initialize and load snapshot data', () => {
    const snapshot = service.snapshot();
    expect(snapshot.users.length).toBeGreaterThan(0);
    expect(snapshot.events.length).toBeGreaterThan(0);
    expect(snapshot.resources.length).toBeGreaterThan(0);
  });

  it('should create an event, initialize monitor, and create audit log', () => {
    const event = service.create('events', 'EVT', {
      name: 'Automated Test Gala 2026',
      type: 'Gala',
      date: '2026-08-30',
      venue: 'Skyline Ballroom',
      budget: 20000,
      status: 'pending',
      client: 'Emily Carter',
      createdBy: 'client',
    });

    expect(event.id).toBeDefined();
    const monitors = service.getValue('monitorProgress') as Record<string, any>;
    expect(monitors[event.id]).toEqual({ setup: 0, registration: 0, event: 0, breakdown: 0 });

    const logs = service.collection('activityLogs');
    const matchLog = logs.find((l) => l.entityId === event.id);
    expect(matchLog).toBeDefined();
    expect(matchLog?.action).toBe('EVENT_CREATED');
  });

  it('should auto-generate booking when event is confirmed', () => {
    const event = service.create('events', 'EVT', {
      name: 'Booking Auto-Gen Test',
      type: 'Corporate',
      date: '2026-09-15',
      venue: 'Convention Center',
      budget: 35000,
      status: 'pending',
      client: 'Acme Corp',
      vendor: 'Elite Events Co.',
      createdBy: 'client',
    });

    service.update('events', event.id, { status: 'confirmed' });

    const bookings = service.collection('bookings');
    const createdBooking = bookings.find((b) => b.eventName === event.name);
    expect(createdBooking).toBeDefined();
    expect(createdBooking?.cost).toBe(35000);
    expect(createdBooking?.status).toBe('Confirmed');
  });

  it('should calculate workload when staff assignment changes', () => {
    const staff = service.create('staff', 'S', {
      name: 'Jordan Lee',
      role: 'Lighting Tech',
      phone: '+1 555-9988',
      status: 'available',
      workload: 0,
      events: 0,
      avatar: 'purple',
    });

    service.create('staffAssignments', 'A', {
      staffId: staff.id,
      staffName: staff.name,
      eventId: 'EVT001',
      eventName: 'Tech Summit 2026',
      role: 'Lighting Tech',
      status: 'assigned',
      priority: 'Medium',
      assignedAt: new Date().toISOString(),
    });

    const updatedStaff = service.find('staff', staff.id);
    expect(updatedStaff.status).toBe('assigned');
    expect(updatedStaff.workload).toBe(25);
  });
});
