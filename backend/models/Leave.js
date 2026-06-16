import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
  },
  applicantType: {
    type: String,
    enum: ['student', 'teacher', 'staff'],
    default: 'student',
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  rollNo: {
    type: String,
    default: '',
  },
  grade: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['Medical', 'Personal', 'Family', 'Casual', 'Annual', 'Sick'],
    required: [true, 'Leave type is required'],
  },
  from: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  to: {
    type: Date,
    required: [true, 'End date is required'],
  },
  days: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    default: '',
  },
  attachment: {
    url: String,
    name: String,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  remarks: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

const Leave = mongoose.model('Leave', leaveSchema);
export default Leave;
