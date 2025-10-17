const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import routes and models
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const joinRequestRoutes = require('./routes/joinRequests');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const meetingRoutes = require('./routes/meetings');
const messageRoutes = require('./routes/messages');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

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
app.use(express.json());

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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New socket connection established');
  
  const { projectId, userId } = socket.handshake.query;
  console.log('Connection params:', { projectId, userId });
  
  if (!projectId || !userId) {
    console.error('Missing projectId or userId in connection');
    socket.disconnect();
    return;
  }
  
  // Join a room specific to the project
  socket.join(projectId);
  console.log(`User ${userId} connected to project ${projectId}`);
  
  // Send confirmation of connection
  socket.emit('connected', { 
    message: 'Successfully connected to chat',
    userId,
    projectId
  });

  socket.on('message', async (messageData, callback) => {
    try {
      console.log('Received message from client:', messageData);
      
      // Create new message
      const newMessage = new Message({
        projectId: messageData.projectId,
        userId: messageData.userId,
        username: messageData.username,
        content: messageData.content,
        timestamp: new Date()
      });
      
      // Save to database
      const savedMessage = await newMessage.save();
      console.log('Message saved:', savedMessage);
      
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
      io.to(projectId).emit('message', messageToSend);
      console.log('Message broadcast to room:', projectId);
      
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
    console.log(`User ${userId} disconnected from project ${projectId}. Reason: ${reason}`);
    socket.leave(projectId);
    // Notify others in the room that a user disconnected
    socket.to(projectId).emit('user_left', { userId, timestamp: new Date().toISOString() });
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Synergy Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.IO server is ready`);
});