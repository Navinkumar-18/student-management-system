import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import User from '../models/User.js';

export const getFees = async (req, res) => {
  const { studentEmail } = req.query;

  try {
    let query = {};

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (student) {
        query.student = student._id;
      } else {
        return res.status(404).json({ message: 'Student record not found' });
      }
    } else if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins cannot manage fees.' });
    } else {
      if (studentEmail) {
        const user = await User.findOne({ email: studentEmail });
        if (user) {
          const student = await Student.findOne({ user: user._id });
          if (student) {
            query.student = student._id;
          }
        }
      }
    }

    const feeRecords = await Fee.find(query)
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name' }
      })
      .populate('class')
      .sort({ dueDate: 1 });

    const formatted = feeRecords.map(f => ({
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
      feeType: f.feeType
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching fees', error: error.message });
  }
};

export const updateFee = async (req, res) => {
  const { id } = req.params;
  const { status, amountPaid, paymentMethod } = req.body;

  try {
    const fee = await Fee.findById(id);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || String(fee.student) !== String(student._id)) {
        return res.status(403).json({ message: 'Access denied. You can only update/pay your own fees.' });
      }
    } else if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins cannot manage fees.' });
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

    res.json({ message: 'Fee paid successfully', fee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating fee', error: error.message });
  }
};
