import axios, { AxiosResponse } from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('webmail-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('webmail-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface EmailMessage {
  id: string;
  subject: string;
  sender: string;
  recipient: string[];
  date: string;
  body_text?: string;
  body_html?: string;
  is_read: boolean;
  has_attachments: boolean;
  folder: string;
  thread_id?: string;
  message_id?: string;
  in_reply_to?: string;
  references?: string;
}

export interface EmailFolder {
  name: string;
  display_name: string;
  message_count: number;
  unread_count: number;
}

export interface EmailAccount {
  id: number;
  email_address: string;
  display_name?: string;
  is_primary: boolean;
}

export const authAPI = {
  login: async (username: string, password: string) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const response: AxiosResponse = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getCurrentUser: async (token?: string) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response: AxiosResponse = await api.get('/auth/me', config);
    return response.data;
  },
};

export const emailAPI = {
  getAccounts: async (): Promise<EmailAccount[]> => {
    const response: AxiosResponse = await api.get('/emails/accounts');
    return response.data;
  },

  getFolders: async (accountId: number): Promise<EmailFolder[]> => {
    const response: AxiosResponse = await api.get(`/emails/folders?account_id=${accountId}`);
    return response.data;
  },

  getMessages: async (accountId: number, folder = 'INBOX', limit = 50): Promise<EmailMessage[]> => {
    const response: AxiosResponse = await api.get(
      `/emails/messages?account_id=${accountId}&folder=${folder}&limit=${limit}`
    );
    return response.data;
  },

  getMessage: async (messageId: string, accountId: number, folder = 'INBOX'): Promise<EmailMessage> => {
    const response: AxiosResponse = await api.get(
      `/emails/message/${messageId}?account_id=${accountId}&folder=${folder}`
    );
    return response.data;
  },

  sendMessage: async (accountId: number, messageData: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body_text?: string;
    body_html?: string;
    attachments?: Array<{
      filename: string;
      content: File | string;
      content_type: string;
    }>;
  }) => {
    const response: AxiosResponse = await api.post(
      `/emails/send?account_id=${accountId}`, 
      messageData
    );
    return response.data;
  },
};

export interface ChatChannel {
  id: number;
  name: string;
  description?: string;
  channel_type: string;
  created_at: string;
  member_count: number;
  unread_count: number;
}

export interface ChatMessage {
  id: number;
  channel_id: number;
  user_id: number;
  username: string;
  content: string;
  message_type: string;
  created_at: string;
  is_edited: boolean;
  reply_to_id?: number;
}

export interface ChatMember {
  id: number;
  username: string;
  full_name?: string;
  email: string;
  status: string;
  last_seen?: string;
}

export interface UserPresence {
  user_id: number;
  status: string;
  status_message?: string;
  last_seen: string;
}

export interface RSSFeed {
  id: number;
  title: string;
  description?: string;
  url: string;
  last_updated?: string;
  user_id: number;
  unread_count: number;
}

export interface RSSEntry {
  id: number;
  feed_id: number;
  title: string;
  description?: string;
  url: string;
  published: string;
  is_read: boolean;
  content?: string;
}

export const chatAPI = {
  getChannels: async (): Promise<ChatChannel[]> => {
    const response: AxiosResponse = await api.get('/chat/channels');
    return response.data;
  },

  createChannel: async (channelData: {
    name: string;
    description?: string;
    channel_type?: string;
    member_ids?: number[];
  }): Promise<ChatChannel> => {
    const response: AxiosResponse = await api.post('/chat/channels', channelData);
    return response.data;
  },

  getChannelMessages: async (channelId: number, limit = 50): Promise<ChatMessage[]> => {
    const response: AxiosResponse = await api.get(`/chat/channels/${channelId}/messages?limit=${limit}`);
    return response.data;
  },

  sendMessage: async (channelId: number, messageData: {
    content: string;
    message_type?: string;
    reply_to_id?: number;
  }): Promise<ChatMessage> => {
    const response: AxiosResponse = await api.post(`/chat/channels/${channelId}/messages`, messageData);
    return response.data;
  },

  getChannelMembers: async (channelId: number): Promise<ChatMember[]> => {
    const response: AxiosResponse = await api.get(`/chat/channels/${channelId}/members`);
    return response.data;
  },

  getDomainUsers: async (): Promise<ChatMember[]> => {
    const response: AxiosResponse = await api.get('/chat/users');
    return response.data;
  },

  updatePresence: async (status: string, statusMessage?: string): Promise<UserPresence> => {
    const response: AxiosResponse = await api.put('/chat/presence', {
      status,
      status_message: statusMessage
    });
    return response.data;
  },

  getUserPresence: async (userId: number): Promise<UserPresence> => {
    const response: AxiosResponse = await api.get(`/chat/presence/${userId}`);
    return response.data;
  },
};

export interface FileStorage {
  id: number;
  name: string;
  storage_type: string;
  host: string;
  port?: number;
  username: string;
  bucket_name?: string;
  region?: string;
  base_path?: string;
  is_active: boolean;
  created_at: string;
}

export interface FileItem {
  name: string;
  path: string;
  size?: number;
  modified?: string;
  is_directory: boolean;
  permissions?: string;
}

export interface DirectoryListing {
  current_path: string;
  parent_path?: string;
  items: FileItem[];
  total_files: number;
  total_directories: number;
}

