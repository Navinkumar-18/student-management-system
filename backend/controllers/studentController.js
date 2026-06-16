import Student from '../models/Student.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import Fee from '../models/Fee.js';

export const getStudents = async (req, res) => {
  try {
    const students = await Student.find({})
      .populate('user', 'name email avatar')
      .populate('class', 'name section');
    
    // Map data to match the format expected by the frontend
    const formattedStudents = students.map(student => ({
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
      dateOfBirth: student.dateOfBirth
    }));

    res.json(formattedStudents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching students' });
  }
};

export const createStudent = async (req, res) => {
  const { name, email, password, grade, status, gpa, phone, address, tuitionFee } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Parse grade (e.g., '10-A')
    const gradeParts = grade.split('-');
    const className = gradeParts[0] || '10';
    const classSection = gradeParts[1] || 'A';

    let studentClass = await Class.findOne({ name: className, section: classSection });
    if (!studentClass) {
      studentClass = await Class.create({ name: className, section: classSection, grade: className });
    }

    // Create User
    const user = await User.create({
      name,
      email,
      password: password || 'password123', // default password
      role: 'student'
    });

    const rollNo = `STU-${Date.now().toString().slice(-6)}`;

    // Create Student
    const student = await Student.create({
      user: user._id,
      rollNo: rollNo,
      class: studentClass._id,
      grade: `${className}-${classSection}`,
      status: status || 'Active',
      gpa: gpa || '0.0',
      phone: phone || '',
      address: address || ''
    });

    // Create Tuition Fee
    const tuitionAmount = Number(tuitionFee) || 50000;
    await Fee.create({
      student: student._id,
      class: studentClass._id,
      amount: tuitionAmount,
      amountPaid: 0,
      feeType: 'Tuition',
      status: 'Pending',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      academicYear: new Date().getFullYear().toString(),
    });

    res.status(201).json({
      id: student._id,
      name: user.name,
      rollNo: student.rollNo,
      email: user.email,
      grade: `${className}-${classSection}`,
      status: student.status,
      gpa: student.gpa,
      avatar: user.name.substring(0, 2).toUpperCase(),
      phone: student.phone,
      address: student.address
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error creating student', error: error.message });
  }
};

export const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, grade, status, gpa, phone, address } = req.body;

  try {
    const student = await Student.findById(id).populate('user');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update User details
    if (student.user) {
      if (name) student.user.name = name;
      if (email) student.user.email = email;
      if (password) student.user.password = password;
      await student.user.save();
    }

    // Update Class details if grade changes
    if (grade) {
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

    res.json({
      id: student._id,
      name: student.user?.name || name,
      rollNo: student.rollNo,
      email: student.user?.email || email,
      grade: student.grade,
      status: student.status,
      gpa: student.gpa,
      avatar: (student.user?.name || name).substring(0, 2).toUpperCase(),
      phone: student.phone,
      address: student.address
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error updating student', error: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Delete associated User
    if (student.user) {
      await User.findByIdAndDelete(student.user);
    }

    await Student.findByIdAndDelete(id);

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error deleting student', error: error.message });
  }
};
