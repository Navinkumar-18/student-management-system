import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import AppError from '../utils/AppError.js';

export const getAttendance = async (req, res, next) => {
  const { date, className, studentEmail } = req.query;

  try {
    if (studentEmail) {
      const user = await User.findOne({ email: studentEmail });
      if (!user) {
        return sendError(res, 'User not found', 404);
      }
      const student = await Student.findOne({ user: user._id });
      if (!student) {
        return sendError(res, 'Student profile not found', 404);
      }

      const records = await Attendance.find({ student: student._id })
        .populate('class')
        .sort({ date: -1 });

      const formatted = records.map((r) => ({
        id: r._id,
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        rawDate: new Date(r.date).toISOString().split('T')[0],
        status: r.status,
        time: r.time || '-',
        className: r.class ? `${r.class.name}-${r.class.section}` : '',
      }));

      return sendSuccess(res, formatted);
    }

    let targetClassId = null;

    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (teacher && teacher.classTeacherOf) {
        targetClassId = teacher.classTeacherOf;
      }
    } else {
      const gradeParts = (className || '10-A').split('-');
      const clsName = gradeParts[0] || '10';
      const clsSec = gradeParts[1] || 'A';
      const studentClass = await Class.findOne({ name: clsName, section: clsSec });
      if (studentClass) {
        targetClassId = studentClass._id;
      }
    }

    if (!targetClassId) {
      return sendSuccess(res, []);
    }

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    const students = await Student.find({ class: targetClassId }).populate('user');

    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);
    const existingRecords = await Attendance.find({
      class: targetClassId,
      date: { $gte: targetDate, $lte: endOfDay },
    });

    const recordsMap = new Map();
    existingRecords.forEach((r) => recordsMap.set(r.student.toString(), r));

    const attendanceData = students.map((student) => {
      const record = recordsMap.get(student._id.toString());
      return {
        id: student._id,
        name: student.user?.name || 'Unknown',
        rollNo: student.rollNo,
        status: record ? record.status : 'Present',
        time: record ? record.time : '8:00 AM',
        date: targetDate.toISOString().split('T')[0],
        recordId: record ? record._id : null,
      };
    });

    return sendSuccess(res, attendanceData);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const saveAttendance = async (req, res, next) => {
  const { date, className, records } = req.body;

  try {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    let classId;
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (!teacher || !teacher.classTeacherOf) {
        return sendError(res, 'You are not assigned to any class', 403);
      }
      classId = teacher.classTeacherOf;
    } else {
      const gradeParts = (className || '10-A').split('-');
      const clsName = gradeParts[0] || '10';
      const clsSec = gradeParts[1] || 'A';
      const studentClass = await Class.findOne({ name: clsName, section: clsSec });
      classId = studentClass ? studentClass._id : null;
    }

    if (!classId) {
      return sendError(res, 'Class not found', 404);
    }

    const savedRecords = [];

    for (const rec of records) {
      let attendanceRecord = await Attendance.findOne({
        student: rec.studentId,
        date: targetDate,
      });

      if (attendanceRecord) {
        attendanceRecord.status = rec.status;
        attendanceRecord.time = rec.time || '8:00 AM';
        await attendanceRecord.save();
      } else {
        attendanceRecord = await Attendance.create({
          student: rec.studentId,
          class: classId,
          date: targetDate,
          status: rec.status,
          time: rec.time || '8:00 AM',
        });
      }
      savedRecords.push(attendanceRecord);
    }

    return sendSuccess(res, { count: savedRecords.length }, 'Attendance saved successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};
