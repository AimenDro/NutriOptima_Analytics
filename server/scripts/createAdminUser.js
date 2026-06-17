const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');
require('dotenv').config();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if any admin users exist
    const existingAdmin = await AdminUser.findOne();
    if (existingAdmin) {
      console.log('Admin user already exists. Exiting...');
      process.exit(0);
    }

    // Create super admin user
    const adminData = {
      email: 'admin@nutrioptima.com',
      passwordHash: 'admin123', // Will be hashed by pre-save middleware
      role: 'super_admin',
      permissions: [], // Super admin gets all permissions
      isActive: true
    };

    const admin = new AdminUser(adminData);
    await admin.save();

    console.log('✅ Super admin user created successfully!');
    console.log('Email: admin@nutrioptima.com');
    console.log('Password: admin123');
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  createAdminUser();
}

module.exports = createAdminUser;