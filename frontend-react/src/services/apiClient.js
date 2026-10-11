import { getAuthEmail, getAuthRole, getAuthToken } from './auth/authStorage';

/**
 * Custom error class for API errors that preserves HTTP status code,
 * response payloads, validation errors, and request tracking IDs.
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusCode = status;
    this.data = data;
    this.validationErrors = Array.isArray(data?.message) ? data.message : [];
    this.requestId = data?.requestId || null;
    this.response = { status, data };
  }
}

let customBaseUrl = null;
let customTokenProvider = null;
let customRoleProvider = null;
let customEmailProvider = null;

export function getBaseUrl() {
  if (customBaseUrl) return customBaseUrl;
  return (
    import.meta.env?.VITE_API_BASE_URL ||
    import.meta.env?.VITE_API_URL ||
    'http://localhost:3000/api'
  );
}

export function setBaseUrl(url) {
  customBaseUrl = url;
}

export function setTokenProvider(providerFn) {
  customTokenProvider = providerFn;
}

export function setRoleProvider(providerFn) {
  customRoleProvider = providerFn;
}

export function setEmailProvider(providerFn) {
  customEmailProvider = providerFn;
}

function resolveToken(options) {
  if (options?.token !== undefined) return options.token;
  if (typeof customTokenProvider === 'function') return customTokenProvider();
  return getAuthToken();
}

function resolveRole(options) {
  if (options?.role !== undefined) return options.role;
  if (typeof customRoleProvider === 'function') return customRoleProvider();
  return getAuthRole();
}

function resolveEmail(options) {
  if (options?.email !== undefined) return options.email;
  if (typeof customEmailProvider === 'function') return customEmailProvider();
  return getAuthEmail();
}

function buildEndpointUrl(baseUrl, endpoint) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanPath}`;
}

function appendQueryParams(url, params) {
  if (!params || typeof params !== 'object') return url;
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  if (!queryString) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
}

/**
 * Central HTTP request function using native fetch.
 */
export async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    params,
    headers: customHeaders = {},
    isPublic = false,
    requiresAuth = true,
    signal,
    fetchOptions = {},
  } = options;

  const baseUrl = getBaseUrl();
  const urlWithEndpoint = buildEndpointUrl(baseUrl, endpoint);
  const finalUrl = appendQueryParams(urlWithEndpoint, params);

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = new Headers();

  if (!isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  // Attach caller headers
  if (customHeaders) {
    const entries =
      customHeaders instanceof Headers
        ? Object.fromEntries(customHeaders.entries())
        : customHeaders;
    Object.entries(entries).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        headers.set(k, String(v));
      }
    });
  }

  // Handle authentication and RBAC context headers
  const shouldAuthenticate = !isPublic && requiresAuth !== false;
  if (shouldAuthenticate) {
    const token = resolveToken(options);
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const role = resolveRole(options);
    if (role && !headers.has('x-role')) {
      headers.set('x-role', String(role).toLowerCase());
    }

    const email = resolveEmail(options);
    if (email && !headers.has('x-email')) {
      headers.set('x-email', String(email));
    }
  }

  let requestBody = body;
  if (!isFormData && body !== undefined && body !== null && typeof body === 'object') {
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(finalUrl, {
    method,
    headers,
    body: requestBody,
    signal,
    ...fetchOptions,
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (response.status !== 204 && response.status !== 205) {
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      const text = await response.text();
      data = text || null;
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    if (data && typeof data === 'object') {
      if (Array.isArray(data.message)) {
        message = data.message.join(', ');
      } else if (typeof data.message === 'string' && data.message.trim()) {
        message = data.message;
      } else if (typeof data.error === 'string' && data.error.trim()) {
        message = data.error;
      }
    } else if (typeof data === 'string' && data.trim()) {
      message = data;
    }

    throw new ApiError(message, response.status, data);
  }

  return data;
}

export function get(endpoint, options = {}) {
  return request(endpoint, { ...options, method: 'GET' });
}

export function post(endpoint, body, options = {}) {
  return request(endpoint, { ...options, method: 'POST', body });
}

export function put(endpoint, body, options = {}) {
  return request(endpoint, { ...options, method: 'PUT', body });
}

export function patch(endpoint, body, options = {}) {
  return request(endpoint, { ...options, method: 'PATCH', body });
}

export function del(endpoint, options = {}) {
  return request(endpoint, { ...options, method: 'DELETE' });
}

const apiClient = {
  request,
  get,
  post,
  put,
  patch,
  delete: del,
  getBaseUrl,
  setBaseUrl,
  setTokenProvider,
  setRoleProvider,
  setEmailProvider,
};

export default apiClient;
