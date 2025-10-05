export interface PaymentIntentResponse {
  clientSecret: string;
  paymentId: string;
  amount: number;
  currency: string;
}

export interface ConfirmPaymentRequest {
  paymentId: string;
  paymentIntentId: string;
  status: 'completed' | 'failed';
}

export interface PaymentHistory {
  _id: string;
  userId: string;
  courseId?: string;
  lessonId?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  type: 'course_payment' | 'lesson_payment' | 'instructor_fee';
  transactionId: string;
  adminShare: number;
  instructorShare: number;
  createdAt: string;
  updatedAt: string;
}