import mongoose from 'mongoose';

const homeworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  dueDate: {
    type: Date,
    required: true,
  },
  attachments: [{
    url: String,
    name: String,
  }],
  status: {
    type: String,
    enum: ['Active', 'Grading', 'Completed'],
    default: 'Active',
  },
  submissions: {
    type: Number,
    default: 0,
  },
  submittedBy: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    text: String,
    fileUrl: String,
    fileName: String,
    status: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
    submittedAt: { type: Date, default: Date.now }
  }],
  totalStudents: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

const Homework = mongoose.model('Homework', homeworkSchema);
export default Homework;
