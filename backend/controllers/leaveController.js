import Leave from '../models/Leave.js';
import LeaveBalance from '../models/LeaveBalance.js';
import Student from '../models/Student.js';
import User from '../models/User.js';

export const getLeaves = async (req, res) => {
  const { studentEmail } = req.query;

  try {
    let query = {};

    if (studentEmail) {
      const user = await User.findOne({ email: studentEmail });
      if (user) {
        const student = await Student.findOne({ user: user._id });
        if (student) {
          query.student = student._id;
        }
      }
    }

    const leaveRequests = await Leave.find(query)
      .populate('student')
      .sort({ createdAt: -1 });

    const formatted = leaveRequests.map(l => ({
      id: l._id,
      name: l.name,
      rollNo: l.rollNo,
      type: l.type,
      days: l.days,
      from: l.from.toISOString().split('T')[0],
      to: l.to.toISOString().split('T')[0],
      status: l.status,
      grade: l.grade,
      reason: l.reason
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching leaves', error: error.message });
  }
};

export const createLeave = async (req, res) => {
  const { studentEmail, type, from, to, reason } = req.body;

  try {
    const user = await User.findOne({ email: studentEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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
      grade: student && student.class ? `${student.class.name}-${student.class.section}` : (student ? student.grade : 'General'),
      type,
      from: fromDate,
      to: toDate,
      days,
      reason,
      status: 'Pending'
    });

    // Deduct leave balance if any
    const balance = await LeaveBalance.findOne({ user: user._id });
    if (balance) {
      if (type === 'Sick' || type === 'Medical') {
        balance.sickLeave.used += days;
      } else if (type === 'Casual') {
        balance.casualLeave.used += days;
      } else {
        balance.annualLeave.used += days;
      }
      await balance.save();
    }

    res.status(201).json({
      id: leave._id,
      name: leave.name,
      rollNo: leave.rollNo,
      type: leave.type,
      days: leave.days,
      from: leave.from.toISOString().split('T')[0],
      to: leave.to.toISOString().split('T')[0],
      status: leave.status,
      grade: leave.grade,
      reason: leave.reason
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error creating leave', error: error.message });
  }
};

export const updateLeave = async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  try {
    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (status) leave.status = status;
    if (remarks) leave.remarks = remarks;

    await leave.save();

    res.json({ message: 'Leave request updated successfully', leave });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating leave', error: error.message });
  }
};

export const getLeaveBalance = async (req, res) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let balance = await LeaveBalance.findOne({ user: user._id });
    if (!balance) {
      // Create a default balance
      balance = await LeaveBalance.create({
        user: user._id,
        annualLeave: { total: 20, used: 0 },
        sickLeave: { total: 12, used: 0 },
        casualLeave: { total: 10, used: 0 }
      });
    }

    res.json(balance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching leave balance', error: error.message });
  }
};
