import mongoose from 'mongoose';
import Subject from './backend/models/Subject.js';
await mongoose.connect('mongodb://localhost:27017/student-management-system');
const subjects = await Subject.find({});
console.log(subjects);
process.exit(0);
