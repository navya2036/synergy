const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const Resource = require('../models/Resource');
const Project = require('../models/Project');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    console.log('Upload directory:', uploadDir);
    try {
      if (!fs.existsSync(uploadDir)) {
        console.log('Creating uploads directory');
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Uploads directory created successfully');
      }
      // Check if directory is writable
      fs.accessSync(uploadDir, fs.constants.W_OK);
      console.log('Upload directory is writable');
      cb(null, uploadDir);
    } catch (err) {
      console.error('Error with upload directory:', err);
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    const fileName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    console.log('Generated filename:', fileName);
    cb(null, fileName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('Received file:', file.originalname, 'Mimetype:', file.mimetype);
    
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
    console.log('Fetching resources for project:', req.params.projectId);
    console.log('Auth user data:', req.user);

    // Get user details
    const user = await User.findById(req.user.id || req.user.userId);
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ msg: 'User not found' });
    }
    console.log('User found:', user.email);

    // Get the project
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      console.log('Project not found:', req.params.projectId);
      return res.status(404).json({ msg: 'Project not found' });
    }
    console.log('Project found:', project.title);

    // Get all resources for the project
    const resources = await Resource.find({ projectId: req.params.projectId })
      .populate('uploadedBy', 'name email');
    
    console.log('Resources found:', resources.length);
    res.json(resources);
  } catch (err) {
    console.error('Error fetching resources:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ msg: 'Failed to load resources', error: err.message });
  }
});

// Upload a resource
router.post('/projects/:projectId/resources', auth, async (req, res, next) => {
  try {
    console.log('Starting file upload process...');
    console.log('Auth token user:', req.user);
    
    // Get user details
    const user = await User.findById(req.user.id || req.user.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    console.log('User found:', user.email);

    // Check if user is a team member before processing the upload
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    console.log('Project found:', project._id);

    // Check if user is a team member
    const isMember = project.members.includes(user.email) ||
                    project.creatorEmail === user.email;
    console.log('Team member check:', {
      userEmail: user.email,
      isCreator: project.creatorEmail === user.email,
      isMember: project.members.includes(user.email),
      members: project.members
    });

    if (!isMember) {
      return res.status(403).json({ msg: 'Access denied. Only team members can upload resources.' });
    }

    // Continue with upload if user is a team member
    const uploadMiddleware = upload.single('file');
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.error('Multer upload error:', err);
        console.error('Error details:', {
          code: err.code,
          message: err.message,
          field: err.field,
          storageError: err.storageErrors
        });
        
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
      console.log('File received:', uploadedFile);

      try {
        console.log('Creating resource document...');
        const newResource = new Resource({
          projectId: req.params.projectId,
          name: uploadedFile.originalname,
          fileUrl: uploadedFile.path,
          uploadedBy: user._id,
          fileType: uploadedFile.mimetype,
          fileSize: uploadedFile.size
        });

        console.log('Saving resource to database...');
        const resource = await newResource.save();
        console.log('Resource saved successfully:', resource._id);
        
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
    console.log('Download request for resource:', req.params.id);
    // Get user details
    const user = await User.findById(req.user.id || req.user.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    console.log('User authorized:', user.email);

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      console.log('Resource not found:', req.params.id);
      return res.status(404).json({ msg: 'Resource not found' });
    }
    console.log('Resource found:', resource.name);

    // Get the project to check if user is a member
    const project = await Project.findById(resource.projectId);
    if (!project) {
      console.log('Project not found:', resource.projectId);
      return res.status(404).json({ msg: 'Project not found' });
    }
    console.log('Project found:', project._id);

    // Everyone can download resources
    console.log('Download authorized for user:', user.email);

    // Check if file exists
    if (!fs.existsSync(resource.fileUrl)) {
      console.error('File not found on disk:', resource.fileUrl);
      return res.status(404).json({ msg: 'File not found on server' });
    }

    console.log('Sending file:', resource.fileUrl);
    res.download(resource.fileUrl, resource.name, (err) => {
      if (err) {
        console.error('Error during file download:', err);
        // Only send error if headers haven't been sent yet
        if (!res.headersSent) {
          res.status(500).json({ msg: 'Error downloading file' });
        }
      }
    });
  } catch (err) {
    console.error('Error downloading resource:', err);
    res.status(500).send('Server Error');
  }
});

// Delete a resource
router.delete('/resources/:id', auth, async (req, res) => {
  try {
    console.log('Delete request for resource:', req.params.id);
    // Get user details
    const user = await User.findById(req.user.id || req.user.userId);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ msg: 'User not found' });
    }
    console.log('User authorized:', user.email);

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      console.log('Resource not found:', req.params.id);
      return res.status(404).json({ msg: 'Resource not found' });
    }
    console.log('Resource found:', resource.name);

    // Get the project to check if user is a member
    const project = await Project.findById(resource.projectId);
    if (!project) {
      console.log('Project not found:', resource.projectId);
      return res.status(404).json({ msg: 'Project not found' });
    }
    console.log('Project found:', project._id);

    // Check if user is a team member
    const isMember = project.members.some(member => member.email === user.email) ||
                    project.creatorEmail === user.email;

    if (!isMember) {
      console.log('Access denied for user:', user.email);
      return res.status(403).json({ msg: 'Access denied. Only team members can delete resources.' });
    }

    // Delete file from filesystem
    try {
      if (fs.existsSync(resource.fileUrl)) {
        await fs.promises.unlink(resource.fileUrl);
        console.log('File deleted from filesystem:', resource.fileUrl);
      } else {
        console.log('File not found on filesystem:', resource.fileUrl);
      }
    } catch (fsErr) {
      console.error('Error deleting file from filesystem:', fsErr);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await Resource.findByIdAndDelete(req.params.id);
    console.log('Resource deleted from database');
    res.json({ msg: 'Resource deleted' });
  } catch (err) {
    console.error('Error deleting resource:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;