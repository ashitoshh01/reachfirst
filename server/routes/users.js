const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/search', userController.findByEmail);
router.put('/me', userController.updateProfile);
router.delete('/me', userController.deleteAccount);
router.get('/:id', userController.getUserDetails);

module.exports = router;
