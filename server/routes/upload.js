const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a file' });
        }

        console.log('[Upload Debug] Cloudinary req.file:', JSON.stringify(req.file, null, 2));

        // For Cloudinary, the URL is provided in req.file.path or req.file.secure_url
        // We prioritize secure_url to ensure HTTPS, avoiding mixed content or redirect issues
        const fileUrl = req.file.secure_url || req.file.path;

        res.json({
            message: 'File uploaded successfully',
            url: fileUrl,
            metadata: {
                resource_type: req.file.resource_type,
                format: req.file.format,
                original_name: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('[Upload Debug] Upload error:', error);
        res.status(500).json({ error: 'Server error during upload', details: error.message });
    }
});

module.exports = router;
