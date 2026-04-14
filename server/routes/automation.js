const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/request', requireRole('teacher'), automationController.requestAutomation);
router.get('/pending', requireRole('admin'), automationController.getPendingRequests);
router.put('/:automationId/approve', requireRole('admin'), automationController.approveAutomation);
router.get('/config', requireRole('teacher'), automationController.getTeacherConfig);

// Keywords CRUD
router.get('/keywords', automationController.getKeywords);
router.post('/keywords', automationController.addKeyword);
router.delete('/keywords/:keywordId', automationController.deleteKeyword);
router.put('/keywords/:keywordId/toggle', automationController.toggleKeyword);

module.exports = router;
