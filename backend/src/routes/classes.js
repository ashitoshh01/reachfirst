const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', requireRole('admin'), classController.createClass);
router.get('/', classController.getAllClasses);
router.post('/:classId/cr', requireRole('admin'), classController.assignCR);
router.get('/:classId/crs', classController.getClassCRs);

module.exports = router;
