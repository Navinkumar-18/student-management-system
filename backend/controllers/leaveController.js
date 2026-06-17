import Leave from '../models/Leave.js';
import LeaveBalance from '../models/LeaveBalance.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import AppError from '../utils/AppError.js';

export const getLeaves = async (req, res, next) => {
  const { studentEmail } = req.query;

  try {
    const { page: p, limit: l } = getPagination(req.query);
    let query = {};

    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (teacher && teacher.classTeacherOf) {
        const students = await Student.find({ class: teacher.classTeacherOf }).select('_id');
        const studentIds = students.map(s => s._id);
        query.student = { $in: studentIds };
      }
    } else if (studentEmail) {
      const user = await User.findOne({ email: studentEmail });
      if (user) {
        const student = await Student.findOne({ user: user._id });
        if (student) {
          query.student = student._id;
        }
      }
    }

    const total = await Leave.countDocuments(query);
    const leaveRequests = await Leave.find(query)
      .populate('student')
      .skip(p.skip)
      .limit(l)
      .sort({ createdAt: -1 });

    const formatted = leaveRequests.map((l) => ({
      id: l._id,
      name: l.name,
      rollNo: l.rollNo,
      type: l.type,
      days: l.days,
      from: l.from.toISOString().split('T')[0],
      to: l.to.toISOString().split('T')[0],
      status: l.status,
      grade: l.grade,
      reason: l.reason,
    }));

    return sendSuccess(res, {
      leaves: formatted,
      pagination: getPaginationMeta(total, p.page, l.limit),
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const createLeave = async (req, res, next) => {
  const { studentEmail, type, from, to, reason } = req.body;

  try {
    const user = await User.findOne({ email: studentEmail });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const student = await Student.findOne({ user: user._id }).populate('class');

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    const leave = await Leave.create({
      student: student ? student._id : null,
      applicantType: 'student',
      name: user.name,
      rollNo: student ? student.rollNo : 'N/A',
      grade: student && student.class
        ? `${student.class.name}-${student.class.section}`
        : (student ? student.grade : 'General'),
      type,
      from: fromDate,
      to: toDate,
      days,
      reason,
      status: 'Pending',
    });

    return sendSuccess(res, {
      id: leave._id,
      name: leave.name,
      rollNo: leave.rollNo,
      type: leave.type,
      days: leave.days,
      from: leave.from.toISOString().split('T')[0],
      to: leave.to.toISOString().split('T')[0],
      status: leave.status,
      grade: leave.grade,
      reason: leave.reason,
    }, 'Leave request created successfully', 201);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const updateLeave = async (req, res, next) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  try {
    const leave = await Leave.findById(id).populate('student');
    if (!leave) {
      return sendError(res, 'Leave request not found', 404);
    }

    const previousStatus = leave.status;
    if (status) leave.status = status;
    if (remarks) leave.remarks = remarks;

    await leave.save();

    if (status === 'Approved' && previousStatus !== 'Approved' && leave.student) {
      const student = await Student.findById(leave.student._id || leave.student);
      if (student) {
        const balance = await LeaveBalance.findOne({ user: student.user });
        if (balance) {
          if (leave.type === 'Sick' || leave.type === 'Medical') {
            balance.sickLeave.used += leave.days;
          } else if (leave.type === 'Casual') {
            balance.casualLeave.used += leave.days;
          } else {
            balance.annualLeave.used += leave.days;
          }
          await balance.save();
        }
      }
    }

    return sendSuccess(res, { leave }, 'Leave request updated successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const getLeaveBalance = async (req, res, next) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    let balance = await LeaveBalance.findOne({ user: user._id });
    if (!balance) {
      balance = await LeaveBalance.create({
        user: user._id,
        annualLeave: { total: 20, used: 0 },
        sickLeave: { total: 12, used: 0 },
        casualLeave: { total: 10, used: 0 },
      });
    }

    return sendSuccess(res, balance);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};
