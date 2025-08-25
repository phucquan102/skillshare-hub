import React, { useState } from 'react';
import axios from 'axios';

type ApiData = {
  gateway?: unknown;
  users?: unknown;
  courses?: unknown;
  payments?: unknown;
  error?: string;
};

function App() {
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const testServices = async () => {
    setLoading(true);
    try {
      const gatewayRes  = await axios.get(`${API_BASE_URL}/`);
      const usersRes    = await axios.get(`${API_BASE_URL}/users/api/users`);
      const coursesRes  = await axios.get(`${API_BASE_URL}/courses/api/courses`);
      const paymentsRes = await axios.get(`${API_BASE_URL}/payments/api/payments/history`);

      setApiData({
        gateway:  gatewayRes.data,
        users:    usersRes.data,
        courses:  coursesRes.data,
        payments: paymentsRes.data,
      });
    } catch (error: any) {
      setApiData({ error: error?.message ?? 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="App">
      <header className="App-header">
        <h1>🎓 SkillShare Hub</h1>
        <p>Nền tảng học tập trực tuyến với kiến trúc Microservices</p>
        
        <div style={{ margin: '20px 0' }}>
          <button 
            onClick={testServices} 
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#61dafb',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Testing...' : 'Test All Services'}
          </button>
        </div>

        {apiData && (
          <div style={{ textAlign: 'left', maxWidth: '800px' }}>
            <h3>API Response:</h3>
            <pre style={{ 
              backgroundColor: '#f4f4f4', 
              padding: '10px', 
              borderRadius: '5px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
              {JSON.stringify(apiData, null, 2)}
            </pre>
          </div>
        )}

        <div style={{ marginTop: '30px', fontSize: '14px' }}>
          <h3>Các Services:</h3>
          <ul style={{ textAlign: 'left' }}>
            <li>👥 User Service - Quản lý người dùng</li>
            <li>📚 Course Service - Quản lý khóa học</li>
            <li>💳 Payment Service - Xử lý thanh toán</li>
            <li>🌐 API Gateway - Cổng vào chung</li>
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App;