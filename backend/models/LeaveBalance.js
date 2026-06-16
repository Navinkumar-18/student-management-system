import mongoose from 'mongoose';

const leaveBalanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  annualLeave: {
    total: { type: Number, default: 20 },
    used: { type: Number, default: 0 },
  },
  sickLeave: {
    total: { type: Number, default: 12 },
    used: { type: Number, default: 0 },
  },
  casualLeave: {
    total: { type: Number, default: 10 },
    used: { type: Number, default: 0 },
  },
  academicYear: {
    type: String,
    default: new Date().getFullYear().toString(),
  },
}, {
  timestamps: true,
});

leaveBalanceSchema.virtual('annualLeave.available').get(function () {
  return this.annualLeave.total - this.annualLeave.used;
});

leaveBalanceSchema.virtual('sickLeave.available').get(function () {
  return this.sickLeave.total - this.sickLeave.used;
});

leaveBalanceSchema.virtual('casualLeave.available').get(function () {
  return this.casualLeave.total - this.casualLeave.used;
});

leaveBalanceSchema.index({ user: 1, academicYear: 1 }, { unique: true });

const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);
export default LeaveBalance;
