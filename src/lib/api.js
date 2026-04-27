const API_URL = import.meta.env.VITE_API_URL || '/api';
const DEV_BACKEND_URL = 'http://127.0.0.1:8000';

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('hms_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const toErrorMessage = (errorData, response) => {
  if (typeof errorData?.message === 'string' && errorData.message.trim()) {
    return errorData.message.trim();
  }

  if (typeof errorData?.detail === 'string' && errorData.detail.trim()) {
    return errorData.detail.trim();
  }

  if (Array.isArray(errorData?.detail) && errorData.detail.length > 0) {
    return errorData.detail
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item?.msg) {
          const field = Array.isArray(item.loc) ? item.loc.at(-1) : null;
          return field ? `${field}: ${item.msg}` : item.msg;
        }

        return null;
      })
      .filter(Boolean)
      .join(', ');
  }

  if (response.status === 401) {
    return 'Unauthorized. Please check credentials.';
  }

  if (response.status >= 500) {
    return 'The server is temporarily unavailable. Please try again.';
  }

  if (response.status === 404) {
    return 'The requested resource could not be found.';
  }

  return 'Something went wrong while processing the request.';
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData = {};
    const contentType = response.headers.get('content-type') || '';

    try {
      errorData = contentType.includes('application/json')
        ? await response.json()
        : { detail: await response.text() };
    } catch {
      // Fall back to status-based messages when the server does not return JSON.
    }

    // Vite's dev proxy commonly returns a plain-text 5xx response when the backend is down.
    if (
      import.meta.env.DEV &&
      response.status >= 500 &&
      !contentType.includes('application/json')
    ) {
      throw new Error(`Cannot reach the backend API. Make sure the server is running on ${DEV_BACKEND_URL}.`);
    }

    throw new Error(toErrorMessage(errorData, response));
  }
  return response.json();
};

const request = async (endpoint, options = {}) => {
  const { method = 'GET', body, isProtected = false, headers = {} } = options;

  const authHeaders = isProtected ? getAuthHeaders() : {};

  const config = {
    method,
    headers: {
      ...authHeaders,
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        import.meta.env.DEV
          ? `Cannot reach the backend API. Make sure the server is running on ${DEV_BACKEND_URL}.`
          : 'Unable to connect to the server. Please try again.'
      );
    }

    throw error;
  }
};

export const authApi = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  createUser: (userData) => request('/auth/create-user', { method: 'POST', body: userData, isProtected: true }),
  updateProfile: (profileData) => 
    request('/auth/profile', { method: 'PATCH', body: profileData, isProtected: true }),
  changePassword: (passwordData) => 
    request('/auth/change-password', { method: 'POST', body: passwordData, isProtected: true }),
  forgotPassword: (email) => 
    request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, new_password) => 
    request(`/auth/reset-password/${token}`, { method: 'POST', body: { new_password } })
};

const createCrudClient = (resourceName) => ({
  list: () => request(`/${resourceName}`, { isProtected: true }),
  create: (data) => request(`/${resourceName}`, { method: 'POST', body: data, isProtected: true }),
  update: (id, data) => 
    request(`/${resourceName}/${id}`, { method: 'PUT', body: data, isProtected: true }),
  remove: (id) => request(`/${resourceName}/${id}`, { method: 'DELETE', isProtected: true })
});


export const patientsApi = createCrudClient('patients');
export const appointmentsApi = createCrudClient('appointments');
export const recordsApi = createCrudClient('records');
export const invoicesApi = createCrudClient('invoices');
export const medicinesApi = createCrudClient('medicines');
export const testsApi = createCrudClient('tests');
export const staffApi = createCrudClient('staff');
export const bedsApi = createCrudClient('beds');
export const bloodInventoryApi = createCrudClient('blood_inventory');
export const bloodActivitiesApi = createCrudClient('blood_activities');
export const inventoryApi = createCrudClient('inventory');

export const dashboardApi = {
  getStats: async () => {
    const [patients, tests, staff, invoices] = await Promise.all([
      patientsApi.list(),
      testsApi.list().catch(() => []),
      staffApi.list().catch(() => []),
      invoicesApi.list().catch(() => [])
    ]);
    const activeAdmissions = patients.filter(p => p.status === 'Inpatient').length;
    const criticalAlerts = patients.filter(p => p.status === 'Critical').length;
    const totalRevenue = invoices.reduce((acc, inv) => acc + Number(inv.amount || 0), 0);

    // Build a queue from the first 4 patients for the Live Medical Queue panel
    const queue = patients.slice(0, 4).map(p => ({
      id: p.patient_code || p.id,
      patient: p.name,
      doctor: '-',
      time: '-',
      status: p.status,
    }));

    return {
      activeAdmissions,
      criticalAlerts,
      totalPatients: patients.length,
      testsCount: tests.length,
      staffCount: staff.length,
      invoicesCount: invoices.length,
      totalRevenue,
      queue,
    };
  }
};

export const reportsApi = {
  getStats: async () => {
    const [patients, staff, invoices, tests, appointments, inventory] = await Promise.all([
      patientsApi.list(),
      staffApi.list(),
      invoicesApi.list().catch(() => []),
      testsApi.list().catch(() => []),
      appointmentsApi.list().catch(() => []),
      inventoryApi.list().catch(() => []),
    ]);

    const totalRevenue = invoices.reduce((acc, inv) => acc + Number(inv.amount || 0), 0);
    const lowStockCount = inventory.filter(i => i.status === 'Low Stock').length;

    return {
      revenue: totalRevenue,
      appointmentsCount: appointments.length,
      lowStockCount,
      doctorCount: staff.filter(s => s.role === 'Doctor').length,
      activePatients: patients.length,
      pendingLabs: tests.filter(t => t.status === 'Pending').length,
      staffCount: staff.length,
      staffActive: staff.filter(s => s.status === 'Active').length,
      staffOnLeave: staff.filter(s => s.status === 'On Leave').length
    };
  }
};

/**
 * Trigger a CSV file download from an array of row objects.
 * @param {Record<string, unknown>[]} rows
 * @param {string} filename
 */
export const downloadCsv = (rows, filename = 'export.csv') => {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csvContent = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
