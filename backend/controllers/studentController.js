import Student from '../models/Student.js';
import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Fee from '../models/Fee.js';
import Attendance from '../models/Attendance.js';
import Mark from '../models/Mark.js';
import Leave from '../models/Leave.js';
import Homework from '../models/Homework.js';
import { isLoginAllowedEmail } from '../utils/emailValidation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import AppError from '../utils/AppError.js';

export const getStudents = async (req, res, next) => {
  try {
    const { page: p, limit: l } = getPagination(req.query);
    const search = req.query.search || '';
    const classFilter = req.query.class || '';

    const filter = {};
    if (classFilter) {
      const cls = await Class.findOne({ name: classFilter.split('-')[0], section: classFilter.split('-')[1] || 'A' });
      if (cls) filter.class = cls._id;
    }

    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (teacher && teacher.classTeacherOf) {
        filter.class = teacher.classTeacherOf;
      }
    }

    let userFilter = {};
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      userFilter = { user: { $in: users.map((u) => u._id) } };
    }

    const query = { ...filter, ...userFilter };
    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate('user', 'name email avatar')
      .populate('class', 'name section')
      .skip(p.skip)
      .limit(l)
      .sort({ createdAt: -1 });

    const formatted = students.map((student) => ({
      id: student._id,
      name: student.user?.name || 'Unknown',
      rollNo: student.rollNo,
      email: student.user?.email || 'N/A',
      grade: student.class ? `${student.class.name}-${student.class.section}` : student.grade,
      status: student.status,
      gpa: student.gpa,
      avatar: student.user?.avatar || (student.user?.name ? student.user.name.substring(0, 2).toUpperCase() : 'NA'),
      phone: student.phone,
      address: student.address,
      dateOfBirth: student.dateOfBirth,
    }));

    return sendSuccess(res, {
      students: formatted,
      pagination: getPaginationMeta(total, p.page, l.limit),
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const createStudent = async (req, res, next) => {
  let { name, email, password, grade, status, gpa, phone, address, tuitionFee } = req.body;

  try {
    if (!isLoginAllowedEmail(email)) {
      return sendError(res, 'Please enter a proper professional mail id ending with @gmail.com', 400);
    }

    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (teacher && teacher.classTeacherOf) {
        grade = teacher.classTeacherOf;
      } else {
        return sendError(res, 'Teacher has no assigned class', 400);
      }
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'User with this email already exists', 400);
    }

    const gradeParts = grade.split('-');
    const className = gradeParts[0] || '10';
    const classSection = gradeParts[1] || 'A';

    let studentClass = await Class.findOne({ name: className, section: classSection });
    if (!studentClass) {
      studentClass = await Class.create({ name: className, section: classSection, grade: className });
    }

    const user = await User.create({
      name,
      email,
      password: password || 'password123',
      role: 'student',
    });

    const rollNo = `STU-${Date.now().toString().slice(-6)}`;

    const student = await Student.create({
      user: user._id,
      rollNo,
      class: studentClass._id,
      grade: `${className}-${classSection}`,
      status: status || 'Active',
      gpa: gpa || '0.0',
      phone: phone || '',
      address: address || '',
    });

    const tuitionAmount = Number(tuitionFee) || 50000;
    await Fee.create({
      student: student._id,
      class: studentClass._id,
      amount: tuitionAmount,
      amountPaid: 0,
      feeType: 'Tuition',
      status: 'Pending',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      academicYear: new Date().getFullYear().toString(),
    });

    return sendSuccess(res, {
      id: student._id,
      name: user.name,
      rollNo: student.rollNo,
      email: user.email,
      grade: `${className}-${classSection}`,
      status: student.status,
      gpa: student.gpa,
      avatar: user.name.substring(0, 2).toUpperCase(),
      phone: student.phone,
      address: student.address,
    }, 'Student created successfully', 201);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const updateStudent = async (req, res, next) => {
  const { id } = req.params;
  const { name, email, password, grade, status, gpa, phone, address } = req.body;

  try {
    const student = await Student.findById(id).populate('user');
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    if (student.user) {
      if (name) student.user.name = name;
      if (email) {
        if (!isLoginAllowedEmail(email)) {
          return sendError(res, 'Please enter a proper professional mail id ending with @gmail.com', 400);
        }
        const emailOwner = await User.findOne({ email, _id: { $ne: student.user._id } });
        if (emailOwner) {
          return sendError(res, 'User with this email already exists', 400);
        }
        student.user.email = email;
      }
      if (password) student.user.password = password;
      await student.user.save();
    }

    if (grade && req.user.role !== 'teacher') {
      const gradeParts = grade.split('-');
      const className = gradeParts[0] || '10';
      const classSection = gradeParts[1] || 'A';

      let studentClass = await Class.findOne({ name: className, section: classSection });
      if (!studentClass) {
        studentClass = await Class.create({ name: className, section: classSection, grade: className });
      }
      student.class = studentClass._id;
      student.grade = `${className}-${classSection}`;
    }

    if (status) student.status = status;
    if (gpa !== undefined) student.gpa = gpa;
    if (phone !== undefined) student.phone = phone;
    if (address !== undefined) student.address = address;

    await student.save();

    return sendSuccess(res, {
      id: student._id,
      name: student.user?.name || name,
      rollNo: student.rollNo,
      email: student.user?.email || email,
      grade: student.grade,
      status: student.status,
      gpa: student.gpa,
      avatar: (student.user?.name || name).substring(0, 2).toUpperCase(),
      phone: student.phone,
      address: student.address,
    }, 'Student updated successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const deleteStudent = async (req, res, next) => {
  const { id } = req.params;

  try {
    const student = await Student.findById(id);
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    await Promise.all([
      Fee.deleteMany({ student: student._id }),
      Attendance.deleteMany({ student: student._id }),
      Mark.deleteMany({ student: student._id }),
      Leave.deleteMany({ student: student._id }),
      Homework.updateMany(
        { 'submittedBy.student': student._id },
        {
          $pull: { submittedBy: { student: student._id } },
          $inc: { submissions: -1 },
        }
      ),
    ]);

    await Student.findByIdAndDelete(student._id);

    if (student.user) {
      await User.findByIdAndDelete(student.user);
    }

    return sendSuccess(res, null, 'Student deleted successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};
