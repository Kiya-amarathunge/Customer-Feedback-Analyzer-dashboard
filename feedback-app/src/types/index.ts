export interface FeedbackFormData {
  customerService: number;
  branchEnvironment: number;
  recommendation: number;
  additionalComments: string;
  branchId?: string;
  serviceType?: string;
}

export interface SubmitFeedbackResponse {
  success: boolean;
  message: string;
  feedbackId?: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
}

export type Language = 'en' | 'si' | 'ta';

export interface Translations {
  title: string;
  question1: string;
  question2: string;
  question3: string;
  additionalComments: string;
  commentsPlaceholder: string;
  submitButton: string;
  submitting: string;
  successTitle: string;
  successMessage: string;
  errorMessage: string;
  required: string;
  rateRequired: string;
}
