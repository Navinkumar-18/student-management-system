import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
  },
  section: {
    type: String,
    required: true,
    trim: true,
  },
  grade: {
    type: String,
    required: true,
  },
  roomNumber: {
    type: String,
    default: '',
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null,
  },
  academicYear: {
    type: String,
    default: new Date().getFullYear().toString(),
  },
}, {
  timestamps: true,
});

classSchema.virtual('fullName').get(function () {
  return `${this.grade}-${this.section}`;
});

classSchema.set('toJSON', { virtuals: true });
classSchema.set('toObject', { virtuals: true });

const Class = mongoose.model('Class', classSchema);
export default Class;
