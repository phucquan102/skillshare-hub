// services/course-service/src/controllers/uploadController.js
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

const uploadController = {
  // Upload single image
  uploadImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Không có file được upload' });
      }

      const result = await uploadToCloudinary(req.file.buffer, 'courses', 'image');

      res.json({
        message: 'Upload ảnh thành công',
        image: {
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          resource_type: result.resource_type,
          bytes: result.bytes
        }
      });
    } catch (error) {
      console.error('Upload image error:', error);
      res.status(500).json({ 
        message: 'Lỗi server khi upload ảnh',
        error: error.message 
      });
    }
  },

  // Upload multiple images
  uploadMultipleImages: async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Không có files được upload' });
      }

      const uploadPromises = req.files.map(file => 
        uploadToCloudinary(file.buffer, 'courses', 'image')
      );

      const results = await Promise.all(uploadPromises);

      const images = results.map(result => ({
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes
      }));

      res.json({
        message: `Upload ${images.length} ảnh thành công`,
        images
      });
    } catch (error) {
      console.error('Upload multiple images error:', error);
      res.status(500).json({ 
        message: 'Lỗi server khi upload ảnh',
        error: error.message 
      });
    }
  },

  // Upload video
  uploadVideo: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Không có video được upload' });
      }

      // Kiểm tra định dạng video
      const videoFormats = ['mp4', 'mov', 'avi', 'webm'];
      const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
      if (!videoFormats.includes(fileExtension)) {
        return res.status(400).json({ 
          message: 'Định dạng video không hợp lệ. Chấp nhận: MP4, MOV, AVI, WEBM' 
        });
      }

      const result = await uploadToCloudinary(req.file.buffer, 'courses/videos', 'video');

      res.json({
        message: 'Upload video thành công',
        video: {
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          resource_type: result.resource_type,
          bytes: result.bytes,
          duration: result.duration
        }
      });
    } catch (error) {
      console.error('Upload video error:', error);
      res.status(500).json({ 
        message: 'Lỗi server khi upload video',
        error: error.message 
      });
    }
  },

  // Delete file from Cloudinary
  deleteFile: async (req, res) => {
    try {
      const { public_id, resource_type = 'image' } = req.body;

      if (!public_id) {
        return res.status(400).json({ message: 'Thiếu public_id' });
      }

      const result = await deleteFromCloudinary(public_id, resource_type);

      if (result.result === 'ok') {
        res.json({ message: 'Xóa file thành công', result });
      } else {
        res.status(404).json({ message: 'Không tìm thấy file để xóa' });
      }
    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({ 
        message: 'Lỗi server khi xóa file',
        error: error.message 
      });
    }
  }
};

module.exports = uploadController;