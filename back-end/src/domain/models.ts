export type EventStatus = 'pending' | 'confirmed' | 'approved' | 'rejected' | 'live' | 'completed' | 'cancelled';
export type UserRole = 'Admin' | 'Superuser' | 'Vendor' | 'Staff' | 'Client';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'Active' | 'Inactive' | 'Pending' | 'active' | 'inactive' | 'pending';
  created: string;
  passwordHash: string;
}

export interface EventRecord {
  id: string;
  name: string;
  type: string;
  date: string;
  time?: string;
  venue: string;
  people?: number;
  guests?: number;
  status: EventStatus | string;
  client?: string;
  vendor?: string;
  createdBy?: string;
  packageId?: string;
  budget?: number;
  notes?: string;
  approvedAt?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface Resource {
  id: string;
  name: string;
  category: string;
  cat?: string;
  vendor?: string;
  quantity: number;
  total?: number;
  avail?: number;
  price: number;
  unit?: string;
  available: boolean;
  condition?: string;
}

export interface StaffMember {
  id: string;
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
}

export interface Issue {
  id: string;
  event?: string;
  eventId?: string;
  title: string;
  category: string;
  priority: string;
  description: string;
  reporter: string;
  email?: string;
  role?: string;
  status: string;
  createdAt: string;
}

export interface StaffAssignment {
  id: string;
  staffId: string;
  staffName: string;
  eventId: string;
  eventName: string;
  role: string;
  status: string;
  assignedAt: string;
  tasks?: Array<{ title: string; done: boolean }>;
}

export interface VendorApplication {
  id: string;
  vendorName: string;
  businessName: string;
  email: string;
  phone: string;
  category: string;
  categoryClass?: string;
  documents: Array<{ name: string; type: string }>;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  note?: string;
}

export interface Vendor {
  id: string;
  name: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

export interface Booking {
  id: string;
  eventName: string;
  client: string;
  vendor: string;
  status: string;
  cost: number;
  created: string;
}

export interface Message {
  id: string;
  threadId: string;
  sender: string;
  initials: string;
  self: boolean;
  text: string;
  time: string;
  avatar?: string;
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
  resourceAllocations: Record<string, Array<{ resourceId: string; resourceName: string; quantity: number; allocatedAt: string }>>;
  monitorProgress: Record<string, { setup: number; registration: number; event: number; breakdown: number }>;
  staffRequests: Array<Record<string, unknown>>;
  staffTasks: Array<Record<string, unknown>>;
  vendorDocSubmission: VendorApplication | null;
  session: { user: string; email: string; role: string };
}
