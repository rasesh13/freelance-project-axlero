// frontend/src/api/client.js
// Unified Client API Layer connecting the entire Workverse React Frontend to the Express + SQLite Backend (port 5000)

const API_BASE = '/api';

export function getAuthToken() {
  try {
    return localStorage.getItem('wv_auth_token') || null;
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem('wv_auth_token', token);
    } else {
      localStorage.removeItem('wv_auth_token');
    }
  } catch {
    // ignore storage quota errors
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('wv_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  try {
    if (user) {
      localStorage.setItem('wv_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('wv_user');
    }
  } catch {
    // ignore
  }
}

const apiCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

function getCached(key) {
  const item = apiCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    apiCache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  apiCache.set(key, { data, timestamp: Date.now() });
}

export function clearApiCache() {
  apiCache.clear();
}

async function request(endpoint, options = {}, retries = 2) {
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  if (options.cache && isGet) {
    const cached = getCached(endpoint);
    if (cached !== null) return cached;
  }

  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      if (retries > 0 && [502, 503, 504].includes(res.status) && isGet) {
        await new Promise((r) => setTimeout(r, 400));
        return request(endpoint, options, retries - 1);
      }
      const errMsg = (data && data.error) || (data && data.message) || `HTTP error ${res.status}`;
      throw new Error(errMsg);
    }

    if (options.cache && isGet) {
      setCached(endpoint, data);
    }

    if (!isGet) {
      clearApiCache();
    }

    if (
      typeof window !== 'undefined' &&
      !isGet &&
      ['POST', 'PATCH', 'PUT', 'DELETE'].includes(options.method.toUpperCase()) &&
      !endpoint.startsWith('/notifications') &&
      !endpoint.startsWith('/auth/')
    ) {
      window.dispatchEvent(new CustomEvent('workverse:refresh-notifications'));
    }

    return data;
  } catch (err) {
    if (retries > 0 && isGet && err.name === 'TypeError') {
      await new Promise((r) => setTimeout(r, 500));
      return request(endpoint, options, retries - 1);
    }
    throw err;
  }
}

export function subscribeNetworkStatus(callback) {
  if (typeof window === 'undefined') return () => {};
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// ==========================================
// AUTH & USER SETTINGS API
// ==========================================
export async function authLogin({ email, password, role }) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  });
  if (data.token) setAuthToken(data.token);
  if (data.user) setStoredUser(data.user);
  return data;
}

export async function authRegister({ name, email, password, role }) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
  if (data.token) setAuthToken(data.token);
  if (data.user) setStoredUser(data.user);
  return data;
}

export async function authGetMe() {
  const data = await request('/auth/me');
  if (data && data.user) setStoredUser(data.user);
  return data.user;
}

