// utils/apiUtils.ts

let lastLoggedToken: string | null = null; // Track token để chỉ log khi thay đổi

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const token = localStorage.getItem("token");
    
    // ✅ Chỉ log khi token thay đổi, không log mỗi request
    if (token !== lastLoggedToken) {
      console.log("🚀 Token gửi lên:", token || "Không có token");
      lastLoggedToken = token;
    }

    // Tạo headers object với kiểu cụ thể
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Thêm các headers từ options nếu có
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.entries(options.headers).forEach(([key, value]) => {
          headers[key] = value as string;
        });
      }
    }

    // CHỈ thêm Authorization nếu có token
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return {} as T;
  } catch (error) {
    console.error("❌ API Request failed:", error);
    throw error;
  }
}