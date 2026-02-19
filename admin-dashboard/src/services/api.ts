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

export const analyticsService = {
  getSummary: async (): Promise<AnalyticsData> => {
    const res = await api.get<AnalyticsData>('/analytics/summary');
    return res.data;
  },
  getTrends: async (months: number = 12): Promise<TrendDataPoint[]> => {
    const res = await api.get<TrendDataPoint[]>(`/analytics/trends?months=${months}`);
    return res.data;
  },
  getRatingDistribution: async (): Promise<RatingDistribution[]> => {
    const res = await api.get<RatingDistribution[]>('/analytics/rating-distribution');
    return res.data;
  },
  getBranchPerformance: async (): Promise<BranchPerformance[]> => {
    const res = await api.get<BranchPerformance[]>('/analytics/branch-performance');
    return res.data;
  },
  getServiceDistribution: async (): Promise<ServiceDistribution[]> => {
    const res = await api.get<ServiceDistribution[]>('/analytics/service-distribution');
    return res.data;
  },
};

export const feedbackService = {
  getAll: async (filters: FilterParams): Promise<PagedResponse<FeedbackEntry>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== '') params.append(key, String(val));
    });
    const res = await api.get<PagedResponse<FeedbackEntry>>(`/responses?${params}`);
    return res.data;
  },
  getById: async (id: string): Promise<FeedbackEntry> => {
    const res = await api.get<FeedbackEntry>(`/responses/${id}`);
    return res.data;
  },
  exportCsv: async (filters: FilterParams): Promise<Blob> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== '') params.append(key, String(val));
    });
    const res = await api.get(`/responses/export?${params}`, { responseType: 'blob' });
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/responses/${id}`);
  },
};

export const branchService = {
  getAll: async () => {
    const res = await api.get('/branches');
    return res.data;
  },
};
