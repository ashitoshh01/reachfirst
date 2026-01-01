const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/request', requireRole('teacher'), automationController.requestAutomation);
router.get('/pending', requireRole('admin'), automationController.getPendingRequests);
router.put('/:automationId/approve', requireRole('admin'), automationController.approveAutomation);
router.get('/config', requireRole('teacher'), automationController.getTeacherConfig);
router.get('/keywords', automationController.getKeywords);
router.post('/keywords', requireRole('admin'), automationController.addKeyword);

module.exports = router;
