export * from './staffApi';
export * from './superuserApi';

// Central HTTP client and error definitions
export {
  default as apiClient,
  ApiError,
  del,
  get,
  getBaseUrl,
  patch,
  post,
  put,
  request,
  setBaseUrl,
  setEmailProvider,
  setRoleProvider,
  setTokenProvider,
} from './apiClient';

// Auth and session storage
export {
  clearAuthSession,
  default as authService,
  getAuthEmail,
  getAuthRole,
  getAuthSession,
  getAuthToken,
  getAuthUser,
  login,
  logout,
  register,
  saveAuthSession,
  staffLogin,
  staffSignup,
} from './authService';

// User management
export {
  createUser,
  default as userService,
  deleteUser,
  getProfile,
  getUserById,
  getUsers,
  patchUser,
  updateProfile,
  updateUser,
  uploadAvatar,
} from './userService';

// Event management
export {
  createEvent,
  default as eventService,
  deleteEvent,
  filterMyEvents,
  getEventById,
  getEvents,
  getMyEvents,
  patchEvent,
  updateEvent,
  updateEventStatus,
} from './eventService';

// Resource and inventory management
export {
  createResource,
  default as resourceService,
  deleteResource,
  filterMyResources,
  getMyResources,
  getResourceById,
  getResources,
  patchResource,
  updateResource,
} from './resourceService';

// Staff and assignment management
export {
  createStaff,
  createStaffAssignment,
  default as staffService,
  deleteStaff,
  deleteStaffAssignment,
  filterMyStaff,
  getMyAssignments,
  getMyStaff,
  getStaff,
  getStaffAssignments,
  getStaffById,
  getStaffProfile,
  patchStaff,
  patchStaffAssignment,
  updateStaff,
  updateStaffAssignment,
} from './staffService';

// Package management
export {
  createPackage,
  decidePackage,
  default as packageService,
  deletePackage,
  filterMyPackages,
  getMarketplacePackages,
  getMyPackages,
  getPackageById,
  getPackages,
  patchPackage,
  updatePackage,
} from './packageService';

// Issue tracking
export {
  createIssue,
  default as issueService,
  deleteIssue,
  filterMyIssues,
  getIssueById,
  getIssues,
  getMyIssues,
  patchIssue,
  updateIssue,
} from './issueService';

// Coordination messages
export {
  createMessage,
  default as messageService,
  getMessageThread,
  getMessages,
  getThreads,
  sendMessage,
} from './messageService';

// Vendor management
export {
  createVendor,
  default as vendorService,
  deleteVendor,
  getVendorById,
  getVendorPayouts,
  getVendors,
  patchVendor,
  updateVendor,
} from './vendorService';

// Vendor applications review queue
export {
  createVendorApplication,
  decideVendorApplication,
  default as vendorApplicationService,
  deleteVendorApplication,
  getVendorApplicationById,
  getVendorApplications,
  patchVendorApplication,
  updateVendorApplication,
} from './vendorApplicationService';

// Bookings, payouts, and commissions
export {
  createBooking,
  default as bookingService,
  deleteBooking,
  filterMyBookings,
  getBookingById,
  getBookings,
  getBookingsCommissions,
  getCommissions,
  getMyBookings,
  patchBooking,
  settleBookingPayout,
  settlePayout,
  updateBooking,
} from './bookingService';

// Analytics and financial metrics
export {
  default as analyticsService,
  getAnalyticsSummary,
  getFinancialSummary,
  getPublicRecruitments,
  getSnapshot,
} from './analyticsService';

// App state store and portal state helpers
export {
  default as stateService,
  getContingencyPlans,
  getCoordinationMessages,
  getMonitorProgress,
  getResourceAllocations,
  getStaffRequests,
  getStateKey,
  setContingencyPlans,
  setCoordinationMessages,
  setMonitorProgress,
  setResourceAllocations,
  setStaffRequests,
  setStateKey,
} from './stateService';
