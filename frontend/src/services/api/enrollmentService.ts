// enrollmentService.ts - Version với detailed logging

export const enrollmentService = {
  async createEnrollment(courseId: string, paymentId: string) {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const requestBody = {
        courseId,
        paymentId,
      };

      console.log('📤 Sending enrollment request:', {
        url: 'http://localhost:3000/api/enrollments',
        method: 'POST',
        body: requestBody,
        hasToken: !!token
      });

      const response = await fetch('http://localhost:3000/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Enrollment response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      // Đọc response body để xem error message
      const responseText = await response.text();
      console.log('📄 Response body:', responseText);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
          console.error('❌ Enrollment error details:', errorData);
        } catch (e) {
          console.error('❌ Could not parse error response');
        }
        
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      console.log('✅ Enrollment successful:', result);
      return result;

    } catch (error: any) {
      console.error('💥 Enrollment service error:', {
        message: error.message,
        stack: error.stack,
        courseId,
        paymentId
      });
      
      return {
        success: false,
        error: error.message || 'Enrollment failed but payment was successful. Please contact support.'
      };
    }
  },
};