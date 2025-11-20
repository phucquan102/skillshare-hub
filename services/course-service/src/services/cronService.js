const cron = require('node-cron');
const Enrollment = require('../models/Enrollment');

const startCronJobs = () => {
  console.log('🕒 Starting cron jobs for course completion...');
  
  // Chạy mỗi ngày lúc 2:00 AM để kiểm tra khóa học hết hạn
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('🔄 [CRON] Running auto-completion for expired courses...');
      const result = await Enrollment.autoCompleteExpiredCourses();
      console.log(`✅ [CRON] Auto-completed ${result.completedCount} enrollments for ${result.processedCourses} courses`);
    } catch (error) {
      console.error('❌ [CRON] Error in autoCompleteExpiredCourses:', error);
    }
  });
  
  console.log('✅ Cron jobs started successfully');
};

module.exports = { startCronJobs };