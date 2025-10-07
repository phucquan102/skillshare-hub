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

export const uploadService = {
  // Upload single image
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });

    return response.data;
  },

  // Upload multiple images
  uploadMultipleImages: async (files: File[]): Promise<UploadResponse> => {
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

    return response.data;
  },

  // Upload video
  uploadVideo: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('video', file);

    const response = await api.post('/upload/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000,
    });

    return response.data;
  },

  // Delete file
  deleteFile: async (publicId: string, resourceType: string = 'image'): Promise<any> => {
    const response = await api.delete('/upload/file', {
      data: { public_id: publicId, resource_type: resourceType }
    });
    return response.data;
  }
};