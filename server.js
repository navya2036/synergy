const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/synergy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  college: { type: String, required: true },
  education: { type: String, required: true },
  skills: [String],
  about: { type: String, required: true },
  projectsDone: [String],
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Project Schema
const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  skills: [String],
  creator: { type: String, required: true },
  creatorEmail: { type: String, required: true },
  members: [String],
  timeline: String,
  maxMembers: { type: Number, default: 5 },
  status: { type: String, enum: ['active', 'paused', 'completed', 'cancelled'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', projectSchema);

// JoinRequest Schema
const joinRequestSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  projectTitle: { type: String, required: true },
  requesterEmail: { type: String, required: true },
  requesterName: { type: String, required: true },
  projectOwnerEmail: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const JoinRequest = mongoose.model('JoinRequest', joinRequestSchema);

// Routes
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get projects by user (created by user and joined by user)
app.get('/api/projects/user/:email', async (req, res) => {
  try {
    const userEmail = req.params.email;
    
    // Find projects created by the user
    const createdProjects = await Project.find({ 
      creatorEmail: userEmail 
    }).sort({ createdAt: -1 });
    
    // Find projects where user is a member but not the creator
    const joinedProjects = await Project.find({
      members: userEmail,
      creatorEmail: { $ne: userEmail }
    }).sort({ createdAt: -1 });
    
    res.json({
      created: createdProjects,
      joined: joinedProjects
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Join a project
app.post('/api/projects/:id/join', async (req, res) => {
  try {
    const projectId = req.params.id;
    const { userEmail, userName } = req.body;
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if project is full
    if (project.members.length >= project.maxMembers) {
      return res.status(400).json({ message: 'Project is full' });
    }
    
    // Check if user is already a member
    if (project.members.includes(userEmail)) {
      return res.status(400).json({ message: 'You are already a member of this project' });
    }
    
    // Add user to members
    project.members.push(userEmail);
    await project.save();
    
    res.json({ message: 'Successfully joined the project', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single project by ID
app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
const sendOTPEmail = async (email, otp, name) => {
  // For development: log OTP to console if email is not configured properly
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
      process.env.EMAIL_PASS === 'your-app-password' || 
      process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.log(`\n🔐 OTP for ${email}: ${otp}`);
    console.log(`User: ${name}`);
    console.log(`Copy this OTP to verify the account\n`);
    return true; // Return success for development
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email - Synergy Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Synergy Platform!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for signing up! Please use the following OTP to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't create an account with us, please ignore this email.</p>
        <p>Best regards,<br>Synergy Platform Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.log(`\n🔐 FALLBACK - OTP for ${email}: ${otp}`);
    console.log(`User: ${name}`);
    console.log(`Email failed, but you can use this OTP to verify the account\n`);
    return true; // Return success even if email fails, so user can still use OTP from console
  }
};

// Send Join Request Notification Email
const sendJoinRequestEmail = async (ownerEmail, ownerName, projectTitle, requesterName, requesterEmail, message) => {
  // For development: log notification to console if email is not configured properly
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
      process.env.EMAIL_PASS === 'your-app-password' || 
      process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.log(`\n📧 JOIN REQUEST NOTIFICATION:`);
    console.log(`To: ${ownerEmail} (${ownerName})`);
    console.log(`Project: ${projectTitle}`);
    console.log(`From: ${requesterName} (${requesterEmail})`);
    console.log(`Message: ${message}`);
    console.log(`Check your project dashboard to approve/reject this request\n`);
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: ownerEmail,
    subject: `New Join Request for "${projectTitle}" - Synergy Platform`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Join Request for Your Project!</h2>
        <p>Hi ${ownerName},</p>
        <p>You have received a new join request for your project <strong>"${projectTitle}"</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">Request Details:</h3>
          <p><strong>From:</strong> ${requesterName}</p>
          <p><strong>Email:</strong> ${requesterEmail}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #007bff;">
            ${message}
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p>Please log in to your Synergy dashboard to review and respond to this request.</p>
          <a href="http://localhost:3000" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Review Request
          </a>
        </div>
        
        <p>Best regards,<br>Synergy Platform Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Join request notification sent to ${ownerEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending join request email:', error.message);
    console.log(`\n📧 FALLBACK - Join request notification for ${ownerEmail}:`);
    console.log(`Project: ${projectTitle}, From: ${requesterName}, Message: ${message}\n`);
    return true;
  }
};

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, college, education, skills, about, projectsDone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      college,
      education,
      skills: skills || [],
      about,
      projectsDone: projectsDone || [],
      otp,
      otpExpires
    });

    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, name);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.status(201).json({ 
      message: 'User registered successfully. Please check your email for OTP verification.',
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        education: user.education,
        skills: user.skills,
        about: user.about,
        projectsDone: user.projectsDone
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email first' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        education: user.education,
        skills: user.skills,
        about: user.about,
        projectsDone: user.projectsDone
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const emailSent = await sendOTPEmail(user.email, otp, user.name);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send join request
app.post('/api/projects/:id/request-join', async (req, res) => {
  console.log('🚀 Join request received:');
  console.log('Project ID:', req.params.id);
  console.log('Request body:', req.body);
  
  try {
    const projectId = req.params.id;
    const { userEmail, userName, message } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is already a member
    if (project.members.includes(userEmail)) {
      return res.status(400).json({ message: 'You are already a member of this project' });
    }
    
    // Check if user is the creator
    if (project.creatorEmail === userEmail) {
      return res.status(400).json({ message: 'You cannot send a join request to your own project' });
    }
    
    // Check if there's already a pending request
    const existingRequest = await JoinRequest.findOne({
      projectId,
      requesterEmail: userEmail,
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request for this project' });
    }
    
    // Get the project owner's details for email notification
    const projectOwner = await User.findOne({ email: project.creatorEmail });
    const ownerName = projectOwner ? projectOwner.name : project.creator;
    
    // Create join request
    const joinRequest = new JoinRequest({
      projectId,
      projectTitle: project.title,
      requesterEmail: userEmail,
      requesterName: userName,
      projectOwnerEmail: project.creatorEmail,
      message: message || ''
    });
    
    await joinRequest.save();
    
    // Send email notification to project owner
    try {
      await sendJoinRequestEmail(
        project.creatorEmail,
        ownerName,
        project.title,
        userName,
        userEmail,
        message || 'No message provided'
      );
      console.log(`📧 Join request notification sent to ${project.creatorEmail}`);
    } catch (emailError) {
      console.error('❌ Failed to send join request email, but request was saved:', emailError.message);
      // Don't fail the request if email fails
    }
    
    res.status(201).json({ message: 'Join request sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get join requests for a project
app.get('/api/projects/:id/requests', async (req, res) => {
  try {
    const projectId = req.params.id;
    const requests = await JoinRequest.find({ projectId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept/Reject join request
app.put('/api/join-requests/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { status } = req.body; // 'accepted' or 'rejected'
    
    const joinRequest = await JoinRequest.findById(requestId);
    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }
    
    joinRequest.status = status;
    await joinRequest.save();
    
    // If accepted, add user to project members
    if (status === 'accepted') {
      const project = await Project.findById(joinRequest.projectId);
      if (project && !project.members.includes(joinRequest.requesterEmail)) {
        project.members.push(joinRequest.requesterEmail);
        await project.save();
      }
    }
    
    res.json({ message: `Join request ${status} successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update project status
app.put('/api/projects/:id/status', async (req, res) => {
  try {
    const projectId = req.params.id;
    const { status } = req.body;
    
    const validStatuses = ['active', 'paused', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const project = await Project.findByIdAndUpdate(
      projectId,
      { status },
      { new: true }
    );
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json({ success: true, message: 'Project status updated successfully', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
