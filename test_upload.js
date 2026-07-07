require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');

cloudinary.config(true);

async function runTest() {
    console.log('--- STARTING AUDIT ---');
    
    // 1. Create a minimal valid PDF
    const pdfContent = Buffer.from(
        '%PDF-1.4\n' +
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n' +
        '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n' +
        '5 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Hello, World!) Tj\nET\nendstream\nendobj\n' +
        'xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000223 00000 n \n0000000311 00000 n \n' +
        'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n405\n%%EOF',
        'utf8'
    );
    
    const origHash = crypto.createHash('sha256').update(pdfContent).digest('hex');
    console.log('Original PDF size:', pdfContent.length, 'bytes');
    console.log('Original PDF SHA-256:', origHash);
    
    const params = {
        folder: 'reachfirst_uploads',
        resource_type: 'raw',
        public_id: 'test_pdf_' + Date.now() + '.pdf'
    };

    console.log('Uploading with params:', params);

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(params, async (error, result) => {
            if (error) {
                console.error('Cloudinary Upload Error:', error);
                return reject(error);
            }
            
            console.log('\n--- UPLOAD RESPONSE ---');
            console.log(JSON.stringify(result, null, 2));
            
            console.log('\n--- DOWNLOADING ---');
            console.log('Fetching:', result.secure_url);
            
            try {
                const response = await axios.get(result.secure_url, { responseType: 'arraybuffer' });
                console.log('Status:', response.status);
                console.log('Content-Type:', response.headers['content-type']);
                console.log('Content-Length:', response.headers['content-length']);
                
                const downloadedBuffer = response.data;
                const downHash = crypto.createHash('sha256').update(downloadedBuffer).digest('hex');
                console.log('Downloaded size:', downloadedBuffer.length, 'bytes');
                console.log('Downloaded SHA-256:', downHash);
                
                if (origHash === downHash) {
                    console.log('✅ HASHES MATCH. File is intact.');
                } else {
                    console.log('❌ HASHES DO NOT MATCH. Corruption detected.');
                }
                
                // Let's also check the first 5 bytes
                console.log('First 5 bytes downloaded:', downloadedBuffer.slice(0, 5).toString());
                
            } catch (err) {
                console.error('Download error:', err.message);
                if (err.response) {
                    console.error('Status:', err.response.status);
                    console.error('Headers:', err.response.headers);
                }
            }
            resolve();
        });
        
        stream.end(pdfContent);
    });
}

runTest().catch(console.error);
