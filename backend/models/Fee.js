import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  feeType: {
    type: String,
    enum: ['Tuition', 'Transport', 'Library', 'Laboratory', 'Sports', 'Activity', 'Other'],
    default: 'Tuition',
  },
  status: {
    type: String,
    enum: ['Paid', 'Overdue', 'Partial', 'Pending'],
    default: 'Pending',
  },
  dueDate: {
    type: Date,
  },
  paymentDate: {
    type: Date,
  },
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'Credit Card', 'Cash', 'UPI', 'Cheque', '-'],
    default: '-',
  },
  transactionId: {
    type: String,
    default: '',
  },
  academicYear: {
    type: String,
    default: new Date().getFullYear().toString(),
  },
  remarks: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

const Fee = mongoose.model('Fee', feeSchema);
export default Fee;
