const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/synergy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
  clearDatabase();
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function clearDatabase() {
  try {
    // Import all models
    const Project = require('./models/Project');
    const JoinRequest = require('./models/JoinRequest');
    const User = require('./models/User');
    const Task = require('./models/Task');
    const Meeting = require('./models/Meeting');
    const Message = require('./models/Message');
    const Resource = require('./models/Resource');

    console.log('🗑️  Starting database cleanup...');

    // Delete all users
    const usersDeleted = await User.deleteMany({});
    console.log(`👤 Deleted ${usersDeleted.deletedCount} users`);

    // Delete all projects
    const projectsDeleted = await Project.deleteMany({});
    console.log(`📦 Deleted ${projectsDeleted.deletedCount} projects`);

    // Delete all join requests
    const joinRequestsDeleted = await JoinRequest.deleteMany({});
    console.log(`📨 Deleted ${joinRequestsDeleted.deletedCount} join requests`);

    // Delete all tasks
    const tasksDeleted = await Task.deleteMany({});
    console.log(`✅ Deleted ${tasksDeleted.deletedCount} tasks`);

    // Delete all meetings
    const meetingsDeleted = await Meeting.deleteMany({});
    console.log(`📅 Deleted ${meetingsDeleted.deletedCount} meetings`);

    // Delete all messages
    const messagesDeleted = await Message.deleteMany({});
    console.log(`💬 Deleted ${messagesDeleted.deletedCount} messages`);

    // Delete all resources
    const resourcesDeleted = await Resource.deleteMany({});
    console.log(`📎 Deleted ${resourcesDeleted.deletedCount} resources`);

    console.log('✅ Database cleanup completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Users removed: ${usersDeleted.deletedCount}`);
    console.log(`   - Projects removed: ${projectsDeleted.deletedCount}`);
    console.log(`   - Join requests removed: ${joinRequestsDeleted.deletedCount}`);
    console.log(`   - Tasks removed: ${tasksDeleted.deletedCount}`);
    console.log(`   - Meetings removed: ${meetingsDeleted.deletedCount}`);
    console.log(`   - Messages removed: ${messagesDeleted.deletedCount}`);
    console.log(`   - Resources removed: ${resourcesDeleted.deletedCount}`);

    // Close the connection
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Process interrupted');
  mongoose.connection.close();
  process.exit(0);
});