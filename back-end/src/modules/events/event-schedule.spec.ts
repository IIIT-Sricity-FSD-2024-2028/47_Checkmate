/**
 * Unit tests for when an event starts and ends (EventsService.scheduleOf),
 * including events that run past midnight.
 */
import { EventsService } from './events.service';

// scheduleOf only needs the event itself, so no real data is required
const service = new EventsService({ collection: () => [] } as any, {} as any);
const hours = (s: any) => (s.end.getTime() - s.start.getTime()) / 3600000;

describe('event schedule', () => {
  it('same-day event', () => {
    expect(hours((service as any).scheduleOf({ date: '2027-03-10', time: '10:00 AM', endTime: '4:00 PM' }))).toBe(6);
  });
  it('9 PM to 12 AM with an End Date on the next day lasts 3 hours', () => {
    expect(hours((service as any).scheduleOf({ date: '2027-03-10', endDate: '2027-03-11', time: '9:00 PM', endTime: '12:00 AM' }))).toBe(3);
  });
  it('9 PM to 12 AM without an End Date is still read as past midnight (3 hours)', () => {
    expect(hours((service as any).scheduleOf({ date: '2027-03-10', time: '9:00 PM', endTime: '12:00 AM' }))).toBe(3);
  });
  it('multi-day event', () => {
    expect(hours((service as any).scheduleOf({ date: '2027-03-10', endDate: '2027-03-12', time: '10:00 AM', endTime: '10:00 AM' }))).toBe(48);
  });
  it('no end time falls back to 4 hours', () => {
    expect(hours((service as any).scheduleOf({ date: '2027-03-10', time: '10:00 AM' }))).toBe(4);
  });
  it('an end date before the event date is refused', () => {
    expect(() => (service as any).assertEndDateValid({ date: '2027-03-10', endDate: '2027-03-09' })).toThrow('End date must be');
  });
});
