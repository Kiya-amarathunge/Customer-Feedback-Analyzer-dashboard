import axios, { AxiosInstance } from 'axios';
import {
  AnalyticsData,
  AuthToken,
  BranchPerformance,
  FeedbackEntry,
  FilterParams,
  LoginCredentials,
  PagedResponse,
  RatingDistribution,
  ServiceDistribution,
  TrendDataPoint,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({ baseURL: API_BASE_URL });

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

const api = createApiInstance();

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthToken> => {
    const res = await api.post<AuthToken>('/auth/login', credentials);
    return res.data;
  },
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('authToken');
  },
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsService = {
  // Summary is always global
  getSummary: async (): Promise<AnalyticsData> => {
    const res = await api.get<AnalyticsData>('/analytics/summary');
    return res.data;
  },

  // Trends — supports fromMonth, toMonth (YYYY-MM format), and optional branchId
  getTrends: async (fromMonth?: string, toMonth?: string, branchId?: string): Promise<TrendDataPoint[]> => {
    const params = new URLSearchParams();
    if (fromMonth) params.append('fromMonth', fromMonth);
    if (toMonth)   params.append('toMonth',   toMonth);
    if (branchId)  params.append('branchId',  branchId);
    const res = await api.get<TrendDataPoint[]>(`/analytics/trends?${params}`);
    return res.data;
  },

  // Rating distribution — optional branchId filter
  getRatingDistribution: async (branchId?: string): Promise<RatingDistribution[]> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    const res = await api.get<RatingDistribution[]>(`/analytics/rating-distribution?${params}`);
    return res.data;
  },

  // Branch performance — always all branches
  getBranchPerformance: async (): Promise<BranchPerformance[]> => {
    const res = await api.get<BranchPerformance[]>('/analytics/branch-performance');
    return res.data;
  },

  // Service distribution — optional branchId filter
  getServiceDistribution: async (branchId?: string): Promise<ServiceDistribution[]> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    const res = await api.get<ServiceDistribution[]>(`/analytics/service-distribution?${params}`);
    return res.data;
  },
};

// ── Feedback ──────────────────────────────────────────────────────────────────
export const feedbackService = {
  // Get all feedback with filtering — branch, serviceType, rating, search, page, size
  getAll: async (filters: FilterParams): Promise<PagedResponse<FeedbackEntry>> => {
    const params = new URLSearchParams();
    if (filters.branch)      params.append('branch',      filters.branch);
    if (filters.serviceType) params.append('serviceType', filters.serviceType);
    if (filters.rating)      params.append('rating',      filters.rating);
    if (filters.search)      params.append('search',      filters.search);
    if (filters.page !== undefined) params.append('page', String(filters.page));
    if (filters.size !== undefined) params.append('size', String(filters.size));
    const res = await api.get<PagedResponse<FeedbackEntry>>(`/responses?${params}`);
    return res.data;
  },

  getById: async (id: string): Promise<FeedbackEntry> => {
    const res = await api.get<FeedbackEntry>(`/responses/${id}`);
    return res.data;
  },

  exportCsv: async (filters: FilterParams): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters.branch)      params.append('branch',      filters.branch);
    if (filters.serviceType) params.append('serviceType', filters.serviceType);
    if (filters.rating)      params.append('rating',      filters.rating);
    if (filters.search)      params.append('search',      filters.search);
    const res = await api.get(`/responses/export?${params}`, { responseType: 'blob' });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/responses/${id}`);
  },
};

// ── Branches ──────────────────────────────────────────────────────────────────
export const branchService = {
  getAll: async () => {
    const res = await api.get('/branches');
    return res.data;
  },
};
