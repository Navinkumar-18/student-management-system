import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Student, Teacher, Class, Subject, Attendance, Homework, Mark, Fee, Leave } from './models/index.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/student-management-system';

async function checkDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const collections = ['users', 'students', 'teachers', 'classes', 'subjects', 'attendances', 'homeworks', 'marks', 'fees', 'leaves'];
    for (const name of collections) {
      const count = await mongoose.connection.db.collection(name).countDocuments();
      console.log(`${name}: ${count} documents`);
    }

    const users = await User.find({}).limit(5);
    console.log('Sample Users:', users.map(u => ({ email: u.email, role: u.role, name: u.name })));

    const students = await Student.find({}).populate('user').limit(5);
    console.log('Sample Students:', students.map(s => ({ rollNo: s.rollNo, name: s.user?.name, grade: s.grade })));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDB();
