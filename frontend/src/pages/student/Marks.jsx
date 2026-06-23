import React, { useState, useEffect } from 'react';
import api from '../../api';
import Icon from '../../components/common/Icon';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentMarks() {
  const email = localStorage.getItem('edutrack_email') || 'student@edutrack.pro';
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/marks?studentEmail=${email}`)
      .then(res => {
        setMarks(res.data?.marks || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching marks:', err);
        setLoading(false);
      });
  }, [email]);

  const getGrade = (score) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  };

  // Process subject-wise marks
  const subjectMap = {};
  marks.forEach(m => {
    if (!subjectMap[m.subject]) {
      subjectMap[m.subject] = { total: 0, max: 0 };
    }
    subjectMap[m.subject].total += m.marks;
    subjectMap[m.subject].max += m.max;
  });

  const subjectMarks = Object.keys(subjectMap).map(subj => {
    const s = subjectMap[subj];
    const scorePercent = s.max > 0 ? (s.total / s.max) * 100 : 0;
    return {
      subject: subj,
      marks: Math.round(scorePercent),
      max: 100,
      grade: getGrade(scorePercent)
    };
  });

  const activeSubjectMarks = subjectMarks;

  const totalScore = activeSubjectMarks.reduce((sum, s) => sum + s.marks, 0);
  const averageScore = activeSubjectMarks.length > 0 ? totalScore / activeSubjectMarks.length : 0;
  const overallGrade = activeSubjectMarks.length > 0 ? getGrade(averageScore) : 'N/A';

  const overallPercentage = activeSubjectMarks.length > 0 ? `${averageScore.toFixed(1)}%` : 'N/A';
  const gpa = activeSubjectMarks.length > 0 ? ((averageScore / 100) * 4).toFixed(1) : 'N/A';

  // Process term-wise marks for trend line
  const termMap = {};
  marks.forEach(m => {
    if (!termMap[m.term]) {
      termMap[m.term] = { total: 0, max: 0 };
    }
    termMap[m.term].total += m.marks;
    termMap[m.term].max += m.max;
  });

  const actualTrendData = Object.keys(termMap).map(term => {
    const t = termMap[term];
    return {
      term: term,
      percentage: t.max > 0 ? Math.round((t.total / t.max) * 100) : 0
    };
  });

  const trendData = actualTrendData;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">My Marks & Performance</h1>
        <p className="page-subtitle">Academic assessment logs and overall performance metrics.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="stat-card">
          <p className="text-label-md text-on-surface-variant mb-1">Overall Grade</p>
          <p className="text-headline-md text-primary font-bold">{overallGrade}</p>
          <p className="text-body-md text-emerald-600 mt-2">
            {overallGrade.startsWith('A') ? 'Excellent standing' : 
             overallGrade === 'N/A' ? 'No grades yet' :
             overallGrade.startsWith('B') ? 'Good standing' : 'Satisfactory standing'}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-label-md text-on-surface-variant mb-1">Cumulative Percentage</p>
          <p className="text-headline-md text-on-surface">{overallPercentage}</p>
          <p className="text-body-md text-on-surface-variant mt-2">Across all active subjects</p>
        </div>
        <div className="stat-card">
          <p className="text-label-md text-on-surface-variant mb-1">GPA Score</p>
          <p className="text-headline-md text-on-surface">{gpa} / 4.0</p>
          <p className="text-body-md text-on-surface-variant mt-2">
            {gpa !== 'N/A' ? 'Top tier of the class' : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject wise marks */}
        <div className="card p-6">
          <h3 className="text-title-lg text-on-surface mb-4">Subject-wise Breakdown</h3>
          {activeSubjectMarks.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={activeSubjectMarks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5eeff" />
                <XAxis dataKey="subject" stroke="#737686" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#737686" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #c3c6d7', borderRadius: '8px' }} />
                <Bar dataKey="marks" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-on-surface-variant text-body-md">No marks data available yet.</div>
          )}
        </div>

        {/* Performance Trend */}
        <div className="card p-6">
          <h3 className="text-title-lg text-on-surface mb-4">Term Progression Trend</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5eeff" />
                <XAxis dataKey="term" stroke="#737686" fontSize={12} />
                <YAxis domain={[70, 100]} stroke="#737686" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #c3c6d7', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="percentage" stroke="#006b5f" strokeWidth={3} dot={{ r: 6, fill: '#006b5f' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-on-surface-variant text-body-md">No term progression data available yet.</div>
          )}
        </div>
      </div>

      {/* Marks Table */}
      <div className="card p-6">
        <h3 className="text-title-lg text-on-surface mb-4">Exam Marks Record</h3>
        <div className="overflow-x-auto">
          {marks.length === 0 ? (
            <div className="text-center py-6 text-on-surface-variant">No exam marks records found.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Exam Type</th>
                  <th>Term</th>
                  <th>Marks Obtained</th>
                  <th>Maximum Marks</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((m) => (
                  <tr key={m.id}>
                    <td className="font-medium text-on-surface">{m.subject}</td>
                    <td className="text-on-surface-variant">{m.examType}</td>
                    <td className="text-on-surface-variant">{m.term}</td>
                    <td className="text-on-surface font-semibold">{m.marks}</td>
                    <td className="text-on-surface-variant">{m.max}</td>
                    <td className="font-semibold text-primary">{m.grade}</td>
                    <td>
                      <span className={`chip ${m.marks >= m.max * 0.4 ? 'chip-success' : 'chip-danger'}`}>
                        {m.marks >= m.max * 0.4 ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
