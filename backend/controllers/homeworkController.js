import Homework from '../models/Homework.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import AppError from '../utils/AppError.js';

export const getHomework = async (req, res, next) => {
  const { studentEmail, className } = req.query;

  try {
    const { page: p, limit: l } = getPagination(req.query);

    let query = {};

    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (teacher && teacher.classTeacherOf) {
        query.class = teacher.classTeacherOf;
      }
    } else if (studentEmail) {
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

    const total = await Homework.countDocuments(query);
    const homeworkList = await Homework.find(query)
      .populate('subject', 'name code')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' },
      })
      .populate('class', 'name section')
      .populate({
        path: 'submittedBy.student',
        populate: { path: 'user', select: 'name' },
      })
      .skip(p.skip)
      .limit(l)
      .sort({ dueDate: 1 });

    const formatted = homeworkList.map((hw) => ({
      id: hw._id,
      title: hw.title,
      subject: hw.subject?.name || 'General',
      teacher: hw.teacher?.user?.name || 'Admin',
      description: hw.description,
      dueDate: hw.dueDate.toISOString().split('T')[0],
      submissions: hw.submissions,
      total: hw.totalStudents,
      status: hw.status,
      submissionsList: hw.submittedBy.map((sub) => ({
        studentId: sub.student?._id || sub.student,
        studentName: sub.student?.user?.name || 'Student',
        text: sub.text,
        fileUrl: sub.fileUrl,
        fileName: sub.fileName,
        status: sub.status || 'Pending',
        submittedAt: sub.submittedAt,
      })),
    }));

    return sendSuccess(res, {
      homework: formatted,
      pagination: getPaginationMeta(total, p.page, l.limit),
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const createHomework = async (req, res, next) => {
  const { title, subject, description, dueDate, className } = req.body;

  try {
    if (!title || !subject || !dueDate) {
      return sendError(res, 'Title, subject and due date are required', 400);
    }

    let studentClass;
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (teacher && teacher.classTeacherOf) {
        studentClass = await Class.findById(teacher.classTeacherOf);
      }
    }
    if (!studentClass) {
      const gradeParts = (className || '10-A').split('-');
      const clsName = gradeParts[0] || '10';
      const clsSec = gradeParts[1] || 'A';
      studentClass = await Class.findOne({ name: clsName, section: clsSec });
      if (!studentClass) {
        studentClass = await Class.create({ name: clsName, section: clsSec, grade: clsName });
      }
    }

    let subj = await Subject.findOne({ name: subject });
    if (!subj) {
      const uniqueCode = subject.substring(0, 3).toUpperCase() + Math.floor(10 + Math.random() * 90);
      subj = await Subject.create({ name: subject, code: uniqueCode });
    }

    let teacher;
    if (req.user && req.user.role === 'teacher') {
      teacher = await Teacher.findOne({ user: req.user._id });
    }
    if (!teacher) {
      teacher = await Teacher.findOne({});
    }
    if (!teacher) {
      return sendError(res, 'No teacher profiles available to assign homework', 400);
    }

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
      status: 'Active',
    });

    return sendSuccess(res, {
      id: homework._id,
      title: homework.title,
      subject,
      teacher: 'Admin',
      description: homework.description,
      dueDate: homework.dueDate.toISOString().split('T')[0],
      submissions: homework.submissions,
      total: homework.totalStudents,
      status: homework.status,
    }, 'Homework created successfully', 201);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const updateHomework = async (req, res, next) => {
  const { id } = req.params;
  const { status, title, description, dueDate } = req.body;

  try {
    const hw = await Homework.findById(id);
    if (!hw) {
      return sendError(res, 'Homework not found', 404);
    }

    if (status) hw.status = status;
    if (title) hw.title = title;
    if (description) hw.description = description;
    if (dueDate) hw.dueDate = new Date(dueDate);

    await hw.save();

    const updated = await Homework.findById(id)
      .populate('subject', 'name')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' },
      });

    return sendSuccess(res, {
      id: updated._id,
      title: updated.title,
      subject: updated.subject?.name || 'General',
      teacher: updated.teacher?.user?.name || 'Admin',
      description: updated.description,
      dueDate: updated.dueDate.toISOString().split('T')[0],
      submissions: updated.submissions,
      total: updated.totalStudents,
      status: updated.status,
    }, 'Homework updated successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const submitHomework = async (req, res, next) => {
  const { id } = req.params;
  const { studentEmail, text } = req.body;

  try {
    const hw = await Homework.findById(id);
    if (!hw) {
      return sendError(res, 'Homework not found', 404);
    }

    const user = await User.findOne({ email: studentEmail });
    if (!user) return sendError(res, 'User not found', 404);

    const student = await Student.findOne({ user: user._id });
    if (!student) return sendError(res, 'Student not found', 404);

    const existingSubmissionIndex = hw.submittedBy.findIndex(
      (s) => s.student.toString() === student._id.toString()
    );

    const fileUrl = req.file ? `/uploads/homework/${req.file.filename}` : '';
    const fileName = req.file ? req.file.originalname : '';

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
        submittedAt: new Date(),
      });
      hw.submissions += 1;
    }

    await hw.save();

    return sendSuccess(res, { fileUrl, fileName }, 'Homework submitted successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const verifySubmission = async (req, res, next) => {
  const { id } = req.params;
  const { studentId, status } = req.body;

  try {
    const hw = await Homework.findById(id);
    if (!hw) {
      return sendError(res, 'Homework not found', 404);
    }

    const sub = hw.submittedBy.find((s) => s.student.toString() === studentId);
    if (!sub) {
      return sendError(res, 'Submission not found for this student', 404);
    }

    sub.status = status;
    await hw.save();

    return sendSuccess(res, { status }, 'Submission status updated successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};
