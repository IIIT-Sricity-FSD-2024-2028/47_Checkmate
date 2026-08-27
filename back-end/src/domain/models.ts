export type EventStatus = 'pending' | 'confirmed' | 'approved' | 'rejected' | 'live' | 'completed' | 'cancelled';
export type UserRole = 'Admin' | 'Superuser' | 'Vendor' | 'Staff' | 'Client';
export type AccountStatus = 'Active' | 'Inactive' | 'Pending' | 'Suspended' | 'active' | 'inactive' | 'pending';
export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical' | 'Urgent';

export interface User {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: AccountStatus;
  profile_picture_url?: string;
  bio?: string;
  location?: string;
  address?: string;
  date_of_birth?: string;
  years_experience?: number;
  skills?: string;
  website_url?: string;
  linkedin_url?: string;
  created: string;
  passwordHash: string;
}

export interface Vendor {
  id: string;
  userId?: string;
  name: string;
  businessName?: string;
  category?: string;
  categoryClass?: string;
  rating?: number;
  status: 'Approved' | 'Pending' | 'Rejected' | 'approved' | 'pending' | 'rejected';
  created?: string;
}

export interface Venue {
  id: string;
  vendorId?: string;
  name: string;
  location: string;
  address?: string;
  capacity: number;
  pricePerDay: number;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE';
  description?: string;
}

export interface VenueAllocation {
  id: string;
  eventId: string;
  venueId: string;
  startTime?: string;
  endTime?: string;
  status: 'pending' | 'allocated' | 'released' | 'cancelled';
  allocatedAt: string;
}

export interface ResourceCategory {
  id: number | string;
  name: string;
  code: string;
  description?: string;
}

export interface Resource {
  id: string;
  name: string;
  category: string;
  cat?: string;
  vendor?: string;
  vendorId?: string;
  quantity: number;
  total?: number;
  avail?: number;
  quantityAvailable?: number;
  price: number;
  unit?: string;
  available: boolean;
  condition?: string;
  conditionStatus?: 'Ready' | 'In Use' | 'Maintenance' | 'Damaged';
}

export interface StaffMember {
  id: string;
  userId?: string;
  vendorId?: string;
  name: string;
  initials?: string;
  role: string;
  vendor?: string;
  phone: string;
  email?: string;
  workload?: number;
  status: string;
  avail?: string;
  events?: number;
  avatar?: string;
  assignedEvents?: string[];
}

export interface PackageRecord {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  capacity: string;
  desc: string;
  resources: string[];
  staff: string[];
  status?: 'pending' | 'approved' | 'rejected';
  vendorId?: string;
  vendorName?: string;
  createdBy?: string;
}

export interface EventRecord {
  id: string;
  name: string;
  type: string;
  date: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  venue: string;
  venueId?: string;
  people?: number;
  guests?: number;
  status: EventStatus | string;
  client?: string;
  clientId?: string;
  vendor?: string;
  vendorId?: string;
  createdBy?: string;
  packageId?: string;
  budget?: number;
  estimatedCost?: number;
  budgetRange?: string;
  notes?: string;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  startedAt?: string;
  endedAt?: string;
  rejectedAt?: string;
  requestedResources?: Array<{ resourceId: string; resourceName: string; category: string; quantity: number; pricePerDay: number }>;
  requestedStaff?: Array<{ staffId: string; staffName: string; role: string }>;
  conflicts?: any[];
}

export interface EventResourceAllocationItem {
  id?: string;
  resourceId: string;
  resourceName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  status?: 'pending' | 'allocated' | 'released' | 'returned';
  allocatedAt: string;
  releasedAt?: string;
}

export interface StaffAssignment {
  id: string;
  staffId: string;
  staffName: string;
  staffRole?: string;
  eventId: string;
  eventName: string;
  eventDate?: string;
  eventVenue?: string;
  eventPeople?: number;
  role: string;
  taskDesc?: string;
  priority?: string;
  status: string;
  assignedAt: string;
  respondedAt?: string;
  completedAt?: string;
  tasks?: Array<StaffTask>;
}

export interface StaffTask {
  id?: string;
  assignmentId?: string;
  eventId?: string;
  staffId?: string;
  eventName?: string;
  title: string;
  desc?: string;
  description?: string;
  status: string;
  done?: boolean;
  priority: string;
  dueTime?: string;
  verifiedBy?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface Booking {
  id: string;
  eventId?: string;
  eventName: string;
  client: string;
  clientId?: string;
  vendor: string;
  vendorId?: string;
  status: string;
  cost: number;
  advancePaid?: number;
  paymentStatus?: 'unpaid' | 'partially_paid' | 'paid' | 'refunded';
  created: string;
}

export interface EventProgressMonitor {
  eventId: string;
  setup: number;
  registration: number;
  event: number;
  breakdown: number;
  currentPhase?: 'setup' | 'registration' | 'execution' | 'breakdown' | 'concluded';
  updatedAt?: string;
}

export interface Issue {
  id: string;
  event?: string;
  eventId?: string;
  title: string;
  category: string;
  priority: string;
  severity?: string;
  description: string;
  reporter: string;
  reporterRole?: string;
  email?: string;
  role?: string;
  target?: string;
  status: string;
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface VendorApplication {
  id: string;
  vendorName: string;
  businessName: string;
  email: string;
  phone: string;
  category?: string;
  categoryClass?: string;
  documents: Array<{ name: string; type: string; filePath?: string; status?: string }>;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  note?: string;
  passwordHash?: string;
}

export interface ContingencyPlan {
  id: string;
  eventId?: string;
  problem: string;
  trigger: string;
  solution: string;
  status: 'ready' | 'triggered' | 'executed' | 'cancelled';
  activatedAt?: string;
  activatedBy?: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  threadId: string;
  sender: string;
  senderId?: string;
  initials: string;
  self: boolean;
  text: string;
  time: string;
  avatar?: string;
  sentAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'approval' | 'assignment' | 'alert';
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  userRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface AppData {
  users: User[];
  events: EventRecord[];
  resources: Resource[];
  staff: StaffMember[];
  packages: PackageRecord[];
  issues: Issue[];
  staffAssignments: StaffAssignment[];
  vendorApplications: VendorApplication[];
  vendors: Vendor[];
  bookings: Booking[];
  messages: Record<string, Message[]>;
  resourceAllocations: Record<string, EventResourceAllocationItem[]>;
  monitorProgress: Record<string, { setup: number; registration: number; event: number; breakdown: number }>;
  staffRequests: Array<Record<string, unknown>>;
  staffTasks: Array<StaffTask>;
  vendorDocSubmission: VendorApplication | null;
  session: { user: string; email: string; role: string };
  liveEvents: Array<Record<string, unknown>>;
  contingencyPlans: Record<string, ContingencyPlan[]>;
  adminChatMessages: Array<Record<string, unknown>>;
  coordinationMessages: Array<Record<string, unknown>>;
  venues: Venue[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
}
