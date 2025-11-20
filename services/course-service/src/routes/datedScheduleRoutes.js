const express = require('express');
const router = express.Router();
const datedScheduleController = require('../controllers/datedScheduleController');

// 🆕 Routes cho dated schedules
router.post('/:courseId/schedules', datedScheduleController.createDatedSchedules);
router.get('/:courseId/schedules', datedScheduleController.getDatedSchedules);
router.post('/:courseId/schedules/:scheduleId/lesson', datedScheduleController.createLessonFromDatedSchedule);
router.put('/:courseId/schedules/:scheduleId', datedScheduleController.updateDatedSchedule);
router.delete('/:courseId/schedules/:scheduleId', datedScheduleController.deleteDatedSchedule);
router.patch('/:courseId/settings/dated-scheduling', datedScheduleController.toggleDatedScheduling);
router.get('/:courseId/purchasable-schedules', datedScheduleController.getPurchasableSchedules);

module.exports = router;