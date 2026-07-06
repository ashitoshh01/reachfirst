const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Cloudinary automatically picks up the CLOUDINARY_URL from your .env file
cloudinary.config(true); // true tells it to pull from env

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'reachfirst_uploads', // You can change this folder name if you want
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'mp4', 'docx', 'doc'], 
        // If you need more formats, add them above
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

module.exports = upload;
