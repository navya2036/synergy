const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const auth = require('../middleware/auth');
const Resource = require('../models/Resource');
const Project = require('../models/Project');
const User = require('../models/User');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'synergy-resources',
    resource_type: 'raw', // For non-image files like PDFs
    allowed_formats: ['pdf'],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const filename = file.originalname.replace(/\s+/g, '-').replace(/\.pdf$/i, '');
      return `${timestamp}-${filename}`;
    }
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if it's actually a PDF
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// Get all resources for a project
router.get('/projects/:projectId/resources', auth, async (req, res) => {
  try {
    // Get user details
    const user = await User.findById(req.user.id || req.user.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Get the project
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Get all resources for the project
    const resources = await Resource.find({ projectId: req.params.projectId })
      .populate('uploadedBy', 'name email');
    
    res.json(resources);
  } catch (err) {
    console.error('Error fetching resources:', err);
    res.status(500).json({ msg: 'Failed to load resources', error: err.message });
  }
});

// Upload a resource
router.post('/projects/:projectId/resources', auth, async (req, res, next) => {
  try {
    // Get user details
    const user = await User.findById(req.user.id || req.user.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if user is a team member before processing the upload
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user is a team member
    const isMember = project.members.includes(user.email) ||
                    project.creatorEmail === user.email;

    if (!isMember) {
      return res.status(403).json({ msg: 'Access denied. Only team members can upload resources.' });
    }

    // Continue with upload if user is a team member
    const uploadMiddleware = upload.single('file');
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.error('Multer upload error:', err);
        
        if (err.message === 'Only PDF files are allowed!') {
          return res.status(400).json({ msg: err.message });
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ msg: 'File size must be less than 10MB' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ msg: 'Missing file upload field or wrong field name' });
        }
        return res.status(400).json({ msg: `Error uploading file: ${err.message}` });
      }

      if (!req.file) {
        console.error('No file found in request');
        return res.status(400).json({ msg: 'No file uploaded' });
      }

      const uploadedFile = req.file;

      try {
        const newResource = new Resource({
          projectId: req.params.projectId,
          name: uploadedFile.originalname,
          fileUrl: uploadedFile.path, // Cloudinary URL
          uploadedBy: user._id,
          fileType: uploadedFile.mimetype,
          fileSize: uploadedFile.size
        });

        const resource = await newResource.save();
        
        res.json({
          msg: 'File uploaded successfully',
          resource: {
            _id: resource._id,
            name: resource.name,
            fileUrl: resource.fileUrl,
            uploadedBy: user.name,
            uploadDate: resource.createdAt,
            fileSize: resource.fileSize
          }
        });
      } catch (saveErr) {
        console.error('Error saving resource:', saveErr);
        res.status(500).json({ msg: 'Error saving file information to database' });
      }
    });
  } catch (err) {
    console.error('Error uploading resource:', err);
    res.status(500).send('Server Error');
  }
});

// Download a resource
router.get('/resources/:id/download', auth, async (req, res) => {
  try {
    // Get user details
    const user = await User.findById(req.user.id || req.user.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ msg: 'Resource not found' });
    }

    // Get the project to check if user is a member
    const project = await Project.findById(resource.projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Redirect to Cloudinary URL for download
    // Add fl_attachment flag to force download instead of viewing in browser
    const downloadUrl = resource.fileUrl.replace('/upload/', '/upload/fl_attachment/');
    res.redirect(downloadUrl);
  } catch (err) {
    console.error('Error downloading resource:', err);
    res.status(500).send('Server Error');
  }
});

// Delete a resource
router.delete('/resources/:id', auth, async (req, res) => {
  try {
    // Get user details
    const user = await User.findById(req.user.id || req.user.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ msg: 'Resource not found' });
    }

    // Get the project to check if user is a member
    const project = await Project.findById(resource.projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user is a team member (members array contains email strings)
    const isMember = project.members.includes(user.email) ||
                    project.creatorEmail === user.email;

    if (!isMember) {
      return res.status(403).json({ msg: 'Access denied. Only team members can delete resources.' });
    }

    // Delete file from Cloudinary
    try {
      // Extract public_id from Cloudinary URL
      const urlParts = resource.fileUrl.split('/');
      const publicIdWithExt = urlParts.slice(-2).join('/');
      const publicId = publicIdWithExt.replace('.pdf', '');
      
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    } catch (cloudinaryErr) {
      console.error('Error deleting file from Cloudinary:', cloudinaryErr);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Delete from database
    await Resource.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Resource deleted' });
  } catch (err) {
    console.error('Error deleting resource:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;