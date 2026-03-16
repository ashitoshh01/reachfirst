const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', groupController.createGroup);
router.get('/', groupController.getUserGroups);
router.get('/:groupId', groupController.getGroupDetails);
router.post('/:groupId/members', groupController.addMember);
router.delete('/:groupId/members/:userId', groupController.removeMember);
router.delete('/:groupId', groupController.deleteGroup);
router.post('/:groupId/messages', groupController.sendGroupMessage);
router.get('/:groupId/messages', groupController.getGroupMessages);

module.exports = router;
