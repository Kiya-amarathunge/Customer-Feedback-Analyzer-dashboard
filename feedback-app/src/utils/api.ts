import axios from 'axios';
import { FeedbackFormData, SubmitFeedbackResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export const submitFeedback = async (
  data: FeedbackFormData
): Promise<SubmitFeedbackResponse> => {
  const response = await axios.post<SubmitFeedbackResponse>(
    `${API_BASE_URL}/feedback`,
    data,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

export const getBranches = async () => {
  const response = await axios.get(`${API_BASE_URL}/branches`);
  return response.data;
};
