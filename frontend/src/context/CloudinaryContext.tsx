// src/context/CloudinaryContext.tsx
import React from 'react';
import { Cloudinary } from '@cloudinary/url-gen';

// Tạo Cloudinary instance
const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'your_cloud_name'
  }
});

export const CloudinaryContext = React.createContext(cld);

export const CloudinaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <CloudinaryContext.Provider value={cld}>
      {children}
    </CloudinaryContext.Provider>
  );
};