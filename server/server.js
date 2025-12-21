const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import routes and models
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const joinRequestRoutes = require('./routes/joinRequests');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const meetingRoutes = require('./routes/meetings');
const messageRoutes = require('./routes/messages');
const resourceRoutes = require('./routes/resources');
const Message = require('./models/Message');
const Project = require('./models/Project');
const User = require('./models/User');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
// Serve uploaded files
app.use('/uploads', express.static('uploads'));
const server = http.createServer(app);

// Increase the timeout for the server
server.timeout = 120000; // 2 minutes

// Configure Express for large file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/synergy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/joinRequests', joinRequestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', resourceRoutes);

// Socket.IO connection handling with JWT authentication
io.on('connection', async (socket) => {
  try {
    // Get token from handshake auth
    const token = socket.handshake.auth.token;
    
    if (!token) {
      socket.emit('error', { message: 'Authentication required' });
      socket.disconnect();
      return;
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      socket.emit('error', { message: 'Invalid or expired token' });
      socket.disconnect();
      return;
    }

    // Get user from database
    const user = await User.findById(decoded.user.id);
    if (!user) {
      socket.emit('error', { message: 'User not found' });
      socket.disconnect();
      return;
    }

    // Get projectId from handshake query
    const { projectId } = socket.handshake.query;
    
    if (!projectId) {
      socket.emit('error', { message: 'Project ID required' });
      socket.disconnect();
      return;
    }

    // Verify user is a member of the project
    const project = await Project.findById(projectId);
    if (!project) {
      socket.emit('error', { message: 'Project not found' });
      socket.disconnect();
      return;
    }

    // Check if user is member or creator
    if (!project.members.includes(user.email) && project.creatorEmail !== user.email) {
      socket.emit('error', { message: 'Not authorized to access this project chat' });
      socket.disconnect();
      return;
    }

    // Store user info in socket for later use
    socket.userId = user._id.toString();
    socket.userEmail = user.email;
    socket.username = user.name;
    socket.projectId = projectId;
  
    // Join a room specific to the project
    socket.join(projectId);
  
    // Send confirmation of connection
    socket.emit('connected', { 
      message: 'Successfully connected to chat',
      userId: socket.userId,
      username: socket.username,
      projectId: socket.projectId
    });

    socket.on('message', async (messageData, callback) => {
      try {
        // Use authenticated user info from socket (not from client)
        const newMessage = new Message({
          projectId: socket.projectId,
          userId: socket.userId,
          username: socket.username,
          content: messageData.content,
          timestamp: new Date()
        });
      
        // Save to database
        const savedMessage = await newMessage.save();
      
        // Prepare message for sending
        const messageToSend = {
          _id: savedMessage._id.toString(),
          projectId: savedMessage.projectId,
          userId: savedMessage.userId,
          username: savedMessage.username,
          content: savedMessage.content,
          timestamp: savedMessage.timestamp.toISOString()
        };
      
        // Broadcast to all clients in the room
        io.to(socket.projectId).emit('message', messageToSend);
      
        // Send acknowledgment
        if (callback) callback({ success: true, messageId: savedMessage._id });
      } catch (error) {
        console.error('Error handling message:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('disconnect', (reason) => {
      socket.leave(socket.projectId);
      // Notify others in the room that a user disconnected
      socket.to(socket.projectId).emit('user_left', { 
        userId: socket.userId, 
        username: socket.username,
        timestamp: new Date().toISOString() 
      });
    });

  } catch (error) {
    console.error('Socket connection error:', error);
    socket.emit('error', { message: 'Connection failed' });
    socket.disconnect();
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Synergy Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND'
  });
});

// Centralized error handling middleware (must be last)
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.IO server is ready`);
});