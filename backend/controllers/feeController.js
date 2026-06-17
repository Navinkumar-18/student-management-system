import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import AppError from '../utils/AppError.js';

export const getFees = async (req, res, next) => {
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
    } else if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (student) {
        query.student = student._id;
      } else {
        return sendSuccess(res, { fees: [], pagination: getPaginationMeta(0, p.page, l.limit) });
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

    const total = await Fee.countDocuments(query);
    const feeRecords = await Fee.find(query)
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name' },
      })
      .populate('class')
      .skip(p.skip)
      .limit(l)
      .sort({ dueDate: 1 });

    const formatted = feeRecords.map((f) => ({
      id: f._id,
      student: f.student ? `${f.student.rollNo} - ${f.student.user?.name || 'Unknown'}` : 'N/A',
      rollNo: f.student?.rollNo || '',
      studentName: f.student?.user?.name || '',
      class: f.class ? `${f.class.name}-${f.class.section}` : '',
      amount: `₹${f.amount.toLocaleString('en-IN')}`,
      amountPaid: `₹${f.amountPaid.toLocaleString('en-IN')}`,
      amountVal: f.amount,
      amountPaidVal: f.amountPaid,
      status: f.status,
      date: f.paymentDate ? f.paymentDate.toISOString().split('T')[0] : (f.dueDate ? f.dueDate.toISOString().split('T')[0] : ''),
      dueDate: f.dueDate ? f.dueDate.toISOString().split('T')[0] : '',
      method: f.paymentMethod || '-',
      feeType: f.feeType,
    }));

    return sendSuccess(res, {
      fees: formatted,
      pagination: getPaginationMeta(total, p.page, l.limit),
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const updateFee = async (req, res, next) => {
  const { id } = req.params;
  const { status, amountPaid, paymentMethod } = req.body;

  try {
    const fee = await Fee.findById(id);
    if (!fee) {
      return sendError(res, 'Fee record not found', 404);
    }

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || String(fee.student) !== String(student._id)) {
        return sendError(res, 'Access denied. You can only update/pay your own fees.', 403);
      }
    }

    if (status) fee.status = status;
    if (amountPaid !== undefined) {
      fee.amountPaid = amountPaid;
      if (fee.amountPaid >= fee.amount) {
        fee.status = 'Paid';
      } else if (fee.amountPaid > 0) {
        fee.status = 'Partial';
      } else {
        fee.status = 'Pending';
      }
    }
    if (paymentMethod) fee.paymentMethod = paymentMethod;
    if (fee.status === 'Paid' || fee.status === 'Partial') {
      fee.paymentDate = new Date();
      fee.transactionId = `TXN${Date.now().toString().slice(-6)}`;
    }

    await fee.save();

    return sendSuccess(res, { fee }, 'Fee updated successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};
