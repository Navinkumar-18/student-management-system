import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import User from '../models/User.js';

export const getAttendance = async (req, res) => {
  const { date, className, studentEmail } = req.query;

  try {
    if (studentEmail) {
      // Fetch attendance for a specific student by email
      const user = await User.findOne({ email: studentEmail });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const student = await Student.findOne({ user: user._id });
      if (!student) {
        return res.status(404).json({ message: 'Student profile not found' });
      }

      const records = await Attendance.find({ student: student._id })
        .populate('class')
        .sort({ date: -1 });

      const formatted = records.map(r => ({
        id: r._id,
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        rawDate: new Date(r.date).toISOString().split('T')[0],
        status: r.status,
        time: r.time || '-',
        className: r.class ? `${r.class.name}-${r.class.section}` : ''
      }));

      return res.json(formatted);
    }

    // Otherwise, fetch class-wise attendance for a specific date
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    // Let's get the class
    const gradeParts = (className || '10-A').split('-');
    const clsName = gradeParts[0] || '10';
    const clsSec = gradeParts[1] || 'A';
    const studentClass = await Class.findOne({ name: clsName, section: clsSec });

    if (!studentClass) {
      return res.json([]);
    }

    // Fetch all students in this class
    const students = await Student.find({ class: studentClass._id }).populate('user');

    // Fetch existing attendance records for this date and class
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);
    const existingRecords = await Attendance.find({
      class: studentClass._id,
      date: { $gte: targetDate, $lte: endOfDay }
    });

    const recordsMap = new Map();
    existingRecords.forEach(r => recordsMap.set(r.student.toString(), r));

    // Combine
    const attendanceData = students.map(student => {
      const record = recordsMap.get(student._id.toString());
      return {
        id: student._id,
        name: student.user?.name || 'Unknown',
        rollNo: student.rollNo,
        status: record ? record.status : 'Present', // Default to Present if not marked
        time: record ? record.time : '8:00 AM',
        date: targetDate.toISOString().split('T')[0],
        recordId: record ? record._id : null
      };
    });

    res.json(attendanceData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching attendance', error: error.message });
  }
};

export const saveAttendance = async (req, res) => {
  const { date, className, records } = req.body; // records is array of { studentId, status, time }

  try {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    const gradeParts = (className || '10-A').split('-');
    const clsName = gradeParts[0] || '10';
    const clsSec = gradeParts[1] || 'A';
    let studentClass = await Class.findOne({ name: clsName, section: clsSec });

    if (!studentClass) {
      studentClass = await Class.create({ name: clsName, section: clsSec, grade: clsName });
    }

    const savedRecords = [];

    for (const rec of records) {
      // Find or update
      let attendanceRecord = await Attendance.findOne({
        student: rec.studentId,
        date: targetDate
      });

      if (attendanceRecord) {
        attendanceRecord.status = rec.status;
        attendanceRecord.time = rec.time || '8:00 AM';
        await attendanceRecord.save();
      } else {
        attendanceRecord = await Attendance.create({
          student: rec.studentId,
          class: studentClass._id,
          date: targetDate,
          status: rec.status,
          time: rec.time || '8:00 AM'
        });
      }
      savedRecords.push(attendanceRecord);
    }

    res.json({ message: 'Attendance saved successfully', count: savedRecords.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error saving attendance', error: error.message });
  }
};
