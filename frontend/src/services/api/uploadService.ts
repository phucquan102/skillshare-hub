// src/services/api/uploadService.ts
import api from './apiConfig';

export interface UploadResponse {
  message: string;
  image?: {
    url: string;
    public_id: string;
    format: string;
    resource_type: string;
    bytes: number;
  };
  video?: {
    url: string;
    public_id: string;
    format: string;
    resource_type: string;
    bytes: number;
    duration: number;
  };
  images?: Array<{
    url: string;
    public_id: string;
    format: string;
    resource_type: string;
    bytes: number;
  }>;
}

export interface UploadResult {
  url: string;
  public_id: string;
  format: string;
  resource_type: string;
  bytes: number;
  duration?: number;
}

export class UploadError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

export const uploadService = {
  // Upload single image
  uploadImage: async (file: File): Promise<UploadResponse> => {
    console.log('🔄 [UploadService] Starting image upload:', {
      fileName: file.name,
      size: file.size,
      type: file.type,
      timestamp: new Date().toISOString()
    });

    // Validation cơ bản
    if (!file.type.startsWith('image/')) {
      throw new UploadError('File phải là định dạng ảnh', 400, 'INVALID_FILE_TYPE');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new UploadError('Kích thước file không được vượt quá 10MB', 400, 'FILE_TOO_LARGE');
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📊 Upload progress: ${progress}%`);
          }
        },
      });

      console.log('✅ [UploadService] Image upload successful:', {
        fileName: file.name,
        response: response.data
      });

      return response.data;

    } catch (error: any) {
      console.error('❌ [UploadService] Image upload failed:', {
        fileName: file.name,
        error: error.response?.data || error.message,
        status: error.response?.status,
        code: error.code
      });

      // Xử lý lỗi chi tiết
      let errorMessage = 'Upload ảnh thất bại';
      let statusCode = error.response?.status;
      let errorCode = 'UPLOAD_FAILED';

      if (error.response) {
        // Lỗi từ server
        const serverError = error.response.data;
        
        if (statusCode === 413) {
          errorMessage = 'File quá lớn. Vui lòng chọn file nhỏ hơn 10MB';
          errorCode = 'FILE_TOO_LARGE';
        } else if (statusCode === 415) {
          errorMessage = 'Định dạng file không được hỗ trợ';
          errorCode = 'UNSUPPORTED_FORMAT';
        } else if (statusCode === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau';
          errorCode = 'SERVER_ERROR';
        } else if (serverError?.message) {
          errorMessage = serverError.message;
        } else {
          errorMessage = `Lỗi server (${statusCode})`;
        }
      } else if (error.request) {
        // Không nhận được response
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng';
        errorCode = 'NETWORK_ERROR';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. Vui lòng thử lại';
        errorCode = 'TIMEOUT';
      } else {
        errorMessage = error.message || 'Lỗi không xác định';
      }

      throw new UploadError(errorMessage, statusCode, errorCode, error);
    }
  },

  // Upload multiple images
  uploadMultipleImages: async (files: File[]): Promise<UploadResponse> => {
    console.log('🔄 [UploadService] Starting multiple images upload:', {
      fileCount: files.length,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      timestamp: new Date().toISOString()
    });

    // Validation
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      throw new UploadError('Tất cả file phải là định dạng ảnh', 400, 'INVALID_FILE_TYPE');
    }

    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      throw new UploadError('Một số file vượt quá 10MB', 400, 'FILE_TOO_LARGE');
    }

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await api.post('/upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

      console.log('✅ [UploadService] Multiple images upload successful:', {
        fileCount: files.length,
        response: response.data
      });

      return response.data;

    } catch (error: any) {
      console.error('❌ [UploadService] Multiple images upload failed:', {
        fileCount: files.length,
        error: error.response?.data || error.message,
        status: error.response?.status
      });

      let errorMessage = 'Upload nhiều ảnh thất bại';
      
      if (error.response?.status === 413) {
        errorMessage = 'Tổng kích thước file quá lớn';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      throw new UploadError(
        errorMessage, 
        error.response?.status, 
        'MULTI_UPLOAD_FAILED', 
        error
      );
    }
  },

  // Upload video
  uploadVideo: async (file: File): Promise<UploadResponse> => {
    console.log('🔄 [UploadService] Starting video upload:', {
      fileName: file.name,
      size: file.size,
      type: file.type,
      timestamp: new Date().toISOString()
    });

    // Validation cho video
    const videoFormats = ['mp4', 'mov', 'avi', 'webm'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !videoFormats.includes(fileExtension)) {
      throw new UploadError(
        'Định dạng video không được hỗ trợ. Chấp nhận: MP4, MOV, AVI, WEBM', 
        400, 
        'UNSUPPORTED_VIDEO_FORMAT'
      );
    }

    if (!file.type.startsWith('video/')) {
      throw new UploadError('File phải là định dạng video', 400, 'INVALID_FILE_TYPE');
    }

    if (file.size > 50 * 1024 * 1024) {
      throw new UploadError('Kích thước video không được vượt quá 50MB', 400, 'FILE_TOO_LARGE');
    }

    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await api.post('/upload/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 phút cho video
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📊 Video upload progress: ${progress}%`);
          }
        },
      });

      console.log('✅ [UploadService] Video upload successful:', {
        fileName: file.name,
        response: response.data
      });

      return response.data;

    } catch (error: any) {
      console.error('❌ [UploadService] Video upload failed:', {
        fileName: file.name,
        error: error.response?.data || error.message,
        status: error.response?.status
      });

      let errorMessage = 'Upload video thất bại';
      
      if (error.response?.status === 413) {
        errorMessage = 'Video quá lớn. Vui lòng chọn file nhỏ hơn 50MB';
      } else if (error.response?.status === 415) {
        errorMessage = 'Định dạng video không được hỗ trợ';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      throw new UploadError(errorMessage, error.response?.status, 'VIDEO_UPLOAD_FAILED', error);
    }
  },

  // Delete file
  deleteFile: async (publicId: string, resourceType: string = 'image'): Promise<any> => {
    console.log('🗑️ [UploadService] Deleting file:', { publicId, resourceType });

    try {
      const response = await api.delete('/upload/file', {
        data: { public_id: publicId, resource_type: resourceType }
      });

      console.log('✅ [UploadService] File deleted successfully:', { publicId });
      return response.data;

    } catch (error: any) {
      console.error('❌ [UploadService] File deletion failed:', {
        publicId,
        error: error.response?.data || error.message
      });

      throw new UploadError(
        'Xóa file thất bại', 
        error.response?.status, 
        'DELETE_FAILED', 
        error
      );
    }
  },

  // Helper function để extract upload result
  extractUploadResult: (response: UploadResponse, type: 'image' | 'video' = 'image'): UploadResult => {
    if (type === 'image' && response.image) {
      return response.image;
    } else if (type === 'video' && response.video) {
      return response.video;
    }
    
    throw new UploadError('Không tìm thấy dữ liệu upload trong response', 500, 'INVALID_RESPONSE');
  },

  // Helper function để check server connectivity
  checkServerHealth: async (): Promise<boolean> => {
    try {
      const response = await api.get('/upload/health');
      return response.status === 200;
    } catch (error) {
      console.error('❌ [UploadService] Server health check failed:', error);
      return false;
    }
  }
};