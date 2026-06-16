import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';

export const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find({})
      .populate('user', 'name email avatar')
      .populate('subjects', 'name code')
      .populate('classTeacherOf', 'name section');

    const formatted = teachers.map(t => ({
      id: t._id,
      name: t.user?.name || 'Unknown',
      email: t.user?.email || 'N/A',
      employeeId: t.employeeId,
      subjects: t.subjects.map(s => s.name),
      classTeacherOf: t.classTeacherOf ? `${t.classTeacherOf.name}-${t.classTeacherOf.section}` : 'None',
      phone: t.phone,
      qualification: t.qualification,
      dateOfJoining: t.dateOfJoining ? new Date(t.dateOfJoining).toISOString().split('T')[0] : '',
      status: t.status,
      avatar: t.user?.avatar || (t.user?.name ? t.user.name.substring(0, 2).toUpperCase() : 'NA')
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching teachers', error: error.message });
  }
};

export const createTeacher = async (req, res) => {
  const { name, email, password, employeeId, subjects, classTeacherOf, phone, qualification, status } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if employeeId is unique
    const empExists = await Teacher.findOne({ employeeId });
    if (empExists) {
      return res.status(400).json({ message: 'Teacher with this Employee ID already exists' });
    }

    // Resolve class
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

    // Resolve subjects
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

    // Create User
    const user = await User.create({
      name,
      email,
      password: password || 'password123', // default password
      role: 'teacher'
    });

    // Create Teacher Profile
    const teacher = await Teacher.create({
      user: user._id,
      employeeId,
      subjects: subjectIds,
      classTeacherOf: targetClass ? targetClass._id : null,
      phone: phone || '',
      qualification: qualification || '',
      dateOfJoining: new Date(),
      status: status || 'Active'
    });

    res.status(201).json({
      id: teacher._id,
      name: user.name,
      email: user.email,
      employeeId: teacher.employeeId,
      subjects: subjects || [],
      classTeacherOf: classTeacherOf || 'None',
      phone: teacher.phone,
      qualification: teacher.qualification,
      status: teacher.status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error creating teacher', error: error.message });
  }
};

export const updateTeacher = async (req, res) => {
  const { id } = req.params;
  const { name, email, employeeId, subjects, classTeacherOf, phone, qualification, status } = req.body;

  try {
    const teacher = await Teacher.findById(id).populate('user');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Update User details
    if (teacher.user) {
      if (name) teacher.user.name = name;
      if (email) teacher.user.email = email;
      await teacher.user.save();
    }

    if (employeeId) teacher.employeeId = employeeId;
    if (phone !== undefined) teacher.phone = phone;
    if (qualification !== undefined) teacher.qualification = qualification;
    if (status) teacher.status = status;

    // Resolve class
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

    // Resolve subjects
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

    res.json({
      id: teacher._id,
      name: teacher.user?.name || name,
      email: teacher.user?.email || email,
      employeeId: teacher.employeeId,
      subjects: subjects || [],
      classTeacherOf: classTeacherOf || 'None',
      phone: teacher.phone,
      qualification: teacher.qualification,
      status: teacher.status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating teacher', error: error.message });
  }
};

export const deleteTeacher = async (req, res) => {
  const { id } = req.params;

  try {
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Delete base user record
    if (teacher.user) {
      await User.findByIdAndDelete(teacher.user);
    }

    await Teacher.findByIdAndDelete(id);

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error deleting teacher', error: error.message });
  }
};
