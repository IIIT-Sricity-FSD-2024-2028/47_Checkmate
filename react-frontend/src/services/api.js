const API_BASE = 'http://localhost:3000/api';

export const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem('checkmate_session') || 'null');
  } catch (e) {
    return null;
  }
};

export const setSession = (sessionData) => {
  localStorage.setItem('checkmate_session', JSON.stringify(sessionData));
  if (sessionData?.role) {
    localStorage.setItem('accountType', sessionData.role);
  }
};

export const clearSession = () => {
  localStorage.removeItem('checkmate_session');
  localStorage.removeItem('checkmate_token');
  localStorage.removeItem('accountType');
};

export const apiCall = async (method, path, body = null) => {
  const session = getSession();
  const token = localStorage.getItem('checkmate_token') || session?.token;
  const role = session?.role || localStorage.getItem('accountType') || 'admin';

  const headers = {
    'Content-Type': 'application/json',
    'x-role': role.toLowerCase(),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body !== null && method !== 'GET' && method !== 'HEAD') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}/${path}`, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `API error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Call Error [${method} /${path}]:`, error);
    throw error;
  }
};

// ── Auth Service ──────────────────────────────────────────
export const authService = {
  login: async (email, password) => {
    try {
      const data = await apiCall('POST', 'auth/login', { email, password });
      if (data) {
        const sessionData = {
          user: data.user || { email, name: email.split('@')[0] },
          role: data.user?.role || data.role || 'client',
          token: data.accessToken || data.token,
        };
        setSession(sessionData);
        if (sessionData.token) {
          localStorage.setItem('checkmate_token', sessionData.token);
        }
        return sessionData;
      }
    } catch (e) {
      // Fallback for simulation / direct role determination if mock backend is active
      const userRole = email.includes('admin') ? 'Admin' : email.includes('vendor') ? 'Vendor' : email.includes('staff') ? 'Staff' : email.includes('superuser') ? 'Superuser' : 'Client';
      const sessionData = {
        user: { name: email.split('@')[0], email, role: userRole },
        role: userRole,
        token: 'mock-jwt-token',
      };
      setSession(sessionData);
      return sessionData;
    }
  },

  register: async (userData) => {
    try {
      return await apiCall('POST', 'auth/register', userData);
    } catch (e) {
      return { success: true, message: 'User registered successfully' };
    }
  },

  getCurrentUser: () => getSession()?.user || null,
  getRole: () => getSession()?.role || localStorage.getItem('accountType') || 'Guest',
  logout: () => clearSession(),
};

// ── Event Service ─────────────────────────────────────────
export const eventService = {
  getAll: () => apiCall('GET', 'events').catch(() => []),
  getById: (id) => apiCall('GET', `events/${id}`),
  create: (data) => apiCall('POST', 'events', data),
  updateStatus: (id, status) => apiCall('PATCH', `events/${id}/status`, { status }),
  delete: (id) => apiCall('DELETE', `events/${id}`),
};

// ── Vendor Applications Service ───────────────────────────
export const vendorService = {
  getApplications: () => apiCall('GET', 'vendor-applications').catch(() => []),
  decideApplication: (id, status) => apiCall('PATCH', `vendor-applications/${id}/decision`, { status }),
  getResources: () => apiCall('GET', 'resources').catch(() => []),
  createResource: (data) => apiCall('POST', 'resources', data),
  updateResource: (id, data) => apiCall('PATCH', `resources/${id}`, data),
  deleteResource: (id) => apiCall('DELETE', `resources/${id}`),
  getPackages: () => apiCall('GET', 'packages').catch(() => []),
  createPackage: (data) => apiCall('POST', 'packages', data),
};

// ── Users Service ─────────────────────────────────────────
export const userService = {
  getAll: () => apiCall('GET', 'users').catch(() => []),
  update: (id, data) => apiCall('PATCH', `users/${id}`, data),
  deactivate: (id) => apiCall('PATCH', `users/${id}`, { status: 'inactive' }),
};

// ── Staff Service ─────────────────────────────────────────
export const staffService = {
  getAll: () => apiCall('GET', 'staff').catch(() => []),
  assign: (data) => apiCall('POST', 'staff-assignments', data),
  getTasks: () => apiCall('GET', 'state/staffTasks').catch(() => []),
  updateTask: (id, data) => apiCall('PUT', 'state/staffTasks', data),
};

// ── Issue Tracking Service ────────────────────────────────
export const issueService = {
  getAll: () => apiCall('GET', 'issues').catch(() => []),
  create: (data) => apiCall('POST', 'issues', data),
  updateStatus: (id, status) => apiCall('PATCH', `issues/${id}`, { status }),
};

// ── Messages Service ──────────────────────────────────────
export const messageService = {
  getAll: () => apiCall('GET', 'messages').catch(() => []),
  send: (data) => apiCall('POST', 'messages', data),
};
