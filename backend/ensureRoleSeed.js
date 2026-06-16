import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';
import User from './models/User.js';
import Teacher from './models/Teacher.js';
import Class from './models/Class.js';
import Subject from './models/Subject.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/student-management-system';

const runSeed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for role enforcement...');

    // 1. Ensure Admin admin@gmail.com exists in the Admin table
    const existingAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      // Force password update to satisfy constraints
      existingAdmin.password = 'Admin@123';
      await existingAdmin.save();
      console.log('Admin account (admin@gmail.com) password updated to satisfy constraints.');
    } else {
      await Admin.create({
        email: 'admin@gmail.com',
        password: 'Admin@123',
      });
      console.log('Admin account (admin@gmail.com) created in Admin collection.');
    }

    // Remove admin@gmail.com from User collection if it accidentally exists there
    await User.deleteMany({ email: 'admin@gmail.com' });

    // 2. Ensure Teacher teacher@gmail.com exists in the User collection with role 'teacher'
    let teacherUser = await User.findOne({ email: 'teacher@gmail.com' });
    if (!teacherUser) {
      teacherUser = await User.create({
        name: 'Class Teacher',
        email: 'teacher@gmail.com',
        password: 'Teacher@123',
        role: 'teacher',
      });
      console.log('Teacher user (teacher@gmail.com) created in User collection.');
    } else {
      teacherUser.role = 'teacher';
      teacherUser.password = 'Teacher@123'; // Force update password
      await teacherUser.save();
      console.log('Teacher user (teacher@gmail.com) role and password verified/updated.');
    }

    // Ensure a default class exists
    let defaultClass = await Class.findOne({ name: 'Class 10-A' });
    if (!defaultClass) {
      defaultClass = await Class.create({
        name: 'Class 10-A',
        grade: '10',
        section: 'A',
        roomNumber: '101',
        academicYear: '2024'
      });
    }

    // Ensure a default subject exists
    let defaultSubject = await Subject.findOne({ name: 'Maths' });
    if (!defaultSubject) {
      defaultSubject = await Subject.create({
        name: 'Maths',
        code: 'MTH01',
        description: 'Mathematics',
        isLanguage: false
      });
    }

    // Ensure the Teacher profile exists for teacher@gmail.com
    const teacherProfile = await Teacher.findOne({ user: teacherUser._id });
    if (!teacherProfile) {
      await Teacher.create({
        user: teacherUser._id,
        employeeId: 'TCH-999',
        subjects: [defaultSubject._id],
        classTeacherOf: defaultClass._id,
        qualification: 'M.Ed, B.Sc',
        dateOfJoining: new Date(),
        status: 'Active'
      });
      console.log('Teacher profile created for Mr. Anderson (teacher@gmail.com).');
    }

    // 3. For all other users in User collection, ensure they are students
    const otherUsers = await User.find({ email: { $ne: 'teacher@gmail.com' } });
    let updatedCount = 0;
    for (const u of otherUsers) {
      if (u.role !== 'student') {
        u.role = 'student';
        await u.save();
        updatedCount++;
      }
    }
    console.log(`Updated ${updatedCount} other users to "student" role.`);

    console.log('Role enforcement database script finished successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Role enforcement database script failed:', error);
    process.exit(1);
  }
};

runSeed();
