import Homework from '../models/Homework.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import User from '../models/User.js';

export const getHomework = async (req, res) => {
  const { studentEmail, className } = req.query;

  try {
    let query = {};

    if (studentEmail) {
      const user = await User.findOne({ email: studentEmail });
      if (user) {
        const student = await Student.findOne({ user: user._id });
        if (student) {
          query.class = student.class;
        }
      }
    } else if (className) {
      const gradeParts = className.split('-');
      const clsName = gradeParts[0] || '10';
      const clsSec = gradeParts[1] || 'A';
      const studentClass = await Class.findOne({ name: clsName, section: clsSec });
      if (studentClass) {
        query.class = studentClass._id;
      }
    }

    const homeworkList = await Homework.find(query)
      .populate('subject', 'name code')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' }
      })
      .populate('class', 'name section')
      .populate({
        path: 'submittedBy.student',
        populate: { path: 'user', select: 'name' }
      })
      .sort({ dueDate: 1 });

    const formatted = homeworkList.map(hw => ({
      id: hw._id,
      title: hw.title,
      subject: hw.subject?.name || 'General',
      teacher: hw.teacher?.user?.name || 'Admin',
      description: hw.description,
      dueDate: hw.dueDate.toISOString().split('T')[0],
      submissions: hw.submissions,
      total: hw.totalStudents,
      status: hw.status,
      submissionsList: hw.submittedBy.map(sub => ({
        studentId: sub.student?._id || sub.student,
        studentName: sub.student?.user?.name || 'Student',
        text: sub.text,
        fileUrl: sub.fileUrl,
        fileName: sub.fileName,
        status: sub.status || 'Pending',
        submittedAt: sub.submittedAt
      }))
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching homework', error: error.message });
  }
};

export const createHomework = async (req, res) => {
  const { title, subject, description, dueDate, className } = req.body;

  try {
    // Let's resolve class
    const gradeParts = (className || '10-A').split('-');
    const clsName = gradeParts[0] || '10';
    const clsSec = gradeParts[1] || 'A';
    let studentClass = await Class.findOne({ name: clsName, section: clsSec });
    if (!studentClass) {
      studentClass = await Class.create({ name: clsName, section: clsSec, grade: clsName });
    }

    // Resolve subject
    let subj = await Subject.findOne({ name: subject });
    if (!subj) {
      const uniqueCode = subject.substring(0, 3).toUpperCase() + Math.floor(10 + Math.random() * 90);
      subj = await Subject.create({ name: subject, code: uniqueCode });
    }

    // Assign a default teacher
    const teacher = await Teacher.findOne({});
    if (!teacher) {
      return res.status(400).json({ message: 'No teacher profiles available to assign homework' });
    }

    // Count students in this class
    const totalStudents = await Student.countDocuments({ class: studentClass._id });

    const homework = await Homework.create({
      title,
      subject: subj._id,
      teacher: teacher._id,
      class: studentClass._id,
      description,
      dueDate: new Date(dueDate),
      totalStudents: totalStudents || 20,
      submissions: 0,
      status: 'Active'
    });

    res.status(201).json({
      id: homework._id,
      title: homework.title,
      subject: subject,
      teacher: 'Admin',
      description: homework.description,
      dueDate: homework.dueDate.toISOString().split('T')[0],
      submissions: homework.submissions,
      total: homework.totalStudents,
      status: homework.status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error creating homework', error: error.message });
  }
};

export const updateHomework = async (req, res) => {
  const { id } = req.params;
  const { status, title, description, dueDate } = req.body;

  try {
    const hw = await Homework.findById(id);
    if (!hw) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    if (status) hw.status = status;
    if (title) hw.title = title;
    if (description) hw.description = description;
    if (dueDate) hw.dueDate = new Date(dueDate);

    await hw.save();

    // Populate for response
    const updated = await Homework.findById(id)
      .populate('subject', 'name')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' }
      });

    res.json({
      id: updated._id,
      title: updated.title,
      subject: updated.subject?.name || 'General',
      teacher: updated.teacher?.user?.name || 'Admin',
      description: updated.description,
      dueDate: updated.dueDate.toISOString().split('T')[0],
      submissions: updated.submissions,
      total: updated.totalStudents,
      status: updated.status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating homework', error: error.message });
  }
};

export const submitHomework = async (req, res) => {
  const { id } = req.params;
  const { studentEmail, text } = req.body;
  const fileUrl = req.file ? `/uploads/homework/${req.file.filename}` : '';
  const fileName = req.file ? req.file.originalname : '';

  try {
    const hw = await Homework.findById(id);
    if (!hw) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    const user = await User.findOne({ email: studentEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const student = await Student.findOne({ user: user._id });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Check if already submitted
    const existingSubmissionIndex = hw.submittedBy.findIndex(s => s.student.toString() === student._id.toString());
    
    if (existingSubmissionIndex >= 0) {
      hw.submittedBy[existingSubmissionIndex].text = text;
      if (fileUrl) {
        hw.submittedBy[existingSubmissionIndex].fileUrl = fileUrl;
        hw.submittedBy[existingSubmissionIndex].fileName = fileName;
      }
      hw.submittedBy[existingSubmissionIndex].submittedAt = new Date();
    } else {
      hw.submittedBy.push({
        student: student._id,
        text,
        fileUrl,
        fileName,
        submittedAt: new Date()
      });
      hw.submissions += 1;
    }

    // Mark status as Grading if it was Active (just as a global indicator, though status is global for the whole class usually)
    // Actually hw.status is global, so we shouldn't change it to Grading unless dueDate passed. We will leave hw.status intact.

    await hw.save();

    res.json({ message: 'Homework submitted successfully', fileUrl, fileName });
  } catch (error) {
    console.error('Error submitting homework:', error);
    res.status(500).json({ message: 'Server Error submitting homework', error: error.message });
  }
};

export const verifySubmission = async (req, res) => {
  const { id } = req.params;
  const { studentId, status } = req.body;

  try {
    const hw = await Homework.findById(id);
    if (!hw) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    const sub = hw.submittedBy.find(s => s.student.toString() === studentId);
    if (!sub) {
      return res.status(404).json({ message: 'Submission not found for this student' });
    }

    sub.status = status;
    await hw.save();

    res.json({ message: 'Submission status updated successfully', status });
  } catch (error) {
    console.error('Error verifying submission:', error);
    res.status(500).json({ message: 'Server Error verifying submission', error: error.message });
  }
};
