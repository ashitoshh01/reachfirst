const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', groupController.createGroup);
router.post('/teachers', groupController.createTeacherGroup);
router.get('/', groupController.getUserGroups);
router.get('/my-class-groups', groupController.getMyClassGroups);
router.get('/:groupId', groupController.getGroupDetails);
router.post('/:groupId/members', groupController.addMember);
router.put('/:groupId/read', groupController.markGroupAsRead);
router.delete('/:groupId/members/:userId', groupController.removeMember);
router.put('/:groupId/members/:userId/admin', groupController.makeAdmin);
router.put('/:groupId/members/:userId/cr', groupController.makeCR);
router.delete('/:groupId/members/:userId/admin', groupController.removeAdmin);
router.delete('/:groupId', groupController.deleteGroup);
router.post('/:groupId/messages', groupController.sendGroupMessage);
router.get('/:groupId/messages', groupController.getGroupMessages);

// Automation routes
router.put('/:groupId/automation', groupController.toggleAutomation);
router.post('/:groupId/automation-preview', groupController.previewAutomation);
router.put('/:groupId/class-group', groupController.setClassGroup);
router.delete('/:groupId/class-group', groupController.unsetClassGroup);

module.exports = router;
