import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Fee from '../models/Fee.js';
import jwt from 'jsonwebtoken';
import { isLoginAllowedEmail } from '../utils/emailValidation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import AppError from '../utils/AppError.js';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const authUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!isLoginAllowedEmail(email)) {
      return sendError(res, 'Please enter a proper professional mail id ending with @gmail.com', 400);
    }

    const admin = await Admin.findOne({ email });
    if (admin) {
      if (await admin.matchPassword(password)) {
        return sendSuccess(res, {
          _id: admin._id,
          email: admin.email,
          role: 'admin',
          token: generateToken(admin._id, 'admin'),
        }, 'Login successful');
      }
      return sendError(res, 'Invalid email or password', 401);
    }

    const user = await User.findOne({ email }).select('+password');
    if (user && (await user.matchPassword(password))) {
      return sendSuccess(res, {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id, user.role),
      }, 'Login successful');
    }

    return sendError(res, 'Invalid email or password', 401);
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const admin = await Admin.findById(req.user._id);
    if (admin) {
      if (!(await admin.matchPassword(currentPassword))) {
        return sendError(res, 'Current password is incorrect', 401);
      }
      admin.password = newPassword;
      await admin.save();
      return sendSuccess(res, null, 'Password updated successfully');
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (!(await user.matchPassword(currentPassword))) {
      return sendError(res, 'Current password is incorrect', 401);
    }

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, null, 'Password updated successfully');
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

export const registerUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    if (!isLoginAllowedEmail(email)) {
      return sendError(res, 'Please enter a proper professional mail id ending with @gmail.com', 400);
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'User already exists', 400);
    }

    if (email === 'admin@gmail.com') {
      return sendError(res, 'Email reserved for admin', 400);
    }

    const user = await User.create({ name, email, password, role: 'student' });

    if (user.role === 'student') {
      let defaultClass = await Class.findOne({ name: 'General', section: 'A' });
      if (!defaultClass) {
        defaultClass = await Class.create({ name: 'General', section: 'A', grade: '10' });
      }

      const rollNo = `STU-${Date.now().toString().slice(-6)}`;

      const student = await Student.create({
        user: user._id,
        rollNo,
        class: defaultClass._id,
        grade: defaultClass.grade,
        status: 'Active',
      });

      await Fee.create({
        student: student._id,
        class: defaultClass._id,
        amount: 50000,
        amountPaid: 0,
        feeType: 'Tuition',
        status: 'Pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        academicYear: new Date().getFullYear().toString(),
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id, user.role),
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};
