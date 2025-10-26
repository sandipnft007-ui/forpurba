// server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// --- Cloudinary Configuration ---
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true
});

// Multer setup: In-memory storage for file processing
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 10 * 1024 * 1024 // 10MB limit for safety
    }
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- Upload Route ---
app.post('/upload', upload.single('mediaFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    try {
        // Convert the buffer to a base64 string
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        // Determine resource type and folder based on MIME type
        let resourceType = req.file.mimetype.startsWith('image/') ? 'image' : 
                           req.file.mimetype.startsWith('audio/') ? 'video' : 'auto'; // Cloudinary handles audio as 'video' resource type

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: resourceType,
            folder: "purba_creation_uploads",
            // For audio, we can transform it to 'video' for better handling
            // For images, we can add auto-quality and format
            transformation: resourceType === 'image' ? { quality: "auto", fetch_format: "auto" } : undefined
        });

        // Success response with the public URL
        res.status(200).json({ 
            success: true, 
            publicUrl: result.secure_url, 
            resourceType: resourceType,
            message: `${resourceType} uploaded successfully to Cloudinary!` 
        });

    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'File upload failed due to server error.', 
            error: error.message 
        });
    }
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log(`Open http://localhost:${port}/index.html in your browser.`);
});