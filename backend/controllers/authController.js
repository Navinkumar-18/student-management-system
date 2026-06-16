import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Fee from '../models/Fee.js';
import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production', {
    expiresIn: '30d',
  });
};

export const authUser = async (req, res) => {
  const { email, password } = req.body;

  // First, check if the email exists in the Admin table or matches admin@gmail.com
  if (email === 'admin@gmail.com') {
    const admin = await Admin.findOne({ email });
    if (admin && (await admin.matchPassword(password))) {
      return res.json({
        _id: admin._id,
        email: admin.email,
        role: 'admin',
        token: generateToken(admin._id, 'admin'),
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  }

  // If not admin, check in User table (for students/teachers)
  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    const userRole = user.role;

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: userRole,
      avatar: user.avatar,
      token: generateToken(user._id, userRole),
    });
  } else {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
};

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (email === 'admin@gmail.com') {
      return res.status(400).json({ message: 'Email reserved for admin' });
    }

    const role = 'student';

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    // Handle student creation directly so they show up across the application
    if (user.role === 'student') {
      let defaultClass = await Class.findOne({ name: 'General', section: 'A' });
      if (!defaultClass) {
        defaultClass = await Class.create({ name: 'General', section: 'A', grade: '10' });
      }

      const rollNo = `STU-${Date.now().toString().slice(-6)}`;

      const student = await Student.create({
        user: user._id,
        rollNo: rollNo,
        class: defaultClass._id,
        grade: defaultClass.grade,
        status: 'Active'
      });

      // Create default Tuition Fee
      await Fee.create({
        student: student._id,
        class: defaultClass._id,
        amount: 50000,
        amountPaid: 0,
        feeType: 'Tuition',
        status: 'Pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        academicYear: new Date().getFullYear().toString(),
      });
    }

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
