export interface FeedbackFormData {
  customerService: number;
  branchEnvironment: number;
  recommendation: number;
  additionalComments: string;
  branchId?: string;
  branchName?: string;
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

export type Language = 'en' | 'id';

export interface Translations {
  title: string;
  subtitle: string;
  bannerText: string;
  branchLabel: string;
  branchPlaceholder: string;
  branchSearch: string;
  branchNotFound: string;
  serviceLabel: string;
  servicePlaceholder: string;
  serviceSearch: string;
  serviceNotFound: string;
  question1: string;
  question2: string;
  question3: string;
  additionalComments: string;
  commentsPlaceholder: string;
  submitButton: string;
  submitting: string;
  successTitle: string;
  successMessage: string;
  submitAnother: string;
  errorMessage: string;
  required: string;
  optional: string;
  rateRequired: string;
  selectError: string;
}