export async function updateMyProfile(profileData) {
  const data = await request('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  });
  if (data.user) setStoredUser(data.user);
  return data;
}

export async function forgotPasswordRequest(email) {
  return await request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function authLogout() {
  setAuthToken(null);
  setStoredUser(null);
  try {
    localStorage.removeItem('wv_is_logged_in');
    localStorage.removeItem('wv_user_role');
  } catch {
    // ignore
  }
}

export async function fetchSettings() {
  return await request('/settings');
}

export async function saveSettings(settingsData) {
  const res = await request('/settings', {
    method: 'PUT',
    body: JSON.stringify(settingsData),
  });
  if (res.settings) setStoredUser(res.settings);
  return res;
}

// ==========================================
// TALENTS DIRECTORY API
// ==========================================
export async function fetchTalents({ search = '', category = '', experience = '' } = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  if (experience) params.append('experience', experience);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return await request(`/talents${qs}`);
}

export async function fetchTalentById(id) {
  return await request(`/talents/${id}`);
}

// ==========================================
// PROJECTS API
// ==========================================
export async function fetchProjects({ status = 'All', search = '', category = '', scope = '', page, limit, sortBy, sortOrder } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'All') params.append('status', status);
  if (category && category !== 'All Categories') params.append('category', category);
  if (search && search.trim()) params.append('search', search.trim());
  if (scope) params.append('scope', scope);
  if (page) params.append('page', String(page));
  if (limit) params.append('limit', String(limit));
  if (sortBy) params.append('sortBy', String(sortBy));
  if (sortOrder) params.append('sortOrder', String(sortOrder));
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return await request(`/projects${queryStr}`);
}

export async function createProject(projectData) {
  return await request('/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  });
}

export async function updateProject(id, updates) {
  return await request(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteProject(id) {
  return await request(`/projects/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// KANBAN TASKS API
// ==========================================
export async function fetchKanbanTasks() {
  return await request('/kanban');
}

export async function createKanbanTask(taskData) {
  return await request('/kanban', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

export async function updateKanbanColumn(taskId, column) {
  return await request(`/kanban/${taskId}/column`, {
    method: 'PATCH',
    body: JSON.stringify({ column }),
  });
}

export async function deleteKanbanTask(taskId) {
  return await request(`/kanban/${taskId}`, {
    method: 'DELETE',
  });
}

// ==========================================
// CONTRACTS & PROPOSALS API
// ==========================================
export async function fetchContracts() {
  return await request('/contracts');
}

export async function createContract(contractData) {
  return await request('/contracts', {
    method: 'POST',
    body: JSON.stringify(contractData),
  });
}

export async function fetchProposals() {
  return await request('/proposals');
}

export async function submitProposal(proposalData) {
  return await request('/proposals', {
    method: 'POST',
    body: JSON.stringify(proposalData),
  });
}

export async function updateProposalStatus(id, status) {
  return await request(`/proposals/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ==========================================
// TIME TRACKER & WALLET API
// ==========================================
export async function logTimeSession({ seconds, project_title, hourly_rate, formatted_time }) {
  return await request('/time/log', {
    method: 'POST',
    body: JSON.stringify({ seconds, project_title, hourly_rate, formatted_time }),
  });
}

export async function fetchTimeLogs() {
  return await request('/time/logs');
}

export async function fetchWalletInfo() {
  return await request('/wallet');
}

export async function requestWithdrawal({ amount, method }) {
  return await request('/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify({ amount, method }),
  });
}

// ==========================================
// MESSAGES & THREADS API
// ==========================================
export async function fetchMessages() {
  return await request('/messages');
}

export async function sendMessage({ thread_id, text, project, recipientId, recipientName, recipientRole, recipientAvatar }) {
  return await request('/messages', {
    method: 'POST',
    body: JSON.stringify({ thread_id, text, project, recipientId, recipientName, recipientRole, recipientAvatar }),
  });
}

// ==========================================
// FILES, TEAM & PAYMENTS API
// ==========================================
export async function fetchFiles() {
  return await request('/files');
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(new Error('Could not read the selected file'));
    reader.readAsDataURL(file);
  });
}

export async function uploadFile({ file, name, size, project, projectId }) {
  if (!file) throw new Error('Choose a file to upload');
  const contentBase64 = await readFileAsBase64(file);
  return await request('/files', {
    method: 'POST',
    body: JSON.stringify({ name: name || file.name, size, project, projectId, mimeType: file.type, contentBase64 }),
  });
}

export async function downloadFile(id, fileName) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/files/${encodeURIComponent(id)}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to download file');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName || 'download';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export async function deleteFile(id) {
  return await request(`/files/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchTeam() {
  return await request('/team');
}

export async function inviteTeamMember({ name, email, role, project, projectId }) {
  return await request('/team', {
    method: 'POST',
    body: JSON.stringify({ name, email, role, project, projectId }),
  });
}

export async function fetchPayments() {
  return await request('/payments');
}

export async function releasePaymentEscrow(paymentId) {
  return await request(`/payments/${paymentId}/release`, {
    method: 'PATCH',
  });
}

export async function fetchDisputes() {
  return await request('/disputes');
}

export async function createDispute({ contractId, contractTitle, reason, notes }) {
  return await request('/disputes', {
    method: 'POST',
    body: JSON.stringify({ contractId, contractTitle, reason, notes }),
  });
}

// ==========================================
// PRICING, RESOURCES, BOOKMARKS, NEWSLETTER, SEARCH
// ==========================================
export async function fetchPricingPlans() {
  return await request('/pricing', { cache: true });
}

export async function subscribeToPlan({ planId, billingCycle }) {
  return await request('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ planId, billingCycle }),
  });
}

export async function fetchBillingConfig() {
  return await request('/billing/config');
}

export async function createCheckout({ planId, billingCycle }) {
  return await request('/billing/checkout', { method: 'POST', body: JSON.stringify({ planId, billingCycle }) });
}

export async function openBillingPortal() {
  return await request('/billing/portal', { method: 'POST' });
}

export async function fetchResources() {
  return await request('/resources', { cache: true });
}

export async function fetchBookmarks(type) {
  const qs = type ? `?type=${encodeURIComponent(type)}` : '';
  return await request(`/bookmarks${qs}`);
}

export async function toggleBookmark(itemType, itemId) {
  return await request('/bookmarks/toggle', {
    method: 'POST',
    body: JSON.stringify({ itemType, itemId }),
  });
}

export async function subscribeNewsletter(email) {
  return await request('/newsletter', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function globalSearch(query) {
  return await request(`/search?q=${encodeURIComponent(query || '')}`);
}

export async function fetchBackendStats() {
  return await request('/stats');
}

// ==========================================
// NOTIFICATIONS API
// ==========================================
export async function fetchNotifications(role) {
  const qs = role ? `?role=${encodeURIComponent(role)}` : '';
  return await request(`/notifications${qs}`);
}

export async function markNotificationRead(id, role) {
  const qs = role ? `?role=${encodeURIComponent(role)}` : '';
  return await request(`/notifications/${encodeURIComponent(id)}/read${qs}`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsRead(role) {
  return await request('/notifications/read-all', {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function deleteNotification(id) {
  return await request(`/notifications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function fetchAuditLogs({ action = '', entity_type = '', limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (action) params.append('action', action);
  if (entity_type) params.append('entity_type', entity_type);
  if (limit) params.append('limit', limit);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return await request(`/audit-logs${qs}`);
}

export async function exportFinancialsCsv() {
  const token = getAuthToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/finances/export?format=csv`, { headers });
  if (!res.ok) throw new Error('Failed to download financial report');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workverse-financial-ledger-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  return { success: true };
}
