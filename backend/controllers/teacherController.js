import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import { isLoginAllowedEmail } from '../utils/emailValidation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import AppError from '../utils/AppError.js';

export const getTeachers = async (req, res, next) => {
  try {
    const { page: p, limit: l } = getPagination(req.query);
    const total = await Teacher.countDocuments({});
    const teachers = await Teacher.find({})
      .populate('user', 'name email avatar')
      .populate('subjects', 'name code')
      .populate('classTeacherOf', 'name section')
      .skip(p.skip)
      .limit(l)
      .sort({ createdAt: -1 });

    const formatted = teachers.map((t) => ({
      id: t._id,
      name: t.user?.name || 'Unknown',
      email: t.user?.email || 'N/A',
      employeeId: t.employeeId,
      subjects: t.subjects.map((s) => s.name),
      classTeacherOf: t.classTeacherOf ? `${t.classTeacherOf.name}-${t.classTeacherOf.section}` : 'None',
      phone: t.phone,
      qualification: t.qualification,
      dateOfJoining: t.dateOfJoining ? new Date(t.dateOfJoining).toISOString().split('T')[0] : '',
      status: t.status,
      avatar: t.user?.avatar || (t.user?.name ? t.user.name.substring(0, 2).toUpperCase() : 'NA'),
    }));

    return sendSuccess(res, {
      teachers: formatted,
      pagination: getPaginationMeta(total, p.page, l.limit),
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const createTeacher = async (req, res, next) => {
  const { name, email, password, employeeId, subjects, classTeacherOf, phone, qualification, status } = req.body;

  try {
    if (!isLoginAllowedEmail(email)) {
      return sendError(res, 'Please enter a proper professional mail id ending with @gmail.com', 400);
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'User with this email already exists', 400);
    }

    const empExists = await Teacher.findOne({ employeeId });
    if (empExists) {
      return sendError(res, 'Teacher with this Employee ID already exists', 400);
    }

    let targetClass = null;
    if (classTeacherOf && classTeacherOf !== 'None') {
      const parts = classTeacherOf.split('-');
      const clsName = parts[0];
      const clsSec = parts[1] || 'A';
      targetClass = await Class.findOne({ name: clsName, section: clsSec });
      if (!targetClass) {
        targetClass = await Class.create({ name: clsName, section: clsSec, grade: clsName });
      }
    }

    const subjectIds = [];
    if (Array.isArray(subjects)) {
      for (const sName of subjects) {
        let subj = await Subject.findOne({ name: sName });
        if (!subj) {
          subj = await Subject.create({ name: sName, code: sName.substring(0, 3).toUpperCase() + '01' });
        }
        subjectIds.push(subj._id);
      }
    }

    const user = await User.create({
      name, email,
      password: password || 'password123',
      role: 'teacher',
    });

    const teacher = await Teacher.create({
      user: user._id,
      employeeId,
      subjects: subjectIds,
      classTeacherOf: targetClass ? targetClass._id : null,
      phone: phone || '',
      qualification: qualification || '',
      dateOfJoining: new Date(),
      status: status || 'Active',
    });

    return sendSuccess(res, {
      id: teacher._id,
      name: user.name,
      email: user.email,
      employeeId: teacher.employeeId,
      subjects: subjects || [],
      classTeacherOf: classTeacherOf || 'None',
      phone: teacher.phone,
      qualification: teacher.qualification,
      status: teacher.status,
    }, 'Teacher created successfully', 201);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const updateTeacher = async (req, res, next) => {
  const { id } = req.params;
  const { name, email, employeeId, subjects, classTeacherOf, phone, qualification, status } = req.body;

  try {
    const teacher = await Teacher.findById(id).populate('user');
    if (!teacher) {
      return sendError(res, 'Teacher profile not found', 404);
    }

    if (teacher.user) {
      if (name) teacher.user.name = name;
      if (email) {
        if (!isLoginAllowedEmail(email)) {
          return sendError(res, 'Please enter a proper professional mail id ending with @gmail.com', 400);
        }
        const emailOwner = await User.findOne({ email, _id: { $ne: teacher.user._id } });
        if (emailOwner) {
          return sendError(res, 'User with this email already exists', 400);
        }
        teacher.user.email = email;
      }
      await teacher.user.save();
    }

    if (employeeId) teacher.employeeId = employeeId;
    if (phone !== undefined) teacher.phone = phone;
    if (qualification !== undefined) teacher.qualification = qualification;
    if (status) teacher.status = status;

    if (classTeacherOf) {
      if (classTeacherOf === 'None') {
        teacher.classTeacherOf = null;
      } else {
        const parts = classTeacherOf.split('-');
        const clsName = parts[0];
        const clsSec = parts[1] || 'A';
        let targetClass = await Class.findOne({ name: clsName, section: clsSec });
        if (!targetClass) {
          targetClass = await Class.create({ name: clsName, section: clsSec, grade: clsName });
        }
        teacher.classTeacherOf = targetClass._id;
      }
    }

    if (Array.isArray(subjects)) {
      const subjectIds = [];
      for (const sName of subjects) {
        let subj = await Subject.findOne({ name: sName });
        if (!subj) {
          subj = await Subject.create({ name: sName, code: sName.substring(0, 3).toUpperCase() + '01' });
        }
        subjectIds.push(subj._id);
      }
      teacher.subjects = subjectIds;
    }

    await teacher.save();

    return sendSuccess(res, {
      id: teacher._id,
      name: teacher.user?.name || name,
      email: teacher.user?.email || email,
      employeeId: teacher.employeeId,
      subjects: subjects || [],
      classTeacherOf: classTeacherOf || 'None',
      phone: teacher.phone,
      qualification: teacher.qualification,
      status: teacher.status,
    }, 'Teacher updated successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const deleteTeacher = async (req, res, next) => {
  const { id } = req.params;

  try {
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return sendError(res, 'Teacher profile not found', 404);
    }

    if (teacher.user) {
      await User.findByIdAndDelete(teacher.user);
    }
    await Teacher.findByIdAndDelete(id);

    return sendSuccess(res, null, 'Teacher deleted successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};