export const fileAPI = {
  getStorages: async (): Promise<FileStorage[]> => {
    const response: AxiosResponse = await api.get('/files/storages');
    return response.data;
  },

  createStorage: async (storageData: {
    name: string;
    storage_type: string;
    host: string;
    port?: number;
    username: string;
    password: string;
    bucket_name?: string;
    region?: string;
    access_key?: string;
    secret_key?: string;
    base_path?: string;
  }): Promise<FileStorage> => {
    const response: AxiosResponse = await api.post('/files/storages', storageData);
    return response.data;
  },

  deleteStorage: async (storageId: number): Promise<void> => {
    await api.delete(`/files/storages/${storageId}`);
  },

  browseDirectory: async (storageId: number, path: string = '/'): Promise<DirectoryListing> => {
    const response: AxiosResponse = await api.get(`/files/storages/${storageId}/browse?path=${encodeURIComponent(path)}`);
    return response.data;
  },

  searchFiles: async (storageId: number, searchData: {
    search_term: string;
    path?: string;
    file_types?: string[];
    max_results?: number;
  }) => {
    const response: AxiosResponse = await api.post(`/files/storages/${storageId}/search`, searchData);
    return response.data;
  },

  testConnection: async (storageId: number) => {
    const response: AxiosResponse = await api.get(`/files/storages/${storageId}/test`);
    return response.data;
  },
};

export interface Contact {
  id: number;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  company?: string;
  job_title?: string;
  notes?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactGroup {
  id: number;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  member_count: number;
}

export const contactsAPI = {
  getContacts: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    group_id?: number;
    favorites_only?: boolean;
  }): Promise<Contact[]> => {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.group_id) queryParams.append('group_id', params.group_id.toString());
    if (params?.favorites_only) queryParams.append('favorites_only', 'true');

    const response: AxiosResponse = await api.get(`/contacts?${queryParams}`);
    return response.data;
  },

  createContact: async (contactData: {
    first_name: string;
    last_name?: string;
    email: string;
    phone?: string;
    company?: string;
    job_title?: string;
    notes?: string;
    is_favorite?: boolean;
  }): Promise<Contact> => {
    const response: AxiosResponse = await api.post('/contacts', contactData);
    return response.data;
  },

  updateContact: async (contactId: number, contactData: Partial<Contact>): Promise<Contact> => {
    const response: AxiosResponse = await api.put(`/contacts/${contactId}`, contactData);
    return response.data;
  },

  deleteContact: async (contactId: number): Promise<void> => {
    await api.delete(`/contacts/${contactId}`);
  },

  searchContacts: async (query: string, limit = 50): Promise<Contact[]> => {
    const response: AxiosResponse = await api.post('/contacts/search', {
      query,
      limit
    });
    return response.data;
  },

  getContactGroups: async (): Promise<ContactGroup[]> => {
    const response: AxiosResponse = await api.get('/contact-groups');
    return response.data;
  },

  createContactGroup: async (groupData: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<ContactGroup> => {
    const response: AxiosResponse = await api.post('/contact-groups', groupData);
    return response.data;
  },

  deleteContactGroup: async (groupId: number): Promise<void> => {
    await api.delete(`/contact-groups/${groupId}`);
  },

  addContactToGroup: async (groupId: number, contactId: number): Promise<void> => {
    await api.post(`/contact-groups/${groupId}/members`, {
      contact_id: contactId,
      group_id: groupId
    });
  },

  removeContactFromGroup: async (groupId: number, contactId: number): Promise<void> => {
    await api.delete(`/contact-groups/${groupId}/members/${contactId}`);
  },
};

export const rssAPI = {
  getFeeds: async (): Promise<RSSFeed[]> => {
    const response: AxiosResponse = await api.get('/rss/feeds');
    return response.data;
  },

  createFeed: async (feedData: {
    title: string;
    url: string;
    description?: string;
  }): Promise<RSSFeed> => {
    const response: AxiosResponse = await api.post('/rss/feeds', feedData);
    return response.data;
  },

  deleteFeed: async (feedId: number): Promise<void> => {
    await api.delete(`/rss/feeds/${feedId}`);
  },

  getFeedEntries: async (feedId: number, limit = 50): Promise<RSSEntry[]> => {
    const response: AxiosResponse = await api.get(`/rss/feeds/${feedId}/entries?limit=${limit}`);
    return response.data;
  },

  markEntryRead: async (entryId: number): Promise<void> => {
    await api.put(`/rss/entries/${entryId}/read`);
  },

  markEntryUnread: async (entryId: number): Promise<void> => {
    await api.put(`/rss/entries/${entryId}/unread`);
  },

  refreshFeed: async (feedId: number): Promise<void> => {
    await api.post(`/rss/feeds/${feedId}/refresh`);
  },
};

export const userAPI = {
  getMyAccounts: async (): Promise<EmailAccount[]> => {
    const response: AxiosResponse = await api.get('/users/me/accounts');
    return response.data;
  },

  createEmailAccount: async (accountData: {
    email_address: string;
    display_name?: string;
    imap_username: string;
    imap_password: string;
    domain_id: number;
  }) => {
    const response: AxiosResponse = await api.post('/users/me/accounts', accountData);
    return response.data;
  },

  setPrimaryAccount: async (accountId: number) => {
    const response: AxiosResponse = await api.put(`/users/me/accounts/${accountId}/primary`);
    return response.data;
  },

  deleteEmailAccount: async (accountId: number) => {
    const response: AxiosResponse = await api.delete(`/users/me/accounts/${accountId}`);
    return response.data;
  },
};

export default api;