/**
 * DEMO RATINGS — sample data so the star ratings are visible straight away.
 *
 * Every rating needs a COMPLETED event that the staff member worked, so this
 * file adds a few assignments on the seed's completed events (EVT002, EVT003,
 * EVT005, EVT006 — all run by Elite Events Co., V001) and Sarah's (U002)
 * ratings for them. Every row carries `demo: true` so it is easy to spot.
 *
 * Used by seed.ts (fresh databases) and by DataService.addDemoRatingsIfNone()
 * (an existing database.json that has no ratings at all yet). Real ratings are
 * never overwritten: the demo rows are only added while there are NONE.
 *
 * Also Emily's (U004) client feedback about Elite Events Co. on the same events.
 *
 * Resulting averages: Mike 4.5 (4), Elena 4.5 (2), Marcus 3.5 (2), Chloe 5.0 (2).
 * David and Liam have no completed events, so they stay "New".
 */

const done = (id: string, staffId: string, staffName: string, eventId: string, eventName: string, eventDate: string, role: string) => ({
  id, staffId, staffName, eventId, eventName, eventDate, role, status: 'completed', demo: true,
});

/** Extra work on the completed seed events (EVT002/EVT003 already have assignments in seed.ts) */
export const DEMO_ASSIGNMENTS = [
  done('ADEMO1', 'S001', 'Mike Johnson', 'EVT005', 'FinTech Global Keynote', '2026-06-18', 'Event Coordinator'),
  done('ADEMO2', 'S004', 'Marcus Sterling', 'EVT005', 'FinTech Global Keynote', '2026-06-18', 'AV Specialist'),
  done('ADEMO3', 'S001', 'Mike Johnson', 'EVT006', '25th Anniversary Banquet', '2026-07-02', 'Event Coordinator'),
  done('ADEMO4', 'S002', 'Elena Rostova', 'EVT006', '25th Anniversary Banquet', '2026-07-02', 'Stage Manager'),
  done('ADEMO5', 'S005', 'Chloe Bennett', 'EVT006', '25th Anniversary Banquet', '2026-07-02', 'Guest Relations Lead'),
];

const rating = (id: string, staffId: string, eventId: string, eventName: string, stars: number, comment: string) => ({
  id, staffId, eventId, eventName, stars, comment,
  vendorId: 'V001', ratedBy: 'U002', ratedByName: 'Sarah Williams',
  createdAt: '2026-07-05T10:00:00.000Z', demo: true,
});

/** Sarah's (vendor V001) ratings of her staff on those completed events */
export const DEMO_STAFF_RATINGS = [
  rating('RTDEMO01', 'S001', 'EVT002', 'Sarah & Mike Wedding', 5, 'Kept the whole wedding on schedule.'),
  rating('RTDEMO02', 'S001', 'EVT003', 'Annual Corporate Gala', 4, 'Good coordination, a little late on setup.'),
  rating('RTDEMO03', 'S001', 'EVT005', 'FinTech Global Keynote', 5, 'Excellent with the speakers.'),
  rating('RTDEMO04', 'S001', 'EVT006', '25th Anniversary Banquet', 4, ''),
  rating('RTDEMO05', 'S002', 'EVT003', 'Annual Corporate Gala', 5, 'Flawless stage cues.'),
  rating('RTDEMO06', 'S002', 'EVT006', '25th Anniversary Banquet', 4, ''),
  rating('RTDEMO07', 'S004', 'EVT002', 'Sarah & Mike Wedding', 4, 'Sound was clear all night.'),
  rating('RTDEMO08', 'S004', 'EVT005', 'FinTech Global Keynote', 3, 'One projector issue during the keynote.'),
  rating('RTDEMO09', 'S005', 'EVT003', 'Annual Corporate Gala', 5, 'Guests loved her.'),
  rating('RTDEMO10', 'S005', 'EVT006', '25th Anniversary Banquet', 5, ''),
];

const feedback = (id: string, eventId: string, eventName: string, stars: number, comment: string) => ({
  id, eventId, eventName, stars, comment,
  vendorId: 'V001', clientId: 'U004', clientName: 'Emily Carter',
  createdAt: '2026-07-06T10:00:00.000Z', demo: true,
});

/** Emily's feedback about Elite Events Co. (V001): average 4.5 over 4 events */
export const DEMO_VENDOR_FEEDBACK = [
  feedback('VFDEMO1', 'EVT002', 'Sarah & Mike Wedding', 5, 'Beautiful setup, everything on time.'),
  feedback('VFDEMO2', 'EVT003', 'Annual Corporate Gala', 4, 'Great event, lighting flickered once.'),
  feedback('VFDEMO3', 'EVT005', 'FinTech Global Keynote', 4, 'Professional team.'),
  feedback('VFDEMO4', 'EVT006', '25th Anniversary Banquet', 5, 'Our guests are still talking about it!'),
];
