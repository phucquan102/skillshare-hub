import { apiRequest } from '../../utils/apiUtils';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export interface PaymentResponse {
  message: string;
  clientSecret: string;
  paymentId: string;
}

export interface ConfirmPaymentData {
  paymentId: string;
  paymentIntentId: string;
  status: 'completed' | 'failed';
}

export const paymentService = {
  createStudentPayment: async (
    courseId: string,
    amount: number,
    paymentMethod: string,
    lessonId?: string
  ): Promise<PaymentResponse> => {
    const endpoint = `${API_BASE_URL}/api/payments/create-intent`;
    console.log("👉 Sending createStudentPayment:", { 
      courseId, 
      amount, 
      paymentMethod, 
      lessonId 
    });

    const requestBody: any = { 
      courseId, 
      amount, 
      paymentMethod 
    };

    if (lessonId) {
      requestBody.lessonId = lessonId;
    }

    return await apiRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(requestBody),
    });
  },

  // ... rest of the paymentService methods remain the same
  createInstructorFee: async (paymentMethod: string): Promise<PaymentResponse> => {
    const endpoint = `${API_BASE_URL}/api/payments/instructor-fee`;
    console.log("👉 Sending createInstructorFee:", { paymentMethod });

    return await apiRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ paymentMethod }),
    });
  },

  confirmPayment: async (data: ConfirmPaymentData): Promise<{ success: boolean; message: string }> => {
    const endpoint = `${API_BASE_URL}/api/payments/confirm`;
    return await apiRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });
  },

  getPaymentHistory: async (): Promise<{ payments: any[] }> => {
    const endpoint = `${API_BASE_URL}/api/payments/history`;
    return await apiRequest(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },

  refundPayment: async (paymentId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const endpoint = `${API_BASE_URL}/api/payments/refund`;
    return await apiRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ paymentId, reason }),
    });
  },

  getPaymentStats: async (startDate?: string, endDate?: string, groupBy?: string): Promise<any> => {
    const endpoint = `${API_BASE_URL}/api/payments/stats`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (groupBy) params.append('groupBy', groupBy);

    return await apiRequest(`${endpoint}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },

  getPaymentById: async (paymentId: string): Promise<any> => {
    const endpoint = `${API_BASE_URL}/api/payments/${paymentId}`;
    return await apiRequest(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
  }
};