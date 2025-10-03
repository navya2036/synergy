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
    // Import the models
    const Project = require('./models/Project');
    const JoinRequest = require('./models/JoinRequest');

    console.log('🗑️  Starting database cleanup...');

    // Delete all projects
    const projectsDeleted = await Project.deleteMany({});
    console.log(`📦 Deleted ${projectsDeleted.deletedCount} projects`);

    // Delete all join requests
    const joinRequestsDeleted = await JoinRequest.deleteMany({});
    console.log(`📨 Deleted ${joinRequestsDeleted.deletedCount} join requests`);

    console.log('✅ Database cleanup completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Projects removed: ${projectsDeleted.deletedCount}`);
    console.log(`   - Join requests removed: ${joinRequestsDeleted.deletedCount}`);

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