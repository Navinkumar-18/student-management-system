import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  maxMarks: {
    type: Number,
    default: 100,
  },
  passMarks: {
    type: Number,
    default: 35,
  },
  isLanguage: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
