import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';
import User from './models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/student-management-system');
    
    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      existingAdmin.password = 'Admin@123';
      await existingAdmin.save();
      console.log('Admin already exists. Password updated.');
    } else {
      await Admin.create({
        email: 'admin@gmail.com',
        password: 'Admin@123',
      });
      console.log('Admin created successfully in Admin table.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
