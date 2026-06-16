import Mark from '../models/Mark.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import User from '../models/User.js';

export const getMarks = async (req, res) => {
  const { studentEmail } = req.query;

  try {
    let query = {};

    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (student) {
        query.student = student._id;
      } else {
        // If student profile not found, return empty list
        return res.json([]);
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

    const marksList = await Mark.find(query)
      .populate({
        path: 'student',
        populate: { path: 'user' }
      })
      .populate('subject')
      .populate('class')
      .sort({ createdAt: -1 });

    const formatted = marksList.map(m => ({
      id: m._id,
      studentName: m.student?.user?.name || '',
      rollNo: m.student?.rollNo || '',
      subject: m.subject?.name || 'General',
      marks: m.marksObtained,
      max: m.maxMarks,
      grade: m.grade,
      examType: m.examType,
      term: m.term
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching marks', error: error.message });
  }
};

export const createMark = async (req, res) => {
  const { studentId, subjectName, marksObtained, maxMarks, examType, term } = req.body;

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    let subj = await Subject.findOne({ name: subjectName });
    if (!subj) {
      const uniqueCode = subjectName.substring(0, 3).toUpperCase() + Math.floor(10 + Math.random() * 90);
      subj = await Subject.create({ name: subjectName, code: uniqueCode });
    }

    const mark = new Mark({
      student: studentId,
      subject: subj._id,
      class: student.class,
      marksObtained,
      maxMarks: maxMarks || 100,
      examType: examType || 'UnitTest',
      term: term || 'Term 1'
    });

    await mark.save();

    res.status(201).json({
      id: mark._id,
      studentName: student.user?.name || '',
      rollNo: student.rollNo,
      subject: subjectName,
      marks: mark.marksObtained,
      max: mark.maxMarks,
      grade: mark.grade,
      examType: mark.examType,
      term: mark.term
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error creating mark', error: error.message });
  }
};

export const updateMark = async (req, res) => {
  const { id } = req.params;
  const { marksObtained, maxMarks } = req.body;

  try {
    const mark = await Mark.findById(id);
    if (!mark) {
      return res.status(404).json({ message: 'Mark record not found' });
    }

    if (marksObtained !== undefined) mark.marksObtained = marksObtained;
    if (maxMarks !== undefined) mark.maxMarks = maxMarks;

    await mark.save();

    res.json({ message: 'Mark record updated successfully', mark });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating mark', error: error.message });
  }
};
