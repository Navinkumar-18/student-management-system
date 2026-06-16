import mongoose from 'mongoose';

const markSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  examType: {
    type: String,
    enum: ['Midterm', 'Final', 'Quarterly', 'HalfYearly', 'Annual', 'UnitTest'],
    default: 'UnitTest',
  },
  marksObtained: {
    type: Number,
    required: true,
  },
  maxMarks: {
    type: Number,
    default: 100,
  },
  grade: {
    type: String,
    default: '',
  },
  term: {
    type: String,
    default: 'Term 1',
  },
  academicYear: {
    type: String,
    default: new Date().getFullYear().toString(),
  },
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
  },
}, {
  timestamps: true,
});

markSchema.pre('save', function () {
  const percentage = (this.marksObtained / this.maxMarks) * 100;
  if (percentage >= 90) this.grade = 'A+';
  else if (percentage >= 80) this.grade = 'A';
  else if (percentage >= 70) this.grade = 'B+';
  else if (percentage >= 60) this.grade = 'B';
  else if (percentage >= 50) this.grade = 'C';
  else if (percentage >= 40) this.grade = 'D';
  else this.grade = 'F';
});

markSchema.index({ student: 1, subject: 1, examType: 1, term: 1 }, { unique: true });

const Mark = mongoose.model('Mark', markSchema);
export default Mark;
