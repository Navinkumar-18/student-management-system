import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import Icon from '../../components/common/Icon';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    overallAttendance: '94.2%',
    overallAttendanceTrend: '+1.2%',
    homeworkPending: '14',
    totalFeesDue: '₹10.2L',
    pendingLeaves: '2',
    attendanceTrends: [
      { month: 'Jan', rate: 91 }, { month: 'Feb', rate: 93 }, { month: 'Mar', rate: 92 },
      { month: 'Apr', rate: 95 }, { month: 'May', rate: 94 }, { month: 'Jun', rate: 94.2 },
    ],
    homeworkProgress: [
      { subject: 'Maths', submitted: 85, pending: 15 },
      { subject: 'Science', submitted: 78, pending: 22 },
      { subject: 'English', submitted: 90, pending: 10 },
      { subject: 'Tamil', submitted: 72, pending: 28 },
      { subject: 'Social Science', submitted: 95, pending: 5 },
    ],
    outstandingFees: {
      amount: 340000,
      overdueDays: '30+'
    },
    recentActivity: [
      {
        title: 'Term 2 Schedule Published',
        description: 'Global announcement sent to all parents.',
        time: '2 hours ago',
        icon: 'campaign',
        color: 'text-primary-container',
      },
      {
        title: 'Grade 10 Maths Results',
        description: 'Mr. Smith finalized marks for Midterms.',
        time: '5 hours ago',
        icon: 'grade',
        color: 'text-secondary',
      },
      {
        title: 'Teacher Absence Alert',
        description: 'Substitute needed for Science 101 tomorrow.',
        time: '1 day ago',
        icon: 'warning',
        color: 'text-warning',
      },
      {
        title: 'Bulk Fee Reminders Sent',
        description: 'Automated emails dispatched for Q3 fees.',
        time: '2 days ago',
        icon: 'mail',
        color: 'text-tertiary',
      },
    ]
  });

  useEffect(() => {
    api.get('/stats/dashboard')
      .then(res => {
        setStats(res.data);
      })
      .catch(err => {
        console.error('Error fetching dashboard stats:', err.message || err);
      });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="page-header">Dashboard Overview</h1>
        <p className="page-subtitle">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Overall Attendance"
          value={stats.overallAttendance}
          icon="calendar_month"
          trend="up"
          trendValue={stats.overallAttendanceTrend}
          color="primary"
        />
        <StatCard
          title="Homework Pending"
          value={stats.homeworkPending}
          subtitle="tasks"
          icon="assignment"
          color="secondary"
        />
        <StatCard
          title="Total Fees Due"
          value={stats.totalFeesDue}
          icon="payments"
          trend="down"
          trendValue="-3.1%"
          color="tertiary"
        />
        <StatCard
          title="Pending Leaves"
          value={stats.pendingLeaves}
          subtitle="requests"
          icon="event_busy"
          color="error"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trends */}
        <div className="card p-6">
          <h3 className="text-title-lg text-on-surface mb-4">Attendance Trends</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={stats.attendanceTrends}>
              <defs>
                <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eeff" />
              <XAxis dataKey="month" stroke="#737686" fontSize={12} />
              <YAxis domain={[85, 100]} stroke="#737686" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #c3c6d7',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#attendanceGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Homework Progress */}
        <div className="card p-6">
          <h3 className="text-title-lg text-on-surface mb-4">Homework Progress</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.homeworkProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5eeff" />
              <XAxis dataKey="subject" stroke="#737686" fontSize={12} />
              <YAxis stroke="#737686" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #c3c6d7',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="submitted" fill="#2563eb" radius={[4, 4, 0, 0]} name="Submitted" />
              <Bar dataKey="pending" fill="#dbe1ff" radius={[4, 4, 0, 0]} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outstanding Fees */}
        <div className="card p-6">
          <h3 className="text-title-lg text-on-surface mb-2">Outstanding Fees</h3>
          <p className="text-body-md text-on-surface-variant mb-4">Action required for overdue accounts.</p>
          <div className="bg-error/5 border border-error/20 rounded-lg p-4">
            <p className="text-headline-md text-error font-bold">₹{stats.outstandingFees.amount.toLocaleString('en-IN')}</p>
            <p className="text-body-md text-error/80">Overdue by {stats.outstandingFees.overdueDays} days</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-title-lg text-on-surface mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {stats.recentActivity.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-surface-container-low transition-colors animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0`}>
                  <Icon name={item.icon} size={20} className={item.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md text-on-surface font-medium">{item.title}</p>
                  <p className="text-body-md text-on-surface-variant">{item.description}</p>
                </div>
                <span className="text-label-md text-on-surface-variant whitespace-nowrap">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
