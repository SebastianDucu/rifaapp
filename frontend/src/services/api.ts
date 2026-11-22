import axios from 'axios';
import type {
  User,
  Raffle,
  Ticket,
  Participant,
  AuditLogEntry,
  CreateRaffleData,
  UpdateTicketData,
  BulkUpdateData,
  ImageOptions,
} from '@/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores globalmente con mensajes específicos
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = error.response?.data?.error || 'Error de conexión con el servidor';

    // Si Zod devolvió detalles de campos específicos, concatenarlos de forma legible
    if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
      const fieldErrors = error.response.data.details
        .map((d: { field: string; message: string }) => `${d.field ? d.field + ': ' : ''}${d.message}`)
        .join(' | ');
      if (fieldErrors) {
        message = fieldErrors;
      }
    }

    // Si es 401 y no estamos en login/register, redirigir
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      if (!path.includes('/login') && !path.includes('/register') && !path.includes('/r/')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(new Error(message));
  }
);

// ============================================
// Auth
// ============================================

export const authApi = {
  register: async (data: { email: string; password: string; name: string }) => {
    const res = await api.post<{ user: User }>('/auth/register', data);
    return res.data.user;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await api.post<{ user: User }>('/auth/login', data);
    return res.data.user;
  },

  logout: async () => {
    await api.post('/auth/logout');
  },

  getMe: async () => {
    const res = await api.get<{ user: User }>('/auth/me');
    return res.data.user;
  },
};

// ============================================
// Raffles
// ============================================

export const raffleApi = {
  list: async () => {
    const res = await api.get<{ raffles: Raffle[] }>('/raffles');
    return res.data.raffles;
  },

  getById: async (id: string) => {
    const res = await api.get<{ raffle: Raffle }>(`/raffles/${id}`);
    return res.data.raffle;
  },

  create: async (data: CreateRaffleData) => {
    const res = await api.post<{ raffle: Raffle }>('/raffles', data);
    return res.data.raffle;
  },

  update: async (id: string, data: Partial<CreateRaffleData>) => {
    const res = await api.put<{ raffle: Raffle }>(`/raffles/${id}`, data);
    return res.data.raffle;
  },

  duplicate: async (id: string) => {
    const res = await api.post<{ raffle: Raffle }>(`/raffles/${id}/duplicate`);
    return res.data.raffle;
  },

  archive: async (id: string) => {
    const res = await api.patch<{ raffle: Raffle }>(`/raffles/${id}/archive`);
    return res.data.raffle;
  },

  delete: async (id: string) => {
    await api.delete(`/raffles/${id}`);
  },

  draw: async (id: string, method: 'random' | 'manual', manualTicketNumber?: number) => {
    const res = await api.post<{ raffle: Raffle }>(`/raffles/${id}/draw`, {
      method,
      manualTicketNumber,
    });
    return res.data.raffle;
  },

  getAuditLog: async (id: string) => {
    const res = await api.get<{ logs: AuditLogEntry[] }>(`/raffles/${id}/audit-log`);
    return res.data.logs;
  },
};

// ============================================
// Tickets
// ============================================

export const ticketApi = {
  getByRaffle: async (raffleId: string, filters?: { status?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);

    const res = await api.get<{ tickets: Ticket[] }>(
      `/raffles/${raffleId}/tickets?${params.toString()}`
    );
    return res.data.tickets;
  },

  update: async (ticketId: string, data: UpdateTicketData) => {
    const res = await api.patch<{ ticket: Ticket }>(`/tickets/${ticketId}`, data);
    return res.data.ticket;
  },

  bulkUpdate: async (raffleId: string, data: BulkUpdateData) => {
    const res = await api.patch<{ updatedCount: number }>(
      `/raffles/${raffleId}/tickets/bulk`,
      data
    );
    return res.data;
  },
};

// ============================================
// Participants
// ============================================

export const participantApi = {
  getByRaffle: async (raffleId: string) => {
    const res = await api.get<{ participants: Participant[] }>(
      `/raffles/${raffleId}/participants`
    );
    return res.data.participants;
  },

  exportCsv: async (raffleId: string) => {
    const res = await api.get(`/raffles/${raffleId}/export.csv`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tickets.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  },

  importCsv: async (raffleId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{ updated: number; errors: string[] }>(
      `/raffles/${raffleId}/import`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },
};

export const uploadApi = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post<{ url: string }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  },
};

// ============================================
// Images
// ============================================

export const imageApi = {
  generate: async (raffleId: string, options: ImageOptions) => {
    const res = await api.post(`/raffles/${raffleId}/image`, options, {
      responseType: 'blob',
    });
    return res.data as Blob;
  },

  generateZip: async (raffleId: string, options: ImageOptions) => {
    const res = await api.post(`/raffles/${raffleId}/image/zip`, options, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tablero.zip';
    link.click();
    window.URL.revokeObjectURL(url);
  },
};

// ============================================
// Public
// ============================================

export const publicApi = {
  getRaffle: async (slug: string) => {
    const res = await api.get<{ raffle: Raffle & { tickets: Ticket[] } }>(
      `/public/raffles/${slug}`
    );
    return res.data.raffle;
  },
};

export default api;
