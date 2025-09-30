import { apiRequest } from '../../utils/apiUtils';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export interface PaymentResponse {
  message: string;
  clientSecret: string;
  paymentId: string;
}

export interface ConfirmPaymentData {
  paymentId: string;
  paymentIntentId: string;  // ✅ Đổi từ transactionId
  status: 'completed' | 'failed';
}

export const paymentService = {
  createStudentPayment: async (
    courseId: string,
    amount: number,
    paymentMethod: string
  ): Promise<PaymentResponse> => {
    const endpoint = `${API_BASE_URL}/api/payments/create-intent`;
    console.log("👉 Sending createStudentPayment:", { courseId, amount, paymentMethod });

    return await apiRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ courseId, amount, paymentMethod }),
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
};
