const authApi = {
  login(username, password) { return window.apiClient.post('/api/auth/login', { username, password }); },
  logout() { return window.apiClient.post('/api/auth/logout', {}); },
  me() { return window.apiClient.get('/api/auth/me'); },
  updateProfile(payload) { return window.apiClient.patch('/api/auth/profile', payload); },
  listUsers() { return window.apiClient.get('/api/auth/users'); },
  createUser(payload) { return window.apiClient.post('/api/auth/users', payload); },
  updateUser(id, payload) { return window.apiClient.patch(`/api/auth/users/${encodeURIComponent(id)}`, payload); },
};

if (typeof window !== 'undefined') window.authApi = authApi;
if (typeof module !== 'undefined' && module.exports) module.exports = { authApi };
