export interface FeedbackEntry {
  id: string;
  date: string;
  time: string;
  customerService: number;
  branchEnvironment: number;
  recommendation: number;
  additionalComments?: string;
  branch: string;
  branchId: string;
  serviceType?: string;
  overallRating: number;
  createdAt: string;
}

export interface AnalyticsData {
  totalFeedback: number;
  averageRating: number;
  npsScore: number;
  responseRate: number;
  totalFeedbackChange: number;
  averageRatingChange: number;
  npsScoreChange: number;
  responseRateChange: number;
}

export interface BranchPerformance {
  branchName: string;
  branchId: string;
  averageRating: number;
  totalFeedback: number;
}

export interface TrendDataPoint {
  month: string;
  customerService: number;
  branchEnvironment: number;
  recommendation: number;
  count: number;
}

export interface RatingDistribution {
  category: string;
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
}

export interface ServiceDistribution {
  name: string;
  value: number;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthToken {
  token: string;
  expiresAt: string;
  username: string;
}

export interface FilterParams {
  dateRange?: string;
  branch?: string;
  rating?: string;
  serviceType?: string;
  search?: string;
  page?: number;
  size?: number;
}
