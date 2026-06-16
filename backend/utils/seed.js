import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Attendance from '../models/Attendance.js';
import Homework from '../models/Homework.js';
import Mark from '../models/Mark.js';
import Fee from '../models/Fee.js';
import Leave from '../models/Leave.js';
import LeaveBalance from '../models/LeaveBalance.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/student-management-system';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Teacher.deleteMany({}),
      Class.deleteMany({}),
      Subject.deleteMany({}),
      Attendance.deleteMany({}),
      Homework.deleteMany({}),
      Mark.deleteMany({}),
      Fee.deleteMany({}),
      Leave.deleteMany({}),
      LeaveBalance.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // ── Subjects ──
    const subjects = await Subject.insertMany([
      { name: 'Tamil', code: 'TAM01', description: 'Tamil Language and Literature', isLanguage: true },
      { name: 'English', code: 'ENG01', description: 'English Language and Literature', isLanguage: true },
      { name: 'Maths', code: 'MTH01', description: 'Mathematics', isLanguage: false },
      { name: 'Science', code: 'SCI01', description: 'General Science', isLanguage: false },
      { name: 'Social Science', code: 'SOC01', description: 'Social Studies', isLanguage: false },
    ]);
    console.log(`Seeded ${subjects.length} subjects`);

    // ── Classes ──
    const classes = await Class.insertMany([
      { name: 'Class 10-A', grade: '10', section: 'A', roomNumber: '101', academicYear: '2024' },
      { name: 'Class 10-B', grade: '10', section: 'B', roomNumber: '102', academicYear: '2024' },
      { name: 'Class 9-A', grade: '9', section: 'A', roomNumber: '201', academicYear: '2024' },
      { name: 'Class 9-B', grade: '9', section: 'B', roomNumber: '202', academicYear: '2024' },
    ]);
    console.log(`Seeded ${classes.length} classes`);

    // ── Admin User ──
    const adminUser = await User.create({
      name: 'Admin',
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin',
    });

    // ── Teacher Users & Profiles ──
    const teacherData = [
      { name: 'Mr. Anderson', email: 'anderson@school.com', password: 'teacher123', employeeId: 'TCH001', subjects: [0, 2], classTeacher: 0 },
      { name: 'Mr. Smith', email: 'smith@school.com', password: 'teacher123', employeeId: 'TCH002', subjects: [2], classTeacher: null },
      { name: 'Dr. Jane', email: 'jane@school.com', password: 'teacher123', employeeId: 'TCH003', subjects: [3], classTeacher: 1 },
      { name: 'Ms. Davis', email: 'davis@school.com', password: 'teacher123', employeeId: 'TCH004', subjects: [1], classTeacher: 2 },
      { name: 'Mrs. Kumar', email: 'kumar@school.com', password: 'teacher123', employeeId: 'TCH005', subjects: [0], classTeacher: 3 },
      { name: 'Mr. Williams', email: 'williams@school.com', password: 'teacher123', employeeId: 'TCH006', subjects: [4], classTeacher: null },
    ];

    const teacherUsers = [];
    for (const t of teacherData) {
      const user = await User.create({
        name: t.name,
        email: t.email,
        password: t.password,
        role: 'teacher',
      });
      teacherUsers.push(user);
    }

    const teachers = await Teacher.insertMany(
      teacherData.map((t, i) => ({
        user: teacherUsers[i]._id,
        employeeId: t.employeeId,
        subjects: t.subjects.map(idx => subjects[idx]._id),
        classTeacherOf: t.classTeacher !== null ? classes[t.classTeacher]._id : null,
        qualification: 'M.Ed',
        dateOfJoining: new Date('2020-06-01'),
      }))
    );
    console.log(`Seeded ${teachers.length} teachers`);

    // Update classes with class teachers
    const classTeacherMap = [
      { classIdx: 0, teacherIdx: 0 },
      { classIdx: 1, teacherIdx: 2 },
      { classIdx: 2, teacherIdx: 3 },
      { classIdx: 3, teacherIdx: 4 },
    ];
    for (const { classIdx, teacherIdx } of classTeacherMap) {
      await Class.findByIdAndUpdate(classes[classIdx]._id, { classTeacher: teachers[teacherIdx]._id });
    }

    // ── Student Users & Profiles ──
    const studentNames = [
      'Rajinikanth', 'Aishwarya Rai', 'Vijay', 'Ajith Kumar', 'Kamal Haasan',
      'Suriya', 'Vikram', 'Trisha', 'Nayanthara', 'Dhanush',
      'Samantha', 'Allu Arjun', 'Ram Charan', 'Mahesh Babu', 'Pawan Kalyan',
      'Prabhas', 'Rashmika', 'Kajal Agarwal', 'Anushka Shetty', 'Tamannaah',
    ];

    const studentUsers = [];
    for (let i = 0; i < studentNames.length; i++) {
      const user = await User.create({
        name: studentNames[i],
        email: `${studentNames[i].toLowerCase().replace(/\s+/g, '.')}@student.com`,
        password: 'student123',
        role: 'student',
      });
      studentUsers.push(user);
    }

    const students = await Student.insertMany(
      studentNames.map((name, i) => {
        const classIdx = i < 5 ? 0 : i < 10 ? 1 : i < 15 ? 2 : 3;
        return {
          user: studentUsers[i]._id,
          rollNo: String(101 + i),
          class: classes[classIdx]._id,
          grade: classes[classIdx].fullName,
          gpa: (3 + (i % 20) * 0.1).toFixed(1),
          status: i % 7 === 0 ? 'Inactive' : 'Active',
          phone: `987654${String(3210 + i).padStart(4, '0')}`,
        };
      })
    );
    console.log(`Seeded ${students.length} students`);

    // ── Attendance ──
    const attendanceRecords = [];
    const today = new Date();
    const statuses = ['Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Absent', 'Late', 'Present'];
    for (let d = 0; d < 30; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      for (let i = 0; i < students.length; i++) {
        const status = statuses[i % statuses.length];
        attendanceRecords.push({
          student: students[i]._id,
          class: students[i].class,
          date,
          status,
          time: status === 'Present' ? `${7 + Math.floor(Math.random() * 2)}:${Math.random() > 0.5 ? '15' : '30'} AM` : status === 'Late' ? '9:15 AM' : '-',
        });
      }
    }
    await Attendance.insertMany(attendanceRecords);
    console.log(`Seeded ${attendanceRecords.length} attendance records`);

    // ── Homework ──
    const homeworkData = [
      { title: 'Advanced Algebra Practice', subject: 2, teacher: 0, class: 0, submissions: 4, total: 5 },
      { title: 'Chemical Reactions Lab Report', subject: 3, teacher: 2, class: 1, submissions: 8, total: 5 },
      { title: 'English Essay: Shakespeare', subject: 1, teacher: 3, class: 2, submissions: 6, total: 5 },
      { title: 'Tamil Grammar Exercises', subject: 0, teacher: 4, class: 3, submissions: 4, total: 5 },
      { title: 'Geometry Constructions', subject: 2, teacher: 1, class: 0, submissions: 5, total: 5 },
      { title: 'Social Studies Project', subject: 4, teacher: 5, class: 1, submissions: 3, total: 5 },
    ];

    const homeworks = await Homework.insertMany(
      homeworkData.map((hw, i) => ({
        title: hw.title,
        subject: subjects[hw.subject]._id,
        teacher: teachers[hw.teacher]._id,
        class: classes[hw.class]._id,
        description: `Complete the ${hw.title.toLowerCase()} and submit before the due date.`,
        dueDate: new Date(today.getTime() + (i + 1) * 3 * 24 * 60 * 60 * 1000),
        submissions: hw.submissions,
        totalStudents: hw.total,
        status: i < 2 ? 'Active' : i < 4 ? 'Grading' : 'Completed',
      }))
    );
    console.log(`Seeded ${homeworks.length} homework assignments`);

    // ── Marks ──
    const marksData = [];
    for (let i = 0; i < students.length; i++) {
      for (let s = 0; s < subjects.length; s++) {
        const marksObtained = 40 + Math.floor(Math.random() * 60);
        marksData.push({
          student: students[i]._id,
          subject: subjects[s]._id,
          class: students[i].class,
          examType: 'Midterm',
          marksObtained,
          maxMarks: 100,
          term: 'Term 1',
          academicYear: '2024',
          enteredBy: teachers[s % teachers.length]._id,
        });
      }
    }
    await Mark.insertMany(marksData);
    console.log(`Seeded ${marksData.length} marks`);

    // ── Fees ──
    const feeData = [
      { amount: 200000, status: 'Paid', method: 'Bank Transfer', idx: 0 },
      { amount: 200000, status: 'Paid', method: 'Credit Card', idx: 1 },
      { amount: 200000, status: 'Overdue', method: '-', idx: 2 },
      { amount: 200000, status: 'Partial', method: 'Cash', idx: 3 },
      { amount: 200000, status: 'Pending', method: '-', idx: 4 },
    ];

    const fees = await Fee.insertMany(
      students.map((s, i) => {
        const feeTmpl = feeData[i % feeData.length];
        return {
          student: s._id,
          class: s.class,
          amount: feeTmpl.amount,
          amountPaid: feeTmpl.status === 'Paid' ? feeTmpl.amount : feeTmpl.status === 'Partial' ? feeTmpl.amount / 2 : 0,
          feeType: 'Tuition',
          status: feeTmpl.status,
          dueDate: new Date('2024-06-30'),
          paymentDate: feeTmpl.status === 'Paid' || feeTmpl.status === 'Partial' ? new Date() : undefined,
          paymentMethod: feeTmpl.method,
          transactionId: feeTmpl.status !== 'Pending' && feeTmpl.status !== 'Overdue' ? `TXN${String(10000 + i).padStart(6, '0')}` : '',
          academicYear: '2024',
        };
      })
    );
    console.log(`Seeded ${fees.length} fee records`);

    // ── Leaves ──
    const leaves = await Leave.insertMany([
      {
        student: students[2]._id, applicantType: 'student',
        name: studentNames[2], rollNo: '103', grade: '10-A',
        type: 'Medical', from: new Date('2024-02-10'), to: new Date('2024-02-12'), days: 3,
        reason: 'Fever and cold', status: 'Approved', approvedBy: adminUser._id,
      },
      {
        student: students[5]._id, applicantType: 'student',
        name: studentNames[5], rollNo: '106', grade: '10-B',
        type: 'Personal', from: new Date('2024-03-01'), to: new Date('2024-03-01'), days: 1,
        reason: 'Family function', status: 'Pending',
      },
      {
        student: students[8]._id, applicantType: 'student',
        name: studentNames[8], rollNo: '109', grade: '9-A',
        type: 'Family', from: new Date('2024-03-15'), to: new Date('2024-03-18'), days: 4,
        reason: 'Sister wedding', status: 'Approved', approvedBy: adminUser._id,
      },
      {
        student: students[11]._id, applicantType: 'student',
        name: studentNames[11], rollNo: '112', grade: '9-B',
        type: 'Casual', from: new Date('2024-04-01'), to: new Date('2024-04-02'), days: 2,
        reason: 'Out of station', status: 'Rejected', approvedBy: adminUser._id, remarks: 'Insufficient reason',
      },
      {
        student: students[15]._id, applicantType: 'student',
        name: studentNames[15], rollNo: '116', grade: '10-A',
        type: 'Medical', from: new Date('2024-04-10'), to: new Date('2024-04-12'), days: 3,
        reason: 'Viral infection', status: 'Pending',
      },
    ]);
    console.log(`Seeded ${leaves.length} leave requests`);

    // ── Leave Balances ──
    const leaveBalances = await LeaveBalance.insertMany(
      studentUsers.map((u, i) => ({
        user: u._id,
        annualLeave: { total: 20, used: i % 5 },
        sickLeave: { total: 12, used: i % 3 },
        casualLeave: { total: 10, used: i % 2 },
        academicYear: '2024',
      }))
    );
    console.log(`Seeded ${leaveBalances.length} leave balances`);

    console.log('\n✅ Database seeded successfully!');
    console.log(`\nLogin Credentials:`);
    console.log(`  Admin:   admin@school.com / admin123`);
    console.log(`  Teacher: anderson@school.com / teacher123`);
    console.log(`  Student: ${studentNames[0].toLowerCase().replace(/\s+/g, '.')}@student.com / student123`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
