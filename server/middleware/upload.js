const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Cloudinary automatically picks up the CLOUDINARY_URL from your .env file
cloudinary.config(true); // true tells it to pull from env

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let resource_type = 'auto'; // default

        // Explicitly handle PDFs and Documents as 'raw' to prevent 401 Unauthorized delivery issues
        if (
            file.mimetype === 'application/pdf' ||
            file.mimetype.includes('document') ||
            file.mimetype.includes('msword') ||
            file.mimetype.includes('spreadsheet') ||
            file.mimetype.includes('csv')
        ) {
            resource_type = 'raw';
        } else if (file.mimetype.startsWith('video/')) {
            resource_type = 'video';
        } else if (file.mimetype.startsWith('image/')) {
            resource_type = 'image';
        }

        // Clean original filename to use as public_id (preserves name for downloads)
        // Remove extension and replace special characters with underscores
        const parts = file.originalname.split('.');
        const ext = parts.length > 1 ? `.${parts.pop()}` : '';
        const originalNameWithoutExt = parts.join('.').replace(/[^a-zA-Z0-9]/g, '_');
        const safeName = originalNameWithoutExt || 'file';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

        // For raw files, Cloudinary requires the extension in the public_id to serve it correctly
        let finalPublicId = `${safeName}_${uniqueSuffix}`;
        if (resource_type === 'raw') {
            finalPublicId += ext;
        }

        return {
            folder: 'reachfirst_uploads',
            resource_type: resource_type,
            public_id: finalPublicId,
            // allowed_formats is omitted to allow 'raw' to work dynamically
        };
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

module.exports = upload;
