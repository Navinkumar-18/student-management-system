import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();

const app = express();

import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import homeworkRoutes from './routes/homeworkRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import markRoutes from './routes/markRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Student Management System API is running' });
});

import Student from './models/Student.js';
import Fee from './models/Fee.js';

async function seedMissingFees() {
  try {
    const students = await Student.find({});
    for (const student of students) {
      const feeCount = await Fee.countDocuments({ student: student._id });
      if (feeCount === 0) {
        console.log(`Allotted default tuition fee for existing student rollNo: ${student.rollNo}`);
        await Fee.create({
          student: student._id,
          class: student.class,
          amount: 50000,
          amountPaid: 0,
          feeType: 'Tuition',
          status: 'Pending',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          academicYear: new Date().getFullYear().toString(),
        });
      }
    }
  } catch (err) {
    console.error('Error seeding missing fees:', err);
  }
}

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedMissingFees();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
