/**
 * One-time script to seed missing fee records for existing students.
 * Run with: node scripts/seedFees.js
 */
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Student from '../models/Student.js';
import Fee from '../models/Fee.js';

dotenv.config({ path: '../.env' });

async function seedMissingFees() {
  await connectDB();
  console.log('Starting fee seeding...');
  try {
    const students = await Student.find({});
    let seeded = 0;
    for (const student of students) {
      const feeCount = await Fee.countDocuments({ student: student._id });
      if (feeCount === 0) {
        console.log(`Seeding default tuition fee for student rollNo: ${student.rollNo}`);
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
        seeded++;
      }
    }
    console.log(`Done! Seeded fees for ${seeded} students.`);
  } catch (err) {
    console.error('Error seeding missing fees:', err);
  }
  process.exit(0);
}

seedMissingFees();
