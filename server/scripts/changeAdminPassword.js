const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const NEW_PASSWORD = 'Admin@2026'; // change this to whatever you want

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const AdminUser = require('../models/AdminUser');
  const admin = await AdminUser.findOne({ email: 'admin@nutrioptima.com' });

  if (!admin) {
    console.log('❌ Admin user not found');
    process.exit(1);
  }

  const hash = await bcrypt.hash(NEW_PASSWORD, 12);
  await AdminUser.updateOne({ _id: admin._id }, { $set: { password: hash } });

  console.log('✅ Admin password changed successfully');
  console.log('   Email:   ', admin.email);
  console.log('   Password:', NEW_PASSWORD);
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
