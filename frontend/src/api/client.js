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

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errMsg = (data && data.error) || (data && data.message) || `HTTP error ${res.status}`;
    throw new Error(errMsg);
  }

  if (
    typeof window !== 'undefined' &&
    options.method &&
    ['POST', 'PATCH', 'PUT', 'DELETE'].includes(options.method.toUpperCase()) &&
    !endpoint.startsWith('/notifications') &&
    !endpoint.startsWith('/auth/')
  ) {
    window.dispatchEvent(new CustomEvent('workverse:refresh-notifications'));
  }

  return data;
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
export async function fetchProjects({ status = 'All', search = '', category = '' } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'All') params.append('status', status);
  if (category && category !== 'All Categories') params.append('category', category);
  if (search && search.trim()) params.append('search', search.trim());
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

export async function sendMessage({ thread_id, text, project, recipientName, recipientRole, recipientAvatar }) {
  return await request('/messages', {
    method: 'POST',
    body: JSON.stringify({ thread_id, text, project, recipientName, recipientRole, recipientAvatar }),
  });
}

// ==========================================
// FILES, TEAM & PAYMENTS API
// ==========================================
export async function fetchFiles() {
  return await request('/files');
}

export async function uploadFile({ name, size, project }) {
  return await request('/files', {
    method: 'POST',
    body: JSON.stringify({ name, size, project }),
  });
}

export async function deleteFile(id) {
  return await request(`/files/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchTeam() {
  return await request('/team');
}

export async function inviteTeamMember({ name, email, role, project }) {
  return await request('/team', {
    method: 'POST',
    body: JSON.stringify({ name, email, role, project }),
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

// ==========================================
// PRICING, RESOURCES, BOOKMARKS, NEWSLETTER, SEARCH
// ==========================================
export async function fetchPricingPlans() {
  return await request('/pricing');
}

export async function subscribeToPlan({ planId, billingCycle }) {
  return await request('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ planId, billingCycle }),
  });
}

export async function fetchResources() {
  return await request('/resources');
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
