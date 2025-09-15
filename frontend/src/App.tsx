import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./routes/AppRouter"; // Import AppRouter

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter /> {/* Sử dụng AppRouter thay vì định nghĩa Routes ở đây */}
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;