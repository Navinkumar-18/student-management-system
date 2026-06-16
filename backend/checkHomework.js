import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Student, Class, Homework } from './models/index.js';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/student-management-system';

async function checkHomework() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  const classes = await Class.find({});
  console.log('--- CLASSES ---');
  classes.forEach(c => console.log(`ID: ${c._id}, Name: ${c.name}, Section: ${c.section}`));

  const students = await Student.find({}).populate('user').populate('class');
  console.log('--- STUDENTS ---');
  students.slice(0, 10).forEach(s => {
    console.log(`Student Roll: ${s.rollNo}, User Email: ${s.user?.email}, Class Name: ${s.class?.name}-${s.class?.section}, ClassID: ${s.class?._id}`);
  });

  const homeworks = await Homework.find({}).populate('class');
  console.log('--- HOMEWORKS ---');
  homeworks.forEach(h => {
    console.log(`HW Title: ${h.title}, Class: ${h.class?.name}-${h.class?.section}, ClassID: ${h.class?._id}`);
  });

  process.exit(0);
}

checkHomework();
