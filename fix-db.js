import mongoose from 'mongoose';
import Subject from './backend/models/Subject.js';
await mongoose.connect('mongodb://localhost:27017/student-management-system');

const social = await Subject.findOne({ name: 'Social' });
if (social) {
  social.name = 'Social Science';
  await social.save();
  console.log('Updated Social to Social Science');
} else {
  console.log('Social subject not found');
}

process.exit(0);
