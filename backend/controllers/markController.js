import Mark from '../models/Mark.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Subject from '../models/Subject.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import AppError from '../utils/AppError.js';

export const getMarks = async (req, res, next) => {
  const { studentEmail } = req.query;

  try {
    const { page: p, limit: l } = getPagination(req.query);
    let query = {};

    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (teacher && teacher.classTeacherOf) {
        const students = await Student.find({ class: teacher.classTeacherOf }).select('_id');
        const studentIds = students.map(s => s._id);
        query.student = { $in: studentIds };
      }
    } else if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (student) {
        query.student = student._id;
      } else {
        return sendSuccess(res, { marks: [], pagination: getPaginationMeta(0, p.page, l.limit) });
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

    const total = await Mark.countDocuments(query);
    const marksList = await Mark.find(query)
      .populate({ path: 'student', populate: { path: 'user' } })
      .populate('subject')
      .populate('class')
      .skip(p.skip)
      .limit(l)
      .sort({ createdAt: -1 });

    const formatted = marksList.map((m) => ({
      id: m._id,
      studentId: m.student?._id || '',
      studentName: m.student?.user?.name || '',
      rollNo: m.student?.rollNo || '',
      subject: m.subject?.name || 'General',
      marks: m.marksObtained,
      max: m.maxMarks,
      grade: m.grade,
      examType: m.examType,
      term: m.term,
    }));

    return sendSuccess(res, {
      marks: formatted,
      pagination: getPaginationMeta(total, p.page, l.limit),
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const createMark = async (req, res, next) => {
  const { studentId, subjectName, marksObtained, maxMarks, examType, term } = req.body;

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    let subj = await Subject.findOne({ name: subjectName });
    if (!subj) {
      const uniqueCode = subjectName.substring(0, 3).toUpperCase() + Math.floor(10 + Math.random() * 90);
      subj = await Subject.create({ name: subjectName, code: uniqueCode });
    }

    const existingMark = await Mark.findOne({
      student: studentId,
      subject: subj._id,
      examType: examType || 'UnitTest',
      term: term || 'Term 1',
    });

    if (existingMark) {
      if (marksObtained !== undefined) existingMark.marksObtained = marksObtained;
      if (maxMarks !== undefined) existingMark.maxMarks = maxMarks;
      await existingMark.save();

      return sendSuccess(res, {
        id: existingMark._id,
        studentId: student._id,
        studentName: student.user?.name || '',
        rollNo: student.rollNo,
        subject: subjectName,
        marks: existingMark.marksObtained,
        max: existingMark.maxMarks,
        grade: existingMark.grade,
        examType: existingMark.examType,
        term: existingMark.term,
      }, 'Mark updated successfully');
    }

    const mark = new Mark({
      student: studentId,
      subject: subj._id,
      class: student.class,
      marksObtained,
      maxMarks: maxMarks || 100,
      examType: examType || 'UnitTest',
      term: term || 'Term 1',
    });

    await mark.save();

    return sendSuccess(res, {
      id: mark._id,
      studentId: student._id,
      studentName: student.user?.name || '',
      rollNo: student.rollNo,
      subject: subjectName,
      marks: mark.marksObtained,
      max: mark.maxMarks,
      grade: mark.grade,
      examType: mark.examType,
      term: mark.term,
    }, 'Mark created successfully', 201);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const updateMark = async (req, res, next) => {
  const { id } = req.params;
  const { marksObtained, maxMarks } = req.body;

  try {
    const mark = await Mark.findById(id);
    if (!mark) {
      return sendError(res, 'Mark record not found', 404);
    }

    if (marksObtained !== undefined) mark.marksObtained = marksObtained;
    if (maxMarks !== undefined) mark.maxMarks = maxMarks;

    await mark.save();

    return sendSuccess(res, { mark }, 'Mark updated successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};
