import api from './api';

export interface Domain {
  id: number;
  name: string;
  imap_server: string;
  imap_port: number;
  smtp_server: string;
  smtp_port: number;
  use_ssl: boolean;
  is_active: boolean;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_admin: boolean;
  domain_id: number;
  storage_quota_mb?: number;
  storage_used_mb?: number;
  email_quota_daily?: number;
  email_sent_today?: number;
  created_at: string;
  last_login?: string;
}

export interface SystemStats {
  domains: {
    total: number;
    active: number;
    inactive: number;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
  };
  email_accounts: {
    total: number;
    active: number;
    inactive: number;
  };
}

export const adminAPI = {
  // Domain Management
  getDomains: async (search?: string): Promise<Domain[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    const response = await api.get(`/admin/domains?${params.toString()}`);
    return response.data;
  },

  createDomain: async (domainData: {
    name: string;
    imap_server: string;
    imap_port: number;
    smtp_server: string;
    smtp_port: number;
    use_ssl: boolean;
  }): Promise<Domain> => {
    const response = await api.post('/admin/domains', domainData);
    return response.data;
  },

  updateDomain: async (domainId: number, domainData: any): Promise<Domain> => {
    const response = await api.put(`/admin/domains/${domainId}`, domainData);
    return response.data;
  },

  deleteDomain: async (domainId: number): Promise<void> => {
    await api.delete(`/admin/domains/${domainId}`);
  },

  toggleDomainStatus: async (domainId: number): Promise<void> => {
    await api.post(`/admin/domains/${domainId}/toggle`);
  },

  // User Management
  getUsers: async (domainId?: number, search?: string): Promise<User[]> => {
    const params = new URLSearchParams();
    if (domainId) params.append('domain_id', domainId.toString());
    if (search) params.append('search', search);
    
    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  },

  createUser: async (userData: {
    username: string;
    email: string;
    password: string;
    domain_id: number;
    full_name?: string;
    is_admin?: boolean;
    storage_quota_mb?: number;
    email_quota_daily?: number;
  }): Promise<void> => {
    await api.post('/admin/users', userData);
  },

  updateUser: async (userId: number, userData: {
    username?: string;
    email?: string;
    full_name?: string;
    is_admin?: boolean;
    password?: string;
    storage_quota_mb?: number;
    email_quota_daily?: number;
  }): Promise<void> => {
    await api.put(`/admin/users/${userId}`, userData);
  },

  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
  },

  toggleUserStatus: async (userId: number): Promise<void> => {
    await api.post(`/admin/users/${userId}/toggle`);
  },

  resetUserPassword: async (userId: number, newPassword: string): Promise<void> => {
    await api.post(`/admin/users/${userId}/reset-password`, {
      new_password: newPassword
    });
  },

  // Email Account Management
  getEmailAccounts: async (userId?: number, domainId?: number): Promise<any[]> => {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    if (domainId) params.append('domain_id', domainId.toString());
    
    const response = await api.get(`/admin/email-accounts?${params.toString()}`);
    return response.data;
  },

  deleteEmailAccount: async (accountId: number): Promise<void> => {
    await api.delete(`/admin/email-accounts/${accountId}`);
  },

  // System Statistics
  getSystemStatistics: async (): Promise<SystemStats> => {
    const response = await api.get('/admin/statistics');
    return response.data;
  },
};