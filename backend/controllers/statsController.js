import { Student, Fee, Attendance, Homework, Leave } from '../models/index.js';
import Teacher from '../models/Teacher.js';
import { sendSuccess } from '../utils/response.js';
import AppError from '../utils/AppError.js';

const formatRelativeTime = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export const getDashboardStats = async (req, res, next) => {
  try {
    let teacherStudentIds = null;
    let teacherClassId = null;

    if (req.user.role === 'teacher') {
      const teacherDoc = await Teacher.findOne({ user: req.user._id });
      if (teacherDoc && teacherDoc.classTeacherOf) {
        teacherClassId = teacherDoc.classTeacherOf;
        const students = await Student.find({ class: teacherClassId }).select('_id');
        teacherStudentIds = students.map(s => s._id);
      }
    }

    const hasTeacherScope = !!teacherStudentIds;
    const classFilter = hasTeacherScope ? { class: teacherClassId } : {};
    const studentIdsFilter = hasTeacherScope ? { student: { $in: teacherStudentIds } } : {};
    const attendanceFilter = studentIdsFilter;
    const homeworkFilter = classFilter;
    const feeFilter = studentIdsFilter;
    const leaveFilter = studentIdsFilter;
    const studentFilter = classFilter;

    const [
      totalAttendanceRecords,
      presentAttendanceRecords,
      activeHomeworks,
      totalHomeworkCount,
      feeRecords,
      pendingLeaves,
    ] = await Promise.all([
      Attendance.countDocuments(attendanceFilter),
      Attendance.countDocuments({ ...attendanceFilter, status: { $in: ['Present', 'Late'] } }),
      Homework.find({ status: 'Active', ...homeworkFilter }).populate('subject'),
      Homework.countDocuments(homeworkFilter),
      Fee.find(feeFilter),
      Leave.countDocuments(leaveFilter),
    ]);

    let overallAttendance = '0%';
    if (totalAttendanceRecords > 0) {
      overallAttendance = `${((presentAttendanceRecords / totalAttendanceRecords) * 100).toFixed(1)}%`;
    }

    let homeworkPending = 0;
    if (activeHomeworks.length > 0) {
      homeworkPending = activeHomeworks.reduce((sum, hw) => {
        const pending = (hw.totalStudents || 0) - (hw.submissions || 0);
        return sum + Math.max(0, pending);
      }, 0);
    }

    let totalFeesDueVal = 0;
    if (feeRecords.length > 0) {
      totalFeesDueVal = feeRecords.reduce((sum, f) => sum + ((f.amount || 0) - (f.amountPaid || 0)), 0);
    }

    let totalFeesDueStr = '₹0';
    if (totalFeesDueVal >= 100000) {
      totalFeesDueStr = `₹${(totalFeesDueVal / 100000).toFixed(1)}L`;
    } else if (totalFeesDueVal > 0) {
      totalFeesDueStr = `₹${totalFeesDueVal.toLocaleString('en-IN')}`;
    }

    // Attendance Trends
    const attendanceList = await Attendance.find(attendanceFilter);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyStats = {};

    attendanceList.forEach((rec) => {
      const monthName = months[new Date(rec.date).getMonth()];
      if (!monthlyStats[monthName]) {
        monthlyStats[monthName] = { total: 0, present: 0 };
      }
      monthlyStats[monthName].total += 1;
      if (['Present', 'Late'].includes(rec.status)) {
        monthlyStats[monthName].present += 1;
      }
    });

    const last6Months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push(months[d.getMonth()]);
    }

    const attendanceTrends = last6Months.map((month) => {
      if (monthlyStats[month] && monthlyStats[month].total > 0) {
        return {
          month,
          rate: Math.round((monthlyStats[month].present / monthlyStats[month].total) * 1000) / 10,
        };
      }
      return { month, rate: 0 };
    });

    // Homework Progress
    const allHomeworks = await Homework.find(homeworkFilter).populate('subject');
    const subjectStats = {};
    allHomeworks.forEach((hw) => {
      const subjectName = hw.subject?.name || 'Other';
      if (!subjectStats[subjectName]) {
        subjectStats[subjectName] = { total: 0, submitted: 0 };
      }
      subjectStats[subjectName].total += hw.totalStudents || 0;
      subjectStats[subjectName].submitted += hw.submissions || 0;
    });

    let homeworkProgress = [];
    if (Object.keys(subjectStats).length > 0) {
      homeworkProgress = Object.keys(subjectStats).map((subject) => {
        const stats = subjectStats[subject];
        const submittedPercent = stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0;
        return {
          subject,
          submitted: submittedPercent,
          pending: 100 - submittedPercent,
        };
      });
    }

    // Outstanding Fees
    const overdueFees = await Fee.find({ status: 'Overdue', ...feeFilter });
    const outstandingOverdueVal = overdueFees.reduce((sum, f) => sum + ((f.amount || 0) - (f.amountPaid || 0)), 0);

    // Recent Activity
    const activityList = [];

    const [recentStudents, recentHomeworks, recentLeaves, recentFees] = await Promise.all([
      Student.find(studentFilter).populate('user').sort({ createdAt: -1 }).limit(3),
      Homework.find(homeworkFilter).populate('subject').sort({ createdAt: -1 }).limit(3),
      Leave.find(leaveFilter).sort({ createdAt: -1 }).limit(3),
      Fee.find({ status: { $in: ['Paid', 'Partial'] }, ...feeFilter })
        .populate({ path: 'student', populate: { path: 'user' } })
        .sort({ updatedAt: -1 })
        .limit(3),
    ]);

    recentStudents.forEach((s) => {
      activityList.push({
        title: 'New Student Registered',
        description: `${s.user?.name || 'Unknown student'} enrolled in Grade ${s.grade || 'N/A'}.`,
        time: formatRelativeTime(s.createdAt),
        dateVal: s.createdAt,
        icon: 'school',
        color: 'text-primary-container',
      });
    });

    recentHomeworks.forEach((h) => {
      activityList.push({
        title: 'Homework Assigned',
        description: `New task "${h.title}" posted for ${h.subject?.name || 'Subject'}.`,
        time: formatRelativeTime(h.createdAt),
        dateVal: h.createdAt,
        icon: 'assignment',
        color: 'text-secondary',
      });
    });

    recentLeaves.forEach((l) => {
      activityList.push({
        title: 'Leave Request Received',
        description: `${l.name} requested leave (${l.type}).`,
        time: formatRelativeTime(l.createdAt),
        dateVal: l.createdAt,
        icon: 'event_busy',
        color: 'text-warning',
      });
    });

    recentFees.forEach((f) => {
      activityList.push({
        title: 'Fee Payment Received',
        description: `₹${(f.amountPaid || 0).toLocaleString('en-IN')} received from ${f.student?.user?.name || 'Student'}.`,
        time: formatRelativeTime(f.updatedAt),
        dateVal: f.updatedAt,
        icon: 'payments',
        color: 'text-tertiary',
      });
    });

    activityList.sort((a, b) => new Date(b.dateVal) - new Date(a.dateVal));

    return sendSuccess(res, {
      overallAttendance,
      overallAttendanceTrend: '+1.2%',
      homeworkPending: String(homeworkPending),
      totalFeesDue: totalFeesDueStr,
      totalFeesDueVal,
      pendingLeaves: String(pendingLeaves),
      attendanceTrends,
      homeworkProgress,
      outstandingFees: {
        amount: outstandingOverdueVal,
        overdueDays: totalFeesDueVal > 0 ? '30+' : '0',
      },
      recentActivity: activityList.slice(0, 4),
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};
